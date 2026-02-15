import { PasswordInputProps, PasswordInputState } from '../../services/types.js';

export class PasswordInputComponent extends HTMLElement {
    private state: PasswordInputState = {
        value: '',
        isVisible: false,
        isValid: true,
        isFocused: false,
        hasBeenTouched: false
    };

    private inputElement: HTMLInputElement | null = null;
    private toggleButton: HTMLButtonElement | null = null;
    private debounceTimer: number | null = null;

    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
    }

    connectedCallback(): void {
        this.render();
        this.setupEventListeners();
    }

    disconnectedCallback(): void {
        this.cleanupEventListeners();
    }

    static get observedAttributes(): string[] {
        return ['placeholder', 'disabled', 'max-length', 'min-length', 'required'];
    }

    attributeChangedCallback(name: string, oldValue: string, newValue: string): void {
        if (oldValue !== newValue) {
            this.render();
        }
    }

    private render(): void {
        const placeholder = this.getAttribute('placeholder') || 'Enter your password';
        const disabled = this.hasAttribute('disabled');
        const maxLength = parseInt(this.getAttribute('max-length') || '128');
        const minLength = parseInt(this.getAttribute('min-length') || '1');
        const required = this.hasAttribute('required');

        const template = `
            <style>
                :host {
                    display: block;
                    width: 100%;
                }

                .password-input-container {
                    position: relative;
                    width: 100%;
                }

                .password-input {
                    width: 100%;
                    padding: 12px 48px 12px 16px;
                    border: 2px solid #e5e7eb;
                    border-radius: 8px;
                    font-size: 16px;
                    line-height: 1.5;
                    transition: all 0.2s ease;
                    background-color: white;
                    box-sizing: border-box;
                }

                .password-input:focus {
                    outline: none;
                    border-color: #3b82f6;
                    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
                }

                .password-input:invalid {
                    border-color: #ef4444;
                }

                .password-input:disabled {
                    background-color: #f9fafb;
                    color: #6b7280;
                    cursor: not-allowed;
                }

                .password-toggle-btn {
                    position: absolute;
                    right: 12px;
                    top: 50%;
                    transform: translateY(-50%);
                    background: none;
                    border: none;
                    cursor: pointer;
                    padding: 8px;
                    border-radius: 4px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: #6b7280;
                    transition: all 0.2s ease;
                }

                .password-toggle-btn:hover:not(:disabled) {
                    background-color: #f3f4f6;
                    color: #374151;
                }

                .password-toggle-btn:focus {
                    outline: 2px solid #3b82f6;
                    outline-offset: 2px;
                }

                .password-toggle-btn:disabled {
                    cursor: not-allowed;
                    opacity: 0.5;
                }

                .toggle-icon {
                    width: 20px;
                    height: 20px;
                    fill: currentColor;
                }

                .error-message {
                    color: #ef4444;
                    font-size: 14px;
                    margin-top: 4px;
                    display: none;
                }

                .error-message.show {
                    display: block;
                }

                @media (prefers-reduced-motion: reduce) {
                    .password-input,
                    .password-toggle-btn {
                        transition: none;
                    }
                }
            </style>

            <div class="password-input-container">
                <input
                    type="${this.state.isVisible ? 'text' : 'password'}"
                    class="password-input"
                    placeholder="${placeholder}"
                    maxlength="${maxLength}"
                    minlength="${minLength}"
                    ${required ? 'required' : ''}
                    ${disabled ? 'disabled' : ''}
                    autocomplete="current-password"
                    spellcheck="false"
                    aria-label="Password input"
                    aria-describedby="password-error"
                />
                
                <button
                    type="button"
                    class="password-toggle-btn"
                    aria-label="${this.state.isVisible ? 'Hide password' : 'Show password'}"
                    ${disabled ? 'disabled' : ''}
                    tabindex="0"
                >
                    ${this.state.isVisible ? this.getHideIcon() : this.getShowIcon()}
                </button>

                <div id="password-error" class="error-message" role="alert" aria-live="polite">
                    <!-- Error messages will be displayed here -->
                </div>
            </div>
        `;

        if (this.shadowRoot) {
            this.shadowRoot.innerHTML = template;
        }
    }

    private setupEventListeners(): void {
        if (!this.shadowRoot) return;

        this.inputElement = this.shadowRoot.querySelector('.password-input');
        this.toggleButton = this.shadowRoot.querySelector('.password-toggle-btn');

        if (this.inputElement) {
            this.inputElement.addEventListener('input', this.handleInput.bind(this));
            this.inputElement.addEventListener('focus', this.handleFocus.bind(this));
            this.inputElement.addEventListener('blur', this.handleBlur.bind(this));
            this.inputElement.addEventListener('keydown', this.handleKeyDown.bind(this));
        }

        if (this.toggleButton) {
            this.toggleButton.addEventListener('click', this.togglePasswordVisibility.bind(this));
            this.toggleButton.addEventListener('keydown', this.handleToggleKeyDown.bind(this));
        }
    }

    private cleanupEventListeners(): void {
        if (this.debounceTimer) {
            clearTimeout(this.debounceTimer);
        }
    }

    private handleInput(event: Event): void {
        const target = event.target as HTMLInputElement;
        const newValue = target.value;

        this.state.value = newValue;
        this.state.hasBeenTouched = true;

        // Debounced password change event
        if (this.debounceTimer) {
            clearTimeout(this.debounceTimer);
        }

        this.debounceTimer = window.setTimeout(() => {
            this.dispatchPasswordChangeEvent(newValue);
            this.validateInput();
        }, 300);
    }

    private handleFocus(): void {
        this.state.isFocused = true;
        this.dispatchEvent(new CustomEvent('password-focus', {
            detail: { timestamp: Date.now() },
            bubbles: true
        }));
    }

    private handleBlur(): void {
        this.state.isFocused = false;
        this.state.hasBeenTouched = true;
        this.validateInput();
        
        this.dispatchEvent(new CustomEvent('password-blur', {
            detail: { 
                value: this.state.value,
                timestamp: Date.now() 
            },
            bubbles: true
        }));
    }

    private handleKeyDown(event: KeyboardEvent): void {
        // Handle Enter key for form submission
        if (event.key === 'Enter') {
            this.dispatchEvent(new CustomEvent('password-submit', {
                detail: { 
                    value: this.state.value,
                    timestamp: Date.now() 
                },
                bubbles: true
            }));
        }
    }

    private handleToggleKeyDown(event: KeyboardEvent): void {
        // Make toggle button keyboard accessible
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            this.togglePasswordVisibility();
        }
    }

    private togglePasswordVisibility(): void {
        this.state.isVisible = !this.state.isVisible;
        
        // Update input type and button attributes
        if (this.inputElement && this.toggleButton) {
            this.inputElement.type = this.state.isVisible ? 'text' : 'password';
            this.toggleButton.setAttribute('aria-label', 
                this.state.isVisible ? 'Hide password' : 'Show password');
            
            // Update icon
            this.toggleButton.innerHTML = this.state.isVisible ? 
                this.getHideIcon() : this.getShowIcon();
        }

        // Focus back to input after toggle
        if (this.inputElement) {
            this.inputElement.focus();
        }

        this.dispatchEvent(new CustomEvent('password-visibility-toggle', {
            detail: { 
                isVisible: this.state.isVisible,
                timestamp: Date.now() 
            },
            bubbles: true
        }));
    }

    private validateInput(): void {
        if (!this.inputElement) return;

        const value = this.state.value;
        const minLength = parseInt(this.getAttribute('min-length') || '1');
        const maxLength = parseInt(this.getAttribute('max-length') || '128');
        const required = this.hasAttribute('required');

        let isValid = true;
        let errorMessage = '';

        if (required && value.length === 0) {
            isValid = false;
            errorMessage = 'Password is required';
        } else if (value.length > 0 && value.length < minLength) {
            isValid = false;
            errorMessage = `Password must be at least ${minLength} characters`;
        } else if (value.length > maxLength) {
            isValid = false;
            errorMessage = `Password must not exceed ${maxLength} characters`;
        }

        this.state.isValid = isValid;
        this.updateErrorDisplay(errorMessage);

        // Update input styling
        if (this.inputElement) {
            if (isValid) {
                this.inputElement.style.borderColor = '#e5e7eb';
            } else {
                this.inputElement.style.borderColor = '#ef4444';
            }
        }
    }

    private updateErrorDisplay(message: string): void {
        const errorElement = this.shadowRoot?.querySelector('.error-message');
        if (errorElement) {
            errorElement.textContent = message;
            if (message) {
                errorElement.classList.add('show');
            } else {
                errorElement.classList.remove('show');
            }
        }
    }

    private dispatchPasswordChangeEvent(password: string): void {
        this.dispatchEvent(new CustomEvent('password-change', {
            detail: {
                password: password,
                timestamp: Date.now(),
                isValid: this.state.isValid
            },
            bubbles: true,
            composed: true
        }));
    }

    private getShowIcon(): string {
        return `
            <svg class="toggle-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
        `;
    }

    private getHideIcon(): string {
        return `
            <svg class="toggle-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <line x1="1" y1="1" x2="23" y2="23" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
        `;
    }

    // Public methods
    public getValue(): string {
        return this.state.value;
    }

    public setValue(value: string): void {
        this.state.value = value;
        if (this.inputElement) {
            this.inputElement.value = value;
        }
        this.validateInput();
    }

    public focus(): void {
        if (this.inputElement) {
            this.inputElement.focus();
        }
    }

    public clear(): void {
        this.setValue('');
    }

    public isValid(): boolean {
        return this.state.isValid;
    }
}

// Register the custom element
customElements.define('password-input', PasswordInputComponent);