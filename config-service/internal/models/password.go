package models

import (
	"fmt"
	"strings"
	"unicode"
)

// PasswordRequest represents the request body for password strength check
type PasswordRequest struct {
	Password string `json:"password" binding:"required,min=8,max=128"`
}

// PasswordStrength represents the strength level of a password
type PasswordStrength string

const (
	StrengthWeak       PasswordStrength = "weak"
	StrengthMedium     PasswordStrength = "medium"
	StrengthStrong     PasswordStrength = "strong"
	StrengthVeryStrong PasswordStrength = "very_strong"
)

// PasswordRequirements represents the basic requirements check
type PasswordRequirements struct {
	Length      bool `json:"length"`
	Uppercase   bool `json:"uppercase"`
	Lowercase   bool `json:"lowercase"`
	Numbers     bool `json:"numbers"`
	SpecialChars bool `json:"special_chars"`
}

// PasswordFeedback contains warnings and suggestions
type PasswordFeedback struct {
	Warnings    []string `json:"warnings"`
	Suggestions []string `json:"suggestions"`
}

// BreachInfo represents data about password breaches
type BreachInfo struct {
	Found        bool   `json:"found"`
	BreachCount  int    `json:"breach_count"`
	LastBreached string `json:"last_breached,omitempty"`
}

// PasswordResponse represents the response body for password strength check
type PasswordResponse struct {
	Strength     PasswordStrength    `json:"strength"`
	Score        int                 `json:"score"`
	Feedback     PasswordFeedback    `json:"feedback"`
	Requirements PasswordRequirements `json:"requirements"`
	BreachData   *BreachInfo         `json:"breach_data,omitempty"`
}

// PasswordStrengthChecker defines the interface for password strength checking
type PasswordStrengthChecker interface {
	CheckStrength(password string) *PasswordResponse
}

// PasswordValidator defines the interface for password validation
type PasswordValidator interface {
	Validate(password string) error
}

// passwordValidator implements PasswordValidator
type passwordValidator struct{}

// NewPasswordValidator creates a new password validator
func NewPasswordValidator() PasswordValidator {
	return &passwordValidator{}
}

// Validate validates a password according to basic requirements
func (v *passwordValidator) Validate(password string) error {
	if len(password) < 8 {
		return fmt.Errorf("password must be at least 8 characters long")
	}

	if len(password) > 128 {
		return fmt.Errorf("password must not exceed 128 characters")
	}

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

	if !hasUpper || !hasLower || !hasNumber || !hasSpecial {
		return fmt.Errorf("password must contain at least one uppercase letter, one lowercase letter, one number, and one special character")
	}

	return nil
}

// GetPasswordRequirements checks which basic requirements are met
func GetPasswordRequirements(password string) PasswordRequirements {
	reqs := PasswordRequirements{
		Length:     len(password) >= 8,
		Uppercase:  false,
		Lowercase:  false,
		Numbers:    false,
		SpecialChars: false,
	}

	for _, char := range password {
		switch {
		case unicode.IsUpper(char):
			reqs.Uppercase = true
		case unicode.IsLower(char):
			reqs.Lowercase = true
		case unicode.IsDigit(char):
			reqs.Numbers = true
		case unicode.IsPunct(char) || unicode.IsSymbol(char):
			reqs.SpecialChars = true
		}
	}

	return reqs
}

// GetStrengthCategory determines the strength category based on score
func GetStrengthCategory(score int) PasswordStrength {
	switch {
	case score < 40:
		return StrengthWeak
	case score < 60:
		return StrengthMedium
	case score < 80:
		return StrengthStrong
	default:
		return StrengthVeryStrong
	}
}

// HasCommonPattern checks if password contains common patterns
func HasCommonPattern(password string) bool {
	lowerPassword := strings.ToLower(password)
	
	// Common keyboard patterns
	keyboardPatterns := []string{
		"qwerty", "asdf", "zxcv", "123456", "abcdef",
		"password", "admin", "welcome", "login",
	}
	
	for _, pattern := range keyboardPatterns {
		if strings.Contains(lowerPassword, pattern) {
			return true
		}
	}
	
	// Repeated characters
	for i := 0; i < len(password)-2; i++ {
		if password[i] == password[i+1] && password[i] == password[i+2] {
			return true
		}
	}
	
	return false
}