const router = require('express').Router();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { v4: uuidv4 } = require('uuid');
const db = require('../models/db');
const auth = require('../middleware/authMiddleware');

const PLANS = {
  monthly: { price: 5000, name: 'Mensuel', days: 30 },  // 5000 XOF ~ 8€
  yearly:  { price: 45000, name: 'Annuel', days: 365 },  // 45000 XOF ~ 70€
};

// Créer session Stripe
router.post('/create-checkout', auth, async (req, res) => {
  const { plan = 'monthly' } = req.body;
  const p = PLANS[plan];
  if (!p) return res.status(400).json({ error: 'Plan invalide' });

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: [{
      price_data: {
        currency: 'eur',
        product_data: { name: `Club Manager — ${p.name}` },
        unit_amount: Math.round(p.price / 655 * 100), // XOF → EUR centimes
      },
      quantity: 1,
    }],
    mode: 'payment',
    success_url: `${process.env.FRONTEND_URL}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.FRONTEND_URL}/pricing`,
    metadata: { user_id: req.user.id, plan, days: p.days },
  });

  res.json({ url: session.url, session_id: session.id });
});

// Webhook Stripe (activation automatique)
router.post('/webhook', express.raw({ type: 'application/json' }), (req, res) => {
  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, req.headers['stripe-signature'], process.env.STRIPE_WEBHOOK_SECRET);
  } catch { return res.status(400).send('Webhook error'); }

  if (event.type === 'checkout.session.completed') {
    const s = event.data.object;
    const { user_id, plan, days } = s.metadata;
    const expires = new Date(Date.now() + days * 86400000).toISOString();
    db.prepare(`
      INSERT INTO licenses (id, user_id, key, plan, status, expires_at, stripe_session_id)
      VALUES (?, ?, ?, ?, 'active', ?, ?)
    `).run(uuidv4(), user_id, uuidv4(), plan, expires, s.id);
  }
  res.json({ received: true });
});

// Vérifier licence
router.get('/license-status', auth, (req, res) => {
  const license = db.prepare(`
    SELECT * FROM licenses WHERE user_id = ? AND status = 'active'
    AND (expires_at IS NULL OR expires_at > datetime('now'))
    ORDER BY created_at DESC LIMIT 1
  `).get(req.user.id);
  res.json({ active: !!license, license: license || null });
});

module.exports = router;