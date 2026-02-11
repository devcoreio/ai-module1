package utils

import (
	"regexp"
	"strings"
	"unicode"
)

// PasswordValidator provides utility functions for password validation
type PasswordValidator struct{}

// NewPasswordValidator creates a new password validator
func NewPasswordValidator() *PasswordValidator {
	return &PasswordValidator{}
}

// ValidatePassword validates a password according to security requirements
func (v *PasswordValidator) ValidatePassword(password string) []string {
	var errors []string

	// Check length
	if len(password) < 8 {
		errors = append(errors, "Password must be at least 8 characters long")
	}
	if len(password) > 128 {
		errors = append(errors, "Password must not exceed 128 characters")
	}

	// Check character variety
	hasUpper := false
	hasLower := false
	hasNumber := false
	hasSpecial := false

	for _, char := range password {
		switch {
		case unicode.IsUpper(char):
			hasUpper = true
		case unicode.IsLower(char):
			hasLower = true
		case unicode.IsDigit(char):
			hasNumber = true
		case unicode.IsPunct(char) || unicode.IsSymbol(char):
			hasSpecial = true
		}
	}

	if !hasUpper {
		errors = append(errors, "Password must contain at least one uppercase letter")
	}
	if !hasLower {
		errors = append(errors, "Password must contain at least one lowercase letter")
	}
	if !hasNumber {
		errors = append(errors, "Password must contain at least one number")
	}
	if !hasSpecial {
		errors = append(errors, "Password must contain at least one special character")
	}

	// Check for common patterns
	if v.hasCommonPattern(password) {
		errors = append(errors, "Password contains common patterns (avoid dictionary words, keyboard patterns, etc.)")
	}

	// Check for sequential characters
	if v.hasSequentialChars(password) {
		errors = append(errors, "Password contains sequential characters (avoid patterns like '123', 'abc', etc.)")
	}

	// Check for repeated characters
	if v.hasRepeatedChars(password) {
		errors = append(errors, "Password contains repeated characters (avoid patterns like 'aaa', '111', etc.)")
	}

	return errors
}

// ValidateEmail validates an email address format
func (v *PasswordValidator) ValidateEmail(email string) bool {
	email = strings.TrimSpace(email)
	
	// Basic email regex pattern
	emailRegex := regexp.MustCompile(`^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$`)
	
	if !emailRegex.MatchString(email) {
		return false
	}

	// Additional checks
	parts := strings.Split(email, "@")
	if len(parts) != 2 {
		return false
	}

	localPart := parts[0]
	domainPart := parts[1]

	// Local part checks
	if len(localPart) == 0 || len(localPart) > 64 {
		return false
	}

	// Domain part checks
	if len(domainPart) == 0 || len(domainPart) > 253 {
		return false
	}

	// Check for consecutive dots
	if strings.Contains(localPart, "..") || strings.Contains(domainPart, "..") {
		return false
	}

	return true
}

// ValidateUsername validates a username format
func (v *PasswordValidator) ValidateUsername(username string) []string {
	var errors []string

	username = strings.TrimSpace(username)

	// Length check
	if len(username) < 3 {
		errors = append(errors, "Username must be at least 3 characters long")
	}
	if len(username) > 32 {
		errors = append(errors, "Username must not exceed 32 characters")
	}

	// Character check (alphanumeric and underscores only)
	validUsername := regexp.MustCompile(`^[a-zA-Z0-9_]+$`)
	if !validUsername.MatchString(username) {
		errors = append(errors, "Username can only contain letters, numbers, and underscores")
	}

	// Should not start with a number
	if len(username) > 0 && unicode.IsDigit(rune(username[0])) {
		errors = append(errors, "Username cannot start with a number")
	}

	return errors
}

// hasCommonPattern checks if password contains common patterns
func (v *PasswordValidator) hasCommonPattern(password string) bool {
	lowerPassword := strings.ToLower(password)
	
	// Common keyboard patterns
	keyboardPatterns := []string{
		"qwerty", "asdf", "zxcv", "123456", "abcdef",
		"password", "admin", "welcome", "login", "letmein",
		"monkey", "dragon", "master", "shadow", "michael",
	}
	
	for _, pattern := range keyboardPatterns {
		if strings.Contains(lowerPassword, pattern) {
			return true
		}
	}
	
	// Common number patterns
	numberPatterns := []string{
		"123456", "654321", "111111", "222222", "000000",
		"123123", "321321", "1234", "4321", "1111",
	}
	
	for _, pattern := range numberPatterns {
		if strings.Contains(lowerPassword, pattern) {
			return true
		}
	}
	
	return false
}

// hasSequentialChars checks for sequential characters
func (v *PasswordValidator) hasSequentialChars(password string) bool {
	lowerPassword := ""
	for _, char := range password {
		lowerPassword += string(unicode.ToLower(char))
	}

	sequences := []string{
		"abcdef", "bcdefg", "cdefgh", "defghi", "efghij",
		"fghijk", "ghijkl", "hijklm", "ijklmn", "jklmno",
		"klmnop", "lmnopq", "mnopqr", "nopqrs", "opqrst",
		"pqrstu", "qrstuv", "rstuvw", "stuvwx", "tuvwxy", "uvwxyz",
		"123456", "234567", "345678", "456789", "567890",
		"qwerty", "asdfgh", "zxcvbn",
	}

	for _, seq := range sequences {
		if len(seq) >= 3 && len(lowerPassword) >= len(seq) {
			for i := 0; i <= len(lowerPassword)-len(seq); i++ {
				if lowerPassword[i:i+len(seq)] == seq {
					return true
				}
			}
		}
	}

	return false
}

// hasRepeatedChars checks for repeated characters
func (v *PasswordValidator) hasRepeatedChars(password string) bool {
	// Check for 3 or more consecutive identical characters
	for i := 0; i < len(password)-2; i++ {
		if password[i] == password[i+1] && password[i] == password[i+2] {
			return true
		}
	}
	
	// Check for repeated patterns of 2 or more characters
	for patternLen := 2; patternLen <= len(password)/2; patternLen++ {
		for i := 0; i <= len(password)-patternLen*2; i++ {
			pattern := password[i : i+patternLen]
			nextPattern := password[i+patternLen : i+patternLen*2]
			if pattern == nextPattern {
				return true
			}
		}
	}

	return false
}

// IsStrongPassword checks if a password meets strong security requirements
func (v *PasswordValidator) IsStrongPassword(password string) bool {
	errors := v.ValidatePassword(password)
	return len(errors) == 0
}

// GetPasswordStrengthHint provides a hint about password strength
func (v *PasswordValidator) GetPasswordStrengthHint(password string) string {
	errors := v.ValidatePassword(password)
	
	if len(errors) == 0 {
		return "Strong password"
	}
	
	if len(errors) <= 2 {
		return "Moderate password - consider improving"
	}
	
	return "Weak password - needs significant improvement"
}