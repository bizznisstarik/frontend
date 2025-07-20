// OSB Productions Frontend JavaScript
document.addEventListener('DOMContentLoaded', function() {
    // Initialize the application
    initNavigation();
    initCalEmbed();
    initScrollEffects();
    initPortfolioAutoScroll();
    initHeroAnimations();
});

// Navigation functionality
function initNavigation() {
    const navToggle = document.querySelector('.nav-toggle');
    const mobileMenu = document.querySelector('.mobile-menu');
    const mobileMenuClose = document.querySelector('.mobile-menu-close');
    const mobileMenuLinks = document.querySelectorAll('.mobile-menu-link, .mobile-menu-cta');
    
    function closeMenu() {
        navToggle.classList.remove('active');
        mobileMenu.classList.remove('active');
        document.body.style.overflow = '';
    }
    
    function openMenu() {
        navToggle.classList.add('active');
        mobileMenu.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
    
    // Mobile navigation toggle
    if (navToggle && mobileMenu) {
        navToggle.addEventListener('click', function() {
            const isActive = navToggle.classList.contains('active');
            
            if (isActive) {
                closeMenu();
            } else {
                openMenu();
            }
        });
        
        // Close button functionality
        if (mobileMenuClose) {
            mobileMenuClose.addEventListener('click', closeMenu);
        }
        
        // Close menu when clicking on links
        mobileMenuLinks.forEach(link => {
            link.addEventListener('click', closeMenu);
        });
        
        // Close menu when clicking outside
        mobileMenu.addEventListener('click', function(e) {
            if (e.target === mobileMenu) {
                closeMenu();
            }
        });
    }
    
    // Smooth scrolling for navigation links
    const links = document.querySelectorAll('a[href^="#"]');
    links.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href').substring(1);
            const targetElement = document.getElementById(targetId);
            
            if (targetElement) {
                const headerHeight = document.querySelector('.header').offsetHeight;
                const targetPosition = targetElement.offsetTop - headerHeight;
                
                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });
    
    // Header scroll effect
    const header = document.querySelector('.header');
    let lastScrollTop = 0;
    
    window.addEventListener('scroll', function() {
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        
        if (scrollTop > 100) {
            header.style.background = 'rgba(255, 255, 255, 0.98)';
            header.style.boxShadow = '0 2px 20px rgba(0, 0, 0, 0.1)';
        } else {
            header.style.background = 'rgba(255, 255, 255, 0.95)';
            header.style.boxShadow = 'none';
        }
        
        lastScrollTop = scrollTop;
    });
}

// Cal.com embed initialization
function initCalEmbed() {
    const calEmbed = document.getElementById('cal-embed');
    
    if (calEmbed) {
        // Create Cal.com embed iframe (responsive scrolling)
        const iframe = document.createElement('iframe');
        iframe.src = 'https://cal.com/osb.productions/15min';
        iframe.width = '100%';
        iframe.height = '100vh';
        iframe.frameBorder = '0';
        
        // Set scrolling based on device
        const isMobile = window.innerWidth <= 768;
        if (isMobile) {
            iframe.scrolling = 'auto';
            iframe.style.overflow = 'auto';
            iframe.style.webkitOverflowScrolling = 'touch';
        } else {
            iframe.scrolling = 'no';
            iframe.style.overflow = 'hidden';
        }
        
        iframe.style.border = 'none';
        iframe.style.borderRadius = '0';
        
        // Add loading state
        calEmbed.innerHTML = `
            <div style="display: flex; align-items: center; justify-content: center; height: 100vh; background: white;">
                <div style="text-align: center; color: var(--cal-text-secondary);">
                    <div style="width: 40px; height: 40px; border: 3px solid var(--cal-border); border-top: 3px solid var(--cal-accent); border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto 1rem;"></div>
                    <p>Loading booking calendar...</p>
                </div>
            </div>
        `;
        
        // Add CSS for loading spinner
        const style = document.createElement('style');
        style.textContent = `
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
        `;
        document.head.appendChild(style);
        
        // Replace loading state with iframe after a short delay
        setTimeout(() => {
            calEmbed.innerHTML = '';
            calEmbed.appendChild(iframe);
            
            // Handle iframe load event
            iframe.onload = function() {
                console.log('Cal.com embed loaded successfully');
                
                // Handle responsive scrolling on window resize
                window.addEventListener('resize', debounce(() => {
                    const isMobileNow = window.innerWidth <= 768;
                    if (isMobileNow) {
                        iframe.scrolling = 'auto';
                        iframe.style.overflow = 'auto';
                        iframe.style.webkitOverflowScrolling = 'touch';
                    } else {
                        iframe.scrolling = 'no';
                        iframe.style.overflow = 'hidden';
                    }
                }, 250));
                
                // Optional: Add postMessage listener for Cal.com events
                window.addEventListener('message', function(event) {
                    // Handle Cal.com booking events if needed
                    if (event.origin === 'https://cal.com') {
                        console.log('Cal.com event:', event.data);
                        
                        // Example: Handle successful booking
                        if (event.data.type === 'booking_confirmed') {
                            showBookingConfirmation();
                        }
                    }
                });
            };
            
            iframe.onerror = function() {
                console.error('Failed to load Cal.com embed');
                showEmbedError();
            };
        }, 1000);
    }
}

