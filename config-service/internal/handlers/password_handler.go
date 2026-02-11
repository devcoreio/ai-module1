package handlers

import (
	"net/http"
	"time"

	"github.com/gin-gonic/gin"

	"config-service/internal/models"
	"config-service/internal/services"
)

// PasswordCheckHandler handles the password strength check endpoint
func PasswordCheckHandler(passwordService *services.PasswordService) gin.HandlerFunc {
	return func(c *gin.Context) {
		var request models.PasswordRequest
		
		// Bind JSON request
		if err := c.ShouldBindJSON(&request); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{
				"error":   "Invalid request format",
				"message": err.Error(),
			})
			return
		}

		// Check password strength
		response, err := passwordService.CheckPasswordStrength(request.Password)
		if err != nil {
			c.JSON(http.StatusUnprocessableEntity, gin.H{
				"error":   "Password validation failed",
				"message": err.Error(),
			})
			return
		}

		// Return success response
		c.JSON(http.StatusOK, gin.H{
			"strength":     response.Strength,
			"score":        response.Score,
			"feedback":     response.Feedback,
			"requirements": response.Requirements,
		})
	}
}

// HealthCheckHandler handles the health check endpoint
func HealthCheckHandler(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{
		"status":    "healthy",
		"timestamp": time.Now().UTC().Format(time.RFC3339),
		"version":   "1.0.0",
	})
}

// GetPasswordRequirementsHandler handles getting password requirements for a given password
func GetPasswordRequirementsHandler(passwordService *services.PasswordService) gin.HandlerFunc {
	return func(c *gin.Context) {
		var request models.PasswordRequest
		
		// Bind JSON request
		if err := c.ShouldBindJSON(&request); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{
				"error":   "Invalid request format",
				"message": err.Error(),
			})
			return
		}

		// Get requirements
		requirements := passwordService.GetPasswordRequirements(request.Password)

		c.JSON(http.StatusOK, gin.H{
			"requirements": requirements,
		})
	}
}