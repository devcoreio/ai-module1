package handlers

import (
	"net/http"
	"time"

	"github.com/gin-gonic/gin"

	"config-service/internal/models"
	"config-service/internal/services"
)

// PasswordCheckHandler handles the password strength check endpoint
func PasswordCheckHandler(passwordService *services.PasswordService, breachService *services.BreachService) gin.HandlerFunc {
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

		// Check for breaches if breach service is provided
		if breachService != nil {
			breachInfo, breachErr := breachService.CheckPasswordBreach(request.Password)
			if breachErr == nil {
				// Add breach information to response
				AddBreachInfoToPasswordResponse(response, breachInfo)
			}
		}

		// Return success response
		c.JSON(http.StatusOK, response)
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