// Show booking confirmation message
function showBookingConfirmation() {
    const confirmationDiv = document.createElement('div');
    confirmationDiv.innerHTML = `
        <div style="position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); background: white; padding: 2rem; border-radius: 0.5rem; box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2); z-index: 9999; text-align: center; max-width: 400px;">
            <div style="font-size: 3rem; margin-bottom: 1rem; color: var(--cal-success);">✅</div>
            <h3 style="color: var(--cal-primary); margin-bottom: 1rem;">Booking Confirmed!</h3>
            <p style="color: var(--cal-text-secondary); margin-bottom: 1.5rem;">Thank you for booking with OSB Productions. We'll be in touch soon!</p>
            <button onclick="this.parentElement.parentElement.remove()" style="background: var(--cal-primary); color: white; border: none; padding: 0.5rem 1rem; border-radius: 0.375rem; cursor: pointer;">Close</button>
        </div>
        <div style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0, 0, 0, 0.5); z-index: 9998;"></div>
    `;
    document.body.appendChild(confirmationDiv);
}

// Show embed error message
function showEmbedError() {
    const calEmbed = document.getElementById('cal-embed');
    if (calEmbed) {
        calEmbed.innerHTML = `
            <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; background: white; text-align: center; padding: 2rem;">
                <div style="font-size: 3rem; margin-bottom: 1rem; color: var(--cal-text-muted);">📅</div>
                <h3 style="color: var(--cal-primary); margin-bottom: 1rem;">Booking Calendar Unavailable</h3>
                <p style="color: var(--cal-text-secondary); margin-bottom: 1.5rem;">We're having trouble loading the booking calendar. Please try refreshing the page or contact us directly.</p>
                <div style="display: flex; gap: 1rem; flex-wrap: wrap; justify-content: center;">
                    <button onclick="initCalEmbed()" style="background: var(--cal-accent); color: white; border: none; padding: 0.5rem 1rem; border-radius: 0.375rem; cursor: pointer;">Try Again</button>
                    <a href="mailto:info@osbproductions.com" style="background: var(--cal-primary); color: white; text-decoration: none; padding: 0.5rem 1rem; border-radius: 0.375rem;">Email Us</a>
                </div>
            </div>
        `;
    }
}

// Scroll effects and animations
function initScrollEffects() {
    // Intersection Observer for fade-in animations
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);
    
    // Add fade-in animation to cards and sections
    const animatedElements = document.querySelectorAll('.service-card, .portfolio-item, .about-content, .booking-container');
    animatedElements.forEach(element => {
        element.style.opacity = '0';
        element.style.transform = 'translateY(30px)';
        element.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(element);
    });
    
    // Parallax effect for hero section
    const hero = document.querySelector('.hero-visual');
    if (hero) {
        window.addEventListener('scroll', function() {
            const scrolled = window.pageYOffset;
            const parallax = scrolled * 0.5;
            hero.style.transform = `translateY(${parallax}px)`;
        });
    }
}

// Utility functions
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Handle window resize
window.addEventListener('resize', debounce(function() {
    // Close mobile menu if switching to desktop
    const navToggle = document.querySelector('.nav-toggle');
    const mobileMenu = document.querySelector('.mobile-menu');
    
    if (window.innerWidth > 768 && navToggle && mobileMenu) {
        navToggle.classList.remove('active');
        mobileMenu.classList.remove('active');
        document.body.style.overflow = '';
    }
}, 250));

// Add loading class to body initially
document.body.classList.add('loading');

