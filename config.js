/**
 * Frontend Configuration
 * Edit these settings to customize your booking system
 */

window.BookingConfig = {
    // =============================================================================
    // API CONFIGURATION - EDIT THESE VALUES
    // =============================================================================
    
    /**
     * Backend API Base URL
     * 
     * Development (local): 'http://localhost:5000/api'
     * Production: '/api' (if backend is on same domain)
     * Custom backend: 'https://your-backend-domain.com/api'
     */
    API_BASE_URL: 'http://localhost:5000/api',
    
    /**
     * Alternative API URLs for different environments
     * The system will automatically try these if the main API fails
     */
    FALLBACK_API_URLS: [
        'http://localhost:8002/api',  // Alternative local port
        'http://127.0.0.1:5000/api',  // IPv4 localhost
        '/api'                        // Same-origin fallback
    ],
    
    // =============================================================================
    // UI CONFIGURATION
    // =============================================================================
    
    /**
     * Business Information
     */
    BUSINESS_NAME: 'Tarik Media',
    BUSINESS_TAGLINE: 'Professional Photography & Videography',
    
    /**
     * Booking Configuration
     */
    DEFAULT_DAYS_TO_CHECK: 14,        // How many days ahead to check for availability
    MAX_BOOKING_ATTEMPTS: 3,          // Number of retry attempts for failed bookings
    
    /**
     * Loading Messages
     * These appear during the booking process
     */
    LOADING_MESSAGES: [
        'Checking your session details...',
        'Securing your time slot...',
        'Processing your booking...',
        'Finalizing your appointment...',
        'Almost done, confirming everything...'
    ],
    
    // =============================================================================
    // DEVELOPMENT SETTINGS
    // =============================================================================
    
    /**
     * Debug Mode
     * Set to true to enable console logging and detailed error messages
     */
    DEBUG: true,
    
    /**
     * Auto-detect API URL based on current environment
     * If true, will automatically determine the best API URL
     */
    AUTO_DETECT_API: true,
    
    // =============================================================================
    // METHODS (DO NOT EDIT UNLESS YOU KNOW WHAT YOU'RE DOING)
    // =============================================================================
    
    /**
     * Get the appropriate API URL based on current environment
     */
    getApiUrl() {
        if (!this.AUTO_DETECT_API) {
            return this.API_BASE_URL;
        }
        
        // Auto-detect based on current page
        const currentLocation = window.location;
        
        // If opened as file:// protocol (local development)
        if (currentLocation.protocol === 'file:') {
            return this.API_BASE_URL;
        }
        
        // If on localhost with port 8001 (specific setup)
        if (currentLocation.hostname === 'localhost' && currentLocation.port === '8001') {
            return 'http://localhost:8002/api';
        }
        
        // If on same domain, use relative path
        if (currentLocation.hostname !== 'localhost' && currentLocation.hostname !== '127.0.0.1') {
            return '/api';
        }
        
        // Default fallback
        return this.API_BASE_URL;
    },
    
    /**
     * Try multiple API URLs until one works
     */
    async findWorkingApiUrl() {
        const urlsToTry = [this.getApiUrl(), ...this.FALLBACK_API_URLS];
        
        for (const url of urlsToTry) {
            try {
                const response = await fetch(`${url}/health`, { 
                    method: 'GET',
                    headers: { 'Accept': 'application/json' }
                });
                
                if (response.ok) {
                    if (this.DEBUG) {
                        console.log(`✅ Found working API at: ${url}`);
                    }
                    return url;
                }
            } catch (error) {
                if (this.DEBUG) {
                    console.log(`❌ API not available at: ${url}`);
                }
                continue;
            }
        }
        
        throw new Error('No working API URL found. Please check your backend configuration.');
    },
    
    /**
     * Log debug messages if debug mode is enabled
     */
    log(...args) {
        if (this.DEBUG) {
            console.log('[BookingConfig]', ...args);
        }
    }
};