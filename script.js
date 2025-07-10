// Smooth scrolling for navigation links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// Fade in animation on scroll
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

// Enhanced Calendar Booking System
class BookingCalendar {
    constructor() {
        this.currentDate = new Date();
        this.selectedDate = null;
        this.selectedTime = null;
        this.selectedDateData = null;
        this.availabilityData = {};
        this.monthlyAvailability = {};
        this.availabilityCache = {};
        this.currentStep = 'calendar';
        this.isTransitioning = false;
        this.isBooking = false;
        // Use configuration from config.js
        this.loadingMessages = window.BookingConfig?.LOADING_MESSAGES || [
            'Checking your session details...',
            'Securing your time slot...',
            'Processing your booking...',
            'Finalizing your appointment...',
            'Almost done, confirming everything...'
        ];
        this.bookingResult = null;
        this.apiBaseUrl = null; // Will be set dynamically
        
        this.init();
    }
    
    async init() {
        this.showLoading(true);
        
        try {
            // Initialize API URL from configuration
            await this.initializeApiUrl();
            
            this.bindEvents();
            await this.loadInitialMonths();
            this.showLoading(false);
            this.renderCalendar();
        } catch (error) {
            this.showLoading(false);
            this.showError('Unable to connect to booking system. Please check your internet connection and try again.');
            console.error('Initialization error:', error);
        }
    }
    
    async initializeApiUrl() {
        if (window.BookingConfig && typeof window.BookingConfig.findWorkingApiUrl === 'function') {
            try {
                this.apiBaseUrl = await window.BookingConfig.findWorkingApiUrl();
                window.BookingConfig.log('Using API URL:', this.apiBaseUrl);
            } catch (error) {
                console.error('Failed to find working API URL:', error);
                // Fallback to default detection
                this.apiBaseUrl = this.getDefaultApiUrl();
            }
        } else {
            // Fallback if config is not available
            this.apiBaseUrl = this.getDefaultApiUrl();
        }
    }
    
    getDefaultApiUrl() {
        // Original logic as fallback
        return window.location.protocol === 'file:' 
            ? 'http://localhost:8002/api'
            : (window.location.port === '8001' 
                ? 'http://localhost:8002/api'
                : `${window.location.origin}/api`);
    }
    
    bindEvents() {
        // Navigation buttons
        document.getElementById('prevMonth')?.addEventListener('click', () => this.changeMonth(-1));
        document.getElementById('nextMonth')?.addEventListener('click', () => this.changeMonth(1));
        
        // Form submission
        document.getElementById('bookingForm')?.addEventListener('submit', (e) => this.submitBooking(e));
        
        // Back buttons - specific handlers for each step
        document.getElementById('backToCalendar')?.addEventListener('click', () => this.goToStep('calendar'));
        document.getElementById('backToTimes')?.addEventListener('click', () => this.goToStep('time'));
        
        // Generic back button class handler
        document.querySelectorAll('.back-to-calendar').forEach(btn => {
            btn.addEventListener('click', () => this.goToStep('calendar'));
        });
        
        // Time slot selection
        document.getElementById('timeSlots')?.addEventListener('click', (e) => {
            if (e.target.classList.contains('time-slot')) {
                this.selectTime(e);
            }
        });
    }
    
    async loadInitialMonths() {
        try {
            await this.loadAvailability();
        } catch (error) {
            console.error('Error loading initial months:', error);
            this.showError('Unable to load available dates. Please check your internet connection and try again.');
        }
    }
    
    async loadAvailability() {
        try {
            const year = this.currentDate.getFullYear();
            const month = this.currentDate.getMonth();
            const monthKey = `${year}-${month}`;
            
            // Check if we already have this month's data
            if (this.availabilityCache[monthKey]) {
                this.availabilityData = this.availabilityCache[monthKey];
                this.buildMonthlyAvailability();
                return;
            }
            
            // Calculate date range for the current month
            const startDate = new Date(year, month, 1);
            const endDate = new Date(year, month + 1, 0);
            
            const rangeStart = this.formatDate(startDate);
            const rangeEnd = this.formatDate(endDate);
            
            const response = await fetch(`${this.apiBaseUrl}/availability/range?range_start=${rangeStart}&range_end=${rangeEnd}`);
            
            if (!response.ok) {
                if (response.status === 500) {
                    throw new Error('Server is temporarily unavailable. Please try again in a few moments.');
                } else if (response.status === 404) {
                    throw new Error('Calendar service is not available. Please contact support.');
                } else {
                    throw new Error(`Unable to load calendar data (Error ${response.status}). Please try again.`);
                }
            }
            
            const data = await response.json();
            
            // Cache the data
            this.availabilityCache[monthKey] = data;
            this.availabilityData = data;
            
            // Build the monthly availability lookup
            this.buildMonthlyAvailability();
            
        } catch (error) {
            console.error('Error fetching availability:', error);
            this.availabilityData = {};
            this.monthlyAvailability = {};
            throw error;
        }
    }
    
