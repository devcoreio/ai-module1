# Password Configuration Service

A high-performance Go-based microservice for password strength checking and validation. This service provides RESTful APIs to validate password strength, generate security recommendations, and enforce configurable password policies.

## Features

- **Password Strength Analysis**: Comprehensive password strength checking with detailed scoring
- **Security Recommendations**: Actionable feedback for improving password security
- **Configurable Policies**: Flexible password policy configuration via environment variables
- **RESTful API**: Clean, well-documented REST API with proper error handling
- **Production Ready**: Docker support, health checks, and comprehensive logging
- **High Performance**: Built with Gin framework for optimal performance
- **Comprehensive Testing**: Unit and integration tests included

## Quick Start

### Prerequisites

- Go 1.23+
- Docker (optional)

### Running Locally

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd config-service
   ```

2. **Build and run:**
   ```bash
   go mod download
   go run cmd/api/main.go
   ```

3. **Test the API:**
   ```bash
   curl -X POST http://localhost:8080/api/v1/password/check \
     -H "Content-Type: application/json" \
     -d '{"password": "MyStr0ng!Password"}'
   ```

### Running with Docker

1. **Build and run with Docker Compose:**
   ```bash
   docker-compose up -d
   ```

2. **Or build manually:**
   ```bash
   docker build -t password-config-service .
   docker run -p 8080:8080 password-config-service
   ```

## API Endpoints

### Health Check
```http
GET /api/v1/health
```
Returns service health status and version information.

### Password Strength Check
```http
POST /api/v1/password/check
Content-Type: application/json

{
  "password": "your-password-here"
}
```

**Response:**
```json
{
  "strength": "STRONG",
  "score": 75,
  "feedback": {
    "warnings": [],
    "suggestions": [
      "Consider using a longer password"
    ]
  },
  "requirements": {
    "length": true,
    "uppercase": true,
    "lowercase": true,
    "numbers": true,
    "special_chars": true,
    "no_common_patterns": true,
    "no_sequential_chars": true,
    "no_repeated_chars": true
  }
}
```

## Configuration

The service can be configured using environment variables:

### Server Configuration
- `SERVER_PORT`: Port to listen on (default: 8080)
- `SERVER_HOST`: Host to bind to (default: localhost)
- `APP_ENV`: Environment (development, staging, production)

### Password Policy
- `PASSWORD_MAX_LENGTH`: Maximum password length (default: 128)
- `PASSWORD_MIN_LENGTH`: Minimum password length (default: 8)
- `PASSWORD_REQUIRE_UPPERCASE`: Require uppercase letters (default: true)
- `PASSWORD_REQUIRE_LOWERCASE`: Require lowercase letters (default: true)
- `PASSWORD_REQUIRE_NUMBERS`: Require numbers (default: true)
- `PASSWORD_REQUIRE_SPECIAL`: Require special characters (default: true)

### Logging
- `LOG_LEVEL`: Log level (debug, info, warn, error)
- `LOG_FORMAT`: Log format (json, text)
- `LOG_OUTPUT`: Log output (stdout, stderr, file)

## Password Strength Criteria

The service evaluates passwords based on the following criteria:

1. **Length**: Minimum 8 characters, maximum 128 characters
2. **Character Variety**: Must contain uppercase, lowercase, numbers, and special characters
3. **Common Patterns**: Detects and penalizes common passwords and keyboard patterns
4. **Sequential Characters**: Identifies sequential characters (e.g., "123", "abc")
5. **Repeated Characters**: Detects repeated character patterns
6. **Entropy**: Calculates password entropy based on character set size

## Password Strength Levels

- **WEAK** (0-39): Poor security, easily guessable
- **MEDIUM** (40-59): Moderate security, could be improved
- **STRONG** (60-79): Good security, suitable for most applications
- **VERY_STRONG** (80-100): Excellent security, highly resistant to attacks

## Project Structure

```
config-service/
├── cmd/
│   └── api/                 # Main application entry point
├── internal/
│   ├── config/             # Configuration management
│   ├── handlers/           # HTTP request handlers
│   ├── models/             # Data models and DTOs
│   ├── services/           # Business logic services
│   ├── errors/             # Custom error types
│   └── utils/              # Utility functions
├── pkg/                    # Shared packages
├── tests/                  # Test files
│   ├── unit/              # Unit tests
│   └── integration/       # Integration tests
├── docs/                  # Documentation
├── scripts/               # Utility scripts
├── Dockerfile             # Docker build configuration
├── docker-compose.yml     # Docker Compose configuration
└── README.md              # This file
```

## Development

### Running Tests

```bash
# Run all tests
go test ./...

# Run specific test package
go test ./tests/unit/...

# Run with coverage
go test -cover ./...

# Run integration tests
go test ./tests/integration/...
```

### Code Quality

```bash
# Run linter
golangci-lint run

# Format code
gofmt -w .

# Check for issues
go vet ./...
```

### Building for Production

```bash
# Build for Linux
GOOS=linux GOARCH=amd64 go build -o config-service cmd/api/main.go

# Build with optimizations
go build -ldflags="-s -w" -o config-service cmd/api/main.go
```

## Monitoring and Observability

### Health Checks
The service provides a health check endpoint at `/api/v1/health` that returns:
- Service status
- Version information
- Timestamp
- Basic system information

### Logging
The service uses structured logging with the following levels:
- **Debug**: Detailed debugging information
- **Info**: General operational information
- **Warn**: Warning conditions that don't stop the service
- **Error**: Error conditions that may affect service operation

### Metrics
Consider adding Prometheus metrics for production deployments to monitor:
- Request rates and latencies
- Error rates
- Password strength distribution
- Service health status

## Security Considerations

1. **Password Handling**: Passwords are never logged or stored
2. **Input Validation**: All inputs are validated and sanitized
3. **CORS**: Configurable CORS policies for web applications
4. **Rate Limiting**: Consider implementing rate limiting in production
5. **HTTPS**: Use HTTPS in production environments

## Deployment

### Kubernetes
For Kubernetes deployment, consider using the provided Docker image with appropriate resource limits and health checks.

### Docker Swarm
Use the docker-compose.yml file for Docker Swarm deployments.

### Cloud Platforms
The service can be deployed to any cloud platform that supports Docker containers (AWS ECS, Google Cloud Run, Azure Container Instances, etc.).

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for your changes
5. Run the test suite
6. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support and questions:
- Create an issue in the repository
- Check the documentation in the `docs/` directory
- Review the test files for usage examples

## Changelog

### v1.0.0
- Initial release
- Password strength checking
- RESTful API
- Docker support
- Comprehensive testing