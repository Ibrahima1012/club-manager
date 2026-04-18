const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(__dirname, '../data/club.db'));

db.exec(`
  PRAGMA journal_mode=WAL;

  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT DEFAULT 'admin',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS licenses (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    key TEXT UNIQUE NOT NULL,
    plan TEXT DEFAULT 'monthly',
    status TEXT DEFAULT 'active',
    expires_at DATETIME,
    stripe_session_id TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS club_settings (
    id TEXT PRIMARY KEY DEFAULT 'main',
    name TEXT,
    logo TEXT,
    address TEXT,
    phone TEXT,
    email TEXT,
    currency TEXT DEFAULT 'XOF',
    colors TEXT DEFAULT '{"primary":"#6366f1","secondary":"#8b5cf6"}',
    signature TEXT,
    stamp TEXT,
    responsibles TEXT DEFAULT '[]',
    auto_messages TEXT DEFAULT '{}',
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS invoices (
    id TEXT PRIMARY KEY,
    number TEXT UNIQUE NOT NULL,
    client_name TEXT NOT NULL,
    client_email TEXT,
    items TEXT NOT NULL,
    total REAL NOT NULL,
    status TEXT DEFAULT 'pending',
    payment_method TEXT,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS receipts (
    id TEXT PRIMARY KEY,
    number TEXT UNIQUE NOT NULL,
    client_name TEXT NOT NULL,
    amount REAL NOT NULL,
    payment_method TEXT DEFAULT 'cash',
    description TEXT,
    invoice_id TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (invoice_id) REFERENCES invoices(id)
  );

  CREATE TABLE IF NOT EXISTS diplomas (
    id TEXT PRIMARY KEY,
    recipient_name TEXT NOT NULL,
    type TEXT NOT NULL,
    grade TEXT,
    template TEXT,
    issued_date TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS expenses (
    id TEXT PRIMARY KEY,
    description TEXT NOT NULL,
    amount REAL NOT NULL,
    category TEXT,
    date TEXT,
    receipt_url TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);


// ============================================================
// MIGRATIONS — Ajout des nouvelles colonnes sans perdre les données
// ============================================================
const migrations = [
  // diplomas
  `ALTER TABLE diplomas ADD COLUMN competition_name TEXT`,
  `ALTER TABLE diplomas ADD COLUMN rank TEXT`,
  `ALTER TABLE diplomas ADD COLUMN custom_title TEXT`,
  `ALTER TABLE diplomas ADD COLUMN custom_text TEXT`,
  `ALTER TABLE diplomas ADD COLUMN template_image TEXT`,
  `ALTER TABLE diplomas ADD COLUMN signatories TEXT DEFAULT '[]'`,

  // club_settings
  `ALTER TABLE club_settings ADD COLUMN stamp_opacity REAL DEFAULT 1.0`,
  `ALTER TABLE club_settings ADD COLUMN stamp_rotation REAL DEFAULT 0`,
  `ALTER TABLE club_settings ADD COLUMN stamp_size REAL DEFAULT 35`,
  `ALTER TABLE club_settings ADD COLUMN stamp_x REAL DEFAULT 140`,
  `ALTER TABLE club_settings ADD COLUMN stamp_y REAL DEFAULT 240`,
];

// SQLite ne supporte pas IF NOT EXISTS sur ADD COLUMN → try/catch
migrations.forEach(sql => {
  try {
    db.exec(sql);
  } catch (e) {
    if (!e.message.includes('duplicate column')) {
      console.warn('Migration skipped:', sql, e.message);
    }
  }
});


// Init default settings
const existing = db.prepare("SELECT id FROM club_settings WHERE id='main'").get();
if (!existing) {
  db.prepare(`INSERT INTO club_settings (id, name) VALUES ('main', 'Mon Club')`).run();
}

module.exports = db;