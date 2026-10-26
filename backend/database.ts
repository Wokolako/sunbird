import { mkdirSync } from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import { config } from "./config";
import { initializePmsSchema } from "../lib/pms";

export type Db = DatabaseSync;
let instance: Db | undefined;

export function database() {
  if (instance) return instance;
  mkdirSync(path.dirname(config.databasePath), { recursive: true });
  const db = new DatabaseSync(config.databasePath);
  db.exec("PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON; PRAGMA busy_timeout=5000;");
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY, name TEXT NOT NULL, email TEXT NOT NULL UNIQUE, phone TEXT NOT NULL DEFAULT '',
      password_hash TEXT NOT NULL, role TEXT NOT NULL CHECK(role IN ('owner','admin','guest')),
      status TEXT NOT NULL DEFAULT 'active', created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS sessions (
      token_hash TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      expires_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS organisations (
      id TEXT PRIMARY KEY, owner_id TEXT NOT NULL REFERENCES users(id), name TEXT NOT NULL DEFAULT '',
      type TEXT NOT NULL DEFAULT '', registration_number TEXT NOT NULL DEFAULT '', licence_number TEXT NOT NULL DEFAULT '',
      contact_name TEXT NOT NULL DEFAULT '', phone TEXT NOT NULL DEFAULT '', email TEXT NOT NULL DEFAULT '', address TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL DEFAULT 'pending', verification_reason TEXT NOT NULL DEFAULT '', payout_status TEXT NOT NULL DEFAULT 'not_connected',
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS properties (
      id TEXT PRIMARY KEY, organisation_id TEXT NOT NULL REFERENCES organisations(id), name TEXT NOT NULL,
      type TEXT NOT NULL DEFAULT '', description TEXT NOT NULL DEFAULT '', address TEXT NOT NULL DEFAULT '',
      latitude REAL, longitude REAL, photos TEXT NOT NULL DEFAULT '[]', amenities TEXT NOT NULL DEFAULT '[]',
      accessibility TEXT NOT NULL DEFAULT '', languages TEXT NOT NULL DEFAULT '', house_rules TEXT NOT NULL DEFAULT '',
      cancellation_policy TEXT NOT NULL DEFAULT '', check_in TEXT NOT NULL DEFAULT '14:00', check_out TEXT NOT NULL DEFAULT '10:00',
      booking_mode TEXT NOT NULL DEFAULT 'request', currency TEXT NOT NULL DEFAULT 'GBP', status TEXT NOT NULL DEFAULT 'draft',
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS rooms (
      id TEXT PRIMARY KEY, property_id TEXT NOT NULL REFERENCES properties(id) ON DELETE CASCADE, name TEXT NOT NULL,
      adult_capacity INTEGER NOT NULL DEFAULT 1, child_capacity INTEGER NOT NULL DEFAULT 0, beds TEXT NOT NULL DEFAULT '',
      size_sqm REAL, units INTEGER NOT NULL DEFAULT 1, nightly_rate_minor INTEGER NOT NULL DEFAULT 0,
      amenities TEXT NOT NULL DEFAULT '[]', photos TEXT NOT NULL DEFAULT '[]', created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS availability (room_id TEXT NOT NULL REFERENCES rooms(id) ON DELETE CASCADE, night TEXT NOT NULL, units_open INTEGER NOT NULL, closed INTEGER NOT NULL DEFAULT 0, PRIMARY KEY(room_id,night));
    CREATE TABLE IF NOT EXISTS booking_requests (
      id TEXT PRIMARY KEY, guest_id TEXT NOT NULL REFERENCES users(id), property_id TEXT NOT NULL REFERENCES properties(id),
      room_id TEXT NOT NULL REFERENCES rooms(id), check_in TEXT NOT NULL, check_out TEXT NOT NULL, guests INTEGER NOT NULL,
      rooms INTEGER NOT NULL, total_minor INTEGER NOT NULL, status TEXT NOT NULL DEFAULT 'pending', created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS audit_log (id TEXT PRIMARY KEY, actor_id TEXT NOT NULL, entity_type TEXT NOT NULL, entity_id TEXT NOT NULL, action TEXT NOT NULL, before_json TEXT, after_json TEXT, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
  `);
  initializePmsSchema(db);
  instance = db;
  return db;
}
