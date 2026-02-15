import { 
    ApiConfig, 
    ApiResponse, 
    ApiError, 
    PasswordCheckResponse, 
    BreachCheckResponse, 
    HealthCheckResponse,
    DEFAULT_CONFIG 
} from './types.js';

export class ApiClient {
    private config: ApiConfig;

    constructor(config: Partial<ApiConfig> = {}) {
        this.config = { ...DEFAULT_CONFIG.api, ...config };
    }

    /**
     * Check password strength and get detailed feedback
     */
    async checkPasswordStrength(password: string): Promise<ApiResponse<PasswordCheckResponse>> {
        const endpoint = `${this.config.baseUrl}/password/check`;
        
        try {
            const response = await this.makeRequest<PasswordCheckResponse>(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ password })
            });

            return {
                data: response,
                success: true
            };
        } catch (error) {
            return this.handleError(error, endpoint);
        }
    }

    /**
     * Check if password exists in known data breaches
     */
    async checkPasswordBreach(password: string): Promise<ApiResponse<BreachCheckResponse>> {
        const endpoint = `${this.config.baseUrl}/password/breach-check`;
        
        try {
            const response = await this.makeRequest<BreachCheckResponse>(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ password })
            });

            return {
                data: response,
                success: true
            };
        } catch (error) {
            return this.handleError(error, endpoint);
        }
    }

    /**
     * Check API health status
     */
    async checkHealth(): Promise<ApiResponse<HealthCheckResponse>> {
        const endpoint = `${this.config.baseUrl}/health`;
        
        try {
            const response = await this.makeRequest<HealthCheckResponse>(endpoint, {
                method: 'GET'
            });

            return {
                data: response,
                success: true
            };
        } catch (error) {
            return this.handleError(error, endpoint);
        }
    }

    /**
     * Make HTTP request with retry logic and error handling
     */
    private async makeRequest<T>(
        url: string, 
        options: RequestInit, 
        attempt: number = 1
    ): Promise<T> {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

        try {
            const response = await fetch(url, {
                ...options,
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                throw await this.createApiError(response, url);
            }

            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
                return await response.json() as T;
            } else {
                throw new Error('Invalid response format: expected JSON');
            }
        } catch (error) {
            clearTimeout(timeoutId);

            // Handle abort error (timeout)
            if (error instanceof Error && error.name === 'AbortError') {
                throw new Error(`Request timeout after ${this.config.timeout}ms`);
            }

            // Handle network errors with retry logic
            if (this.isRetryableError(error) && attempt < this.config.retryAttempts) {
                await this.delay(this.config.retryDelay * attempt);
                return this.makeRequest<T>(url, options, attempt + 1);
            }

            throw error;
        }
    }

    /**
     * Create structured API error from response
     */
    private async createApiError(response: Response, endpoint: string): Promise<ApiError> {
        let message = `HTTP ${response.status}: ${response.statusText}`;
        
        try {
            const errorData = await response.json();
            if (errorData.message) {
                message = errorData.message;
            } else if (errorData.error) {
                message = errorData.error;
            }
        } catch {
            // If response body is not JSON, use status text
        }

        return {
            message,
            status: response.status,
            timestamp: new Date().toISOString(),
            endpoint
        };
    }

    /**
     * Handle API errors and create response structure
     */
    private handleError<T>(error: unknown, endpoint: string): ApiResponse<T> {
        let apiError: ApiError;

        if (error instanceof Error) {
            apiError = {
                message: error.message,
                status: 0, // Network error
                timestamp: new Date().toISOString(),
                endpoint
            };
        } else if (typeof error === 'object' && error !== null && 'status' in error) {
            apiError = error as ApiError;
        } else {
            apiError = {
                message: 'Unknown error occurred',
                status: 0,
                timestamp: new Date().toISOString(),
                endpoint
            };
        }

        return {
            data: {} as T,
            success: false,
            error: apiError
        };
    }

    /**
     * Determine if error is retryable
     */
    private isRetryableError(error: unknown): boolean {
        if (error instanceof Error) {
            // Network errors
            if (error.message.includes('fetch') || error.message.includes('network')) {
                return true;
            }
        }

        if (typeof error === 'object' && error !== null && 'status' in error) {
            const status = (error as any).status;
            // Retry on 5xx server errors and certain 4xx errors
            return status >= 500 || status === 408 || status === 429;
        }

        return false;
    }

    /**
     * Delay utility for retry logic
     */
    private delay(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Update API configuration
     */
    public updateConfig(newConfig: Partial<ApiConfig>): void {
        this.config = { ...this.config, ...newConfig };
    }

    /**
     * Get current configuration
     */
    public getConfig(): ApiConfig {
        return { ...this.config };
    }
}

// Utility functions for API client
export class ApiUtils {
    /**
     * Debounce function for API calls
     */
    static debounce<T extends (...args: any[]) => Promise<any>>(
        func: T,
        delay: number
    ): (...args: Parameters<T>) => Promise<ReturnType<T>> {
        let timeoutId: number | null = null;
        let lastPromise: Promise<ReturnType<T>> | null = null;

        return (...args: Parameters<T>): Promise<ReturnType<T>> => {
            return new Promise((resolve, reject) => {
                if (timeoutId) {
                    clearTimeout(timeoutId);
                }

                timeoutId = window.setTimeout(async () => {
                    try {
                        lastPromise = func(...args);
                        const result = await lastPromise;
                        resolve(result);
                    } catch (error) {
                        reject(error);
                    } finally {
                        timeoutId = null;
                        lastPromise = null;
                    }
                }, delay);
            });
        };
    }

    /**
     * Throttle function for API calls
     */
    static throttle<T extends (...args: any[]) => Promise<any>>(
        func: T,
        delay: number
    ): (...args: Parameters<T>) => Promise<ReturnType<T>> | null {
        let lastCall = 0;
        let timeoutId: number | null = null;

        return (...args: Parameters<T>): Promise<ReturnType<T>> | null => {
            const now = Date.now();

            if (now - lastCall >= delay) {
                lastCall = now;
                return func(...args);
            }

            if (timeoutId) {
                clearTimeout(timeoutId);
            }

            return new Promise((resolve, reject) => {
                timeoutId = window.setTimeout(async () => {
                    lastCall = Date.now();
                    try {
                        const result = await func(...args);
                        resolve(result);
                    } catch (error) {
                        reject(error);
                    }
                }, delay - (now - lastCall));
            });
        };
    }

    /**
     * Validate password before API call
     */
    static isValidPassword(password: string): boolean {
        return typeof password === 'string' && 
               password.length > 0 && 
               password.length <= 128 &&
               password.trim() === password; // No leading/trailing whitespace
    }

    /**
     * Sanitize password for logging (mask sensitive data)
     */
    static maskPassword(password: string): string {
        if (password.length <= 2) {
            return '*'.repeat(password.length);
        }
        return password[0] + '*'.repeat(password.length - 2) + password[password.length - 1];
    }
}

// Create singleton API client instance
export const apiClient = new ApiClient();