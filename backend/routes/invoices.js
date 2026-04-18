const router = require('express').Router();
const { v4: uuidv4 } = require('uuid');
const db = require('../models/db');
const auth = require('../middleware/authMiddleware');
const license = require('../middleware/licenseMiddleware');

router.use(auth, license);

const getNextNumber = () => {
  const last = db.prepare("SELECT number FROM invoices ORDER BY created_at DESC LIMIT 1").get();
  if (!last) return 'FAC-0001';
  const n = parseInt(last.number.split('-')[1] || '0') + 1;
  return `FAC-${String(n).padStart(4, '0')}`;
};

router.get('/', (req, res) => {
  const { search, status } = req.query;
  let q = 'SELECT * FROM invoices WHERE 1=1';
  const params = [];
  if (search) { q += ' AND client_name LIKE ?'; params.push(`%${search}%`); }
  if (status) { q += ' AND status = ?'; params.push(status); }
  q += ' ORDER BY created_at DESC';
  res.json(db.prepare(q).all(...params));
});

router.post('/', (req, res) => {
  const { client_name, client_email, items, total, status, payment_method, notes } = req.body;
  const id = uuidv4();
  const number = getNextNumber();
  db.prepare(`
    INSERT INTO invoices (id, number, client_name, client_email, items, total, status, payment_method, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, number, client_name, client_email, JSON.stringify(items), total, status || 'pending', payment_method, notes);
  res.status(201).json({ id, number });
});

router.put('/:id', (req, res) => {
  const { client_name, client_email, items, total, status, payment_method, notes } = req.body;
  db.prepare(`
    UPDATE invoices SET client_name=?, client_email=?, items=?, total=?, status=?, payment_method=?, notes=?
    WHERE id=?
  `).run(client_name, client_email, JSON.stringify(items), total, status, payment_method, notes, req.params.id);
  res.json({ success: true });
});

router.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM invoices WHERE id=?').run(req.params.id);
  res.json({ success: true });
});

module.exports = router;