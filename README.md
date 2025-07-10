# Frontend - Booking Interface

This is the HTML/CSS/JavaScript frontend for the Tarik Media photography booking system.

## Quick Start

1. **Configure API Connection**
   
   Edit `config.js` to point to your backend:
   ```javascript
   window.BookingConfig = {
       // Your backend API URL
       API_BASE_URL: 'http://localhost:5000/api',
       
       // Business information
       BUSINESS_NAME: 'Your Business Name',
       BUSINESS_TAGLINE: 'Your Business Tagline',
   };
   ```

2. **Open the Booking Interface**
   
   **Option A: Local File (Development)**
   ```bash
   # Open directly in browser
   open index.html
   # or
   double-click index.html
   ```
   
   **Option B: Web Server (Recommended)**
   ```bash
   # Using Python's built-in server
   cd frontend
   python -m http.server 8001
   # Then visit: http://localhost:8001
   
   # Using Node.js serve package
   npx serve . -p 8001
   ```

## Configuration Options

### API Configuration

```javascript
// config.js
window.BookingConfig = {
    // Backend API URL - CHANGE THIS TO YOUR BACKEND
    API_BASE_URL: 'http://localhost:5000/api',
    
    // Fallback URLs if main API fails
    FALLBACK_API_URLS: [
        'http://localhost:8002/api',  // Alternative port
        '/api'                        // Same-origin
    ],
    
    // Auto-detect best API URL
    AUTO_DETECT_API: true,
}
```

### Business Customization

```javascript
// Business Information
BUSINESS_NAME: 'Your Business Name',
BUSINESS_TAGLINE: 'Your Business Description',

// Booking Settings
DEFAULT_DAYS_TO_CHECK: 14,     // Days ahead to check
MAX_BOOKING_ATTEMPTS: 3,       // Retry attempts

// Custom loading messages
LOADING_MESSAGES: [
    'Checking your session details...',
    'Securing your time slot...',
    'Processing your booking...',
    'Finalizing your appointment...',
    'Almost done, confirming everything...'
],
```

## File Structure

```
frontend/
├── config.js              # Configuration file (EDIT THIS)
├── index.html             # Main HTML page
├── script.js              # JavaScript functionality
├── style.css              # Styles and responsive design
└── README.md              # This file
```

## Customization

### Changing Colors/Styling

Edit `style.css` to customize the appearance:

```css
/* Main color scheme */
:root {
    --primary-color: #007bff;
    --success-color: #28a745;
    --error-color: #dc3545;
    --background-color: #0f0f0f;
    --text-color: #ffffff;
}
```

### Adding Your Logo

Replace the text logo in `index.html`:

```html
<!-- Replace this -->
<a href="#" class="logo">Tarik Media</a>

<!-- With your image -->
<a href="#" class="logo">
    <img src="your-logo.png" alt="Your Business" height="30">
</a>
```

### Customizing Content

Edit the text content in `index.html`:

```html
<!-- Hero section -->
<h1 class="hero-title">Your Business Name</h1>
<p class="hero-subtitle">Your business description...</p>

<!-- Services section -->
<h2 class="section-title">What You Offer</h2>
```

## Backend Connection

The frontend automatically detects and connects to your backend API:

1. **Local Development**: Uses `http://localhost:5000/api` by default
2. **Production**: Uses `/api` (same domain as frontend)
3. **Custom**: Set `API_BASE_URL` in `config.js`

### Testing API Connection

Open browser developer tools (F12) and check the console for:

```
✅ Found working API at: http://localhost:5000/api
```

If you see errors, check:
- Backend is running on the correct port
- `API_BASE_URL` in `config.js` is correct
- CORS is enabled on the backend

## Deployment

### Static Hosting (Recommended)

Deploy to any static hosting service:

- **Netlify**: Drag & drop the `frontend` folder
- **Vercel**: Connect your Git repository
- **GitHub Pages**: Push to a GitHub repo and enable Pages
- **AWS S3**: Upload files to an S3 bucket with static hosting

### Custom Domain

If using a custom domain, update `config.js`:

```javascript
// For production deployment
API_BASE_URL: '/api',  // Same domain
// or
API_BASE_URL: 'https://your-backend-domain.com/api',  // Different domain
```

## Browser Compatibility

- **Modern Browsers**: Chrome 60+, Firefox 55+, Safari 12+, Edge 79+
- **Mobile**: iOS Safari 12+, Chrome Mobile 60+
- **Features Used**: Fetch API, CSS Grid, Flexbox, ES6 Classes

## Troubleshooting

### Common Issues

1. **"Unable to connect to booking system"**
   - Check backend is running
   - Verify API URL in `config.js`
   - Check browser console for errors

2. **Calendar not loading dates**
   - Backend API is not responding
   - Check network tab in developer tools
   - Verify `/api/availability/range` endpoint works

3. **Booking fails**
   - Check backend logs
   - Verify Calendly configuration in backend
   - Check browser console for errors

4. **Mobile display issues**
   - Clear browser cache
   - Check CSS media queries
   - Test on different devices

### Debug Mode

Enable debug mode in `config.js`:

```javascript
DEBUG: true,  // Enables console logging
```

Then check browser console for detailed information.

## Performance

- **Service Worker**: Caches static assets for faster loading
- **Lazy Loading**: Calendar data loaded on demand
- **Responsive Images**: Optimized for all screen sizes
- **Minimal Dependencies**: Pure JavaScript, no external libraries