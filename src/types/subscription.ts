export type SubscriptionTier = 'free' | 'reader' | 'bookworm';

export interface SubscriptionPlan {
  id: SubscriptionTier;
  name: string;
  price: number;
  priceId: string; // Stripe price ID
  features: string[];
  bookLimit: number | null; // null = unlimited
  aiFeatures: boolean;
  cloudSync: boolean;
  familySharing: number; // number of family members, 0 = none
}

export const SUBSCRIPTION_PLANS: Record<SubscriptionTier, SubscriptionPlan> = {
  free: {
    id: 'free',
    name: 'Free',
    price: 0,
    priceId: '',
    features: [
      'Track up to 50 books',
      'Manual book entry',
      'Basic reading stats',
      'Barcode scanner',
    ],
    bookLimit: 50,
    aiFeatures: false,
    cloudSync: false,
    familySharing: 0,
  },
  reader: {
    id: 'reader',
    name: 'Reader',
    price: 4.99,
    priceId: 'price_reader_monthly', // Replace with actual Stripe price ID
    features: [
      'Unlimited books',
      'All import options',
      'Full reading analytics',
      'Cloud sync',
      'Priority support',
    ],
    bookLimit: null,
    aiFeatures: false,
    cloudSync: true,
    familySharing: 0,
  },
  bookworm: {
    id: 'bookworm',
    name: 'Bookworm',
    price: 7.99,
    priceId: 'price_bookworm_monthly', // Replace with actual Stripe price ID
    features: [
      'Everything in Reader',
      'AI book recommendations',
      'Smart reading insights',
      'Family sharing (up to 5)',
      'Early access to features',
    ],
    bookLimit: null,
    aiFeatures: true,
    cloudSync: true,
    familySharing: 5,
  },
};

export interface UserSubscription {
  tier: SubscriptionTier;
  status: 'active' | 'cancelled' | 'past_due' | 'trialing';
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
}

export interface User {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  subscription: UserSubscription;
  isOwner: boolean;
  createdAt: string;
}

// Owner email that gets free premium access
// IMPORTANT: Change this to your email address to get free premium!
export const OWNER_EMAIL = 'jpvoight12@gmail.com'; // Change this to your email
