import { 
    TipItem, 
    TipStatus, 
    TipCategory, 
    PasswordFeedback 
} from '../../services/types.js';

export class TipsPanelComponent extends HTMLElement {
    private tips: TipItem[] = [];
    private isExpanded: boolean = true;
    private maxVisibleTips: number = 6;
    private tipsContainer: HTMLElement | null = null;
    private toggleButton: HTMLElement | null = null;
    private headerElement: HTMLElement | null = null;

    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
    }

    connectedCallback(): void {
        this.initializeDefaultTips();
        this.render();
        this.setupEventListeners();
    }

    disconnectedCallback(): void {
        this.cleanup();
    }

    static get observedAttributes(): string[] {
        return ['collapsible', 'expanded', 'max-visible-tips'];
    }

    attributeChangedCallback(name: string, oldValue: string, newValue: string): void {
        if (oldValue !== newValue) {
            switch (name) {
                case 'collapsible':
                case 'expanded':
                    this.render();
                    break;
                case 'max-visible-tips':
                    this.maxVisibleTips = parseInt(newValue) || 6;
                    this.render();
                    break;
            }
        }
    }

    private initializeDefaultTips(): void {
        this.tips = [
            {
                id: 'length',
                text: 'Use at least 12 characters for better security',
                status: 'pending',
                priority: 1,
                category: 'length'
            },
            {
                id: 'uppercase',
                text: 'Include uppercase letters (A-Z)',
                status: 'pending',
                priority: 2,
                category: 'complexity'
            },
            {
                id: 'lowercase',
                text: 'Include lowercase letters (a-z)',
                status: 'pending',
                priority: 2,
                category: 'complexity'
            },
            {
                id: 'numbers',
                text: 'Include numbers (0-9)',
                status: 'pending',
                priority: 2,
                category: 'complexity'
            },
            {
                id: 'symbols',
                text: 'Include special characters (!@#$%^&*)',
                status: 'pending',
                priority: 3,
                category: 'complexity'
            },
            {
                id: 'common-patterns',
                text: 'Avoid common patterns and sequences',
                status: 'pending',
                priority: 4,
                category: 'security'
            },
            {
                id: 'dictionary',
                text: 'Avoid dictionary words and common passwords',
                status: 'pending',
                priority: 4,
                category: 'security'
            },
            {
                id: 'unique',
                text: 'Use a unique password for each account',
                status: 'pending',
                priority: 5,
                category: 'best-practices'
            }
        ];
    }

    private render(): void {
        const isCollapsible = this.hasAttribute('collapsible');
        const defaultExpanded = this.hasAttribute('expanded') ? 
            this.getAttribute('expanded') === 'true' : true;
        
        if (isCollapsible && this.isExpanded === undefined) {
            this.isExpanded = defaultExpanded;
        }

        const visibleTips = this.getVisibleTips();
        const completedCount = this.tips.filter(tip => tip.status === 'completed').length;

        const template = `
            <style>
                :host {
                    display: block;
                    width: 100%;
                }

                .tips-panel {
                    border: 1px solid #e5e7eb;
                    border-radius: 8px;
                    background-color: white;
                    overflow: hidden;
                    transition: all 0.3s ease;
                }

                .tips-header {
                    padding: 16px;
                    background-color: #f8fafc;
                    border-bottom: 1px solid #e5e7eb;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    cursor: ${isCollapsible ? 'pointer' : 'default'};
                    transition: background-color 0.2s ease;
                }

                .tips-header:hover {
                    background-color: ${isCollapsible ? '#f1f5f9' : '#f8fafc'};
                }

                .tips-title {
                    font-size: 16px;
                    font-weight: 600;
                    color: #1f2937;
                    margin: 0;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }

                .progress-indicator {
                    font-size: 14px;
                    color: #6b7280;
                    font-weight: normal;
                    background-color: #e5e7eb;
                    padding: 2px 8px;
                    border-radius: 12px;
                }

                .progress-indicator.good {
                    background-color: #dcfce7;
                    color: #166534;
                }

                .toggle-button {
                    background: none;
                    border: none;
                    cursor: pointer;
                    padding: 4px;
                    border-radius: 4px;
                    color: #6b7280;
                    transition: all 0.2s ease;
                    display: ${isCollapsible ? 'flex' : 'none'};
                    align-items: center;
                    justify-content: center;
                }

                .toggle-button:hover {
                    color: #374151;
                    background-color: #f3f4f6;
                }

                .toggle-button:focus {
                    outline: 2px solid #3b82f6;
                    outline-offset: 2px;
                }

                .toggle-icon {
                    width: 20px;
                    height: 20px;
                    transition: transform 0.3s ease;
                    transform: rotate(${this.isExpanded ? '180deg' : '0deg'});
                }

                .tips-content {
                    padding: ${this.isExpanded ? '16px' : '0'};
                    max-height: ${this.isExpanded ? '400px' : '0'};
                    overflow-y: auto;
                    transition: all 0.3s ease;
                    opacity: ${this.isExpanded ? '1' : '0'};
                }

                .tips-list {
                    list-style: none;
                    margin: 0;
                    padding: 0;
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                }

                .tip-item {
                    padding: 12px;
                    border-radius: 6px;
                    border-left: 3px solid transparent;
                    transition: all 0.2s ease;
                    display: flex;
                    align-items: flex-start;
                    gap: 8px;
                    font-size: 14px;
                    line-height: 1.4;
                }

                .tip-item.completed {
                    background-color: #f0fdf4;
                    border-left-color: #10b981;
                    color: #166534;
                }

                .tip-item.pending {
                    background-color: #fffbeb;
                    border-left-color: #f59e0b;
                    color: #92400e;
                }

                .tip-item.failed {
                    background-color: #fef2f2;
                    border-left-color: #ef4444;
                    color: #991b1b;
                }

                .tip-icon {
                    width: 16px;
                    height: 16px;
                    flex-shrink: 0;
                    margin-top: 2px;
                }

                .tip-text {
                    flex: 1;
                }

                .tip-category {
                    font-size: 11px;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                    opacity: 0.8;
                    font-weight: 600;
                }

                .no-tips-message {
                    text-align: center;
                    color: #6b7280;
                    font-style: italic;
                    padding: 20px;
                }

                .show-more-button {
                    width: 100%;
                    background: none;
                    border: 1px solid #e5e7eb;
                    border-radius: 6px;
                    padding: 8px;
                    color: #6b7280;
                    cursor: pointer;
                    font-size: 14px;
                    margin-top: 8px;
                    transition: all 0.2s ease;
                }

                .show-more-button:hover {
                    background-color: #f9fafb;
                    border-color: #d1d5db;
                }

                @media (prefers-reduced-motion: reduce) {
                    .tips-panel,
                    .tips-content,
                    .toggle-icon,
                    .tip-item {
                        transition: none;
                    }
                }

                @media (max-width: 640px) {
                    .tips-header {
                        padding: 12px;
                    }
                    
                    .tips-content {
                        padding: ${this.isExpanded ? '12px' : '0'};
                    }
                    
                    .tip-item {
                        padding: 8px;
                        font-size: 13px;
                    }
                }
            </style>

            <div class="tips-panel">
                <div class="tips-header" ${isCollapsible ? 'role="button" tabindex="0"' : ''}>
                    <h3 class="tips-title">
                        Password Tips
                        <span class="progress-indicator ${completedCount >= this.tips.length / 2 ? 'good' : ''}">
                            ${completedCount}/${this.tips.length}
                        </span>
                    </h3>
                    <button class="toggle-button" aria-label="${this.isExpanded ? 'Collapse tips' : 'Expand tips'}">
                        ${this.getToggleIcon()}
                    </button>
                </div>
                
                <div class="tips-content">
                    ${this.renderTips(visibleTips)}
                </div>
            </div>
        `;

        if (this.shadowRoot) {
            this.shadowRoot.innerHTML = template;
            this.tipsContainer = this.shadowRoot.querySelector('.tips-content');
            this.toggleButton = this.shadowRoot.querySelector('.toggle-button');
            this.headerElement = this.shadowRoot.querySelector('.tips-header');
        }
    }

    private renderTips(tips: TipItem[]): string {
        if (tips.length === 0) {
            return '<div class="no-tips-message">All password requirements met! 🎉</div>';
        }

        const visibleTips = tips.slice(0, this.maxVisibleTips);
        const hasMore = tips.length > this.maxVisibleTips;

        const tipsHtml = visibleTips.map(tip => `
            <li class="tip-item ${tip.status}" data-tip-id="${tip.id}">
                <div class="tip-icon">
                    ${this.getTipIcon(tip.status)}
                </div>
                <div class="tip-text">
                    <div>${tip.text}</div>
                    <div class="tip-category">${tip.category}</div>
                </div>
            </li>
        `).join('');

        return `
            <ul class="tips-list">
                ${tipsHtml}
            </ul>
            ${hasMore ? `<button class="show-more-button">Show ${tips.length - this.maxVisibleTips} more tips</button>` : ''}
        `;
    }

    private getVisibleTips(): TipItem[] {
        // Sort tips by priority and status
        return this.tips
            .filter(tip => tip.status === 'pending' || tip.status === 'failed')
            .sort((a, b) => {
                // Failed items first, then by priority
                if (a.status === 'failed' && b.status !== 'failed') return -1;
                if (b.status === 'failed' && a.status !== 'failed') return 1;
                return a.priority - b.priority;
            });
    }

    private setupEventListeners(): void {
        if (this.toggleButton) {
            this.toggleButton.addEventListener('click', this.handleToggle.bind(this));
        }

        if (this.headerElement && this.hasAttribute('collapsible')) {
            this.headerElement.addEventListener('click', this.handleToggle.bind(this));
            this.headerElement.addEventListener('keydown', this.handleHeaderKeydown.bind(this));
        }

        // Listen for show more button
        this.addEventListener('click', this.handleShowMore.bind(this));
    }

    private cleanup(): void {
        // Clean up any resources if needed
    }

    private handleToggle(): void {
        this.isExpanded = !this.isExpanded;
        this.render();
        
        this.dispatchEvent(new CustomEvent('tips-panel-toggle', {
            detail: {
                expanded: this.isExpanded,
                timestamp: Date.now()
            },
            bubbles: true
        }));
    }

    private handleHeaderKeydown(event: KeyboardEvent): void {
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            this.handleToggle();
        }
    }

    private handleShowMore(event: Event): void {
        const target = event.target as HTMLElement;
        if (target.classList.contains('show-more-button')) {
            this.maxVisibleTips = this.tips.length;
            this.render();
        }
    }

    private getTipIcon(status: TipStatus): string {
        switch (status) {
            case 'completed':
                return `
                    <svg viewBox="0 0 16 16" fill="currentColor">
                        <path d="M12.416 2.584a1 1 0 011.414 1.414l-6.5 6.5a1 1 0 01-1.414 0l-3-3a1 1 0 011.414-1.414L6.5 8.414l5.916-5.83z"/>
                    </svg>
                `;
            case 'pending':
                return `
                    <svg viewBox="0 0 16 16" fill="currentColor">
                        <path d="M8 15A7 7 0 118 1a7 7 0 010 14zm0-1A6 6 0 108 2a6 6 0 000 12zm0-3a1 1 0 110-2 1 1 0 010 2zm0-8a1 1 0 01.993.883L9 4v4a1 1 0 01-1.993.117L7 8V4a1 1 0 011-1z"/>
                    </svg>
                `;
            case 'failed':
                return `
                    <svg viewBox="0 0 16 16" fill="currentColor">
                        <path d="M8 15A7 7 0 118 1a7 7 0 010 14zM5.707 6.293a1 1 0 00-1.414 1.414L6.586 8l-2.293 2.293a1 1 0 101.414 1.414L8 9.414l2.293 2.293a1 1 0 001.414-1.414L9.414 8l2.293-2.293a1 1 0 00-1.414-1.414L8 6.586 5.707 4.293z"/>
                    </svg>
                `;
            default:
                return '';
        }
    }

    private getToggleIcon(): string {
        return `
            <svg class="toggle-icon" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd"/>
            </svg>
        `;
    }

    // Public methods
    public updateTipsFromFeedback(feedback: PasswordFeedback, password: string): void {
        // Update tip statuses based on password feedback
        this.tips.forEach(tip => {
            switch (tip.id) {
                case 'length':
                    tip.status = password.length >= 12 ? 'completed' : 
                                password.length >= 8 ? 'pending' : 'failed';
                    if (password.length < 8) {
                        tip.text = 'Password must be at least 8 characters (12+ recommended)';
                    }
                    break;
                case 'uppercase':
                    tip.status = feedback.uppercase_check ? 'completed' : 'pending';
                    break;
                case 'lowercase':
                    tip.status = feedback.lowercase_check ? 'completed' : 'pending';
                    break;
                case 'numbers':
                    tip.status = feedback.number_check ? 'completed' : 'pending';
                    break;
                case 'symbols':
                    tip.status = feedback.special_char_check ? 'completed' : 'pending';
                    break;
                case 'common-patterns':
                    tip.status = feedback.common_patterns ? 'completed' : 'failed';
                    break;
                case 'dictionary':
                    tip.status = feedback.dictionary_check ? 'completed' : 'failed';
                    break;
            }
        });

        this.render();
        this.dispatchTipsUpdateEvent();
    }

    public addCustomTip(tip: TipItem): void {
        this.tips.push(tip);
        this.render();
    }

    public removeTip(tipId: string): void {
        this.tips = this.tips.filter(tip => tip.id !== tipId);
        this.render();
    }

    public expand(): void {
        if (this.hasAttribute('collapsible')) {
            this.isExpanded = true;
            this.render();
        }
    }

    public collapse(): void {
        if (this.hasAttribute('collapsible')) {
            this.isExpanded = false;
            this.render();
        }
    }

    public getTips(): TipItem[] {
        return [...this.tips];
    }

    public getCompletedCount(): number {
        return this.tips.filter(tip => tip.status === 'completed').length;
    }

    private dispatchTipsUpdateEvent(): void {
        this.dispatchEvent(new CustomEvent('tips-updated', {
            detail: {
                tips: this.tips,
                completedCount: this.getCompletedCount(),
                totalCount: this.tips.length,
                timestamp: Date.now()
            },
            bubbles: true,
            composed: true
        }));
    }
}

// Register the custom element
customElements.define('tips-panel', TipsPanelComponent);