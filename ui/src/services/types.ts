// TypeScript types for the Password Security Checker

// API Response Types
export interface PasswordCheckResponse {
    password: string;
    score: number;
    feedback: PasswordFeedback;
    strength_level: StrengthLevel;
    estimated_crack_time: string;
    suggestions: string[];
    warning: string;
}

export interface BreachCheckResponse {
    password_hash: string;
    is_breached: boolean;
    breach_count: number;
    severity: BreachSeverity;
    message: string;
}

export interface HealthCheckResponse {
    status: string;
    timestamp: string;
    version: string;
}

// Strength and Security Types
export type StrengthLevel = 'very_weak' | 'weak' | 'fair' | 'good' | 'strong' | 'very_strong';

export type BreachSeverity = 'low' | 'medium' | 'high' | 'critical';

export interface PasswordFeedback {
    length_check: boolean;
    uppercase_check: boolean;
    lowercase_check: boolean;
    number_check: boolean;
    special_char_check: boolean;
    common_patterns: boolean;
    dictionary_check: boolean;
}

// UI Component Types
export interface PasswordInputState {
    value: string;
    isVisible: boolean;
    isValid: boolean;
    isFocused: boolean;
    hasBeenTouched: boolean;
}

export interface StrengthMeterState {
    score: number;
    level: StrengthLevel;
    segments: StrengthSegment[];
    isAnimating: boolean;
}

export interface StrengthSegment {
    id: number;
    isActive: boolean;
    color: StrengthColor;
    level: StrengthLevel | 'inactive';
}

export type StrengthColor = 'weak' | 'fair' | 'good' | 'strong' | 'very-strong' | 'inactive';

export interface TipItem {
    id: string;
    text: string;
    status: TipStatus;
    priority: number;
    category: TipCategory;
}

export type TipStatus = 'completed' | 'pending' | 'failed';
export type TipCategory = 'length' | 'complexity' | 'security' | 'best-practices';

export interface BreachAlertState {
    isVisible: boolean;
    status: BreachStatus;
    message: string;
    breachCount?: number;
    severity?: BreachSeverity;
    isChecking: boolean;
}

export type BreachStatus = 'safe' | 'breached' | 'checking' | 'error';

// Application State Types
export interface AppState {
    passwordInput: PasswordInputState;
    strengthMeter: StrengthMeterState;
    tips: TipItem[];
    breachAlert: BreachAlertState;
    isLoading: boolean;
    error: string | null;
    lastCheckTimestamp: number | null;
}

// Event Types
export interface PasswordChangeEvent extends CustomEvent {
    detail: {
        password: string;
        timestamp: number;
    };
}

export interface StrengthUpdateEvent extends CustomEvent {
    detail: {
        score: number;
        level: StrengthLevel;
        feedback: PasswordFeedback;
    };
}

export interface BreachCheckEvent extends CustomEvent {
    detail: {
        isBreached: boolean;
        breachCount: number;
        severity: BreachSeverity;
    };
}

// API Client Types
export interface ApiConfig {
    baseUrl: string;
    timeout: number;
    retryAttempts: number;
    retryDelay: number;
}

export interface ApiError {
    message: string;
    status: number;
    timestamp: string;
    endpoint: string;
}

export interface ApiResponse<T> {
    data: T;
    success: boolean;
    error?: ApiError;
}

// Utility Types
export interface DebouncedFunction<T extends (...args: any[]) => any> {
    (...args: Parameters<T>): void;
    cancel: () => void;
    flush: () => void;
}

export interface ThrottledFunction<T extends (...args: any[]) => any> {
    (...args: Parameters<T>): void;
    cancel: () => void;
}

// Component Props Types
export interface BaseComponentProps {
    id?: string;
    className?: string;
    ariaLabel?: string;
    disabled?: boolean;
}

export interface PasswordInputProps extends BaseComponentProps {
    placeholder?: string;
    maxLength?: number;
    minLength?: number;
    autoComplete?: string;
    required?: boolean;
    onPasswordChange?: (password: string) => void;
    onFocus?: () => void;
    onBlur?: () => void;
}

export interface StrengthMeterProps extends BaseComponentProps {
    score: number;
    level: StrengthLevel;
    showLabel?: boolean;
    animated?: boolean;
}

export interface TipsPanelProps extends BaseComponentProps {
    tips: TipItem[];
    isCollapsible?: boolean;
    defaultExpanded?: boolean;
    maxVisibleTips?: number;
}

export interface BreachAlertProps extends BaseComponentProps {
    isVisible: boolean;
    status: BreachStatus;
    message: string;
    breachCount?: number;
    severity?: BreachSeverity;
    onDismiss?: () => void;
}

// Configuration Types
export interface AppConfig {
    api: ApiConfig;
    debounceDelay: number;
    strengthCheckDelay: number;
    breachCheckDelay: number;
    maxPasswordLength: number;
    minPasswordLength: number;
    enableBreachCheck: boolean;
    enableRealTimeFeedback: boolean;
}

// Constants
export const STRENGTH_LEVELS: Record<StrengthLevel, { score: number; label: string; color: StrengthColor }> = {
    very_weak: { score: 0, label: 'Very Weak', color: 'weak' },
    weak: { score: 1, label: 'Weak', color: 'weak' },
    fair: { score: 2, label: 'Fair', color: 'fair' },
    good: { score: 3, label: 'Good', color: 'good' },
    strong: { score: 4, label: 'Strong', color: 'strong' },
    very_strong: { score: 5, label: 'Very Strong', color: 'very-strong' }
};

export const BREACH_SEVERITY_COLORS: Record<BreachSeverity, string> = {
    low: '#F59E0B',
    medium: '#F97316',
    high: '#EF4444',
    critical: '#DC2626'
};

export const DEFAULT_CONFIG: AppConfig = {
    api: {
        baseUrl: 'http://localhost:8080/api/v1',
        timeout: 5000,
        retryAttempts: 3,
        retryDelay: 1000
    },
    debounceDelay: 300,
    strengthCheckDelay: 500,
    breachCheckDelay: 1000,
    maxPasswordLength: 128,
    minPasswordLength: 1,
    enableBreachCheck: true,
    enableRealTimeFeedback: true
};
