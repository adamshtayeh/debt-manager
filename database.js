const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(__dirname, 'debt-manager.db'));

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS sessions (
    token TEXT PRIMARY KEY,
    user_id INTEGER NOT NULL,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS debts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    initial_amount REAL NOT NULL DEFAULT 0,
    amount REAL NOT NULL,
    notes TEXT DEFAULT '',
    is_active INTEGER NOT NULL DEFAULT 1,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS payments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    debt_id INTEGER NOT NULL,
    amount REAL NOT NULL,
    date TEXT NOT NULL,
    note TEXT DEFAULT '',
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (debt_id) REFERENCES debts(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS charges (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    debt_id INTEGER NOT NULL,
    amount REAL NOT NULL,
    date TEXT NOT NULL,
    note TEXT DEFAULT '',
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (debt_id) REFERENCES debts(id) ON DELETE CASCADE
  );
`);

// Upgrade a database created by an older version that lacks initial_amount.
// Migration checks for older database versions
if (db.prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'debts'").get()) {
  const columns = db.pragma('table_info(debts)');
  
  const hasInitialAmount = columns.some(column => column.name === 'initial_amount');
  if (!hasInitialAmount) {
    db.exec('ALTER TABLE debts ADD COLUMN initial_amount REAL NOT NULL DEFAULT 0');
  }

  const hasIsActive = columns.some(column => column.name === 'is_active');
  if (!hasIsActive) {
    db.exec('ALTER TABLE debts ADD COLUMN is_active INTEGER NOT NULL DEFAULT 1');
  }
}

module.exports = db;

