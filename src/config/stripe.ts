// Stripe configuration
// Replace with your actual Stripe keys

export const STRIPE_CONFIG = {
  // Publishable key (safe to expose in client code)
  publishableKey: 'pk_test_YOUR_PUBLISHABLE_KEY',
  
  // Price IDs from your Stripe Dashboard
  prices: {
    reader: 'price_reader_monthly', // Replace with actual price ID
    bookworm: 'price_bookworm_monthly', // Replace with actual price ID
  },
  
  // Your backend API URL for creating checkout sessions
  // You'll need a simple backend to securely create Stripe sessions
  apiUrl: 'https://your-backend.com/api', // Replace with your backend URL
};

// For web: Create a checkout session
export const createCheckoutSession = async (
  priceId: string, 
  customerId: string,
  customerEmail: string
): Promise<string> => {
  // This should call your backend API which creates a Stripe Checkout session
  // For now, we'll use Stripe's hosted checkout via a simple backend
  
  const response = await fetch(`${STRIPE_CONFIG.apiUrl}/create-checkout-session`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      priceId,
      customerId,
      customerEmail,
      successUrl: window.location.origin + '/subscription-success',
      cancelUrl: window.location.origin + '/settings',
    }),
  });
  
  const { sessionUrl } = await response.json();
  return sessionUrl;
};

// Create a portal session for managing subscription
export const createPortalSession = async (customerId: string): Promise<string> => {
  const response = await fetch(`${STRIPE_CONFIG.apiUrl}/create-portal-session`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      customerId,
      returnUrl: window.location.origin + '/settings',
    }),
  });
  
  const { portalUrl } = await response.json();
  return portalUrl;
};

// Cancel subscription
export const cancelSubscription = async (subscriptionId: string): Promise<void> => {
  await fetch(`${STRIPE_CONFIG.apiUrl}/cancel-subscription`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ subscriptionId }),
  });
};
