const router = require('express').Router();
const { v4: uuidv4 } = require('uuid');
const db = require('../models/db');
const auth = require('../middleware/authMiddleware');
const license = require('../middleware/licenseMiddleware');

router.use(auth, license);

const getNextNumber = () => {
  const last = db.prepare("SELECT number FROM diplomas ORDER BY created_at DESC LIMIT 1").get();
  if (!last?.number) return 'DIP-0001';
  const n = parseInt(last.number.split('-')[1] || '0') + 1;
  return `DIP-${String(n).padStart(4, '0')}`;
};

router.get('/', (req, res) => {
  const diplomas = db.prepare('SELECT * FROM diplomas ORDER BY created_at DESC').all();
  res.json(diplomas);
});

router.get('/:id', (req, res) => {
  const d = db.prepare('SELECT * FROM diplomas WHERE id = ?').get(req.params.id);
  if (!d) return res.status(404).json({ error: 'Non trouvé' });
  res.json(d);
});

router.post('/', (req, res) => {
  const {
    recipient_name, type, grade, template, template_image,
    competition_name, rank, custom_title, custom_text,
    signatories, issued_date
  } = req.body;

  if (!recipient_name || !type) return res.status(400).json({ error: 'Champs manquants' });

  const id = uuidv4();
  const number = getNextNumber();

  db.prepare(`
    INSERT INTO diplomas (
      id, number, recipient_name, type, grade, template, template_image,
      competition_name, rank, custom_title, custom_text,
      signatories, issued_date
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id, number, recipient_name, type,
    grade || null, template || 'default',
    template_image || null,
    competition_name || null, rank || null,
    custom_title || null, custom_text || null,
    JSON.stringify(signatories || []),
    issued_date || new Date().toISOString().split('T')[0]
  );

  res.status(201).json({ id, number });
});

router.put('/:id', (req, res) => {
  const {
    recipient_name, type, grade, template, template_image,
    competition_name, rank, custom_title, custom_text,
    signatories, issued_date
  } = req.body;

  db.prepare(`
    UPDATE diplomas SET
      recipient_name=?, type=?, grade=?, template=?, template_image=?,
      competition_name=?, rank=?, custom_title=?, custom_text=?,
      signatories=?, issued_date=?
    WHERE id=?
  `).run(
    recipient_name, type, grade || null, template || 'default',
    template_image || null,
    competition_name || null, rank || null,
    custom_title || null, custom_text || null,
    JSON.stringify(signatories || []),
    issued_date,
    req.params.id
  );

  res.json({ success: true });
});

router.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM diplomas WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

module.exports = router;