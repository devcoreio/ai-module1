package services

import (
	"bufio"
	"crypto/sha1"
	"encoding/hex"
	"fmt"
	"io"
	"net"
	"net/http"
	"strconv"
	"strings"
	"sync"
	"time"

	"github.com/sirupsen/logrus"

	"config-service/internal/errors"
	"config-service/internal/models"
)

const (
	// HIBP API endpoint for the password range API
	defaultHibpAPIEndpoint = "https://api.pwnedpasswords.com/range"
	
	// Default timeout for API requests in seconds
	defaultRequestTimeout = 10
	
	// Default cache duration in minutes
	defaultCacheDuration = 60
)

// BreachService provides functionality to check if passwords have been exposed in data breaches
type BreachService struct {
	logger        *logrus.Logger
	apiEndpoint   string
	httpClient    *http.Client
	cache         map[string]*models.BreachInfo
	cacheMutex    sync.RWMutex
	cacheDuration time.Duration
	enabled       bool
	// HashFunc allows overriding the default hash function for testing purposes
	HashFunc      func(string) string
}

// BreachServiceOption defines functional options for configuring the BreachService
type BreachServiceOption func(*BreachService)

// WithAPIEndpoint sets a custom HIBP API endpoint
func WithAPIEndpoint(endpoint string) BreachServiceOption {
	return func(bs *BreachService) {
		bs.apiEndpoint = endpoint
	}
}

// WithTimeout sets a custom timeout for HTTP requests
func WithTimeout(seconds int) BreachServiceOption {
	return func(bs *BreachService) {
		bs.httpClient.Timeout = time.Duration(seconds) * time.Second
	}
}

// WithCacheDuration sets a custom cache duration
func WithCacheDuration(minutes int) BreachServiceOption {
	return func(bs *BreachService) {
		bs.cacheDuration = time.Duration(minutes) * time.Minute
	}
}

// WithEnabled sets whether breach checking is enabled
func WithEnabled(enabled bool) BreachServiceOption {
	return func(bs *BreachService) {
		bs.enabled = enabled
	}
}

// NewBreachService creates a new breach service with the given options
func NewBreachService(logger *logrus.Logger, options ...BreachServiceOption) *BreachService {
	bs := &BreachService{
		logger:        logger,
		apiEndpoint:   defaultHibpAPIEndpoint,
		httpClient:    &http.Client{Timeout: defaultRequestTimeout * time.Second},
		cache:         make(map[string]*models.BreachInfo),
		cacheDuration: defaultCacheDuration * time.Minute,
		enabled:       true,
	}
	
	// Set the default hash function
	bs.HashFunc = bs.DefaultHashPassword

	// Apply options
	for _, option := range options {
		option(bs)
	}

	// Start cache cleanup goroutine
	go bs.startCacheCleanup()

	return bs
}

// CheckPasswordBreach checks if a password has been exposed in known data breaches
func (bs *BreachService) CheckPasswordBreach(password string) (*models.BreachInfo, error) {
	// If breach checking is disabled, return not found
	if !bs.enabled {
		bs.logger.Info("Breach detection is disabled")
		return &models.BreachInfo{Found: false}, nil
	}

	// Hash the password with SHA-1
	sha1Hash := bs.HashPassword(password)
	
	// Check if result is in cache
	cachedResult := bs.getFromCache(sha1Hash)
	if cachedResult != nil {
		bs.logger.Debug("Breach result found in cache")
		return cachedResult, nil
	}

	// Split hash for k-anonymity (first 5 chars used as API request, rest used for comparison)
	prefix := sha1Hash[:5]
	suffix := strings.ToUpper(sha1Hash[5:])

	bs.logger.Debugf("Checking breach status for hash prefix: %s", prefix)

	// Call HIBP API with the hash prefix
	resp, err := bs.callHIBPAPI(prefix)
	if err != nil {
		return nil, err
	}

	// Parse response and find matching suffix
	breachCount, found := bs.parseHIBPResponse(resp, suffix)

	// Create breach info
	result := &models.BreachInfo{
		Found:      found,
		BreachCount: breachCount,
	}
	
	if found {
		result.LastBreached = time.Now().Format("2006-01-02")
	}

	// Add to cache
	bs.addToCache(sha1Hash, result)

	return result, nil
}

