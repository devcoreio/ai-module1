import { 
    StrengthLevel, 
    StrengthColor, 
    StrengthSegment, 
    StrengthMeterState,
    STRENGTH_LEVELS 
} from '../../services/types.js';

export class StrengthMeterComponent extends HTMLElement {
    private state: StrengthMeterState = {
        score: 0,
        level: 'very_weak',
        segments: [],
        isAnimating: false
    };

    private segmentContainer: HTMLElement | null = null;
    private labelElement: HTMLElement | null = null;
    private animationTimeout: number | null = null;

    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
    }

    connectedCallback(): void {
        this.initializeSegments();
        this.render();
        this.setupEventListeners();
    }

    disconnectedCallback(): void {
        this.cleanup();
    }

    static get observedAttributes(): string[] {
        return ['score', 'level', 'show-label', 'animated'];
    }

    attributeChangedCallback(name: string, oldValue: string, newValue: string): void {
        if (oldValue !== newValue) {
            switch (name) {
                case 'score':
                    this.updateScore(parseInt(newValue) || 0);
                    break;
                case 'level':
                    this.updateLevel(newValue as StrengthLevel);
                    break;
                case 'show-label':
                case 'animated':
                    this.render();
                    break;
            }
        }
    }

    private initializeSegments(): void {
        this.state.segments = Array.from({ length: 5 }, (_, index) => ({
            id: index,
            isActive: false,
            color: 'inactive',
            level: 'inactive'
        }));
    }

    private render(): void {
        const showLabel = this.hasAttribute('show-label');
        const animated = this.hasAttribute('animated');

        const template = `
            <style>
                :host {
                    display: block;
                    width: 100%;
                }

                .strength-meter-container {
                    width: 100%;
                }

                .strength-segments {
                    display: flex;
                    gap: 4px;
                    margin-bottom: ${showLabel ? '8px' : '0'};
                    width: 100%;
                }

                .strength-segment {
                    height: 8px;
                    border-radius: 4px;
                    flex: 1;
                    transition: ${animated ? 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)' : 'none'};
                    transform: translateY(0);
                    opacity: 1;
                }

                .strength-segment.inactive {
                    background-color: #e5e7eb;
                }

                .strength-segment.weak {
                    background-color: #ef4444;
                }

                .strength-segment.fair {
                    background-color: #f59e0b;
                }

                .strength-segment.good {
                    background-color: #3b82f6;
                }

                .strength-segment.strong {
                    background-color: #10b981;
                }

                .strength-segment.very-strong {
                    background-color: #059669;
                }

                .strength-segment.animating {
                    transform: translateY(-2px);
                    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
                }

                .strength-label {
                    display: ${showLabel ? 'flex' : 'none'};
                    justify-content: space-between;
                    align-items: center;
                    font-size: 14px;
                    font-weight: 500;
                }

                .strength-text {
                    color: #374151;
                    transition: ${animated ? 'color 0.3s ease' : 'none'};
                }

                .strength-text.weak {
                    color: #ef4444;
                }

                .strength-text.fair {
                    color: #f59e0b;
                }

                .strength-text.good {
                    color: #3b82f6;
                }

                .strength-text.strong {
                    color: #10b981;
                }

                .strength-text.very-strong {
                    color: #059669;
                }

                .strength-score {
                    color: #6b7280;
                    font-size: 12px;
                    font-weight: normal;
                }

                @media (prefers-reduced-motion: reduce) {
                    .strength-segment,
                    .strength-text {
                        transition: none !important;
                    }
                    
                    .strength-segment.animating {
                        transform: none;
                        box-shadow: none;
                    }
                }

                @media (prefers-contrast: high) {
                    .strength-segment.weak {
                        background-color: #dc2626;
                    }
                    
                    .strength-segment.fair {
                        background-color: #d97706;
                    }
                    
                    .strength-segment.good {
                        background-color: #2563eb;
                    }
                    
                    .strength-segment.strong,
                    .strength-segment.very-strong {
                        background-color: #047857;
                    }
                }
            </style>

            <div class="strength-meter-container">
                <div class="strength-segments" role="progressbar" 
                     aria-valuenow="${this.state.score}" 
                     aria-valuemin="0" 
                     aria-valuemax="5"
                     aria-label="Password strength meter">
                    ${this.renderSegments()}
                </div>
                
                <div class="strength-label" aria-live="polite">
                    <span class="strength-text ${this.getTextColorClass()}">
                        ${this.getStrengthLabel()}
                    </span>
                    <span class="strength-score">
                        ${this.state.score}/5
                    </span>
                </div>
            </div>
        `;

        if (this.shadowRoot) {
            this.shadowRoot.innerHTML = template;
            this.segmentContainer = this.shadowRoot.querySelector('.strength-segments');
            this.labelElement = this.shadowRoot.querySelector('.strength-label');
        }
    }

    private renderSegments(): string {
        return this.state.segments.map(segment => 
            `<div class="strength-segment ${segment.color}" 
                  data-segment-id="${segment.id}"
                  role="presentation"></div>`
        ).join('');
    }

    private setupEventListeners(): void {
        // Set up any additional event listeners if needed
    }

    private cleanup(): void {
        if (this.animationTimeout) {
            clearTimeout(this.animationTimeout);
        }
    }

    private updateScore(score: number): void {
        const clampedScore = Math.max(0, Math.min(5, score));
        this.state.score = clampedScore;
        
        // Determine level based on score
        const level = this.scoreToLevel(clampedScore);
        this.updateLevel(level);
        
        this.updateSegments();
        this.triggerAnimation();
    }

    private updateLevel(level: StrengthLevel): void {
        this.state.level = level;
        this.updateSegments();
    }

    private updateSegments(): void {
        const strengthInfo = STRENGTH_LEVELS[this.state.level];
        const activeSegments = strengthInfo.score + 1; // Convert 0-4 to 1-5 segments

        this.state.segments.forEach((segment, index) => {
            if (index < activeSegments) {
                segment.isActive = true;
                segment.color = strengthInfo.color;
                segment.level = this.state.level;
            } else {
                segment.isActive = false;
                segment.color = 'inactive';
                segment.level = 'inactive';
            }
        });

        this.updateSegmentElements();
    }

    private updateSegmentElements(): void {
        if (!this.segmentContainer) return;

        const segmentElements = this.segmentContainer.querySelectorAll('.strength-segment');
        
        segmentElements.forEach((element, index) => {
            const segment = this.state.segments[index];
            if (segment) {
                // Remove all color classes
                element.classList.remove('inactive', 'weak', 'fair', 'good', 'strong', 'very-strong');
                // Add current color class
                element.classList.add(segment.color);
            }
        });

        // Update label if visible
        if (this.labelElement) {
            const textElement = this.labelElement.querySelector('.strength-text');
            const scoreElement = this.labelElement.querySelector('.strength-score');
            
            if (textElement) {
                textElement.textContent = this.getStrengthLabel();
                textElement.className = `strength-text ${this.getTextColorClass()}`;
            }
            
            if (scoreElement) {
                scoreElement.textContent = `${this.state.score}/5`;
            }
        }
    }

    private triggerAnimation(): void {
        if (!this.hasAttribute('animated') || !this.segmentContainer) return;

        this.state.isAnimating = true;
        
        const segmentElements = this.segmentContainer.querySelectorAll('.strength-segment');
        
        // Add animation class to active segments with staggered timing
        segmentElements.forEach((element, index) => {
            const segment = this.state.segments[index];
            if (segment.isActive) {
                setTimeout(() => {
                    element.classList.add('animating');
                    
                    // Remove animation class after animation completes
                    setTimeout(() => {
                        element.classList.remove('animating');
                    }, 300);
                }, index * 50); // Stagger timing
            }
        });

        // Reset animation state
        if (this.animationTimeout) {
            clearTimeout(this.animationTimeout);
        }
        
        this.animationTimeout = window.setTimeout(() => {
            this.state.isAnimating = false;
        }, 500);
    }

    private scoreToLevel(score: number): StrengthLevel {
        const levels: StrengthLevel[] = ['very_weak', 'weak', 'fair', 'good', 'strong', 'very_strong'];
        return levels[Math.max(0, Math.min(5, score))] || 'very_weak';
    }

    private getStrengthLabel(): string {
        return STRENGTH_LEVELS[this.state.level]?.label || 'Very Weak';
    }

    private getTextColorClass(): string {
        return STRENGTH_LEVELS[this.state.level]?.color || 'weak';
    }

    // Public methods
    public setScore(score: number): void {
        this.setAttribute('score', score.toString());
    }

    public setLevel(level: StrengthLevel): void {
        this.setAttribute('level', level);
    }

    public getScore(): number {
        return this.state.score;
    }

    public getLevel(): StrengthLevel {
        return this.state.level;
    }

    public reset(): void {
        this.setScore(0);
    }

    public isAnimating(): boolean {
        return this.state.isAnimating;
    }

    // Event dispatch methods
    private dispatchStrengthChange(): void {
        this.dispatchEvent(new CustomEvent('strength-change', {
            detail: {
                score: this.state.score,
                level: this.state.level,
                segments: this.state.segments,
                timestamp: Date.now()
            },
            bubbles: true,
            composed: true
        }));
    }
}

// Register the custom element
customElements.define('strength-meter', StrengthMeterComponent);