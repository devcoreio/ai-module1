import { 
    AppState, 
    PasswordCheckResponse, 
    BreachCheckResponse,
    PasswordFeedback,
    StrengthLevel,
    DEFAULT_CONFIG 
} from './services/types.js';
import { apiClient, ApiUtils } from './services/api.js';

// Import all components
import './components/password-input/password-input.js';
import './components/strength-meter/strength-meter.js';
import './components/breach-alert/breach-alert.js';
import './components/tips-panel/tips-panel.js';

class PasswordAppComponent extends HTMLElement {
    private state: AppState = {
        passwordInput: {
            value: '',
            isVisible: false,
            isValid: true,
            isFocused: false,
            hasBeenTouched: false
        },
        strengthMeter: {
            score: 0,
            level: 'very_weak',
            segments: [],
            isAnimating: false
        },
        tips: [],
        breachAlert: {
            isVisible: false,
            status: 'checking',
            message: '',
            isChecking: false
        },
        isLoading: false,
        error: null,
        lastCheckTimestamp: null
    };

    private passwordInput: any = null;
    private strengthMeter: any = null;
    private breachAlert: any = null;
    private tipsPanel: any = null;

    // Debounced API calls
    private debouncedPasswordCheck: any;
    private debouncedBreachCheck: any;

    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        
        // Initialize debounced functions
        this.debouncedPasswordCheck = ApiUtils.debounce(
            this.checkPasswordStrength.bind(this),
            DEFAULT_CONFIG.strengthCheckDelay
        );
        
