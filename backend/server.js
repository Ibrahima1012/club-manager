require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const app = express();
const PORT = process.env.PORT || 3001;

// Security
app.use(helmet());
app.use(cors({
  origin: [process.env.FRONTEND_URL, 'http://localhost:3000'],
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));

// Rate limiting
const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 100 });
app.use('/api/', limiter);

// Init DB
require('./models/db');

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/license', require('./routes/license'));
app.use('/api/payment', require('./routes/payment'));
app.use('/api/invoices', require('./routes/invoices'));
app.use('/api/receipts', require('./routes/receipts'));
app.use('/api/diplomas', require('./routes/diplomas'));
app.use('/api/expenses', require('./routes/expenses'));
app.use('/api/settings', require('./routes/settings'));

app.get('/api/health', (req, res) => res.json({ status: 'ok', ts: Date.now() }));

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
module.exports = app;