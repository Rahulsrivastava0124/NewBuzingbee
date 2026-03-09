// ========================================
// BUZINGBEE ANALYTICS TRACKING SNIPPET
// ========================================
// Add this script to your website to track unique visitors by IP
// Place it in your HTML <head> or before closing </body> tag
//
// ✅ Features:
// - Automatic IP detection on backend
// - Prevents duplicate counts from same IP within 1 hour
// - Tracks unique visitors, not just page views

(function () {
  // Configuration
  const CONFIG = {
    apiUrl: "http://localhost:3001/api/analytics/track", // Change to your production API URL
    websiteName: "buzingbee", // Your website identifier
    trackOnLoad: true,
    trackSPA: true, // Set to true if you have a Single Page Application
  };

  // Detect device type from user agent
  function detectDevice() {
    const ua = navigator.userAgent.toLowerCase();
    if (/mobile|android|iphone|ipod|blackberry|iemobile|opera mini/i.test(ua)) {
      return "mobile";
    }
    if (/tablet|ipad|playbook|silk/i.test(ua)) {
      return "tablet";
    }
    return "desktop";
  }

  // Get current page path
  function getCurrentPage() {
    return window.location.pathname + window.location.search;
  }

  // Send tracking data to API
  async function track(customData = {}) {
    try {
      const payload = {
        website: CONFIG.websiteName,
        page: getCurrentPage(),
        device: detectDevice(),
        location: null, // Optional: add location if available
        ...customData,
      };

      // IP address is automatically extracted by backend from request headers
      // No need to send it explicitly!
      const response = await fetch(CONFIG.apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const result = await response.json();
        if (!result.tracked) {
          // Visit already counted for this IP within time window
          console.debug("Analytics: Visit already tracked for this IP");
        }
      } else {
        console.warn("Analytics tracking failed:", response.status);
      }
    } catch (error) {
      // Silently fail - don't disrupt user experience
      console.warn("Analytics error:", error.message);
    }
  }

  // Track page view
  function trackPageView() {
    track();
  }

  // Initialize tracking on page load
  if (CONFIG.trackOnLoad) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", trackPageView);
    } else {
      trackPageView();
    }
  }

  // Track SPA route changes (for React, Vue, Angular, etc.)
  if (CONFIG.trackSPA) {
    let lastPath = getCurrentPage();

    // Monitor for URL changes
    const observer = new MutationObserver(() => {
      const currentPath = getCurrentPage();
      if (currentPath !== lastPath) {
        lastPath = currentPath;
        trackPageView();
      }
    });

    observer.observe(document.querySelector("title"), {
      childList: true,
      subtree: true,
    });

    // Also listen to history API
    const originalPushState = history.pushState;
    const originalReplaceState = history.replaceState;

    history.pushState = function () {
      originalPushState.apply(this, arguments);
      trackPageView();
    };

    history.replaceState = function () {
      originalReplaceState.apply(this, arguments);
      trackPageView();
    };

    window.addEventListener("popstate", trackPageView);
  }

  // Expose global tracking function (optional)
  window.buzingbeeAnalytics = {
    track: track,
    trackPageView: trackPageView,
  };
})();