// Remove loading class when everything is loaded
window.addEventListener('load', function() {
    document.body.classList.remove('loading');
    
    // Add entrance animation to hero elements
    const heroTitle = document.querySelector('.hero-title');
    const heroSubtitle = document.querySelector('.hero-subtitle');
    const heroActions = document.querySelector('.hero-actions');
    
    if (heroTitle) {
        heroTitle.style.opacity = '0';
        heroTitle.style.transform = 'translateY(30px)';
        setTimeout(() => {
            heroTitle.style.transition = 'opacity 0.8s ease, transform 0.8s ease';
            heroTitle.style.opacity = '1';
            heroTitle.style.transform = 'translateY(0)';
        }, 200);
    }
    
    if (heroSubtitle) {
        heroSubtitle.style.opacity = '0';
        heroSubtitle.style.transform = 'translateY(30px)';
        setTimeout(() => {
            heroSubtitle.style.transition = 'opacity 0.8s ease, transform 0.8s ease';
            heroSubtitle.style.opacity = '1';
            heroSubtitle.style.transform = 'translateY(0)';
        }, 400);
    }
    
    if (heroActions) {
        heroActions.style.opacity = '0';
        heroActions.style.transform = 'translateY(30px)';
        setTimeout(() => {
            heroActions.style.transition = 'opacity 0.8s ease, transform 0.8s ease';
            heroActions.style.opacity = '1';
            heroActions.style.transform = 'translateY(0)';
        }, 600);
    }
});

// Portfolio glide animation functionality
function initPortfolioAutoScroll() {
    const portfolioContainer = document.querySelector('.portfolio-scroll-container');
    const portfolioGrid = document.querySelector('.portfolio-grid');
    
    if (!portfolioContainer || !portfolioGrid) return;
    
    // Pause/resume animation based on visibility
    const portfolioSection = document.querySelector('#portfolio');
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                portfolioGrid.style.animationPlayState = 'running';
            } else {
                portfolioGrid.style.animationPlayState = 'paused';
            }
        });
    }, { threshold: 0.3 });
    
    if (portfolioSection) {
        observer.observe(portfolioSection);
    }
    
    // Additional pause on manual interaction
    let interactionTimeout;
    
    portfolioContainer.addEventListener('mouseenter', () => {
        portfolioGrid.style.animationPlayState = 'paused';
    });
    
    portfolioContainer.addEventListener('mouseleave', () => {
        portfolioGrid.style.animationPlayState = 'running';
    });
    
    // Pause on scroll wheel or touch
    portfolioContainer.addEventListener('wheel', (e) => {
        e.preventDefault(); // Prevent default scroll behavior
        portfolioGrid.style.animationPlayState = 'paused';
        
        clearTimeout(interactionTimeout);
        interactionTimeout = setTimeout(() => {
            portfolioGrid.style.animationPlayState = 'running';
        }, 3000);
    });
    
    portfolioContainer.addEventListener('touchstart', () => {
        portfolioGrid.style.animationPlayState = 'paused';
        
        clearTimeout(interactionTimeout);
        interactionTimeout = setTimeout(() => {
            portfolioGrid.style.animationPlayState = 'running';
        }, 3000);
    });
}

// Hero section animations
function initHeroAnimations() {
    // Only animate counters - skip title animation for now
    animateCounters();
}

function animateTitle() {
    const titleElement = document.getElementById('animated-title');
    if (!titleElement) return;
    
    const text = titleElement.textContent;
    titleElement.innerHTML = '';
    
    try {
        // Split text into words and letters
        const words = text.split(' ');
        words.forEach((word, wordIndex) => {
            const wordSpan = document.createElement('span');
            wordSpan.style.display = 'inline-block';
            wordSpan.style.marginRight = '0.5rem';
            
            for (let i = 0; i < word.length; i++) {
                const letter = document.createElement('span');
                letter.textContent = word[i];
                letter.className = 'letter';
                letter.style.animationDelay = `${(wordIndex * word.length + i) * 0.03}s`;
                wordSpan.appendChild(letter);
            }
            
            titleElement.appendChild(wordSpan);
        });
        
        // Fallback: ensure all letters are visible after 3 seconds
        setTimeout(() => {
            const letters = titleElement.querySelectorAll('.letter');
            letters.forEach(letter => {
                letter.style.opacity = '1';
                letter.style.transform = 'translateY(0)';
            });
        }, 3000);
        
    } catch (error) {
        // Fallback: restore original text if animation fails
        console.warn('Title animation failed, showing original text');
        titleElement.textContent = text;
    }
}

function animateCounters() {
    const counters = document.querySelectorAll('.hero-stat-number[data-count]');
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                animateCounter(entry.target);
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.5 });
    
    counters.forEach(counter => {
        observer.observe(counter);
    });
}

function animateCounter(element) {
    const target = parseInt(element.getAttribute('data-count'));
    const duration = 2000; // 2 seconds
    const increment = target / (duration / 16); // 60fps
    let current = 0;
    
    const updateCounter = () => {
        current += increment;
        if (current < target) {
            element.textContent = Math.floor(current);
            requestAnimationFrame(updateCounter);
        } else {
            element.textContent = target;
        }
    };
    
    // Add a slight delay for staggered effect
    const delay = Array.from(document.querySelectorAll('.hero-stat-number')).indexOf(element) * 200;
    setTimeout(() => {
        updateCounter();
    }, delay);
}