    buildMonthlyAvailability() {
        this.monthlyAvailability = {};
        
        if (this.availabilityData) {
            Object.keys(this.availabilityData).forEach(dateStr => {
                const dayData = this.availabilityData[dateStr];
                // Mark date as available if it has slots
                if (dayData && dayData.slots && dayData.slots.length > 0) {
                    this.monthlyAvailability[dateStr] = true;
                }
            });
        }
        
        console.log(`📊 Built monthly availability: ${Object.keys(this.monthlyAvailability).length} available days`);
    }
    
    async renderCalendar() {
        try {
            const monthNames = ["January", "February", "March", "April", "May", "June",
                            "July", "August", "September", "October", "November", "December"];
            const currentMonth = document.getElementById('currentMonth');
            currentMonth.textContent = `${monthNames[this.currentDate.getMonth()]} ${this.currentDate.getFullYear()}`;
            
            const calendarDates = document.getElementById('calendarDates');
            
            // Add fade-out animation before changing content
            calendarDates.style.opacity = '0';
            calendarDates.style.transition = 'opacity 0.2s ease-out';
            
            // Wait for fade-out to complete
            await new Promise(resolve => setTimeout(resolve, 200));
            
            // Render the actual calendar
            this.renderActualCalendar(calendarDates);
            
            // Fade in the new content
            calendarDates.style.opacity = '1';
            
        } catch (error) {
            console.error('Error rendering calendar:', error);
            this.showError('Failed to render calendar. Please try again.');
        }
    }
    
    showSkeletonLoading(container) {
        container.innerHTML = '';
        container.classList.add('loading');
        
        // Create skeleton grid (6 weeks * 7 days = 42 cells)
        for (let i = 0; i < 42; i++) {
            const skeletonCell = document.createElement('div');
            skeletonCell.className = 'skeleton-date';
            container.appendChild(skeletonCell);
        }
    }
    
