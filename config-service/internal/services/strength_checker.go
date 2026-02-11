package services

import (
	"math"
	"unicode"
	"config-service/internal/models"
)

// PasswordStrengthChecker implements the password strength checking logic
type PasswordStrengthChecker struct{}

// NewPasswordStrengthChecker creates a new password strength checker
func NewPasswordStrengthChecker() *PasswordStrengthChecker {
	return &PasswordStrengthChecker{}
}

// CheckStrength calculates the strength score and provides feedback for a password
func (c *PasswordStrengthChecker) CheckStrength(password string) *models.PasswordResponse {
	// Calculate base score components
	lengthScore := c.calculateLengthScore(password)
	characterVarietyScore := c.calculateCharacterVarietyScore(password)
	patternPenalty := c.calculatePatternPenalty(password)
	entropyScore := c.calculateEntropyScore(password)

	// Calculate total score (0-100)
	totalScore := lengthScore + characterVarietyScore - patternPenalty + entropyScore

	// Ensure score is within bounds
	if totalScore < 0 {
		totalScore = 0
	}
	if totalScore > 100 {
		totalScore = 100
	}

	// Generate feedback
	feedback := c.generateFeedback(password, totalScore)

	// Get requirements
	requirements := models.GetPasswordRequirements(password)

	// Create response
	response := &models.PasswordResponse{
		Strength:     models.GetStrengthCategory(totalScore),
		Score:        totalScore,
		Feedback:     feedback,
		Requirements: requirements,
	}

	return response
}

// calculateLengthScore calculates score based on password length
func (c *PasswordStrengthChecker) calculateLengthScore(password string) int {
	length := len(password)
	
	switch {
	case length >= 16:
		return 25
	case length >= 12:
		return 20
	case length >= 8:
		return 15
	case length >= 6:
		return 10
	case length >= 4:
		return 5
	default:
		return 0
	}
}

// calculateCharacterVarietyScore calculates score based on character variety
func (c *PasswordStrengthChecker) calculateCharacterVarietyScore(password string) int {
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

	score := 0
	if hasUpper {
		score += 6
	}
	if hasLower {
		score += 6
	}
	if hasNumber {
		score += 6
	}
	if hasSpecial {
		score += 6
	}

	return score
}

// calculatePatternPenalty calculates penalty for common patterns
func (c *PasswordStrengthChecker) calculatePatternPenalty(password string) int {
	penalty := 0

	// Check for common patterns
	if models.HasCommonPattern(password) {
		penalty += 20
	}

	// Check for sequential characters
	if c.hasSequentialChars(password) {
		penalty += 10
	}

	// Check for repeated patterns
	if c.hasRepeatedPatterns(password) {
		penalty += 15
	}

	return penalty
}

// calculateEntropyScore calculates score based on password entropy
func (c *PasswordStrengthChecker) calculateEntropyScore(password string) int {
	charSetSize := c.getCharacterSetSize(password)
	entropy := float64(len(password)) * math.Log2(float64(charSetSize))
	
	// Normalize entropy score to 0-50 range
	maxEntropy := 10.0 * float64(len(password)) // Approximate max for very complex passwords
	if maxEntropy == 0 {
		return 0
	}
	
	normalizedScore := int((entropy / maxEntropy) * 50)
	
	// Cap at 50 points
	if normalizedScore > 50 {
		normalizedScore = 50
	}

	return normalizedScore
}

// getCharacterSetSize determines the size of the character set used
func (c *PasswordStrengthChecker) getCharacterSetSize(password string) int {
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

	size := 0
	if hasUpper {
		size += 26
	}
	if hasLower {
		size += 26
	}
	if hasNumber {
		size += 10
	}
	if hasSpecial {
		size += 32 // Approximate number of common special characters
	}

	return size
}

// hasSequentialChars checks for sequential characters (keyboard patterns)
func (c *PasswordStrengthChecker) hasSequentialChars(password string) bool {
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
		if len(seq) >= 4 && len(lowerPassword) >= len(seq) {
			for i := 0; i <= len(lowerPassword)-len(seq); i++ {
				if lowerPassword[i:i+len(seq)] == seq {
					return true
				}
			}
		}
	}

	return false
}

// hasRepeatedPatterns checks for repeated character patterns
func (c *PasswordStrengthChecker) hasRepeatedPatterns(password string) bool {
	// Check for patterns like "abcabc", "123123", etc.
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

// generateFeedback generates warnings and suggestions based on the password
func (c *PasswordStrengthChecker) generateFeedback(password string, score int) models.PasswordFeedback {
	feedback := models.PasswordFeedback{
		Warnings:    []string{},
		Suggestions: []string{},
	}

	// Check for common issues
	if models.HasCommonPattern(password) {
		feedback.Warnings = append(feedback.Warnings, "Password contains common patterns")
		feedback.Suggestions = append(feedback.Suggestions, "Use a more unique combination of characters")
	}

	if c.hasSequentialChars(password) {
		feedback.Warnings = append(feedback.Warnings, "Password contains sequential characters")
		feedback.Suggestions = append(feedback.Suggestions, "Avoid keyboard patterns and sequential characters")
	}

	if c.hasRepeatedPatterns(password) {
		feedback.Warnings = append(feedback.Warnings, "Password contains repeated patterns")
		feedback.Suggestions = append(feedback.Suggestions, "Avoid repeating character sequences")
	}

	// Check character variety
	reqs := models.GetPasswordRequirements(password)
	if !reqs.Uppercase {
		feedback.Suggestions = append(feedback.Suggestions, "Add uppercase letters")
	}
	if !reqs.Lowercase {
		feedback.Suggestions = append(feedback.Suggestions, "Add lowercase letters")
	}
	if !reqs.Numbers {
		feedback.Suggestions = append(feedback.Suggestions, "Add numbers")
	}
	if !reqs.SpecialChars {
		feedback.Suggestions = append(feedback.Suggestions, "Add special characters")
	}

	// Length suggestions
	if len(password) < 12 {
		feedback.Suggestions = append(feedback.Suggestions, "Use a longer password (12+ characters)")
	}

	// Score-based suggestions
	if score < 40 {
		feedback.Suggestions = append(feedback.Suggestions, "Consider using a passphrase with multiple words")
	}
	if score < 60 {
		feedback.Suggestions = append(feedback.Suggestions, "Mix different character types more thoroughly")
	}

	return feedback
}