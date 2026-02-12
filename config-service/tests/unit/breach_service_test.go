package services_test

import (
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/sirupsen/logrus"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"

	"config-service/internal/models"
	"config-service/internal/services"
)

func TestBreachService_CheckPasswordBreach(t *testing.T) {
	// Create test data
	passwords := map[string]struct {
		path    string
		found   bool
		count   int
	}{
		"BreachedPassword": {
			path:  "/A4259",
			found: true,
			count: 42,
		},
		"SafePassword": {
			path:  "/B5932",
			found: false,
			count: 0,
		},
	}

	// Create a mock server to simulate the HIBP API
	mockServer := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Check which password we're testing based on the path
		switch r.URL.Path {
		case "/A4259":
			// Return a result for the breached password
			w.WriteHeader(http.StatusOK)
			// Include a hash suffix that will match what our test password hashes to
			// The actual hash is determined by the HashPassword method
			// We just need to ensure the suffix in our mock response matches what we expect in our test
			sha1Hash := "A4259EF10A5A93C32A0B2C21347E544CF9921C7"
			suffix := sha1Hash[5:] // Remove the first 5 chars that we use as the API path
			w.Write([]byte(suffix + ":42\nOTHERHASH:7"))
		case "/B5932":
			// Return a result for the non-breached password (no matching suffix)
			w.WriteHeader(http.StatusOK)
			w.Write([]byte("SOMEHASH:10\nANOTHERHASH:54"))
		default:
			t.Logf("Unexpected API call to path: %s", r.URL.Path)
			w.WriteHeader(http.StatusNotFound)
		}
	}))
	defer mockServer.Close()

	logger := logrus.New()
	logger.SetLevel(logrus.ErrorLevel) // Suppress logs for testing

	// Create breach service configured to use our mock server
	breachService := services.NewBreachService(
		logger,
		services.WithAPIEndpoint(mockServer.URL),
		services.WithEnabled(true),
	)

	// Override HashFunc to return known values for our test passwords
	originalHashFunc := breachService.HashFunc
	breachService.HashFunc = func(password string) string {
		switch password {
		case "BreachedPassword":
			return "A4259EF10A5A93C32A0B2C21347E544CF9921C7"
		case "SafePassword":
			return "B5932E34A983C87D392038328A5193ABCDEF0123"
		default:
			return originalHashFunc(password)
		}
	}

	// Test each password
	for password, expected := range passwords {
		t.Run(password, func(t *testing.T) {
			result, err := breachService.CheckPasswordBreach(password)
			require.NoError(t, err)

			assert.Equal(t, expected.found, result.Found)
			assert.Equal(t, expected.count, result.BreachCount)
			if expected.found {
				assert.NotEmpty(t, result.LastBreached)
			} else {
				assert.Empty(t, result.LastBreached)
			}
		})
	}
}

func TestBreachService_Disabled(t *testing.T) {
	logger := logrus.New()
	logger.SetLevel(logrus.ErrorLevel)

	// Create breach service with disabled flag
	breachService := services.NewBreachService(
		logger, 
		services.WithEnabled(false),
	)

	// Should return not found without making any HTTP requests
	result, err := breachService.CheckPasswordBreach("AnyPassword")
	require.NoError(t, err)
	
	assert.False(t, result.Found)
	assert.Equal(t, 0, result.BreachCount)
	assert.Empty(t, result.LastBreached)
}

// MockBreachService creates a custom breach service for testing
type MockBreachService struct {
	services.BreachService
	mockEnabled bool
	mockResults map[string]*models.BreachInfo
}

func NewMockBreachService() *MockBreachService {
	return &MockBreachService{
		mockEnabled: true,
		mockResults: make(map[string]*models.BreachInfo),
	}
}

func (m *MockBreachService) SetEnabled(enabled bool) {
	m.mockEnabled = enabled
}

func (m *MockBreachService) AddMockResult(password string, found bool, count int) {
	m.mockResults[password] = &models.BreachInfo{
		Found:       found,
		BreachCount: count,
	}
	if found {
		m.mockResults[password].LastBreached = "2023-01-01"
	}
}

func (m *MockBreachService) CheckPasswordBreach(password string) (*models.BreachInfo, error) {
	if !m.mockEnabled {
		return &models.BreachInfo{Found: false}, nil
	}
	
	result, exists := m.mockResults[password]
	if exists {
		return result, nil
	}
	
	return &models.BreachInfo{Found: false}, nil
}