        this.debouncedBreachCheck = ApiUtils.debounce(
            this.checkPasswordBreach.bind(this),
            DEFAULT_CONFIG.breachCheckDelay
        );
    }

    connectedCallback(): void {
        this.render();
        this.setupEventListeners();
        this.initializeApplication();
    }

    disconnectedCallback(): void {
        this.cleanup();
    }

    private render(): void {
        const template = `
            <style>
                :host {
                    display: block;
                    width: 100%;
                    max-width: 100%;
                }

                .password-app {
                    display: flex;
                    flex-direction: column;
                    gap: 20px;
                    width: 100%;
                }

                .input-section {
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                }

                .input-label {
                    font-size: 16px;
                    font-weight: 600;
                    color: #1f2937;
                    margin-bottom: 4px;
                }

                .strength-section {
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                    padding: 16px;
                    background-color: #f8fafc;
                    border-radius: 8px;
                    border: 1px solid #e5e7eb;
                }

                .strength-label {
                    font-size: 14px;
                    font-weight: 500;
                    color: #374151;
                }

                .feedback-sections {
                    display: flex;
                    flex-direction: column;
                    gap: 16px;
                }

                .error-message {
                    background-color: #fef2f2;
                    color: #991b1b;
                    padding: 12px 16px;
                    border-radius: 8px;
                    border-left: 4px solid #ef4444;
                    font-size: 14px;
                    display: none;
                }

                .error-message.show {
                    display: block;
                    animation: slideIn 0.3s ease-out;
                }

                .loading-overlay {
                    position: relative;
                    opacity: 1;
                    transition: opacity 0.3s ease;
                }

                .loading-overlay.loading {
                    opacity: 0.7;
                    pointer-events: none;
                }

                @keyframes slideIn {
                    from {
                        opacity: 0;
                        transform: translateY(-10px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }

                @media (max-width: 640px) {
                    .password-app {
                        gap: 16px;
                    }
                    
                    .strength-section {
                        padding: 12px;
                    }
                }
            </style>

            <div class="password-app">
                <!-- Password Input Section -->
                <div class="input-section">
                    <label class="input-label" for="password-input">
                        Enter your password to check its security
                    </label>
                    <password-input 
                        id="password-input"
                        placeholder="Enter your password..."
                        max-length="128"
                        min-length="8"
                        autocomplete="new-password"
                    ></password-input>
                </div>

                <!-- Strength Meter Section -->
                <div class="strength-section">
                    <div class="strength-label">Password Strength</div>
                    <strength-meter 
                        score="0" 
                        level="very_weak" 
                        show-label 
                        animated
                    ></strength-meter>
                </div>

                <!-- Error Messages -->
                <div id="error-message" class="error-message" role="alert">
                    <!-- Error content will be inserted here -->
                </div>

                <!-- Feedback Sections -->
                <div class="feedback-sections">
                    <!-- Breach Alert -->
                    <breach-alert dismissible></breach-alert>
                    
                    <!-- Tips Panel -->
                    <tips-panel collapsible expanded></tips-panel>
                </div>
            </div>
        `;

        if (this.shadowRoot) {
            this.shadowRoot.innerHTML = template;
        }
    }

    private setupEventListeners(): void {
        if (!this.shadowRoot) return;

        // Get component references
        this.passwordInput = this.shadowRoot.querySelector('password-input');
        this.strengthMeter = this.shadowRoot.querySelector('strength-meter');
        this.breachAlert = this.shadowRoot.querySelector('breach-alert');
        this.tipsPanel = this.shadowRoot.querySelector('tips-panel');

        // Password input events
        if (this.passwordInput) {
            this.passwordInput.addEventListener('password-change', this.handlePasswordChange.bind(this));
            this.passwordInput.addEventListener('password-focus', this.handlePasswordFocus.bind(this));
            this.passwordInput.addEventListener('password-blur', this.handlePasswordBlur.bind(this));
        }

        // Strength meter events
        if (this.strengthMeter) {
            this.strengthMeter.addEventListener('strength-change', this.handleStrengthChange.bind(this));
        }

        // Breach alert events
        if (this.breachAlert) {
            this.breachAlert.addEventListener('breach-alert-dismissed', this.handleBreachDismissed.bind(this));
            this.breachAlert.addEventListener('breach-status-change', this.handleBreachStatusChange.bind(this));
        }

        // Tips panel events
        if (this.tipsPanel) {
            this.tipsPanel.addEventListener('tips-updated', this.handleTipsUpdated.bind(this));
            this.tipsPanel.addEventListener('tips-panel-toggle', this.handleTipsToggle.bind(this));
        }

        // Global error handling
        window.addEventListener('unhandledrejection', this.handleUnhandledError.bind(this));
    }

    private cleanup(): void {
        // Clean up any resources
        window.removeEventListener('unhandledrejection', this.handleUnhandledError.bind(this));
    }

    private async initializeApplication(): Promise<void> {
        try {
            // Check API health
            const healthResponse = await apiClient.checkHealth();
            if (!healthResponse.success) {
                this.showError('Unable to connect to password service. Please try again later.');
            }
            
            // Set initial focus
            if (this.passwordInput) {
                this.passwordInput.focus();
            }
        } catch (error) {
            console.warn('Health check failed:', error);
            // Continue without showing error - API might be offline during development
        }
    }

    private handlePasswordChange(event: CustomEvent): void {
        const { password, isValid } = event.detail;
        
        this.state.passwordInput.value = password;
        this.state.passwordInput.isValid = isValid;
        this.state.passwordInput.hasBeenTouched = true;

        // Clear previous error
        this.clearError();

        if (password.length === 0) {
            this.resetAllComponents();
            return;
        }

        // Check if password meets minimum length for API calls
        if (!ApiUtils.meetsMinimumLength(password)) {
            // Hide API-dependent components for short passwords
            if (this.breachAlert) {
                this.breachAlert.hide();
            }
            // Don't make API calls for passwords shorter than 8 characters
            return;
        }

        if (!ApiUtils.isValidPassword(password)) {
            this.showError('Password must be 8-128 characters long with no leading/trailing spaces');
            return;
        }

        // Trigger debounced checks only for valid length passwords
        this.debouncedPasswordCheck(password);
        
        if (DEFAULT_CONFIG.enableBreachCheck) {
            this.debouncedBreachCheck(password);
        }
    }

    private handlePasswordFocus(event: CustomEvent): void {
        this.state.passwordInput.isFocused = true;
    }

    private handlePasswordBlur(event: CustomEvent): void {
        this.state.passwordInput.isFocused = false;
    }

    private handleStrengthChange(event: CustomEvent): void {
        // Strength meter component updates are handled internally
    }

    private handleBreachDismissed(event: CustomEvent): void {
        this.state.breachAlert.isVisible = false;
    }

    private handleBreachStatusChange(event: CustomEvent): void {
        const { status, breachCount, severity } = event.detail;
        this.state.breachAlert.status = status;
        this.state.breachAlert.breachCount = breachCount;
        this.state.breachAlert.severity = severity;
    }

    private handleTipsUpdated(event: CustomEvent): void {
        this.state.tips = event.detail.tips;
    }

    private handleTipsToggle(event: CustomEvent): void {
        // Handle tips panel toggle if needed
    }

    private handleUnhandledError(event: PromiseRejectionEvent): void {
        console.error('Unhandled promise rejection:', event.reason);
        this.showError('An unexpected error occurred. Please try again.');
    }

    private async checkPasswordStrength(password: string): Promise<void> {
        try {
            this.setLoading(true);
            
            const response = await apiClient.checkPasswordStrength(password);
            
            if (response.success) {
                this.updateStrengthMeter(response.data);
                this.updateTipsPanel(response.data.feedback, password);
            } else {
                this.showError(response.error?.message || 'Failed to check password strength');
            }
        } catch (error) {
            console.error('Password strength check failed:', error);
            this.showError('Unable to check password strength. Please try again.');
        } finally {
            this.setLoading(false);
        }
    }

    private async checkPasswordBreach(password: string): Promise<void> {
        try {
            if (this.breachAlert) {
                this.breachAlert.showChecking();
            }
            
            const response = await apiClient.checkPasswordBreach(password);
            
            if (response.success) {
                this.updateBreachAlert(response.data);
            } else {
                if (this.breachAlert) {
                    this.breachAlert.showError(
                        response.error?.message || 'Failed to check breach status'
                    );
                }
            }
        } catch (error) {
            console.error('Breach check failed:', error);
            if (this.breachAlert) {
                this.breachAlert.showError('Unable to check breach status');
            }
        }
    }

    private updateStrengthMeter(data: PasswordCheckResponse): void {
        if (!this.strengthMeter) return;

        this.state.strengthMeter.score = data.score;
        this.state.strengthMeter.level = data.strength_level;

        this.strengthMeter.setScore(data.score);
        this.strengthMeter.setLevel(data.strength_level);
    }

    private updateTipsPanel(feedback: PasswordFeedback, password: string): void {
        if (!this.tipsPanel) return;

        this.tipsPanel.updateTipsFromFeedback(feedback, password);
    }

    private updateBreachAlert(data: BreachCheckResponse): void {
        if (!this.breachAlert) return;

        this.state.breachAlert.breachCount = data.breach_count;
        this.state.breachAlert.severity = data.severity;

        if (data.is_breached) {
            this.breachAlert.showBreached(data.breach_count, data.severity, data.message);
        } else {
            this.breachAlert.showSafe();
        }
    }

    private resetAllComponents(): void {
        // Reset strength meter
        if (this.strengthMeter) {
            this.strengthMeter.reset();
        }

        // Hide breach alert
        if (this.breachAlert) {
            this.breachAlert.hide();
        }

        // Reset tips panel would require re-initializing tips
        this.state.passwordInput.hasBeenTouched = false;
        this.state.lastCheckTimestamp = null;
    }

    private setLoading(isLoading: boolean): void {
        this.state.isLoading = isLoading;
        
        // Add visual loading state if needed
        const appContainer = this.shadowRoot?.querySelector('.password-app');
        if (appContainer) {
            if (isLoading) {
                appContainer.classList.add('loading');
            } else {
                appContainer.classList.remove('loading');
            }
        }
    }

    private showError(message: string): void {
        this.state.error = message;
        
        const errorElement = this.shadowRoot?.querySelector('#error-message');
        if (errorElement) {
            errorElement.textContent = message;
            errorElement.classList.add('show');
        }
    }

    private clearError(): void {
        this.state.error = null;
        
        const errorElement = this.shadowRoot?.querySelector('#error-message');
        if (errorElement) {
            errorElement.classList.remove('show');
        }
    }

    // Public methods for external control
    public getState(): AppState {
        return { ...this.state };
    }

    public setPassword(password: string): void {
        if (this.passwordInput) {
            this.passwordInput.setValue(password);
        }
    }

    public clearPassword(): void {
        if (this.passwordInput) {
            this.passwordInput.clear();
        }
        this.resetAllComponents();
    }

    public focusPasswordInput(): void {
        if (this.passwordInput) {
            this.passwordInput.focus();
        }
    }
}

// Register the custom element
customElements.define('password-app', PasswordAppComponent);

// Export for potential external use
export { PasswordAppComponent };