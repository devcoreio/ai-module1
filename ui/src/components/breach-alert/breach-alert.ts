import { 
    BreachStatus, 
    BreachSeverity, 
    BreachAlertState,
    BREACH_SEVERITY_COLORS 
} from '../../services/types.js';

export class BreachAlertComponent extends HTMLElement {
    private state: BreachAlertState = {
        isVisible: false,
        status: 'checking',
        message: '',
        isChecking: false
    };

    private alertContainer: HTMLElement | null = null;
    private messageElement: HTMLElement | null = null;
    private iconElement: HTMLElement | null = null;
    private dismissButton: HTMLElement | null = null;

    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
    }

    connectedCallback(): void {
        this.render();
        this.setupEventListeners();
    }

    disconnectedCallback(): void {
        this.cleanup();
    }

    static get observedAttributes(): string[] {
        return ['status', 'message', 'breach-count', 'severity', 'visible', 'dismissible'];
    }

    attributeChangedCallback(name: string, oldValue: string, newValue: string): void {
        if (oldValue !== newValue) {
            switch (name) {
                case 'status':
                    this.updateStatus(newValue as BreachStatus);
                    break;
                case 'message':
                    this.updateMessage(newValue);
                    break;
                case 'breach-count':
                    this.state.breachCount = parseInt(newValue) || 0;
                    this.render();
                    break;
                case 'severity':
                    this.state.severity = newValue as BreachSeverity;
                    this.render();
                    break;
                case 'visible':
                    this.state.isVisible = newValue === 'true';
                    this.updateVisibility();
                    break;
                case 'dismissible':
                    this.render();
                    break;
            }
        }
    }

    private render(): void {
        const isDismissible = this.hasAttribute('dismissible');
        const statusClass = this.getStatusClass();
        const iconSvg = this.getStatusIcon();

        const template = `
            <style>
                :host {
                    display: ${this.state.isVisible ? 'block' : 'none'};
                    width: 100%;
                }

                .breach-alert {
                    border-radius: 8px;
                    padding: 16px;
                    border-left: 4px solid;
                    position: relative;
                    display: flex;
                    align-items: flex-start;
                    gap: 12px;
                    transition: all 0.3s ease;
                    animation: slideIn 0.3s ease-out;
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

                .breach-alert.safe {
                    background-color: #f0fdf4;
                    border-left-color: #10b981;
                    color: #166534;
                }

                .breach-alert.breached {
                    background-color: #fef2f2;
                    border-left-color: #ef4444;
                    color: #991b1b;
                }

                .breach-alert.checking {
                    background-color: #f8fafc;
                    border-left-color: #64748b;
                    color: #475569;
                }

                .breach-alert.error {
                    background-color: #fef2f2;
                    border-left-color: #f59e0b;
                    color: #92400e;
                }

                .alert-icon {
                    width: 24px;
                    height: 24px;
                    flex-shrink: 0;
                    margin-top: 2px;
                }

                .alert-content {
                    flex: 1;
                    min-width: 0;
                }

                .alert-message {
                    font-size: 14px;
                    line-height: 1.5;
                    margin: 0;
                    font-weight: 500;
                }

                .alert-details {
                    font-size: 13px;
                    margin-top: 4px;
                    opacity: 0.8;
                    line-height: 1.4;
                }

                .breach-count {
                    font-weight: 600;
                    display: inline-block;
                    margin-right: 4px;
                }

                .severity-badge {
                    display: inline-block;
                    padding: 2px 8px;
                    border-radius: 12px;
                    font-size: 11px;
                    font-weight: 600;
                    text-transform: uppercase;
                    margin-left: 8px;
                    opacity: 0.9;
                }

                .severity-low {
                    background-color: rgba(245, 158, 11, 0.1);
                    color: #92400e;
                }

                .severity-medium {
                    background-color: rgba(249, 115, 22, 0.1);
                    color: #c2410c;
                }

                .severity-high {
                    background-color: rgba(239, 68, 68, 0.1);
                    color: #991b1b;
                }

                .severity-critical {
                    background-color: rgba(220, 38, 38, 0.1);
                    color: #7f1d1d;
                }

                .dismiss-button {
                    background: none;
                    border: none;
                    cursor: pointer;
                    padding: 4px;
                    border-radius: 4px;
                    color: currentColor;
                    opacity: 0.7;
                    transition: all 0.2s ease;
                    flex-shrink: 0;
                    display: ${isDismissible ? 'flex' : 'none'};
                    align-items: center;
                    justify-content: center;
                }

                .dismiss-button:hover {
                    opacity: 1;
                    background-color: rgba(0, 0, 0, 0.05);
                }

                .dismiss-button:focus {
                    outline: 2px solid currentColor;
                    outline-offset: 2px;
                }

                .dismiss-icon {
                    width: 16px;
                    height: 16px;
                }

                .loading-spinner {
                    width: 16px;
                    height: 16px;
                    border: 2px solid currentColor;
                    border-top: 2px solid transparent;
                    border-radius: 50%;
                    animation: spin 1s linear infinite;
                    display: inline-block;
                    margin-right: 8px;
                }

                @keyframes spin {
                    to {
                        transform: rotate(360deg);
                    }
                }

                @media (prefers-reduced-motion: reduce) {
                    .breach-alert {
                        animation: none;
                        transition: none;
                    }
                    
                    .loading-spinner {
                        animation: none;
                        border-top: 2px solid currentColor;
                    }
                }

                @media (max-width: 640px) {
                    .breach-alert {
                        padding: 12px;
                        gap: 8px;
                    }
                    
                    .alert-message {
                        font-size: 13px;
                    }
                    
                    .alert-details {
                        font-size: 12px;
                    }
                }
            </style>

            <div class="breach-alert ${statusClass}" role="alert" aria-live="polite">
                <div class="alert-icon">
                    ${iconSvg}
                </div>
                
                <div class="alert-content">
                    <p class="alert-message">
                        ${this.state.isChecking ? '<span class="loading-spinner"></span>' : ''}
                        ${this.state.message || this.getDefaultMessage()}
                    </p>
                    ${this.renderDetails()}
                </div>

                <button 
                    type="button" 
                    class="dismiss-button" 
                    aria-label="Dismiss alert"
                    ${!isDismissible ? 'style="display: none;"' : ''}
                >
                    ${this.getDismissIcon()}
                </button>
            </div>
        `;

        if (this.shadowRoot) {
            this.shadowRoot.innerHTML = template;
            this.alertContainer = this.shadowRoot.querySelector('.breach-alert');
            this.messageElement = this.shadowRoot.querySelector('.alert-message');
            this.iconElement = this.shadowRoot.querySelector('.alert-icon');
            this.dismissButton = this.shadowRoot.querySelector('.dismiss-button');
        }
    }

    private renderDetails(): string {
        if (this.state.status === 'breached' && this.state.breachCount !== undefined) {
            const severityBadge = this.state.severity ? 
                `<span class="severity-badge severity-${this.state.severity}">${this.state.severity}</span>` : '';
            
            return `
                <div class="alert-details">
                    Found in <span class="breach-count">${this.state.breachCount.toLocaleString()}</span> 
                    data breach${this.state.breachCount !== 1 ? 'es' : ''}${severityBadge}
                </div>
            `;
        }
        return '';
    }

    private setupEventListeners(): void {
        if (this.dismissButton) {
            this.dismissButton.addEventListener('click', this.handleDismiss.bind(this));
            this.dismissButton.addEventListener('keydown', this.handleDismissKeydown.bind(this));
        }
    }

    private cleanup(): void {
        // Clean up any timers or resources if needed
    }

    private updateStatus(status: BreachStatus): void {
        const oldStatus = this.state.status;
        this.state.status = status;
        this.state.isChecking = status === 'checking';
        
        if (oldStatus !== status) {
            this.render();
            this.dispatchStatusChangeEvent();
        }
    }

    private updateMessage(message: string): void {
        this.state.message = message;
        if (this.messageElement) {
            this.messageElement.innerHTML = `
                ${this.state.isChecking ? '<span class="loading-spinner"></span>' : ''}
                ${message || this.getDefaultMessage()}
            `;
        }
    }

    private updateVisibility(): void {
        if (this.style) {
            this.style.display = this.state.isVisible ? 'block' : 'none';
        }
        
        if (this.state.isVisible) {
            this.dispatchEvent(new CustomEvent('breach-alert-shown', {
                detail: { 
                    status: this.state.status,
                    timestamp: Date.now() 
                },
                bubbles: true
            }));
        }
    }

    private getStatusClass(): string {
        return this.state.status;
    }

    private getDefaultMessage(): string {
        switch (this.state.status) {
            case 'safe':
                return 'Great! This password has not been found in any known data breaches.';
            case 'breached':
                return 'Warning: This password has been found in data breaches.';
            case 'checking':
                return 'Checking password against known data breaches...';
            case 'error':
                return 'Unable to check password against breach databases.';
            default:
                return '';
        }
    }

    private getStatusIcon(): string {
        switch (this.state.status) {
            case 'safe':
                return `
                    <svg viewBox="0 0 24 24" fill="currentColor">
                        <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                    </svg>
                `;
            case 'breached':
                return `
                    <svg viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
                    </svg>
                `;
            case 'checking':
                return `
                    <svg viewBox="0 0 24 24" fill="currentColor">
                        <path d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                    </svg>
                `;
            case 'error':
                return `
                    <svg viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                    </svg>
                `;
            default:
                return '';
        }
    }

    private getDismissIcon(): string {
        return `
            <svg class="dismiss-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
        `;
    }

    private handleDismiss(): void {
        this.hide();
        this.dispatchEvent(new CustomEvent('breach-alert-dismissed', {
            detail: { 
                status: this.state.status,
                timestamp: Date.now() 
            },
            bubbles: true
        }));
    }

    private handleDismissKeydown(event: KeyboardEvent): void {
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            this.handleDismiss();
        }
    }

    private dispatchStatusChangeEvent(): void {
        this.dispatchEvent(new CustomEvent('breach-status-change', {
            detail: {
                status: this.state.status,
                breachCount: this.state.breachCount,
                severity: this.state.severity,
                message: this.state.message,
                timestamp: Date.now()
            },
            bubbles: true,
            composed: true
        }));
    }

    // Public methods
    public show(): void {
        this.setAttribute('visible', 'true');
    }

    public hide(): void {
        this.setAttribute('visible', 'false');
    }

    public setStatus(status: BreachStatus, message?: string): void {
        this.setAttribute('status', status);
        if (message) {
            this.setAttribute('message', message);
        }
    }

    public setBreachInfo(breachCount: number, severity: BreachSeverity): void {
        this.setAttribute('breach-count', breachCount.toString());
        this.setAttribute('severity', severity);
    }

    public showChecking(): void {
        this.state.isChecking = true;
        this.setStatus('checking');
        this.show();
    }

    public showSafe(): void {
        this.state.isChecking = false;
        this.setStatus('safe');
        this.show();
    }

    public showBreached(breachCount: number, severity: BreachSeverity, message?: string): void {
        this.state.isChecking = false;
        this.setBreachInfo(breachCount, severity);
        this.setStatus('breached', message);
        this.show();
    }

    public showError(message?: string): void {
        this.state.isChecking = false;
        this.setStatus('error', message);
        this.show();
    }

    public getStatus(): BreachStatus {
        return this.state.status;
    }

    public isVisible(): boolean {
        return this.state.isVisible;
    }

    public isChecking(): boolean {
        return this.state.isChecking;
    }
}

// Register the custom element
customElements.define('breach-alert', BreachAlertComponent);