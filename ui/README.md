# Password Security Checker - Frontend

A modern, accessible, and responsive password security checker built with Web Components, TypeScript, and Tailwind CSS. This frontend provides real-time password strength analysis, breach detection, and security tips.

## 🚀 Features

- **Real-time Password Analysis**: Instant feedback as you type
- **Breach Detection**: Checks passwords against known data breaches
- **Visual Strength Meter**: Progressive visual indication of password strength
- **Security Tips**: Context-aware suggestions for password improvement
- **Accessibility**: WCAG compliant with screen reader support
- **Responsive Design**: Works seamlessly across devices
- **Modern Architecture**: Built with Web Components and TypeScript

## 🏗️ Architecture

### Tech Stack
- **HTML5** - Semantic structure
- **TypeScript** - Type-safe logic (compiles to JavaScript)
- **Tailwind CSS** - Utility-first styling via CDN
- **Web Components** - Reusable, encapsulated components
- **Fetch API** - Native network requests
- **Custom Events** - Component communication

### Project Structure
```
ui/
├── index.html              # Main entry point
├── assets/                 # Static assets
│   ├── images/             # Images and icons
│   └── styles/             # Additional CSS files
├── src/                    # TypeScript source code
│   ├── components/         # Web components
│   │   ├── password-input/ # Password input with visibility toggle
│   │   ├── strength-meter/ # Visual strength indicator
│   │   ├── tips-panel/     # Password improvement tips
│   │   └── breach-alert/   # Breach detection alerts
│   ├── services/           # API and utility services
│   │   ├── api.ts          # API client with retry logic
│   │   └── types.ts        # TypeScript types and interfaces
│   ├── utils/              # Utility functions
│   └── app.ts              # Main application controller
└── tests/                  # Test files
    ├── unit/               # Unit tests
    ├── integration/        # Integration tests
    └── e2e/                # End-to-end tests
```

## 🔧 API Integration

The frontend integrates with the following API endpoints:

### Password Strength Check
```typescript
POST /api/v1/password/check
{
  "password": "userPassword123"
}
```

### Breach Detection
```typescript
POST /api/v1/password/breach-check
{
  "password": "userPassword123"
}
```

### Health Check
```typescript
GET /api/v1/health
```

## 🎨 Components

### PasswordInputComponent (`<password-input>`)
A secure password input field with show/hide functionality.

**Features:**
- Toggle password visibility
- Real-time validation
- Debounced input events
- Accessible keyboard navigation
- Custom validation rules

**Attributes:**
- `placeholder` - Input placeholder text
- `max-length` - Maximum password length
- `min-length` - Minimum password length
- `required` - Makes field required
- `disabled` - Disables input

**Events:**
- `password-change` - Fired when password changes
- `password-focus` - Fired when input gains focus
- `password-blur` - Fired when input loses focus

### StrengthMeterComponent (`<strength-meter>`)
Visual representation of password strength with animations.

**Features:**
- 5-segment strength visualization
- Animated transitions
- Color-coded strength levels
- Accessible progress indicator

**Attributes:**
- `score` - Strength score (0-5)
- `level` - Strength level (very_weak to very_strong)
- `show-label` - Display text label
- `animated` - Enable animations

### BreachAlertComponent (`<breach-alert>`)
Displays breach detection results and security warnings.

**Features:**
- Status-based styling
- Dismissible notifications
- Severity indicators
- Loading states

**Attributes:**
- `status` - Alert status (safe, breached, checking, error)
- `message` - Custom message
- `breach-count` - Number of breaches found
- `severity` - Breach severity level
- `visible` - Show/hide alert
- `dismissible` - Allow dismissal

### TipsPanelComponent (`<tips-panel>`)
Context-aware password improvement suggestions.

**Features:**
- Collapsible interface
- Dynamic tip filtering
- Progress tracking
- Categorized suggestions

**Attributes:**
- `collapsible` - Enable collapse/expand
- `expanded` - Initial expanded state
- `max-visible-tips` - Maximum tips to show

## 🎯 Usage

### Basic Implementation
```html
<!DOCTYPE html>
<html>
<head>
    <script src="https://cdn.tailwindcss.com"></script>
    <link rel="stylesheet" href="assets/styles/main.css">
</head>
<body>
    <div class="container mx-auto p-6">
        <password-app></password-app>
    </div>
    <script type="module" src="src/app.js"></script>
</body>
</html>
```

