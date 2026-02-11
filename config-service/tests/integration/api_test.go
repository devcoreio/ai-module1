package integration_test

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
	"github.com/sirupsen/logrus"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"

	"config-service/internal/handlers"
	"config-service/internal/models"
	"config-service/internal/services"
)

func setupTestRouter() *gin.Engine {
	gin.SetMode(gin.TestMode)
	
	// Create test logger
	logger := setupTestLogger()

	// Initialize services
	passwordService := services.NewPasswordService(logger)

	// Create router
	r := gin.Default()

	// Add middleware
	r.Use(handlers.LoggingMiddleware(logger))
	r.Use(handlers.ErrorHandlingMiddleware(logger))

	// Health check endpoint
	r.GET("/api/v1/health", handlers.HealthCheckHandler)

	// Password strength check endpoint
	r.POST("/api/v1/password/check", handlers.PasswordCheckHandler(passwordService))

	return r
}

func setupTestLogger() *logrus.Logger {
	logger := logrus.New()
	logger.SetLevel(logrus.ErrorLevel) // Reduce log noise in tests
	return logger
}

func TestHealthCheckHandler(t *testing.T) {
	router := setupTestRouter()

	w := httptest.NewRecorder()
	req, _ := http.NewRequest("GET", "/api/v1/health", nil)

	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)

	var response map[string]interface{}
	err := json.Unmarshal(w.Body.Bytes(), &response)
	require.NoError(t, err)

	assert.Equal(t, "healthy", response["status"])
	assert.Contains(t, response, "timestamp")
	assert.Equal(t, "1.0.0", response["version"])
}

func TestPasswordCheckHandler_ValidPassword(t *testing.T) {
	router := setupTestRouter()

	testCases := []struct {
		name     string
		password string
		expected struct {
			statusCode int
			strength   models.PasswordStrength
			scoreMin   int
			scoreMax   int
		}
	}{
		{
			name:     "weak password",
			password: "Password1!",
			expected: struct {
				statusCode int
				strength   models.PasswordStrength
				scoreMin   int
				scoreMax   int
			}{
				statusCode: http.StatusOK,
				strength:   models.StrengthMedium,
				scoreMin:   40,
				scoreMax:   59,
			},
		},
		{
			name:     "medium password",
			password: "MyPassword1!",
			expected: struct {
				statusCode int
				strength   models.PasswordStrength
				scoreMin   int
				scoreMax   int
			}{
				statusCode: http.StatusOK,
				strength:   models.StrengthMedium,
				scoreMin:   40,
				scoreMax:   59,
			},
		},
		{
			name:     "strong password",
			password: "MyStr0ng!Pass",
			expected: struct {
				statusCode int
				strength   models.PasswordStrength
				scoreMin   int
				scoreMax   int
			}{
				statusCode: http.StatusOK,
				strength:   models.StrengthStrong,
				scoreMin:   60,
				scoreMax:   79,
			},
		},
		{
			name:     "very strong password",
			password: "MyV3ryStr0ng!P@ssw0rdWithNumbers123",
			expected: struct {
				statusCode int
				strength   models.PasswordStrength
				scoreMin   int
				scoreMax   int
			}{
				statusCode: http.StatusOK,
				strength:   models.StrengthVeryStrong,
				scoreMin:   80,
				scoreMax:   100,
			},
		},
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			requestBody := models.PasswordRequest{
				Password: tc.password,
			}

			jsonBody, err := json.Marshal(requestBody)
			require.NoError(t, err)

			w := httptest.NewRecorder()
			req, _ := http.NewRequest("POST", "/api/v1/password/check", bytes.NewBuffer(jsonBody))
			req.Header.Set("Content-Type", "application/json")

			router.ServeHTTP(w, req)

			assert.Equal(t, tc.expected.statusCode, w.Code)

			var response map[string]interface{}
			err = json.Unmarshal(w.Body.Bytes(), &response)
			require.NoError(t, err)

			assert.Equal(t, string(tc.expected.strength), response["strength"].(string))
			assert.Contains(t, response, "score")
			assert.Contains(t, response, "feedback")
			assert.Contains(t, response, "requirements")

			score := int(response["score"].(float64))
			assert.GreaterOrEqual(t, score, tc.expected.scoreMin)
			assert.LessOrEqual(t, score, tc.expected.scoreMax)
		})
	}
}

func TestPasswordCheckHandler_InvalidPassword(t *testing.T) {
	router := setupTestRouter()

	testCases := []struct {
		name     string
		password string
		expected struct {
			statusCode int
			errorType  string
		}
	}{
		{
			name:     "too short",
			password: "short",
			expected: struct {
				statusCode int
				errorType  string
			}{
				statusCode: http.StatusBadRequest,
				errorType:  "Password validation failed",
			},
		},
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			requestBody := models.PasswordRequest{
				Password: tc.password,
			}

			jsonBody, err := json.Marshal(requestBody)
			require.NoError(t, err)

			w := httptest.NewRecorder()
			req, _ := http.NewRequest("POST", "/api/v1/password/check", bytes.NewBuffer(jsonBody))
			req.Header.Set("Content-Type", "application/json")

			router.ServeHTTP(w, req)

			assert.Equal(t, tc.expected.statusCode, w.Code)

			var response map[string]interface{}
			err = json.Unmarshal(w.Body.Bytes(), &response)
			require.NoError(t, err)

			assert.Contains(t, response, "error")
		})
	}
}