// HashPassword uses the service's hash function to create a SHA-1 hash
// This is a public method that can be used by tests
func (bs *BreachService) HashPassword(password string) string {
	return bs.HashFunc(password)
}

// DefaultHashPassword is the default implementation of the hash function
// Exported for testing purposes
func (bs *BreachService) DefaultHashPassword(password string) string {
	hasher := sha1.New()
	hasher.Write([]byte(password))
	return hex.EncodeToString(hasher.Sum(nil))
}

// callHIBPAPI makes a request to the HIBP password range API
func (bs *BreachService) callHIBPAPI(hashPrefix string) (string, error) {
	// Construct URL with hash prefix
	url := fmt.Sprintf("%s/%s", bs.apiEndpoint, hashPrefix)
	
	// Create request
	req, err := http.NewRequest(http.MethodGet, url, nil)
	if err != nil {
		bs.logger.Errorf("Error creating request: %v", err)
		return "", fmt.Errorf("error creating request: %w", err)
	}
	
	// Set headers
	req.Header.Add("User-Agent", "Password-Config-Service")
	req.Header.Add("Accept", "text/plain")
	
	// Execute request
	resp, err := bs.httpClient.Do(req)
	if err != nil {
		bs.logger.Errorf("Error calling HIBP API: %v", err)
		
		// Handle specific error types
		if netErr, ok := err.(net.Error); ok && netErr.Timeout() {
			return "", errors.ErrBreachTimeout(err)
		}
		
		return "", errors.ErrBreachAPIUnavailable(err)
	}
	defer resp.Body.Close()
	
	// Check status code
	if resp.StatusCode != http.StatusOK {
		bs.logger.Errorf("HIBP API returned non-OK status: %d", resp.StatusCode)
		
		// Handle specific status codes
		switch resp.StatusCode {
		case http.StatusTooManyRequests:
			return "", errors.ErrBreachRateLimited(fmt.Errorf("status code: %d", resp.StatusCode))
		case http.StatusServiceUnavailable, http.StatusBadGateway, http.StatusGatewayTimeout:
			return "", errors.ErrBreachAPIUnavailable(fmt.Errorf("status code: %d", resp.StatusCode))
		default:
			return "", errors.ErrBreachInvalidResponse(fmt.Errorf("status code: %d", resp.StatusCode))
		}
	}
	
	// Read response body
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		bs.logger.Errorf("Error reading response: %v", err)
		return "", errors.ErrBreachInvalidResponse(err)
	}
	
	return string(body), nil
}

// parseHIBPResponse parses the HIBP API response and looks for the suffix
func (bs *BreachService) parseHIBPResponse(response string, suffix string) (int, bool) {
	scanner := bufio.NewScanner(strings.NewReader(response))
	
	for scanner.Scan() {
		line := scanner.Text()
		parts := strings.Split(line, ":")
		
		if len(parts) != 2 {
			continue
		}
		
		hashSuffix := strings.TrimSpace(parts[0])
		countStr := strings.TrimSpace(parts[1])
		
		if hashSuffix == suffix {
			count, err := strconv.Atoi(countStr)
			if err != nil {
				bs.logger.Warnf("Error parsing breach count: %v", err)
				return 0, true
			}
			return count, true
		}
	}
	
	return 0, false
}

// getFromCache retrieves breach info from cache if it exists
func (bs *BreachService) getFromCache(passwordHash string) *models.BreachInfo {
	bs.cacheMutex.RLock()
	defer bs.cacheMutex.RUnlock()
	
	return bs.cache[passwordHash]
}

// addToCache adds breach info to the cache
func (bs *BreachService) addToCache(passwordHash string, breachInfo *models.BreachInfo) {
	bs.cacheMutex.Lock()
	defer bs.cacheMutex.Unlock()
	
	bs.cache[passwordHash] = breachInfo
}

// startCacheCleanup periodically cleans up the cache
func (bs *BreachService) startCacheCleanup() {
	ticker := time.NewTicker(bs.cacheDuration)
	defer ticker.Stop()
	
	for {
		<-ticker.C
		bs.cleanCache()
	}
}

// cleanCache removes old entries from the cache
func (bs *BreachService) cleanCache() {
	bs.cacheMutex.Lock()
	defer bs.cacheMutex.Unlock()
	
	bs.logger.Debug("Cleaning breach cache")
	bs.cache = make(map[string]*models.BreachInfo)
}