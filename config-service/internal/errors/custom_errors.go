package errors

import (
	"fmt"
	"net/http"
)

// ErrorCode represents different types of errors
type ErrorCode string

const (
	// Validation errors
	ErrorCodeInvalidInput     ErrorCode = "INVALID_INPUT"
	ErrorCodeMissingField     ErrorCode = "MISSING_FIELD"
	ErrorCodeInvalidFormat    ErrorCode = "INVALID_FORMAT"
	ErrorCodePasswordTooShort ErrorCode = "PASSWORD_TOO_SHORT"
	ErrorCodePasswordTooLong  ErrorCode = "PASSWORD_TOO_LONG"

	// Business logic errors
	ErrorCodePasswordWeak        ErrorCode = "PASSWORD_TOO_WEAK"
	ErrorCodePasswordCommon      ErrorCode = "PASSWORD_TOO_COMMON"
	ErrorCodePasswordSequential  ErrorCode = "PASSWORD_SEQUENTIAL"
	ErrorCodePasswordRepeated    ErrorCode = "PASSWORD_REPEATED"

	// System errors
	ErrorCodeInternalError       ErrorCode = "INTERNAL_ERROR"
	ErrorCodeServiceUnavailable  ErrorCode = "SERVICE_UNAVAILABLE"
	ErrorCodeTimeout             ErrorCode = "TIMEOUT"
)

// APIError represents a custom API error
type APIError struct {
	Code    ErrorCode `json:"code"`
	Message string    `json:"message"`
	Details string    `json:"details,omitempty"`
}

// Error implements the error interface
func (e *APIError) Error() string {
	if e.Details != "" {
		return fmt.Sprintf("%s: %s (details: %s)", e.Code, e.Message, e.Details)
	}
	return fmt.Sprintf("%s: %s", e.Code, e.Message)
}

// HTTPStatus returns the HTTP status code for the error
func (e *APIError) HTTPStatus() int {
	switch e.Code {
	case ErrorCodeInvalidInput, ErrorCodeMissingField, ErrorCodeInvalidFormat,
		ErrorCodePasswordTooShort, ErrorCodePasswordTooLong:
		return http.StatusBadRequest
	case ErrorCodePasswordWeak, ErrorCodePasswordCommon,
		ErrorCodePasswordSequential, ErrorCodePasswordRepeated:
		return http.StatusUnprocessableEntity
	case ErrorCodeServiceUnavailable, ErrorCodeTimeout:
		return http.StatusServiceUnavailable
	default:
		return http.StatusInternalServerError
	}
}

// NewAPIError creates a new API error
func NewAPIError(code ErrorCode, message string, details ...string) *APIError {
	var detail string
	if len(details) > 0 {
		detail = details[0]
	}
	return &APIError{
		Code:    code,
		Message: message,
		Details: detail,
	}
}

// ValidationError represents a validation error
type ValidationError struct {
	Field   string `json:"field"`
	Message string `json:"message"`
}

// ValidationErrors represents a collection of validation errors
type ValidationErrors struct {
	Errors []ValidationError `json:"errors"`
}

// Error implements the error interface
func (e *ValidationErrors) Error() string {
	if len(e.Errors) == 0 {
		return "validation failed"
	}
	
	message := "validation failed: "
	for i, err := range e.Errors {
		if i > 0 {
			message += ", "
		}
		message += fmt.Sprintf("%s: %s", err.Field, err.Message)
	}
	return message
}

// NewValidationError creates a new validation error
func NewValidationError(field, message string) ValidationError {
	return ValidationError{
		Field:   field,
		Message: message,
	}
}

// NewValidationErrors creates a new collection of validation errors
func NewValidationErrors(errors []ValidationError) *ValidationErrors {
	return &ValidationErrors{
		Errors: errors,
	}
}

// AddError adds an error to the validation errors collection
func (e *ValidationErrors) AddError(field, message string) {
	e.Errors = append(e.Errors, NewValidationError(field, message))
}

// IsValidationError checks if an error is a validation error
func IsValidationError(err error) bool {
	_, ok := err.(*ValidationErrors)
	return ok
}

// IsAPIError checks if an error is an API error
func IsAPIError(err error) bool {
	_, ok := err.(*APIError)
	return ok
}

// WrapError wraps an error with additional context
func WrapError(err error, message string) error {
	return fmt.Errorf("%s: %w", message, err)
}

// PasswordValidationError represents a password-specific validation error
type PasswordValidationError struct {
	*APIError
	Requirements []string `json:"requirements,omitempty"`
}

// NewPasswordValidationError creates a new password validation error
func NewPasswordValidationError(code ErrorCode, message string, requirements []string) *PasswordValidationError {
	return &PasswordValidationError{
		APIError:     NewAPIError(code, message),
		Requirements: requirements,
	}
}