import { randomUUID } from "node:crypto";

type Row = Record<string, any>;
type Db = any;

export const PMS_STAFF_ROLES = ["manager", "front_desk", "housekeeper"] as const;
export type PmsStaffRole = (typeof PMS_STAFF_ROLES)[number];
const uid = () => randomUUID().replaceAll("-", "");

function hasColumn(db: Db, table: string, column: string) {
  return (db.prepare(`PRAGMA table_info(${table})`).all() as Row[]).some((item) => item.name === column);
}

export function initializePmsSchema(db: Db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS staff_members (
      id TEXT PRIMARY KEY, property_id TEXT NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      role TEXT NOT NULL CHECK(role IN ('manager','front_desk','housekeeper')),
      status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active','inactive')),
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(property_id,user_id)
    );
    CREATE TABLE IF NOT EXISTS room_units (
      id TEXT PRIMARY KEY, room_id TEXT NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
      label TEXT NOT NULL, floor TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL DEFAULT 'vacant' CHECK(status IN ('vacant','occupied','dirty','cleaning','maintenance','blocked')),
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(room_id,label)
    );
    CREATE TABLE IF NOT EXISTS rate_plans (
      id TEXT PRIMARY KEY, property_id TEXT NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
      name TEXT NOT NULL, minimum_stay INTEGER NOT NULL DEFAULT 1,
      tax_bps INTEGER NOT NULL DEFAULT 0, service_fee_minor INTEGER NOT NULL DEFAULT 0,
      active INTEGER NOT NULL DEFAULT 1, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS rate_rules (
      id TEXT PRIMARY KEY, rate_plan_id TEXT NOT NULL REFERENCES rate_plans(id) ON DELETE CASCADE,
      room_id TEXT NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
      start_date TEXT NOT NULL, end_date TEXT NOT NULL, nightly_rate_minor INTEGER NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CHECK(end_date >= start_date)
    );
    CREATE TABLE IF NOT EXISTS operational_tasks (
      id TEXT PRIMARY KEY, property_id TEXT NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
      room_unit_id TEXT REFERENCES room_units(id) ON DELETE SET NULL,
      booking_id TEXT REFERENCES booking_requests(id) ON DELETE SET NULL,
      type TEXT NOT NULL CHECK(type IN ('housekeeping','maintenance')),
      status TEXT NOT NULL DEFAULT 'open' CHECK(status IN ('open','in_progress','completed')),
      note TEXT NOT NULL DEFAULT '', assigned_to TEXT REFERENCES users(id) ON DELETE SET NULL,
      due_at TEXT, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, completed_at TEXT
    );
    CREATE INDEX IF NOT EXISTS idx_staff_members_property ON staff_members(property_id,status);
    CREATE INDEX IF NOT EXISTS idx_room_units_room ON room_units(room_id,status);
    CREATE INDEX IF NOT EXISTS idx_rate_rules_room_dates ON rate_rules(room_id,start_date,end_date);
    CREATE INDEX IF NOT EXISTS idx_operational_tasks_property ON operational_tasks(property_id,status);
  `);
  if (!hasColumn(db, "booking_requests", "room_unit_id")) {
    db.exec("ALTER TABLE booking_requests ADD COLUMN room_unit_id TEXT REFERENCES room_units(id)");
  }
}

export function pmsMembership(db: Db, userId: string, propertyId: string) {
  return db.prepare("SELECT * FROM staff_members WHERE user_id=? AND property_id=? AND status='active'").get(userId, propertyId) as Row | undefined;
}

export function pmsAccess(db: Db, user: Row, propertyId: string, allowed: PmsStaffRole[] = [...PMS_STAFF_ROLES]) {
  if (user.role === "admin") return { role: "admin" as const };
  const owner = db.prepare("SELECT p.id FROM properties p JOIN organisations o ON o.id=p.organisation_id WHERE p.id=? AND o.owner_id=?").get(propertyId, user.id);
  if (owner) return { role: "owner" as const };
  const membership = pmsMembership(db, user.id, propertyId);
  if (membership && allowed.includes(membership.role)) return { role: membership.role as PmsStaffRole };
  return null;
}

function dates(start: string, end: string) {
  const result: string[] = [];
  const cursor = new Date(`${start}T00:00:00.000Z`);
  const finish = new Date(`${end}T00:00:00.000Z`);
  while (cursor < finish) {
    result.push(cursor.toISOString().slice(0, 10));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return result;
}

export function quoteStay(db: Db, room: Row, start: string, end: string, units: number) {
  const nights = dates(start, end);
  if (!nights.length) throw new Error("At least one night is required.");
  let subtotal = 0;
  let plan: Row | undefined;
  for (const night of nights) {
    const rule = db.prepare(`SELECT rr.nightly_rate_minor,rp.* FROM rate_rules rr JOIN rate_plans rp ON rp.id=rr.rate_plan_id
      WHERE rr.room_id=? AND rp.active=1 AND rr.start_date<=? AND rr.end_date>=? ORDER BY rr.created_at DESC LIMIT 1`).get(room.id, night, night) as Row | undefined;
    subtotal += (rule?.nightly_rate_minor ?? room.nightly_rate_minor) * units;
    plan ||= rule;
  }
  if (nights.length < (plan?.minimum_stay ?? 1)) throw new Error(`This rate requires at least ${plan!.minimum_stay} nights.`);
  const tax = Math.round(subtotal * (plan?.tax_bps ?? 0) / 10_000);
  const serviceFee = (plan?.service_fee_minor ?? 0) * units;
  return { nights: nights.length, subtotalMinor: subtotal, taxMinor: tax, serviceFeeMinor: serviceFee, totalMinor: subtotal + tax + serviceFee, minimumStay: plan?.minimum_stay ?? 1 };
}

export function pmsReport(db: Db, propertyId: string, start: string, end: string) {
  const bookings = db.prepare(`SELECT b.* FROM booking_requests b WHERE b.property_id=?
    AND b.status IN ('confirmed','checked_in','completed') AND b.check_in<? AND b.check_out>?`).all(propertyId, end, start) as Row[];
  const roomNights = bookings.reduce((total, booking) => total + dates(booking.check_in < start ? start : booking.check_in, booking.check_out > end ? end : booking.check_out).length * booking.rooms, 0);
  const revenueMinor = bookings.reduce((total, booking) => total + Number(booking.total_minor), 0);
  const supply = Number(db.prepare("SELECT COALESCE(SUM(r.units),0) AS units FROM rooms r JOIN properties p ON p.id=r.property_id WHERE p.id=?").get(propertyId).units) * dates(start, end).length;
  return {
    bookings: bookings.length, revenueMinor, roomNights, availableRoomNights: supply,
    occupancyPercent: supply ? Number((roomNights / supply * 100).toFixed(2)) : 0,
    adrMinor: roomNights ? Math.round(revenueMinor / roomNights) : 0,
    revparMinor: supply ? Math.round(revenueMinor / supply) : 0,
  };
}

export function createStaffMembership(db: Db, propertyId: string, userId: string, role: PmsStaffRole) {
  const id = uid();
  db.prepare(`INSERT INTO staff_members(id,property_id,user_id,role) VALUES(?,?,?,?)
    ON CONFLICT(property_id,user_id) DO UPDATE SET role=excluded.role,status='active'`).run(id, propertyId, userId, role);
  return id;
}
