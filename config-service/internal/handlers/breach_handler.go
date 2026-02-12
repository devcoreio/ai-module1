package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"

	"config-service/internal/models"
	"config-service/internal/services"
)

// BreachCheckHandler handles the password breach check endpoint
func BreachCheckHandler(breachService *services.BreachService) gin.HandlerFunc {
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

		// Check if password is breached
		breachInfo, err := breachService.CheckPasswordBreach(request.Password)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"error":   "Breach check failed",
				"message": err.Error(),
			})
			return
		}

		// Return breach information
		c.JSON(http.StatusOK, breachInfo)
	}
}

// AddBreachInfoToPasswordResponse enhances a password strength response with breach info
func AddBreachInfoToPasswordResponse(response *models.PasswordResponse, breachInfo *models.BreachInfo) {
	// Add breach data to response
	response.BreachData = breachInfo

	// Update feedback if password was found in breaches
	if breachInfo != nil && breachInfo.Found {
		// Add breach warning
		response.Feedback.Warnings = append(
			response.Feedback.Warnings,
			"Password has appeared in data breaches",
		)

		// Add breach suggestion
		response.Feedback.Suggestions = append(
			response.Feedback.Suggestions,
			"Choose a password that hasn't been compromised",
		)
	}
}