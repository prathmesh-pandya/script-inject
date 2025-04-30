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
    determinePageType: function () {
      // This is a simple detection - adjust based on your site structure
      const url = window.location.href.toLowerCase();

      // Check for common product page indicators
      // Adjust these patterns based on your actual URL structure
      if (
        url.includes("/products/") ||
        url.includes("/product/") ||
        url.includes("/p/") ||
        document.querySelector(".product-detail") !== null ||
        document.querySelector("[data-product-id]") !== null
      ) {
        return "product";
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

    // Detect browser name and version
    getBrowserInfo: function () {
      const userAgent = navigator.userAgent;
      let browserName = "Unknown";
      let browserVersion = "";

      // Chrome
      if (
        /Chrome/.test(userAgent) &&
        !/Chromium|Edge|Edg|OPR|Opera|brave/i.test(userAgent)
      ) {
        browserName = "Chrome";
        const match = userAgent.match(/Chrome\/(\d+(\.\d+)?)/i);
        browserVersion = match ? match[1] : "";
      }
      // Firefox
      else if (/Firefox/.test(userAgent) && !/Seamonkey/i.test(userAgent)) {
        browserName = "Firefox";
        const match = userAgent.match(/Firefox\/(\d+(\.\d+)?)/i);
        browserVersion = match ? match[1] : "";
      }
      // Edge
      else if (/Edg/.test(userAgent)) {
        browserName = "Edge";
        const match = userAgent.match(/Edg\/(\d+(\.\d+)?)/i);
        browserVersion = match ? match[1] : "";
      }
      // Safari
      else if (
        /Safari/.test(userAgent) &&
        !/Chrome|Chromium|Edge|Edg|OPR|Opera/i.test(userAgent)
      ) {
        browserName = "Safari";
        const match = userAgent.match(/Version\/(\d+(\.\d+)?)/i);
        browserVersion = match ? match[1] : "";
      }
      // Internet Explorer
      else if (/MSIE|Trident/.test(userAgent)) {
        browserName = "Internet Explorer";
        const match = userAgent.match(/(?:MSIE |rv:)(\d+(\.\d+)?)/i);
        browserVersion = match ? match[1] : "";
      }
      // Opera
      else if (/OPR|Opera/.test(userAgent)) {
        browserName = "Opera";
        const match = userAgent.match(/(?:OPR|Opera)\/(\d+(\.\d+)?)/i);
        browserVersion = match ? match[1] : "";
      }

      return {
        name: browserName,
        version: browserVersion,
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
        canvasFingerprint: this.getCanvasFingerprint(),
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

    // Generate a canvas fingerprint
    getCanvasFingerprint: function () {
      try {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        if (!ctx) return "canvas-not-supported";

        canvas.width = 200;
        canvas.height = 50;

        // Text with different styles
        ctx.textBaseline = "top";
        ctx.font = "14px Arial";
        ctx.fillStyle = "#F60";
        ctx.fillRect(125, 1, 62, 20);
        ctx.fillStyle = "#069";
        ctx.fillText("Visitor Tracking", 2, 15);
        ctx.fillStyle = "rgba(102, 204, 0, 0.7)";
        ctx.fillText("Canvas Fingerprint", 4, 30);

        // Add some shapes to make it more unique
        ctx.beginPath();
        ctx.arc(50, 25, 10, 0, Math.PI * 2);
        ctx.closePath();
        ctx.fill();

        // Create a short hash from the canvas data
        const dataURL = canvas
          .toDataURL()
          .replace("data:image/png;base64,", "");
        let hash = 0;

        for (let i = 0; i < 50 && i < dataURL.length; i++) {
          hash = (hash << 5) - hash + dataURL.charCodeAt(i);
          hash = hash & hash; // Convert to 32bit integer
        }

        return Math.abs(hash).toString(36);
      } catch (e) {
        return "canvas-error";
      }
    },

    // Creates a formatted string from visitor data
    formatVisitorString: function (data) {
      // Return a pipe-delimited string of key attributes
      return [
        data.os.name,
        data.browser.name,
        data.browser.version.split(".")[0] || "unknown", // Major version only
        `${data.screen.width}x${data.screen.height}`,
        `${data.hardware.cores}cores-${data.hardware.memory}GB`,
        data.identifiers.canvasFingerprint,
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
