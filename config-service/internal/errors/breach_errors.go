package errors

import "fmt"

// BreachServiceError represents errors from the breach detection service
type BreachServiceError struct {
	Message string
	Cause   error
}

// Error returns the error message
func (e *BreachServiceError) Error() string {
	if e.Cause != nil {
		return fmt.Sprintf("%s: %v", e.Message, e.Cause)
	}
	return e.Message
}

// Unwrap returns the underlying cause of the error
func (e *BreachServiceError) Unwrap() error {
	return e.Cause
}

// NewBreachServiceError creates a new breach service error
func NewBreachServiceError(message string, cause error) *BreachServiceError {
	return &BreachServiceError{
		Message: message,
		Cause:   cause,
	}
}

// ErrBreachAPIUnavailable indicates the breach API is unavailable
func ErrBreachAPIUnavailable(cause error) *BreachServiceError {
	return NewBreachServiceError("breach API is unavailable", cause)
}

// ErrBreachRateLimited indicates the breach API rate limit was exceeded
func ErrBreachRateLimited(cause error) *BreachServiceError {
	return NewBreachServiceError("breach API rate limit exceeded", cause)
}

// ErrBreachTimeout indicates the breach API request timed out
func ErrBreachTimeout(cause error) *BreachServiceError {
	return NewBreachServiceError("breach API request timed out", cause)
}

// ErrBreachInvalidResponse indicates the breach API returned an invalid response
func ErrBreachInvalidResponse(cause error) *BreachServiceError {
	return NewBreachServiceError("breach API returned invalid response", cause)
}