// Simple Express backend for Stripe integration and AI recommendations
// Run with: node server.js
// Deploy to Vercel, Railway, or any Node.js hosting

require('dotenv').config();

const express = require('express');
const cors = require('cors');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const OpenAI = require('openai');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const app = express();
app.use(cors());
app.use(express.json());

// Create a Stripe Checkout session
app.post('/api/create-checkout-session', async (req, res) => {
  try {
    const { priceId, customerEmail, successUrl, cancelUrl } = req.body;

    // Find or create customer
    let customer;
    const existingCustomers = await stripe.customers.list({ email: customerEmail, limit: 1 });
    
    if (existingCustomers.data.length > 0) {
      customer = existingCustomers.data[0];
    } else {
      customer = await stripe.customers.create({ email: customerEmail });
    }

    const session = await stripe.checkout.sessions.create({
      customer: customer.id,
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      mode: 'subscription',
      success_url: successUrl || 'https://your-app.com/success',
      cancel_url: cancelUrl || 'https://your-app.com/cancel',
    });

    res.json({ sessionUrl: session.url, customerId: customer.id });
  } catch (error) {
    console.error('Checkout error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Create a Customer Portal session
app.post('/api/create-portal-session', async (req, res) => {
  try {
    const { customerId, returnUrl } = req.body;

    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl || 'https://your-app.com/settings',
    });

    res.json({ portalUrl: session.url });
  } catch (error) {
    console.error('Portal error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Cancel subscription
app.post('/api/cancel-subscription', async (req, res) => {
  try {
    const { subscriptionId } = req.body;

    const subscription = await stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: true,
    });

    res.json({ success: true, subscription });
  } catch (error) {
    console.error('Cancel error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Webhook to handle Stripe events
app.post('/api/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  switch (event.type) {
    case 'checkout.session.completed':
      const session = event.data.object;
      console.log('Checkout completed:', session);
      // Update user subscription in your database
      break;
      
    case 'customer.subscription.updated':
      const subscription = event.data.object;
      console.log('Subscription updated:', subscription);
      // Update subscription status in your database
      break;
      
    case 'customer.subscription.deleted':
      const cancelledSub = event.data.object;
      console.log('Subscription cancelled:', cancelledSub);
      // Downgrade user to free tier in your database
      break;
      
    case 'invoice.payment_failed':
      const failedInvoice = event.data.object;
      console.log('Payment failed:', failedInvoice);
      // Notify user of payment failure
      break;
      
    default:
      console.log(`Unhandled event type: ${event.type}`);
  }

  res.json({ received: true });
});

// Get book recommendations using OpenAI
app.post('/api/recommendations', async (req, res) => {
  try {
    const { books } = req.body;

    if (!books || books.length === 0) {
      return res.status(400).json({ error: 'No books provided' });
    }

    const bookList = books
      .slice(0, 20)
      .map(b => `"${b.title}" by ${b.authors.join(', ')} (${b.genres.join(', ')})`)
      .join('\n');

    const prompt = `Based on this user's reading history, recommend 5 books they might enjoy. The user has read:

${bookList}

Return ONLY a valid JSON array with exactly 20 book recommendations. Each book should have:
- id: a unique identifier (use lowercase title with hyphens)
- title: the book title
- authors: array of author names
- synopsis: a compelling 2-3 sentence synopsis
- genres: array of genres

Do not include any books the user has already read. Focus on similar themes, authors, or genres.

Response format (return ONLY this JSON, no other text):
[{"id":"book-id","title":"Book Title","authors":["Author Name"],"synopsis":"Synopsis here.","genres":["Genre"]}]`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are a book recommendation expert. Always respond with valid JSON only, no markdown or extra text.',
        },
        { role: 'user', content: prompt },
      ],
      temperature: 0.8,
      max_tokens: 4000,
    });

    const responseText = completion.choices[0].message.content.trim();
    
    // Parse the JSON response
    let recommendations;
    try {
      recommendations = JSON.parse(responseText);
    } catch (parseError) {
      // Try to extract JSON from the response if it has extra text
      const jsonMatch = responseText.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        recommendations = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('Invalid JSON response from AI');
      }
    }

    // Add cover URLs from Open Library (free API)
    const enrichedRecommendations = await Promise.all(
      recommendations.map(async (book) => {
        try {
          const searchQuery = encodeURIComponent(`${book.title} ${book.authors[0]}`);
          const searchRes = await fetch(
            `https://openlibrary.org/search.json?q=${searchQuery}&limit=1`
          );
          const searchData = await searchRes.json();
          
          if (searchData.docs && searchData.docs[0]?.cover_i) {
            book.coverURL = `https://covers.openlibrary.org/b/id/${searchData.docs[0].cover_i}-L.jpg`;
          }
        } catch (err) {
          console.error('Error fetching cover:', err);
        }
        return book;
      })
    );

    res.json({ recommendations: enrichedRecommendations });
  } catch (error) {
    console.error('Recommendations error:', error);
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`);
});
