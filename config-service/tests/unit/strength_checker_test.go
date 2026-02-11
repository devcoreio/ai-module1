package services_test

import (
	"testing"

	"github.com/stretchr/testify/assert"

	"config-service/internal/models"
	"config-service/internal/services"
)

func TestPasswordStrengthChecker_CheckStrength(t *testing.T) {
	checker := services.NewPasswordStrengthChecker()

	tests := []struct {
		name     string
		password string
		wantScore int
		wantStrength models.PasswordStrength
	}{
		{
			name:         "very weak password",
			password:     "123",
			wantScore:    0,
			wantStrength: models.StrengthWeak,
		},
		{
			name:         "weak password",
			password:     "password",
			wantScore:    15,
			wantStrength: models.StrengthWeak,
		},
		{
			name:         "medium password",
			password:     "Password1",
			wantScore:    45,
			wantStrength: models.StrengthMedium,
		},
		{
			name:         "strong password",
			password:     "MyStr0ng!Pass",
			wantScore:    75,
			wantStrength: models.StrengthStrong,
		},
		{
			name:         "very strong password",
			password:     "MyV3ryStr0ng!P@ssw0rdWithNumbers123",
			wantScore:    95,
			wantStrength: models.StrengthVeryStrong,
		},
		{
			name:         "long password with good variety",
			password:     "ThisIsAVeryLongPasswordWithLotsOfCharactersAndNumbers123!@#",
			wantScore:    90,
			wantStrength: models.StrengthStrong,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := checker.CheckStrength(tt.password)
			
			assert.Equal(t, tt.wantStrength, result.Strength)
			assert.GreaterOrEqual(t, result.Score, 0)
			assert.LessOrEqual(t, result.Score, 100)
			
			// Verify that feedback is provided
			assert.NotNil(t, result.Feedback)
			assert.NotNil(t, result.Requirements)
		})
	}
}

