/**
 * Shopify Analytics Test Script
 * This is a simplified version for testing purposes only.
 * It logs all events to the console instead of sending to a server.
 */

(function () {
    // Create a simple analytics object
    window.shopTestAnalytics = {
        track: function (eventName, eventData = {}) {
            // Add basic metadata
            const data = {
                event: eventName,
                timestamp: new Date().toISOString(),
                url: window.location.href,
                shop: window.Shopify ? window.Shopify.shop : window.location.hostname,
                ...eventData
            };

            // Log to console with formatting
            console.log(`%c ANALYTICS EVENT: ${eventName}`, 'background: #ff6b6b; color: white; padding: 2px 6px; border-radius: 2px; font-weight: bold;', data);
        }
    };

    // Track page view immediately
    shopTestAnalytics.track('page_viewed');

    // Track product views
    if (window.location.pathname.includes('/products/')) {
        shopTestAnalytics.track('product_viewed', {
            product_path: window.location.pathname
        });
    }

    // Track add to cart via form submission
    document.addEventListener('submit', function (event) {
        if (event.target.action && event.target.action.indexOf('/cart/add') !== -1) {
            const formData = new FormData(event.target);
            const productId = formData.get('id');
            const quantity = formData.get('quantity') || 1;

            shopTestAnalytics.track('add_to_cart', {
                product_id: productId,
                quantity: quantity
            });
        }
    });

    // Track add to cart via button clicks
    document.addEventListener('click', function (event) {
        const addToCartButton = event.target.closest('[name="add"], .add-to-cart, .product-form__cart-submit, [data-action="add-to-cart"]');
        if (addToCartButton) {
            shopTestAnalytics.track('add_to_cart_click', {
                button: addToCartButton.outerHTML.slice(0, 100) // Just log part of the button for debugging
            });
        }

        // Track quantity changes
        const quantityButton = event.target.closest('.quantity-button, .quantity__button, [data-quantity-button], .js-qty__adjust');
        if (quantityButton) {
            shopTestAnalytics.track('quantity_changed', {
                element: quantityButton.outerHTML.slice(0, 100)
            });
        }
    });

    // Track checkout
    if (window.location.pathname.includes('/checkout')) {
        shopTestAnalytics.track('checkout_started');

        // Track checkout steps
        document.addEventListener('click', function (event) {
            if (event.target.closest('#continue_button')) {
                shopTestAnalytics.track('checkout_step_continued', {
                    current_url: window.location.href
                });
            }

            const paymentButton = event.target.closest('[data-payment-button], .payment-button');
            if (paymentButton) {
                shopTestAnalytics.track('payment_button_clicked');
            }
        });
    }

    // Track Ajax cart updates (jQuery method)
    if (typeof jQuery !== 'undefined') {
        jQuery(document).on('cart.requestComplete', function (event, cart) {
            shopTestAnalytics.track('cart_updated_jquery', {
                item_count: cart.item_count,
                total_price: cart.total_price / 100
            });
        });
    }

    // Track fetch calls to cart
    const originalFetch = window.fetch;
    window.fetch = function (url, options) {
        const result = originalFetch.apply(this, arguments);

        if (typeof url === 'string' && (url.includes('/cart/add') || url.includes('/cart/update') || url.includes('/cart/change'))) {
            shopTestAnalytics.track('cart_api_call', {
                url: url,
                method: options ? options.method : 'GET'
            });
        }

        return result;
    };

    console.log('%c Shopify Analytics Test Script Loaded', 'background: #50fa7b; color: #282a36; padding: 4px 8px; font-weight: bold;');
})();