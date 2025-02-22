// Generate a unique identifier for the session
function generateUserId() {
  return 'user_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
}

// Get visit history - Optimized with single localStorage read
function getVisitHistory() {
  // Read all data at once to minimize localStorage access
  const stored = {
    visitCount: localStorage.getItem('heapVisitCount'),
    lastVisit: localStorage.getItem('heapLastVisit'),
    firstVisit: localStorage.getItem('heapFirstVisit')
  };
  
  const now = new Date();
  const data = {
    visitCount: (parseInt(stored.visitCount) || 0) + 1,
    lastVisitDate: stored.lastVisit || null,
    firstVisitDate: stored.firstVisit || now.toISOString()
  };

  // Batch localStorage writes
  const updates = {
    heapVisitCount: data.visitCount,
    heapLastVisit: now.toISOString(),
    heapFirstVisit: data.firstVisitDate
  };
  
  // Use requestIdleCallback for non-critical storage updates
  if (window.requestIdleCallback) {
    requestIdleCallback(() => {
      Object.entries(updates).forEach(([key, value]) => {
        localStorage.setItem(key, value);
      });
    });
  } else {
    // Fallback for browsers that don't support requestIdleCallback
    setTimeout(() => {
      Object.entries(updates).forEach(([key, value]) => {
        localStorage.setItem(key, value);
      });
    }, 0);
  }

  return {
    ...data,
    daysSinceLastVisit: data.lastVisitDate ? 
      Math.floor((now - new Date(data.lastVisitDate)) / (1000 * 60 * 60 * 24)) : 0,
    totalDaysKnown: Math.floor((now - new Date(data.firstVisitDate)) / (1000 * 60 * 60 * 24))
  };
}

// Optimize event handling with a debounced track function
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

// Initialize tracking system
class HeapTracker {
  constructor() {
    this.userId = localStorage.getItem('heapUserId') || generateUserId();
    if (!localStorage.getItem('heapUserId')) {
      localStorage.setItem('heapUserId', this.userId);
    }
    
    this.debouncedTrack = debounce((eventName, properties) => {
      heap.track(eventName, properties);
    }, 250);

    this.setupTracking();
  }

  setupTracking() {
    document.addEventListener('DOMContentLoaded', () => {
      // Get visit history and URL parameters once
      const visitHistory = getVisitHistory();
      const urlParams = new URLSearchParams(window.location.search);
      
      // Identify user immediately
      heap.identify(this.userId);
      
      // Add page-specific properties
      const pageProperties = {
        'page_type': document.body.className || 'unknown',
        'page_url': window.location.href,
        'page_path': window.location.pathname,
        'initial_landing_page': window.location.pathname,
        'referrer': document.referrer,
        'device_type': window.innerWidth <= 768 ? 'mobile' : window.innerWidth <= 1024 ? 'tablet' : 'desktop',
        'first_seen_date': visitHistory.firstVisitDate,
        'last_visit_date': visitHistory.lastVisitDate,
        'visit_count': visitHistory.visitCount,
        'days_since_last_visit': visitHistory.daysSinceLastVisit,
        'total_days_known': visitHistory.totalDaysKnown,
        'is_returning_visitor': visitHistory.visitCount > 1,
        'utm_source': urlParams.get('utm_source') || '',
        'utm_medium': urlParams.get('utm_medium') || '',
        'utm_campaign': urlParams.get('utm_campaign') || ''
      };

      // Add all properties in one call
      heap.addUserProperties(pageProperties);

      // Track session start
      this.debouncedTrack('Session Started', {
        'visit_number': visitHistory.visitCount,
        'days_since_last_visit': visitHistory.daysSinceLastVisit,
        'is_returning_visitor': visitHistory.visitCount > 1,
        'page_type': pageProperties.page_type
      });

      // Setup global click tracking
      this.setupClickTracking();
      
      // Setup form tracking
      this.setupFormTracking();
      
      // Setup video tracking
      this.setupVideoTracking();
      
      // Track page-specific elements
      this.setupPageSpecificTracking();
    });
  }

  setupClickTracking() {
    document.body.addEventListener('click', (e) => {
      // Handle CTA buttons
      if (e.target.closest('.btn-getstarted, .hero-cta-btn, .cta-btn')) {
        const button = e.target.closest('.btn-getstarted, .hero-cta-btn, .cta-btn');
        this.debouncedTrack('CTA Clicked', {
          'button_text': button.textContent.trim(),
          'button_location': button.closest('section')?.id || 'header',
          'button_href': button.href
        });
      }
      
      // Handle navigation
      if (e.target.closest('#navmenu a')) {
        const link = e.target.closest('#navmenu a');
        this.debouncedTrack('Navigation Link Clicked', {
          'link_text': link.textContent.trim(),
          'link_href': link.href
        });
      }

      // Handle testimonials
      if (e.target.closest('.testimonial-item')) {
        const testimonial = e.target.closest('.testimonial-item');
        this.debouncedTrack('Testimonial Viewed', {
          'author_name': testimonial.querySelector('h3')?.textContent.trim(),
          'author_company': testimonial.querySelector('h4')?.textContent.trim()
        });
      }
    });
  }

  setupFormTracking() {
    const forms = document.querySelectorAll('form');
    forms.forEach(form => {
      form.addEventListener('submit', (e) => {
        const formData = new FormData(form);
        const email = formData.get('email');
        
        if (email) {
          heap.identify(email);
          heap.addUserProperties({
            'name': formData.get('name'),
            'email': email,
            'last_contact_subject': formData.get('subject')
          });
        }

        this.debouncedTrack('Form Submitted', {
          'form_id': form.id,
          'form_name': form.getAttribute('name'),
          'form_action': form.getAttribute('action')
        });
      });
    });
  }

  setupVideoTracking() {
    const videos = document.querySelectorAll('video');
    videos.forEach(video => {
      let lastVideoEvent = 0;
      const VIDEO_THROTTLE = 1000;
      
      ['play', 'pause', 'ended'].forEach(event => {
        video.addEventListener(event, function() {
          const now = Date.now();
          if (now - lastVideoEvent >= VIDEO_THROTTLE) {
            this.debouncedTrack('Video ' + event.charAt(0).toUpperCase() + event.slice(1), {
              'video_source': video.querySelector('source')?.src,
              'video_id': video.id
            });
            lastVideoEvent = now;
          }
        }.bind(this));
      });
    });
  }

  setupPageSpecificTracking() {
    // Track specific elements based on page type
    const pageType = document.body.className;
    
    switch(pageType) {
      case 'about-page':
        // Track about page specific elements
        this.trackAboutPageElements();
        break;
      case 'team-page':
        // Track team page specific elements
        this.trackTeamPageElements();
        break;
      // Add more page types as needed
    }
  }

  trackAboutPageElements() {
    // Add about page specific tracking
    const aboutSections = document.querySelectorAll('.about-section');
    aboutSections.forEach(section => {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            this.debouncedTrack('About Section Viewed', {
              'section_id': section.id,
              'section_title': section.querySelector('h2')?.textContent
            });
          }
        });
      });
      observer.observe(section);
    });
  }

  trackTeamPageElements() {
    // Add team page specific tracking
    const teamMembers = document.querySelectorAll('.team-member');
    teamMembers.forEach(member => {
      member.addEventListener('click', () => {
        this.debouncedTrack('Team Member Viewed', {
          'member_name': member.querySelector('h3')?.textContent,
          'member_role': member.querySelector('.role')?.textContent
        });
      });
    });
  }
}

// Initialize tracking
new HeapTracker(); 