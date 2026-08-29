const crypto = require('crypto');
const fs = require('fs');
const express = require('express');
const path = require('path');
const db = require('./database');

const app = express();
const port = process.env.PORT || 3000;

function seedTestUser() {
  const username = 'test';
  const password = '123456';
  const hashedPassword = hashPassword(password);

  const existingUser = db.prepare('SELECT id FROM users WHERE email = ?').get(username);
  if (!existingUser) {
    console.log('Provisioning test user...');
    db.prepare('INSERT INTO users (email, password_hash) VALUES (?, ?)').run(username, hashedPassword);
  }
}
seedTestUser();

// Readable registry of every account (name + password), as requested.
// WARNING: passwords are stored in plain text here - keep this file private.
const USERS_LOG_PATH = path.join(__dirname, 'users.json');

function readUsersLog() {
  try {
    const parsed = JSON.parse(fs.readFileSync(USERS_LOG_PATH, 'utf8'));
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeUsersLog(users) {
  fs.writeFileSync(USERS_LOG_PATH, JSON.stringify(users, null, 2), 'utf8');
}

function recordSignup(id, email, password) {
  const users = readUsersLog();
  users.push({ id, email, password, createdAt: new Date().toISOString(), lastLogin: null });
  writeUsersLog(users);
}

function recordLogin(email) {
  const users = readUsersLog();
  const entry = users.find(user => user.email === email);
  if (entry) {
    entry.lastLogin = new Date().toISOString();
    writeUsersLog(users);
  }
}

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

function createToken() {
  return crypto.randomBytes(32).toString('hex');
}

function getUserFromRequest(req) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';
  if (!token) return null;

  return db.prepare(`
    SELECT users.id, users.email
    FROM sessions
    JOIN users ON users.id = sessions.user_id
    WHERE sessions.token = ?
  `).get(token) || null;
}

function requireAuth(req, res, next) {
  const user = getUserFromRequest(req);
  if (!user) {
    res.status(401).json({ error: 'Please sign in.' });
    return;
  }
  req.user = user;
  next();
}

function mapDebt(row) {
  const payments = db.prepare(`
    SELECT id, amount, date, note
    FROM payments
    WHERE debt_id = ?
    ORDER BY date ASC, id ASC
  `).all(row.id);

  const charges = db.prepare(`
    SELECT id, amount, date, note
    FROM charges
    WHERE debt_id = ?
    ORDER BY date ASC, id ASC
  `).all(row.id);

  return {
    id: row.id,
    name: row.name,
    initialAmount: row.initial_amount,
    amount: row.amount,
    notes: row.notes || '',
    createdAt: row.created_at,
    payments,
    charges
  };
}

app.post('/api/signup', (req, res) => {
  const email = String(req.body.email || '').trim().toLowerCase();
  const password = String(req.body.password || '');

  if (!email || !password) {
    res.status(400).json({ error: 'Email and password are required.' });
    return;
  }
  if (password.length < 6) {
    res.status(400).json({ error: 'Password must be at least 6 characters.' });
    return;
  }

  try {
    const result = db.prepare('INSERT INTO users (email, password_hash) VALUES (?, ?)').run(email, hashPassword(password));
    recordSignup(result.lastInsertRowid, email, password);
    const token = createToken();
    db.prepare('INSERT INTO sessions (token, user_id) VALUES (?, ?)').run(token, result.lastInsertRowid);
    res.json({ token, user: { id: result.lastInsertRowid, email } });
  } catch (error) {
    if (String(error.message).includes('UNIQUE')) {
      res.status(409).json({ error: 'Email already registered.' });
      return;
    }
    res.status(500).json({ error: 'Could not create account.' });
  }
});

app.post('/api/login', (req, res) => {
  const email = String(req.body.email || '').trim().toLowerCase();
  const password = String(req.body.password || '');
  const user = db.prepare('SELECT id, email FROM users WHERE email = ? AND password_hash = ?').get(email, hashPassword(password));

  if (!user) {
    res.status(401).json({ error: 'Invalid email or password.' });
    return;
  }

  recordLogin(email);
  const token = createToken();
  db.prepare('INSERT INTO sessions (token, user_id) VALUES (?, ?)').run(token, user.id);
  res.json({ token, user });
});

app.post('/api/logout', requireAuth, (req, res) => {
  const token = req.headers.authorization.slice(7);
  db.prepare('DELETE FROM sessions WHERE token = ?').run(token);
  res.json({ ok: true });
});

app.get('/api/debts', requireAuth, (req, res) => {
  const rows = db.prepare('SELECT * FROM debts WHERE user_id = ? AND is_active = 1 ORDER BY created_at DESC, id DESC').all(req.user.id);
  res.json(rows.map(mapDebt));
});

app.post('/api/debts', requireAuth, (req, res) => {
  const name = String(req.body.name || '').trim();
  const amount = Number(req.body.amount);
  const notes = String(req.body.notes || '').trim();

  if (!name) {
    res.status(400).json({ error: 'Customer name is required.' });
    return;
  }
  if (!Number.isFinite(amount) || amount <= 0) {
    res.status(400).json({ error: 'Enter a valid debt amount.' });
    return;
  }

  const result = db.prepare('INSERT INTO debts (user_id, name, initial_amount, amount, notes) VALUES (?, ?, ?, ?, ?)').run(req.user.id, name, amount, amount, notes);
  const row = db.prepare('SELECT * FROM debts WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(mapDebt(row));
});

app.post('/api/debts/:id/charge', requireAuth, (req, res) => {
  const debt = db.prepare('SELECT * FROM debts WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
  if (!debt) {
    res.status(404).json({ error: 'Customer not found.' });
    return;
  }

  const amount = Number(req.body.amount);
  const date = String(req.body.date || new Date().toISOString().slice(0, 10));
  const note = String(req.body.note || '').trim();

  if (!Number.isFinite(amount) || amount <= 0) {
    res.status(400).json({ error: 'Enter a valid amount to add.' });
    return;
  }

  db.prepare('INSERT INTO charges (debt_id, amount, date, note) VALUES (?, ?, ?, ?)').run(debt.id, amount, date, note);
  db.prepare('UPDATE debts SET amount = amount + ? WHERE id = ?').run(amount, debt.id);

  const row = db.prepare('SELECT * FROM debts WHERE id = ?').get(debt.id);
  res.status(201).json(mapDebt(row));
});

app.delete('/api/debts/:id', requireAuth, (req, res) => {
  const debt = db.prepare('SELECT * FROM debts WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
  if (!debt) {
    res.status(404).json({ error: 'Customer not found.' });
    return;
  }

  db.prepare('UPDATE debts SET is_active = 0 WHERE id = ?').run(debt.id);
  res.json({ ok: true });
});

app.post('/api/debts/:id/payments', requireAuth, (req, res) => {
  const debt = db.prepare('SELECT * FROM debts WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
  if (!debt) {
    res.status(404).json({ error: 'Customer not found.' });
    return;
  }

  const amount = Number(req.body.amount);
  const date = String(req.body.date || new Date().toISOString().slice(0, 10));
  const note = String(req.body.note || '').trim();

  if (!Number.isFinite(amount) || amount <= 0) {
    res.status(400).json({ error: 'Enter a valid payment amount.' });
    return;
  }

  db.prepare('INSERT INTO payments (debt_id, amount, date, note) VALUES (?, ?, ?, ?)').run(debt.id, amount, date, note);
  const row = db.prepare('SELECT * FROM debts WHERE id = ?').get(debt.id);
  res.status(201).json(mapDebt(row));
});

app.use((req, res, next) => {
  if (req.path.startsWith('/api/')) {
    res.status(404).json({ error: 'Not found.' });
    return;
  }
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(port, () => {
  console.log(`Debt Manager running at http://localhost:${port}`);
});
