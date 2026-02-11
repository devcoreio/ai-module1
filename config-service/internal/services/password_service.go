package services

import (
	"fmt"

	"github.com/sirupsen/logrus"
	"config-service/internal/models"
)

// PasswordService handles password strength checking business logic
type PasswordService struct {
	logger               *logrus.Logger
	passwordValidator    models.PasswordValidator
	passwordStrengthChecker *PasswordStrengthChecker
}

// NewPasswordService creates a new password service
func NewPasswordService(logger *logrus.Logger) *PasswordService {
	return &PasswordService{
		logger:               logger,
		passwordValidator:    models.NewPasswordValidator(),
		passwordStrengthChecker: NewPasswordStrengthChecker(),
	}
}

// CheckPasswordStrength validates and checks the strength of a password
func (s *PasswordService) CheckPasswordStrength(password string) (*models.PasswordResponse, error) {
	s.logger.Infof("Checking password strength for password of length %d", len(password))

	// Validate the password first
	if err := s.passwordValidator.Validate(password); err != nil {
		s.logger.Warnf("Password validation failed: %v", err)
		return nil, fmt.Errorf("password validation failed: %w", err)
	}

	// Check password strength
	response := s.passwordStrengthChecker.CheckStrength(password)

	s.logger.Infof("Password strength check completed: strength=%s, score=%d", 
		response.Strength, response.Score)

	return response, nil
}

// ValidatePassword validates a password according to basic requirements
func (s *PasswordService) ValidatePassword(password string) error {
	s.logger.Debugf("Validating password of length %d", len(password))
	return s.passwordValidator.Validate(password)
}

// GetPasswordRequirements returns which basic requirements are met for a password
func (s *PasswordService) GetPasswordRequirements(password string) models.PasswordRequirements {
	return models.GetPasswordRequirements(password)
}