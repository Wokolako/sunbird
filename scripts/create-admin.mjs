import { DatabaseSync } from 'node:sqlite';
import { randomBytes, scryptSync } from 'node:crypto';
import { mkdirSync } from 'node:fs';
import path from 'node:path';

const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
const password = process.env.ADMIN_PASSWORD;
if (!email || !password || password.length < 12) {
  console.error('Set ADMIN_EMAIL and ADMIN_PASSWORD (at least 12 characters).');
  process.exit(1);
}
const file = process.env.DATABASE_PATH || path.join(process.cwd(), 'data', 'finder.sqlite');
mkdirSync(path.dirname(file), { recursive: true });
const db = new DatabaseSync(file);
db.exec('CREATE TABLE IF NOT EXISTS users (id TEXT PRIMARY KEY, name TEXT NOT NULL, email TEXT NOT NULL UNIQUE, phone TEXT NOT NULL DEFAULT \'\', password_hash TEXT NOT NULL, role TEXT NOT NULL, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)');
const salt = randomBytes(16).toString('hex');
const hash = `${salt}:${scryptSync(password, salt, 64).toString('hex')}`;
db.prepare('INSERT INTO users (id,name,email,phone,password_hash,role) VALUES (?,?,?,?,?,?) ON CONFLICT(email) DO UPDATE SET password_hash=excluded.password_hash,role=excluded.role')
  .run(randomBytes(16).toString('hex'), 'Platform Admin', email, '', hash, 'admin');
console.log('Admin account ready:', email);
db.close();