### Individual Components
```html
<!-- Password Input -->
<password-input 
    placeholder="Enter password"
    min-length="8"
    max-length="128"
    required>
</password-input>

<!-- Strength Meter -->
<strength-meter 
    score="3" 
    level="good" 
    show-label 
    animated>
</strength-meter>

<!-- Breach Alert -->
<breach-alert 
    status="breached"
    breach-count="1337"
    severity="high"
    dismissible>
</breach-alert>

<!-- Tips Panel -->
<tips-panel 
    collapsible 
    expanded 
    max-visible-tips="5">
</tips-panel>
```

### Programmatic Control
```javascript
const app = document.querySelector('password-app');

// Set password programmatically
app.setPassword('newPassword123');

// Get current state
const state = app.getState();

// Clear password
app.clearPassword();

// Focus password input
app.focusPasswordInput();
```

## 🧪 Testing

### Running Tests

**Unit Tests:**
```bash
# Open in browser to run basic unit tests
open tests/unit/password-input.test.ts
```

**Integration Tests:**
```bash
# Open in browser to run integration tests
open tests/integration/app-integration.test.html
```

### Test Categories

1. **Unit Tests** - Individual component functionality
2. **Integration Tests** - Component interactions
3. **Manual Tests** - User interaction scenarios
4. **Accessibility Tests** - Screen reader compatibility
5. **Performance Tests** - Load and responsiveness

## ♿ Accessibility Features

- **ARIA Labels** - Proper labeling for screen readers
- **Keyboard Navigation** - Full keyboard accessibility
- **Focus Management** - Logical tab order
- **High Contrast Support** - Compatible with high contrast modes
- **Reduced Motion** - Respects user motion preferences
- **Semantic HTML** - Proper heading structure and landmarks

## 📱 Responsive Design

The interface adapts to different screen sizes:

- **Desktop** (1024px+) - Full layout with all features
- **Tablet** (768px-1023px) - Optimized spacing and sizing
- **Mobile** (320px-767px) - Stacked layout with touch-friendly controls

## ⚙️ Configuration

### API Configuration
```typescript
// Update API base URL
apiClient.updateConfig({
    baseUrl: 'https://your-api.com/api/v1',
    timeout: 10000,
    retryAttempts: 3
});
```

### Component Configuration
```typescript
// Customize debounce delays
const config = {
    debounceDelay: 300,
    strengthCheckDelay: 500,
    breachCheckDelay: 1000
};
```

## 🚀 Deployment

### Development Server
```bash
# Serve files locally (requires local server)
npx serve . -p 3000
# or
python -m http.server 3000
```

### Production Build
1. Compile TypeScript to JavaScript
2. Optimize assets
3. Configure proper MIME types for `.js` files
4. Set up CORS if API is on different domain

### Static Hosting
Compatible with:
- GitHub Pages
- Netlify
- Vercel
- AWS S3 + CloudFront
- Any static file hosting

## 🔒 Security Considerations

- **No Password Storage** - Passwords are never stored locally
- **HTTPS Only** - Always use HTTPS in production
- **API Validation** - Server-side validation is required
- **Content Security Policy** - Implement CSP headers
- **Input Sanitization** - Client-side validation for UX only

## 🛠️ Development

### Prerequisites
- Modern browser with ES6+ support
- HTTP server for local development
- TypeScript compiler (optional, for development)

### Local Development
1. Clone the repository
2. Start a local HTTP server
3. Open `index.html` in browser
4. Make changes and refresh to test

### Adding New Components
1. Create component directory in `src/components/`
2. Implement component class extending `HTMLElement`
3. Register with `customElements.define()`
4. Add TypeScript types to `types.ts`
5. Import in main `app.ts`

## 🐛 Troubleshooting

### Common Issues

**Components not rendering:**
- Check browser console for JavaScript errors
- Ensure TypeScript is compiled to JavaScript
- Verify all imports are using `.js` extensions

**API calls failing:**
- Check network tab for request details
- Verify API server is running and accessible
- Check CORS configuration

**Styling issues:**
- Ensure Tailwind CSS is loaded
- Check for conflicting CSS rules
- Verify responsive classes are applied

### Browser Compatibility
- Chrome 54+
- Firefox 63+
- Safari 10.1+
- Edge 79+

## 📄 License

This project is part of the AI Course password configuration service implementation.

## 🤝 Contributing

1. Follow existing code style and patterns
2. Add TypeScript types for new features
3. Include accessibility considerations
4. Test across different devices and browsers
5. Update documentation for new features

---

For more information about the overall system architecture, see the main project README.