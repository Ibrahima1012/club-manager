const db = require('../models/db');

module.exports = (req, res, next) => {
  const license = db.prepare(`
    SELECT * FROM licenses 
    WHERE user_id = ? AND status = 'active' 
    AND (expires_at IS NULL OR expires_at > datetime('now'))
    ORDER BY created_at DESC LIMIT 1
  `).get(req.user.id);

  if (!license) return res.status(403).json({ error: 'Licence requise', code: 'NO_LICENSE' });
  req.license = license;
  next();
};