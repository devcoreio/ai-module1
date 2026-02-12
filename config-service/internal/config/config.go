package config

import (
	"fmt"
	"os"

	"github.com/spf13/viper"
)

// Config represents the application configuration
type Config struct {
	Server struct {
		Port int    `mapstructure:"port"`
		Env  string `mapstructure:"env"`
	} `mapstructure:"server"`
	Logging struct {
		Level string `mapstructure:"level"`
	} `mapstructure:"logging"`
	Password struct {
		MaxLength int `mapstructure:"max_length"`
	} `mapstructure:"password"`
	Breach struct {
		Enabled       bool   `mapstructure:"enabled"`
		APIEndpoint   string `mapstructure:"api_endpoint"`
		Timeout       int    `mapstructure:"timeout"`
		CacheDuration int    `mapstructure:"cache_duration"`
	} `mapstructure:"breach"`
}

// Load loads the configuration from environment variables and default values
func Load() (*Config, error) {
	// Set configuration defaults
	viper.SetDefault("server.port", 8080)
	viper.SetDefault("server.env", "development")
	viper.SetDefault("logging.level", "info")
	viper.SetDefault("password.max_length", 128)
	viper.SetDefault("breach.enabled", true)
	viper.SetDefault("breach.api_endpoint", "https://api.pwnedpasswords.com/range")
	viper.SetDefault("breach.timeout", 10)
	viper.SetDefault("breach.cache_duration", 60)

	// Set environment variable prefix
	viper.SetEnvPrefix("CONFIG_SERVICE")
	viper.AutomaticEnv()

	// Create config instance
	var cfg Config

	// Unmarshal configuration
	if err := viper.Unmarshal(&cfg); err != nil {
		return nil, fmt.Errorf("failed to unmarshal config: %w", err)
	}

	// Validate configuration
	if err := validateConfig(&cfg); err != nil {
		return nil, fmt.Errorf("invalid configuration: %w", err)
	}

	return &cfg, nil
}

// validateConfig validates the configuration values
func validateConfig(cfg *Config) error {
	if cfg.Server.Port <= 0 || cfg.Server.Port > 65535 {
		return fmt.Errorf("invalid port: %d", cfg.Server.Port)
	}

	if cfg.Password.MaxLength <= 0 {
		return fmt.Errorf("invalid max password length: %d", cfg.Password.MaxLength)
	}

	return nil
}

// GetEnv returns the current environment
func GetEnv() string {
	env := os.Getenv("CONFIG_SERVICE_ENV")
	if env == "" {
		return "development"
	}
	return env
}