    renderActualCalendar(container) {
        container.innerHTML = '';
        container.classList.remove('loading');
        
        const firstDay = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth(), 1);
        const startDate = new Date(firstDay);
        startDate.setDate(startDate.getDate() - firstDay.getDay());
        
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        
        for (let i = 0; i < 42; i++) {
            const date = new Date(startDate);
            date.setDate(startDate.getDate() + i);
            
            const dateStr = this.formatDate(date);
            const isCurrentMonth = date.getMonth() === this.currentDate.getMonth();
            const isPastDate = date < today;
            const isAvailable = this.monthlyAvailability[dateStr];
            
            const dateElement = document.createElement('div');
            dateElement.className = `calendar-date ${isCurrentMonth ? 'current-month' : 'other-month'} ${isPastDate ? 'past-date' : ''} ${isAvailable ? 'available' : ''}`;
            dateElement.textContent = date.getDate();
            
            if (isAvailable && !isPastDate) {
                dateElement.addEventListener('click', (e) => this.selectDate(dateStr, e));
                dateElement.style.cursor = 'pointer';
            }
            
            // Simple opacity animation that doesn't affect layout
            dateElement.style.opacity = '0';
            dateElement.style.transition = 'opacity 0.3s ease-out';
            
            container.appendChild(dateElement);
            
            // Trigger opacity animation with slight delay for smoother appearance
            setTimeout(() => {
                dateElement.style.opacity = '1';
            }, i * 10);
        }
    }
    
    async changeMonth(direction) {
        if (this.isTransitioning) return;
        
        try {
            this.isTransitioning = true;
            
            // Update current date
            this.currentDate.setMonth(this.currentDate.getMonth() + direction);
            
            // Load availability for the new month
            await this.loadAvailability();
            
            // Re-render calendar with smooth animations
            await this.renderCalendar();
            
        } catch (error) {
            console.error('Error changing month:', error);
            this.showError('Failed to load calendar data. Please try again.');
        } finally {
            this.isTransitioning = false;
        }
    }
    
    formatDate(date) {
        return date.toISOString().split('T')[0];
    }
    
    async selectDate(dateStr, event) {
        this.selectedDate = dateStr;
        
        // Update UI with smooth transition
        document.querySelectorAll('.calendar-date').forEach(el => {
            el.classList.remove('selected');
        });
        event.target.classList.add('selected');
        
        // Use pre-loaded availability data
        if (this.availabilityData && this.availabilityData[dateStr]) {
            this.selectedDateData = {
                date: dateStr,
                slots: this.availabilityData[dateStr].slots,
                count: this.availabilityData[dateStr].count
            };
        } else {
            this.selectedDateData = {
                date: dateStr,
                slots: [],
                count: 0
            };
        }
        
        // Render time slots first, then transition
        this.renderTimeSlots();
        
        // Show time step with smooth transition
        await this.showStep('time');
    }
    
    renderTimeSlots() {
        const timeSlots = document.getElementById('timeSlots');
        const selectedDateTitle = document.getElementById('selectedDateTitle');
        
        // Format date for display
        const selectedDate = new Date(this.selectedDate + 'T00:00:00');
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        selectedDateTitle.textContent = `Select Time - ${selectedDate.toLocaleDateString('en-US', options)}`;
        
        timeSlots.innerHTML = '';
        
        if (this.selectedDateData && this.selectedDateData.slots && this.selectedDateData.slots.length > 0) {
            this.selectedDateData.slots.forEach((slot, index) => {
                const timeElement = document.createElement('button');
                timeElement.className = 'time-slot';
                timeElement.textContent = slot.display;
                timeElement.dataset.time = slot.time;
                
                // Smooth staggered appearance without layout shift
                timeElement.style.opacity = '0';
                timeElement.style.transform = 'translateY(10px)';
                timeElement.style.transition = 'opacity 0.3s ease-out, transform 0.3s ease-out';
                
                timeSlots.appendChild(timeElement);
                
                // Trigger animation with staggered delay
                setTimeout(() => {
                    timeElement.style.opacity = '1';
                    timeElement.style.transform = 'translateY(0)';
                }, index * 100);
            });
        } else {
            const noSlots = document.createElement('div');
            noSlots.className = 'no-slots';
            noSlots.textContent = 'No available time slots for this date.';
            noSlots.style.opacity = '0';
            noSlots.style.transition = 'opacity 0.3s ease-out';
            timeSlots.appendChild(noSlots);
            
            setTimeout(() => {
                noSlots.style.opacity = '1';
            }, 100);
        }
    }
    
    async selectTime(event) {
        this.selectedTime = event.target.dataset.time;
        
        // Update UI
        document.querySelectorAll('.time-slot').forEach(el => {
            el.classList.remove('selected');
        });
        event.target.classList.add('selected');
        
        // Update booking summary
        this.updateBookingSummary();
        
        // Show form step with smooth transition
        await this.showStep('form');
    }
    
    updateBookingSummary() {
        const summaryDate = document.getElementById('summaryDate');
        const summaryTime = document.getElementById('summaryTime');
        
        if (this.selectedDate && summaryDate) {
            const selectedDate = new Date(this.selectedDate + 'T00:00:00');
            const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
            summaryDate.textContent = selectedDate.toLocaleDateString('en-US', options);
        }
        
        if (this.selectedTime && summaryTime) {
            const selectedSlot = this.selectedDateData?.slots?.find(slot => slot.time === this.selectedTime);
            summaryTime.textContent = selectedSlot?.display || 'Selected time';
        }
    }
    
    async showStep(step) {
        if (this.isTransitioning) return;
        
        this.isTransitioning = true;
        const currentStepEl = document.getElementById(`${this.currentStep}Step`);
        const nextStepEl = document.getElementById(`${step}Step`);
        
        // Fade out current step
        if (currentStepEl) {
            currentStepEl.style.opacity = '0';
            currentStepEl.style.transform = 'translateX(-20px)';
            await new Promise(resolve => setTimeout(resolve, 200));
            currentStepEl.classList.remove('active');
        }
        
        // Show and fade in next step
        if (nextStepEl) {
            nextStepEl.classList.add('active');
            nextStepEl.style.opacity = '0';
            nextStepEl.style.transform = 'translateX(20px)';
            nextStepEl.style.transition = 'opacity 0.3s ease-out, transform 0.3s ease-out';
            
            // Trigger animation
            await new Promise(resolve => setTimeout(resolve, 50));
            nextStepEl.style.opacity = '1';
            nextStepEl.style.transform = 'translateX(0)';
        }
        
        this.currentStep = step;
        this.isTransitioning = false;
        
        // Scroll to top of the step
        nextStepEl?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    
    // New method for cleaner step transitions
    async goToStep(step) {
        await this.showStep(step);
    }
    
    showLoading(show) {
        const loading = document.getElementById('loading');
        if (loading) {
            loading.style.display = show ? 'flex' : 'none';
        }
    }
    
    showError(message) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #ff4444;
            color: white;
            padding: 15px 25px;
            border-radius: 5px;
            z-index: 1000;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            max-width: 300px;
            animation: slideInRight 0.3s ease-out;
        `;
        errorDiv.textContent = message;
        
        document.body.appendChild(errorDiv);
        
        setTimeout(() => {
            errorDiv.remove();
        }, 5000);
    }
    
    async submitBooking(event) {
        event.preventDefault();
        
        if (this.isBooking) return;
        this.isBooking = true;
        
        const form = event.target;
        const formData = new FormData(form);
        
        const bookingData = {
            full_name: formData.get('fullName'),
            email: formData.get('email'),
            start_time: this.selectedTime,
            message: formData.get('message') || ''
        };
        
        try {
            // Show loading screen with progressive messages
            this.showBookingLoader();
            
            // Simulate realistic booking process with progressive updates
            let currentMessage = 0;
            const messageInterval = setInterval(() => {
                if (currentMessage < this.loadingMessages.length - 1) {
                    currentMessage++;
                    this.updateLoadingMessage(this.loadingMessages[currentMessage]);
                }
            }, 1600); // 8 seconds / 5 messages = 1.6 seconds per message
            
            const response = await fetch(`${this.apiBaseUrl}/book`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(bookingData)
            });
            
            clearInterval(messageInterval);
            
            if (!response.ok) {
                const errorData = await response.json().catch(() => null);
                let errorMessage = 'Booking could not be completed. Please try again.';
                
                if (response.status === 400) {
                    errorMessage = errorData?.error || 'Please check your booking details and try again.';
                } else if (response.status === 409) {
                    errorMessage = 'This time slot is no longer available. Please choose another time.';
                } else if (response.status === 500) {
                    errorMessage = 'Our booking system is temporarily unavailable. Please try again in a few minutes.';
                } else if (response.status >= 500) {
                    errorMessage = 'Server error occurred. Please contact support if this continues.';
                }
                
                throw new Error(errorMessage);
            }
            
            const result = await response.json();
            
            // Store booking result and show confirmation
            this.bookingResult = {
                ...bookingData,
                booking_id: result.booking_id || 'BK-' + Date.now(),
                confirmation: result
            };
            
            this.hideBookingLoader();
            this.updateConfirmationContent();
            await this.showStep('confirmation');
            
        } catch (error) {
            clearInterval(messageInterval);
            this.hideBookingLoader();
            console.error('Booking error:', error);
            this.showError(error.message);
        } finally {
            this.isBooking = false;
        }
    }
    
    showBookingLoader() {
        // Create or show the loading overlay
        let loader = document.getElementById('bookingLoader');
        if (!loader) {
            loader = document.createElement('div');
            loader.id = 'bookingLoader';
            loader.className = 'booking-loader-overlay';
            loader.innerHTML = `
                <div class="booking-loader-content">
                    <div class="booking-spinner">
                        <div class="spinner-ring"></div>
                        <div class="spinner-ring"></div>
                        <div class="spinner-ring"></div>
                    </div>
                    <div class="booking-loader-message">${this.loadingMessages[0]}</div>
                </div>
            `;
            document.body.appendChild(loader);
        }
        
        loader.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }
    
    updateLoadingMessage(message) {
        const messageEl = document.querySelector('.booking-loader-message');
        if (messageEl) {
            messageEl.style.opacity = '0';
            setTimeout(() => {
                messageEl.textContent = message;
                messageEl.style.opacity = '1';
            }, 200);
        }
    }
    
    hideBookingLoader() {
        const loader = document.getElementById('bookingLoader');
        if (loader) {
            loader.style.display = 'none';
            document.body.style.overflow = '';
        }
    }
    
    async showConfirmationStep() {
        if (!this.bookingResult) return;
        
        const confirmationStep = document.getElementById('confirmationStep');
        if (confirmationStep) {
            this.updateConfirmationContent();
            await this.showStep('confirmation');
        }
    }
    
    updateConfirmationContent() {
        const confirmationDate = document.getElementById('confirmationDate');
        const confirmationTime = document.getElementById('confirmationTime');
        const confirmationName = document.getElementById('confirmationName');
        const confirmationEmail = document.getElementById('confirmationEmail');
        const confirmationId = document.getElementById('confirmationId');
        
        if (this.bookingResult && this.selectedDate) {
            // Format the date
            const selectedDate = new Date(this.selectedDate + 'T00:00:00');
            const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
            const formattedDate = selectedDate.toLocaleDateString('en-US', options);
            
            // Find the selected time slot
            const selectedSlot = this.selectedDateData?.slots?.find(slot => slot.time === this.selectedTime);
            const formattedTime = selectedSlot?.display || this.selectedTime || 'Selected time';
            
            // Update all confirmation details
            if (confirmationDate) {
                confirmationDate.textContent = formattedDate;
            }
            if (confirmationTime) {
                confirmationTime.textContent = formattedTime;
            }
            if (confirmationName) {
                confirmationName.textContent = this.bookingResult.full_name;
            }
            if (confirmationEmail) {
                confirmationEmail.textContent = this.bookingResult.email;
            }
            if (confirmationId) {
                confirmationId.textContent = this.bookingResult.booking_id;
            }
        }
    }
    
    resetBooking() {
        this.selectedDate = null;
        this.selectedTime = null;
        this.selectedDateData = null;
        this.bookingResult = null;
        this.showStep('calendar');
        
        // Reset any selected states
        document.querySelectorAll('.calendar-date.selected, .time-slot.selected').forEach(el => {
            el.classList.remove('selected');
        });
        
        // Clear form
        const form = document.getElementById('bookingForm');
        if (form) {
            form.reset();
        }
    }
    
    showSuccess(message) {
        const successDiv = document.createElement('div');
        successDiv.className = 'success-message';
        successDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #28a745;
            color: white;
            padding: 15px 25px;
            border-radius: 5px;
            z-index: 1000;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            max-width: 300px;
            animation: slideInRight 0.3s ease-out;
        `;
        successDiv.textContent = message;
        
        document.body.appendChild(successDiv);
        
        setTimeout(() => {
            successDiv.remove();
        }, 7000);
    }
}

// Initialize calendar when DOM is loaded
let calendar; // Global calendar instance

document.addEventListener('DOMContentLoaded', () => {
    // Register Service Worker for background optimizations (caching only)
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/booking-sw.js')
            .then(registration => {
                console.log('🚀 Service Worker registered for caching optimization');
                // Note: Pre-warming now only happens after user selects time slot
            })
            .catch(error => {
                console.log('🚨 Service Worker registration failed:', error);
            });
    }
    
    calendar = new BookingCalendar();
});

// Parallax effect for hero section
window.addEventListener('scroll', () => {
    const scrolled = window.pageYOffset;
    const header = document.querySelector('.header');
    const parallaxElements = document.querySelectorAll('.parallax');
    
    // Header effect
    if (scrolled > 100) {
        header.style.background = 'rgba(15, 15, 15, 0.98)';
        header.style.backdropFilter = 'blur(15px)';
    } else {
        header.style.background = 'rgba(15, 15, 15, 0.95)';
        header.style.backdropFilter = 'blur(10px)';
    }
    
    // Parallax effect
    parallaxElements.forEach(element => {
        const speed = element.dataset.speed || 0.5;
        element.style.transform = `translateY(${scrolled * speed}px)`;
    });
});

