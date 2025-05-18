/**
 * Visitor Tracking Client Script
 * Collects browser and device information for visitor identification.
 * Sends data to your backend for tracking and analysis.
 */

(function () {
  // API endpoint for tracking
  const TRACKING_API_URL =
    "https://tough-curiously-minnow.ngrok-free.app/api/v1/customer/page-visits";

  // Create tracking object
  window.visitorTracker = {
    // Main method to collect visitor data and send to server
    init: function () {
      // Collect all identifying information
      const visitorData = this.collectVisitorData();

      // Determine page type
      const pageType = this.determinePageType();

      // Get the Shopify domain/vendor ID
      const vendorId = this.getShopifyDomain();

      // Send data to server for tracking
      this.sendToServer(visitorData, pageType, vendorId);

      // Setup cart tracking
      this.setupCartTracking();

      // Return the data for any other client-side usage
      return visitorData;
    },

    // Setup listeners for add to cart buttons
    setupCartTracking: function () {
      // Common selectors for Add to Cart buttons in Shopify themes
      const cartButtonSelectors = [
        'button[name="add"]',
        "button.add-to-cart",
        "button.product-form--add-to-cart",
        "button.product-form__cart-submit",
        "button.ProductForm__AddToCart",
        'button[data-action="add-to-cart"]',
        'input[name="add"]',
        "input.add-to-cart",
        'form[action*="/cart/add"] button',
        'form[action*="/cart/add"] input[type="submit"]',
      ];

      // Create a single selector string from the array
      const combinedSelector = cartButtonSelectors.join(", ");

      // Handle clicks on all potential add to cart buttons
      const self = this;
      document.addEventListener("click", (event) => {
        // Check if the clicked element or any of its parents match our selectors
        let element = event.target;
        let isCartButton = false;

        // Walk up the DOM tree to find if any parent is an add to cart button
        while (element && element !== document.body) {
          if (element.matches && element.matches(combinedSelector)) {
            isCartButton = true;
            break;
          }
          element = element.parentNode;
        }

        // If we clicked an add to cart button, track the event
        if (isCartButton) {
          self.trackAddToCart();
        }
      });
    },

    // Track add to cart events
    trackAddToCart: function () {
      // Get visitor data for fingerprint
      const visitorData = this.collectVisitorData();
      const fingerPrint = this.formatVisitorString(visitorData);

      // Get vendor ID
      const vendorId = this.getShopifyDomain();

      // Create the payload
      const payload = {
        fingerPrint: fingerPrint,
        page: "product", // Likely a product page if adding to cart
        vendorId: vendorId,
        event: "add_to_cart", // Add this to distinguish from regular page visits
      };

      // Send to server
      fetch(TRACKING_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
        credentials: "include",
      })
        .then((response) => {
          if (!response.ok) {
            throw new Error("Network response was not ok");
          }
          return response.json();
        })
        .then((data) => {
          console.log("Add to cart event tracked successfully");
        })
        .catch((error) => {
          console.error("Error tracking add to cart event:", error);
        });

      // Log to console
      console.log(
        "%c Add to Cart Tracked ",
        "background: #e83e8c; color: white; padding: 2px 6px; border-radius: 2px; font-weight: bold;"
      );
    },

    // Get the Shopify store domain
    getShopifyDomain: function () {
      // Try to get it from meta tags first (most reliable)
      const shopifyDomainMeta = document.querySelector(
        'meta[property="og:site_name"]'
      );
      if (shopifyDomainMeta && shopifyDomainMeta.content) {
        return shopifyDomainMeta.content;
      }

      // Try to get from canonical link
      const canonicalLink = document.querySelector('link[rel="canonical"]');
      if (canonicalLink && canonicalLink.href) {
        try {
          const url = new URL(canonicalLink.href);
          return url.hostname;
        } catch (e) {
          // URL parsing failed
        }
      }

      // Fallback to current domain
      return window.location.hostname;
    },

    // Determine if current page is a product page
    // Determine the current page type based on the URL or page structure
    determinePageType: function () {
      const url = window.location.href.toLowerCase();
      const path = window.location.pathname.toLowerCase();

      if (
        path.includes("/products/") ||
        path.includes("/product/") ||
        path.includes("/p/") ||
        document.querySelector(".product-detail") !== null ||
        document.querySelector("[data-product-id]") !== null
      ) {
        return "product";
      }

      if (
        path === "/checkout" ||
        path.startsWith("/checkouts") ||
        path.includes("/checkout")
      ) {
        return "checkout";
      }

      if (path === "/cart" || path.includes("/cart")) {
        return "cart";
      }

      if (path === "/" || path === "/index") {
        return "home";
      }

      if (path.includes("/collections") || path.includes("/search")) {
        return "collection_or_search";
      }

      return "other";
    },

    // Collect all relevant browser and device information
    collectVisitorData: function () {
      return {
        // Operating system identification
        os: this.getOperatingSystem(),

        // Browser identification
        browser: this.getBrowserInfo(),

        // Device model information (NEW!)
        deviceModel: this.getDeviceModel(),

        // Screen and display information
        screen: this.getScreenInfo(),

        // Hardware information
        hardware: this.getHardwareInfo(),

        // Additional identifiers
        identifiers: this.getAdditionalIdentifiers(),

        // Current page information
        page: {
          url: window.location.href,
          referrer: document.referrer || "direct",
          title: document.title,
        },

        // Timestamp for client-side reference
        timestamp: new Date().toISOString(),
      };
    },

    // Detect operating system
    getOperatingSystem: function () {
      const userAgent = navigator.userAgent;
      let os = "Unknown";
      let version = "";

      // Detect common mobile operating systems
      if (/android/i.test(userAgent)) {
        os = "Android";
        const match = userAgent.match(/Android (\d+(\.\d+)?)/i);
        version = match ? match[1] : "";
      } else if (/iPad|iPhone|iPod/.test(userAgent) && !window.MSStream) {
        os = "iOS";
        const match = userAgent.match(/OS (\d+[_\d]*) like Mac OS X/i);
        version = match ? match[1].replace(/_/g, ".") : "";
      } else if (/Windows NT/.test(userAgent)) {
        os = "Windows";
        const match = userAgent.match(/Windows NT (\d+(\.\d+)?)/i);
        version = match ? match[1] : "";
      } else if (/Mac OS X/.test(userAgent)) {
        os = "MacOS";
        const match = userAgent.match(/Mac OS X (\d+[._\d]*)/i);
        version = match ? match[1].replace(/_/g, ".") : "";
      } else if (/Linux/.test(userAgent)) {
        os = "Linux";
      }

      return {
        name: os,
        version: version,
        mobile:
          /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
            userAgent
          ),
      };
    },

    // NEW! Extract device model from user agent
    getDeviceModel: function () {
      const userAgent = navigator.userAgent;

      // For Android devices
      if (/android/i.test(userAgent)) {
        // Look for patterns like: Android 10; SM-G973F or Android 10; Pixel 4

        // Samsung devices
        let match = userAgent.match(/;\s+(SM-[A-Z0-9]+)/i);
        if (match && match[1]) return match[1].trim();

        // Google Pixel
        match = userAgent.match(/;\s+(Pixel\s+[^;)]+)/i);
        if (match && match[1]) return match[1].trim();

        // Xiaomi/Redmi
        match = userAgent.match(/;\s+(Mi\s+[^;)]+|Redmi\s+[^;)]+)/i);
        if (match && match[1]) return match[1].trim();

        // OnePlus
        match = userAgent.match(/;\s+(OnePlus[^;)]+)/i);
        if (match && match[1]) return match[1].trim();

        // General Android model pattern
        match = userAgent.match(
          /Android[\s\/][\d\.]+;\s+([^;]+)(?:Build|[^\)]+\))/i
        );
        if (match && match[1]) {
          // Clean up the model string
          return match[1]
            .trim()
            .replace(/\sBuild.*/i, "") // Remove "Build/XXX"
            .replace(/\sLMY.*/i, "") // Remove additional version info
            .replace(/[;(].*/, ""); // Remove anything after ; or (
        }
      }

      // For iOS devices
      if (/iPad|iPhone|iPod/.test(userAgent)) {
        let device = "Unknown iOS Device";

        if (/iPad/.test(userAgent)) device = "iPad";
        else if (/iPod/.test(userAgent)) device = "iPod";
        else if (/iPhone/.test(userAgent)) device = "iPhone";

        // Try to get iOS version
        const match = userAgent.match(/OS (\d+[._]\d+[._]?\d*) like Mac OS X/i);
        const version = match ? match[1].replace(/_/g, ".") : "";

        if (version) return `${device} (iOS ${version})`;
        return device;
      }

      // For desktop browsers, we can't reliably get specific model info
      // but we can return the platform
      if (/Windows NT|Macintosh|Linux/i.test(userAgent)) {
        return navigator.platform || "Desktop Device";
      }

      return "Unknown Device";
    },

    // Detect browser name and version - UPDATED for iOS browser detection
    getBrowserInfo: function () {
      const userAgent = navigator.userAgent;
      let browserName = "Unknown";
      let browserVersion = "";
      let actualBrowser = "Unknown"; // Track the actual browser application

      // First detect the actual browser application (Chrome, Firefox, etc.)
      if (/CriOS/i.test(userAgent)) {
        actualBrowser = "Chrome";
      } else if (/FxiOS/i.test(userAgent)) {
        actualBrowser = "Firefox";
      } else if (/EdgiOS/i.test(userAgent)) {
        actualBrowser = "Edge";
      } else if (/OPiOS/i.test(userAgent)) {
        actualBrowser = "Opera";
      }

      // iOS specific handling - all browsers use WebKit on iOS
      if (/iPad|iPhone|iPod/.test(userAgent) && !window.MSStream) {
        // For iOS browsers, try to get the WebKit version
        // CriOS = Chrome for iOS, FxiOS = Firefox for iOS, etc.
        if (/CriOS/.test(userAgent)) {
          browserName = "Chrome"; // Report as Chrome even though it uses WebKit
          const match = userAgent.match(/CriOS\/(\d+(\.\d+)?)/i);
          browserVersion = match ? match[1] : "";
        } else if (/FxiOS/.test(userAgent)) {
          browserName = "Firefox";
          const match = userAgent.match(/FxiOS\/(\d+(\.\d+)?)/i);
          browserVersion = match ? match[1] : "";
        } else if (/EdgiOS/.test(userAgent)) {
          browserName = "Edge";
          const match = userAgent.match(/EdgiOS\/(\d+(\.\d+)?)/i);
          browserVersion = match ? match[1] : "";
        } else {
          // Standard Safari
          browserName = "Safari";
          const match = userAgent.match(/Version\/(\d+(\.\d+)?)/i);
          browserVersion = match ? match[1] : "";
        }
      }
      // Non-iOS browser detection
      else if (
        /Chrome/.test(userAgent) &&
        !/Chromium|Edge|Edg|OPR|Opera|brave/i.test(userAgent)
      ) {
        browserName = "Chrome";
        const match = userAgent.match(/Chrome\/(\d+(\.\d+)?)/i);
        browserVersion = match ? match[1] : "";
      } else if (/Firefox/.test(userAgent) && !/Seamonkey/i.test(userAgent)) {
        browserName = "Firefox";
        const match = userAgent.match(/Firefox\/(\d+(\.\d+)?)/i);
        browserVersion = match ? match[1] : "";
      } else if (/Edg/.test(userAgent)) {
        browserName = "Edge";
        const match = userAgent.match(/Edg\/(\d+(\.\d+)?)/i);
        browserVersion = match ? match[1] : "";
      } else if (
        /Safari/.test(userAgent) &&
        !/Chrome|Chromium|Edge|Edg|OPR|Opera/i.test(userAgent)
      ) {
        browserName = "Safari";
        const match = userAgent.match(/Version\/(\d+(\.\d+)?)/i);
        browserVersion = match ? match[1] : "";
      } else if (/MSIE|Trident/.test(userAgent)) {
        browserName = "Internet Explorer";
        const match = userAgent.match(/(?:MSIE |rv:)(\d+(\.\d+)?)/i);
        browserVersion = match ? match[1] : "";
      } else if (/OPR|Opera/.test(userAgent)) {
        browserName = "Opera";
        const match = userAgent.match(/(?:OPR|Opera)\/(\d+(\.\d+)?)/i);
        browserVersion = match ? match[1] : "";
      }

      return {
        name: browserName,
        version: browserVersion,
        actualBrowser: actualBrowser, // Store the actual browser app if relevant
        userAgent: userAgent,
        language: navigator.language || "Unknown",
        cookieEnabled: navigator.cookieEnabled,
      };
    },

    // Get screen and display information
    getScreenInfo: function () {
      return {
        width: window.screen.width,
        height: window.screen.height,
        availWidth: window.screen.availWidth,
        availHeight: window.screen.availHeight,
        colorDepth: window.screen.colorDepth,
        pixelRatio: window.devicePixelRatio || 1,
        orientation: window.screen.orientation
          ? window.screen.orientation.type
          : "Unknown",
      };
    },

    // Get hardware information
    getHardwareInfo: function () {
      return {
        cores: navigator.hardwareConcurrency || "Unknown",
        memory: navigator.deviceMemory || "Unknown",
        maxTouchPoints: navigator.maxTouchPoints || 0,
        platform: navigator.platform || "Unknown",
      };
    },

    // Get additional identifying information
    getAdditionalIdentifiers: function () {
      return {
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "Unknown",
        timezoneOffset: new Date().getTimezoneOffset(),
        canvasFingerprint: this.getEnhancedCanvasFingerprint(), // IMPROVED CANVAS FINGERPRINTING
        // WebGL renderer info (if available)
        webGLRenderer: this.getWebGLRenderer(),
        // Detect various browser capabilities as additional signals
        capabilities: {
          localStorage: !!window.localStorage,
          sessionStorage: !!window.sessionStorage,
          webWorker: !!window.Worker,
          webGL: this.hasWebGL(),
          webRTC: !!window.RTCPeerConnection,
          touchscreen: "ontouchstart" in window,
          audio: !!window.AudioContext || !!window.webkitAudioContext,
          video: !!document.createElement("video").canPlayType,
        },
      };
    },

    // NEW! Get WebGL renderer info (GPU details)
    getWebGLRenderer: function () {
      try {
        const canvas = document.createElement("canvas");
        const gl =
          canvas.getContext("webgl") || canvas.getContext("experimental-webgl");

        if (!gl) return "webgl-not-supported";

        const debugInfo = gl.getExtension("WEBGL_debug_renderer_info");
        if (debugInfo) {
          const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
          return renderer || "unknown-renderer";
        }

        return "renderer-info-not-available";
      } catch (e) {
        return "webgl-error";
      }
    },

    // Check for WebGL support
    hasWebGL: function () {
      try {
        const canvas = document.createElement("canvas");
        return !!(
          window.WebGLRenderingContext &&
          (canvas.getContext("webgl") ||
            canvas.getContext("experimental-webgl"))
        );
      } catch (e) {
        return false;
      }
    },

    // IMPROVED: Enhanced canvas fingerprinting
    getEnhancedCanvasFingerprint: function () {
      try {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        if (!ctx) return "canvas-not-supported";

        // Use a larger canvas for more detail
        canvas.width = 280;
        canvas.height = 80;

        // Set canvas properties
        ctx.textBaseline = "alphabetic";

        // Draw background
        ctx.fillStyle = "rgb(240, 240, 240)";
        ctx.fillRect(0, 0, 280, 80);

        // Add complex text with multiple styles and fonts
        // First text
        ctx.fillStyle = "#F60";
        ctx.font = "14px Arial";
        ctx.fillText("Fingerprinting", 10, 15);

        // Second text with different font
        ctx.fillStyle = "#069";
        ctx.font = "16px Georgia";
        ctx.fillText("DeviceID", 12, 35);

        // Third text with emoji (crucial for device differences)
        ctx.fillStyle = "rgba(102, 204, 0, 0.7)";
        ctx.font = "12px Tahoma";
        ctx.fillText("🦄👨‍💻✨🔒", 14, 55);

        // Shapes with precise positioning to capture sub-pixel rendering differences
        // Draw gradient rectangle
        const gradient = ctx.createLinearGradient(0, 0, 280, 80);
        gradient.addColorStop(0, "rgba(255, 0, 0, 0.2)");
        gradient.addColorStop(0.5, "rgba(0, 255, 0, 0.2)");
        gradient.addColorStop(1, "rgba(0, 0, 255, 0.2)");
        ctx.fillStyle = gradient;
        ctx.fillRect(150, 10, 100, 50);

        // Draw circles with precise positioning
        ctx.beginPath();
        ctx.arc(200, 30, 15.5, 0, Math.PI * 2);
        ctx.closePath();
        ctx.fillStyle = "rgba(255, 0, 0, 0.5)";
        ctx.fill();

        ctx.beginPath();
        ctx.arc(230, 30, 10.5, 0, Math.PI * 2);
        ctx.closePath();
        ctx.fillStyle = "rgba(0, 255, 0, 0.5)";
        ctx.fill();

        // Draw diagonal lines with precise positioning
        ctx.strokeStyle = "rgba(0, 0, 255, 0.5)";
        ctx.lineWidth = 0.5;

        for (let i = 0; i < 8; i++) {
          ctx.beginPath();
          ctx.moveTo(150 + i * 5 + 0.12345, 10);
          ctx.lineTo(150 + i * 5 + 0.12345 + 30, 60);
          ctx.stroke();
        }

        // Get the canvas data and create a hash
        const dataURL = canvas.toDataURL();

        // For a more stable fingerprint, sample from different parts of the image
        // to capture rendering differences across the canvas
        const samples = [
          dataURL.substring(0, 500), // Start
          dataURL.substring(1000, 1500), // Middle part 1
          dataURL.substring(dataURL.length - 500), // End
        ];

        // Create hash from the samples
        let hash = 0;
        const sampleStr = samples.join("");

        for (let i = 0; i < sampleStr.length; i++) {
          const char = sampleStr.charCodeAt(i);
          hash = (hash << 5) - hash + char;
          hash = hash & hash; // Convert to 32bit integer
        }

        return Math.abs(hash).toString(36);
      } catch (e) {
        return "canvas-error-" + e.message.substring(0, 10);
      }
    },

    // Creates a formatted string from visitor data
    formatVisitorString: function (data) {
      // Generate a more browser-specific identifier for iOS
      let browserIdentifier = data.browser.name;

      // For iOS, add clarity about actual browser app
      if (data.os.name === "iOS" && data.browser.actualBrowser !== "Unknown") {
        browserIdentifier = `${data.browser.actualBrowser}(WebKit)`;
      }

      // Return a pipe-delimited string of key attributes with MORE unique identifiers
      return [
        data.os.name,
        browserIdentifier,
        data.browser.version.split(".")[0] || "unknown", // Major version only
        `${data.screen.width}x${data.screen.height}`,
        `${data.hardware.cores}cores-${data.hardware.memory}GB`,
        data.identifiers.canvasFingerprint,
        data.deviceModel, // ADDED DEVICE MODEL!
        (data.screen.pixelRatio || 1).toFixed(3), // Precise pixel ratio
        data.identifiers.webGLRenderer
          ? data.identifiers.webGLRenderer.substring(0, 20)
          : "unknown-gpu", // GPU info!
      ].join("|");
    },

    // Send visitor data to server
    sendToServer: function (visitorData, pageType, vendorId) {
      // Format fingerprint string
      const fingerPrint = this.formatVisitorString(visitorData);

      // Create the payload for the server
      const payload = {
        fingerPrint: fingerPrint,
        page: pageType,
        vendorId: vendorId,
        websiteUrl: window.location.origin, // 🔥 Add full domain (e.g., https://example.com)
        fullPageUrl: window.location.href, // Optional: Full page URL with path/query
      };

      // Send data via fetch API
      fetch(TRACKING_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
        credentials: "include", // Include cookies if needed
      })
        .then((response) => {
          if (!response.ok) {
            throw new Error("Network response was not ok");
          }
          return response.json();
        })
        .then((data) => {
          console.log("Page visit tracked successfully");
        })
        .catch((error) => {
          console.error("Error sending tracking data:", error);
        });

      // Also log to console for debugging
      console.log(
        "%c Visitor Tracking Data ",
        "background: #4834d4; color: white; padding: 2px 6px; border-radius: 2px; font-weight: bold;",
        {
          fingerPrint,
          pageType,
          vendorId,
        }
      );
    },
  };

  // Initialize tracking when the script loads
  window.visitorTracker.init();

  // Also track on page visibility changes to catch returns from other tabs
  document.addEventListener("visibilitychange", function () {
    if (document.visibilityState === "visible") {
      window.visitorTracker.init();
    }
  });
})();
