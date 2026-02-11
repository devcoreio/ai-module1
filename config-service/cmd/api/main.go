package main

import (
	"fmt"
	"os"

	"github.com/gin-gonic/gin"
	"github.com/sirupsen/logrus"

	"config-service/internal/config"
	"config-service/internal/handlers"
	"config-service/internal/services"
)

func main() {
	// Initialize logger
	logger := logrus.New()
	logger.SetFormatter(&logrus.JSONFormatter{})
	logger.SetOutput(os.Stdout)
	logger.SetLevel(logrus.InfoLevel)

	// Load configuration
	cfg, err := config.Load()
	if err != nil {
		logger.Fatalf("Failed to load configuration: %v", err)
	}

	// Initialize services
	passwordService := services.NewPasswordService(logger)

	// Set Gin mode
	if cfg.Server.Env == "production" {
		gin.SetMode(gin.ReleaseMode)
	} else {
		gin.SetMode(gin.DebugMode)
	}

	// Create router
	r := gin.Default()

	// Add middleware
	r.Use(handlers.LoggingMiddleware(logger))
	r.Use(handlers.ErrorHandlingMiddleware(logger))

	// Health check endpoint
	r.GET("/api/v1/health", handlers.HealthCheckHandler)

	// Password strength check endpoint
	r.POST("/api/v1/password/check", handlers.PasswordCheckHandler(passwordService))

	// Start server
	logger.Infof("Starting server on port %d", cfg.Server.Port)
	if err := r.Run(fmt.Sprintf(":%d", cfg.Server.Port)); err != nil {
		logger.Fatalf("Failed to start server: %v", err)
	}
}