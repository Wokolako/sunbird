import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';
import { mkdirSync } from 'node:fs';
import path from 'node:path';
import { cookies } from 'next/headers';

const { DatabaseSync } = require('node:sqlite') as { DatabaseSync: new (file: string) => any };
type Db = InstanceType<typeof DatabaseSync>;
type Row = Record<string, any>;

const storage = (globalThis as typeof globalThis & { finderDb?: Db });

export function database(): Db {
  if (storage.finderDb) return storage.finderDb;
  const file = process.env.DATABASE_PATH || path.join(process.cwd(), 'data', 'finder.sqlite');
  mkdirSync(path.dirname(file), { recursive: true });
  const db = new DatabaseSync(file);
  db.exec('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON; PRAGMA busy_timeout = 5000;');
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY, name TEXT NOT NULL, email TEXT NOT NULL UNIQUE,
      phone TEXT NOT NULL DEFAULT '', password_hash TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('owner','admin','guest')),
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS sessions (
      token_hash TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      expires_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS organisations (
      id TEXT PRIMARY KEY, owner_id TEXT NOT NULL REFERENCES users(id), name TEXT NOT NULL,
      type TEXT NOT NULL, registration_number TEXT NOT NULL, licence_number TEXT NOT NULL DEFAULT '',
      contact_name TEXT NOT NULL, phone TEXT NOT NULL, email TEXT NOT NULL, address TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','approved','rejected','more_documents')),
      verification_reason TEXT NOT NULL DEFAULT '', payout_status TEXT NOT NULL DEFAULT 'not_connected',
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS documents (
      id TEXT PRIMARY KEY, organisation_id TEXT NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
      kind TEXT NOT NULL, filename TEXT NOT NULL, mime TEXT NOT NULL, content BLOB NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS properties (
      id TEXT PRIMARY KEY, organisation_id TEXT NOT NULL REFERENCES organisations(id),
      name TEXT NOT NULL, type TEXT NOT NULL, description TEXT NOT NULL DEFAULT '',
      address TEXT NOT NULL DEFAULT '', latitude REAL, longitude REAL,
      photos TEXT NOT NULL DEFAULT '[]', amenities TEXT NOT NULL DEFAULT '[]',
      accessibility TEXT NOT NULL DEFAULT '', languages TEXT NOT NULL DEFAULT '',
      house_rules TEXT NOT NULL DEFAULT '', cancellation_policy TEXT NOT NULL DEFAULT '',
      check_in TEXT NOT NULL DEFAULT '14:00', check_out TEXT NOT NULL DEFAULT '10:00',
      booking_mode TEXT NOT NULL DEFAULT 'request' CHECK(booking_mode IN ('instant','request')),
      currency TEXT NOT NULL DEFAULT 'MWK',
      status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('draft','published','paused')),
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS rooms (
      id TEXT PRIMARY KEY, property_id TEXT NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
      name TEXT NOT NULL, adult_capacity INTEGER NOT NULL, child_capacity INTEGER NOT NULL DEFAULT 0,
      beds TEXT NOT NULL, size_sqm REAL, units INTEGER NOT NULL,
      nightly_rate_minor INTEGER NOT NULL, amenities TEXT NOT NULL DEFAULT '[]',
      photos TEXT NOT NULL DEFAULT '[]', created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS availability (
      room_id TEXT NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
      night TEXT NOT NULL, units_open INTEGER NOT NULL, closed INTEGER NOT NULL DEFAULT 0,
      PRIMARY KEY(room_id, night)
    );
    CREATE TABLE IF NOT EXISTS enquiries (
      id TEXT PRIMARY KEY, property_id TEXT NOT NULL REFERENCES properties(id),
      guest_name TEXT NOT NULL, guest_email TEXT NOT NULL, guest_phone TEXT NOT NULL,
      message TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'new',
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, first_reply_at TEXT
    );
    CREATE TABLE IF NOT EXISTS audit_log (
      id TEXT PRIMARY KEY, actor_id TEXT NOT NULL, entity_type TEXT NOT NULL,
      entity_id TEXT NOT NULL, action TEXT NOT NULL, before_json TEXT, after_json TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS login_attempts (
      email TEXT PRIMARY KEY, attempts INTEGER NOT NULL DEFAULT 0, blocked_until INTEGER NOT NULL DEFAULT 0
    );
    CREATE INDEX IF NOT EXISTS idx_properties_status ON properties(status);
    CREATE INDEX IF NOT EXISTS idx_availability_night ON availability(night);
  `);
  db.exec('CREATE TABLE IF NOT EXISTS platform_settings (key TEXT PRIMARY KEY, value TEXT NOT NULL)');
  storage.finderDb = db;
  if (!(db.prepare('PRAGMA table_info(users)').all() as Row[]).some(column => column.name === 'status')) {
    db.exec("ALTER TABLE users ADD COLUMN status TEXT NOT NULL DEFAULT 'active'");
  }
  db.exec(`CREATE TABLE IF NOT EXISTS booking_requests (
    id TEXT PRIMARY KEY, guest_id TEXT NOT NULL REFERENCES users(id),
    property_id TEXT NOT NULL REFERENCES properties(id), room_id TEXT NOT NULL REFERENCES rooms(id),
    check_in TEXT NOT NULL, check_out TEXT NOT NULL, guests INTEGER NOT NULL, rooms INTEGER NOT NULL,
    total_minor INTEGER NOT NULL, status TEXT NOT NULL DEFAULT 'pending',
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`);
  return db;
}

export function uid() { return randomBytes(16).toString('hex'); }
export function hashPassword(password: string) {
  const salt = randomBytes(16).toString('hex');
  return `${salt}:${scryptSync(password, salt, 64).toString('hex')}`;
}
export function verifyPassword(password: string, stored: string) {
  const [salt, expected] = stored.split(':');
  if (!salt || !expected) return false;
  const a = Buffer.from(expected, 'hex');
  const b = scryptSync(password, salt, a.length);
  return a.length === b.length && timingSafeEqual(a, b);
}
export function tokenHash(token: string) {
  return require('node:crypto').createHash('sha256').update(token).digest('hex') as string;
}
export function audit(db: Db, actorId: string, entityType: string, entityId: string, action: string, before: unknown, after: unknown) {
  db.prepare('INSERT INTO audit_log (id,actor_id,entity_type,entity_id,action,before_json,after_json) VALUES (?,?,?,?,?,?,?)')
    .run(uid(), actorId, entityType, entityId, action, before == null ? null : JSON.stringify(before), after == null ? null : JSON.stringify(after));
}
export function issueSession(db: Db, userId: string) {
  const token = randomBytes(32).toString('hex');
  const expires = new Date(Date.now() + 7 * 86400000).toISOString();
  db.prepare('INSERT INTO sessions (token_hash,user_id,expires_at) VALUES (?,?,?)').run(tokenHash(token), userId, expires);
  return token;
}
export async function currentUser(): Promise<Row | null> {
  const token = (await cookies()).get(sessionCookie())?.value;
  if (!token) return null;
  const db = database();
  return db.prepare("SELECT users.id,users.name,users.email,users.phone,users.role FROM sessions JOIN users ON users.id=sessions.user_id WHERE sessions.token_hash=? AND sessions.expires_at>? AND users.status='active' AND users.role=?")
    .get(tokenHash(token), new Date().toISOString(), portalRole()) || null;
}
export function portalRole() { return process.env.APP_PORTAL === 'admin' ? 'admin' : process.env.APP_PORTAL === 'management' ? 'owner' : 'guest'; }
export function sessionCookie() { return `vabbot_${portalRole()}_session`; }
export function userOrganisation(db: Db, userId: string) {
  return db.prepare('SELECT * FROM organisations WHERE owner_id=?').get(userId) as Row | undefined;
}
export function propertyForOwner(db: Db, propertyId: string, userId: string) {
  return db.prepare('SELECT p.* FROM properties p JOIN organisations o ON o.id=p.organisation_id WHERE p.id=? AND o.owner_id=?').get(propertyId, userId) as Row | undefined;
}
export function roomForOwner(db: Db, roomId: string, userId: string) {
  return db.prepare('SELECT r.* FROM rooms r JOIN properties p ON p.id=r.property_id JOIN organisations o ON o.id=p.organisation_id WHERE r.id=? AND o.owner_id=?').get(roomId, userId) as Row | undefined;
}
export function safeUser(user: Row) {
  return { id: user.id, name: user.name, email: user.email, phone: user.phone, role: user.role };
}
