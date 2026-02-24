# BookShelf App - Setup Guide

## Authentication & Payments Setup

### 1. Set Your Owner Email (Free Premium Access)

Edit `src/types/subscription.ts` and change the `OWNER_EMAIL`:

```typescript
export const OWNER_EMAIL = 'your-actual-email@example.com';
```

When you sign in with this email, you'll automatically get free Bookworm (premium) access!

---

### 2. Firebase Setup (Authentication)

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project
3. Enable Authentication:
   - Go to Authentication → Sign-in method
   - Enable Email/Password
   - Enable Google (configure OAuth)
4. Get your config:
   - Go to Project Settings → General
   - Scroll to "Your apps" → Add Web App
   - Copy the config object

5. Update `src/config/firebase.ts`:

```typescript
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123"
};
```

---

### 3. Stripe Setup (Payments)

#### A. Create Stripe Account
1. Go to [Stripe Dashboard](https://dashboard.stripe.com/)
2. Create an account or sign in

#### B. Create Products & Prices
1. Go to Products → Add Product
2. Create two subscription products:

**Reader Plan ($4.99/month)**
- Name: "Reader"
- Price: $4.99 recurring monthly
- Copy the Price ID (starts with `price_`)

**Bookworm Plan ($7.99/month)**
- Name: "Bookworm"  
- Price: $7.99 recurring monthly
- Copy the Price ID (starts with `price_`)

#### C. Get API Keys
1. Go to Developers → API Keys
2. Copy your Publishable key (starts with `pk_test_`)
3. Copy your Secret key (starts with `sk_test_`)

#### D. Update App Config

Edit `src/config/stripe.ts`:

```typescript
export const STRIPE_CONFIG = {
  publishableKey: 'pk_test_YOUR_PUBLISHABLE_KEY',
  prices: {
    reader: 'price_YOUR_READER_PRICE_ID',
    bookworm: 'price_YOUR_BOOKWORM_PRICE_ID',
  },
  apiUrl: 'https://your-backend-url.com/api',
};
```

Also update `src/types/subscription.ts`:

```typescript
reader: {
  // ...
  priceId: 'price_YOUR_READER_PRICE_ID',
},
bookworm: {
  // ...
  priceId: 'price_YOUR_BOOKWORM_PRICE_ID',
},
```

---

### 4. Backend Setup (Required for Stripe)

The backend handles secure Stripe operations. You can deploy it to:
- Vercel (free)
- Railway (free tier)
- Heroku
- Any Node.js hosting

#### Local Development:

```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your Stripe keys
npm run dev
```

#### Deploy to Vercel:

1. Push backend folder to GitHub
2. Connect to Vercel
3. Add environment variables:
   - `STRIPE_SECRET_KEY`
   - `STRIPE_WEBHOOK_SECRET`
4. Deploy

#### Set up Webhook:

1. Go to Stripe Dashboard → Developers → Webhooks
2. Add endpoint: `https://your-backend.com/api/webhook`
3. Select events:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_failed`
4. Copy webhook secret to your backend `.env`

---

### 5. Testing

#### Test with Demo Mode (No Backend Required)

The app includes demo mode that simulates subscriptions locally:
- Sign in with any email
- Use owner email for free premium
- Upgrade/downgrade works locally

#### Test with Stripe Test Mode

Use Stripe test cards:
- Success: `4242 4242 4242 4242`
- Decline: `4000 0000 0000 0002`

Any future date and any CVC works.

---

## Subscription Tiers

| Feature | Free | Reader ($4.99) | Bookworm ($7.99) |
|---------|------|----------------|------------------|
| Books | 50 max | Unlimited | Unlimited |
| Basic Stats | ✓ | ✓ | ✓ |
| All Imports | ✗ | ✓ | ✓ |
| Cloud Sync | ✗ | ✓ | ✓ |
| AI Features | ✗ | ✗ | ✓ |
| Family Sharing | ✗ | ✗ | Up to 5 |

---

## File Structure

```
src/
├── config/
│   ├── firebase.ts      # Firebase configuration
│   └── stripe.ts        # Stripe configuration
├── context/
│   └── AuthContext.tsx  # Auth state management
├── screens/
│   ├── AuthScreen.tsx   # Sign in/up screen
│   ├── SubscriptionScreen.tsx  # Plan selection
│   └── SettingsScreen.tsx      # Account & subscription management
├── types/
│   └── subscription.ts  # Subscription types & plans
└── ...
```

---

## Quick Start Checklist

- [ ] Set `OWNER_EMAIL` in `src/types/subscription.ts`
- [ ] Create Firebase project
- [ ] Add Firebase config to `src/config/firebase.ts`
- [ ] Create Stripe account
- [ ] Create Reader and Bookworm products in Stripe
- [ ] Add Stripe keys to `src/config/stripe.ts`
- [ ] Deploy backend (for production)
- [ ] Set up Stripe webhook
- [ ] Test sign in with owner email
- [ ] Test subscription flow with test cards
