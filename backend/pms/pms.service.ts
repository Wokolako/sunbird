import { randomUUID } from "node:crypto";
import { database } from "../database";
import type { AuthUser } from "../auth/auth.service";
import { PMS_STAFF_ROLES, createStaffMembership, pmsAccess, pmsReport, quoteStay } from "../../lib/pms";

const uid = () => randomUUID().replaceAll("-", "");
const audit = (actorId: string, type: string, id: string, action: string, after: unknown) => database().prepare(
  "INSERT INTO audit_log(id,actor_id,entity_type,entity_id,action,after_json) VALUES(?,?,?,?,?,?)"
).run(uid(), actorId, type, id, action, JSON.stringify(after));

export function authorize(user: AuthUser, propertyId: string, roles = [...PMS_STAFF_ROLES]) {
  return pmsAccess(database(), user, propertyId, roles);
}

export function dashboard(user: AuthUser, propertyId: string) {
  const db = database(); const permission = authorize(user, propertyId);
  if (!permission) return null;
  const today = new Date().toISOString().slice(0, 10);
  const end = new Date(Date.now() + 30 * 86_400_000).toISOString().slice(0, 10);
  return { permission, report: pmsReport(db, propertyId, today, end),
    arrivals: db.prepare("SELECT b.*,u.name AS guest_name,r.name AS room_name FROM booking_requests b JOIN users u ON u.id=b.guest_id JOIN rooms r ON r.id=b.room_id WHERE b.property_id=? AND b.check_in=? AND b.status IN ('confirmed','checked_in')").all(propertyId, today),
    departures: db.prepare("SELECT b.*,u.name AS guest_name,r.name AS room_name FROM booking_requests b JOIN users u ON u.id=b.guest_id JOIN rooms r ON r.id=b.room_id WHERE b.property_id=? AND b.check_out=? AND b.status='checked_in'").all(propertyId, today),
    units: db.prepare("SELECT ru.*,r.name AS room_name FROM room_units ru JOIN rooms r ON r.id=ru.room_id WHERE r.property_id=? ORDER BY r.name,ru.label").all(propertyId),
    tasks: db.prepare("SELECT t.*,ru.label AS unit_label FROM operational_tasks t LEFT JOIN room_units ru ON ru.id=t.room_unit_id WHERE t.property_id=? AND t.status!='completed' ORDER BY t.created_at DESC").all(propertyId),
  };
}

export function calendar(user: AuthUser, propertyId: string, roomId: string, start: string, end: string) {
  const db = database(); if (!authorize(user, propertyId) || !/^\d{4}-\d{2}-\d{2}$/.test(start) || !/^\d{4}-\d{2}-\d{2}$/.test(end) || end < start) return null;
  const room = db.prepare("SELECT * FROM rooms WHERE id=? AND property_id=?").get(roomId, propertyId); if (!room) return null;
  return { room, availability: db.prepare("SELECT * FROM availability WHERE room_id=? AND night>=? AND night<=? ORDER BY night").all(roomId, start, end),
    rates: db.prepare("SELECT rr.*,rp.name AS rate_plan_name,rp.minimum_stay,rp.tax_bps,rp.service_fee_minor FROM rate_rules rr JOIN rate_plans rp ON rp.id=rr.rate_plan_id WHERE rr.room_id=? AND rr.end_date>=? AND rr.start_date<=? ORDER BY rr.start_date").all(roomId, start, end) };
}

export function createUnit(user: AuthUser, body: Record<string, unknown>) {
  const propertyId = String(body.propertyId || ""); const permission = authorize(user, propertyId, ["manager"]);
  if (!permission) return null; const db = database(); const roomId = String(body.roomId || ""); const label = String(body.label || "").trim();
  if (!label || !db.prepare("SELECT 1 FROM rooms WHERE id=? AND property_id=?").get(roomId, propertyId)) throw new Error("Choose a room type and unit label.");
  const id = uid(); db.prepare("INSERT INTO room_units(id,room_id,label,floor) VALUES(?,?,?,?)").run(id, roomId, label, String(body.floor || "").trim()); audit(user.id, "room_unit", id, "create", { roomId, label }); return { id };
}

export function createRoomType(user: AuthUser, body: Record<string, unknown>) {
  const propertyId = String(body.propertyId || ""); if (!authorize(user, propertyId, ["manager"])) return null;
  const name = String(body.name || "").trim(); const adults = Number(body.adults); const children = Number(body.children || 0); const units = Number(body.units); const rate = Number(body.nightlyRate); const beds = String(body.beds || "").trim();
  if (!name || !beds || !Number.isInteger(adults) || adults < 1 || !Number.isInteger(children) || children < 0 || !Number.isInteger(units) || units < 1 || !Number.isFinite(rate) || rate <= 0) throw new Error("Enter a name, beds, capacity, units, and nightly rate.");
  const id = uid(); database().prepare("INSERT INTO rooms(id,property_id,name,adult_capacity,child_capacity,beds,size_sqm,units,nightly_rate_minor) VALUES(?,?,?,?,?,?,?,?,?)").run(id, propertyId, name, adults, children, beds, Number(body.sizeSqm) || null, units, Math.round(rate * 100)); audit(user.id, "room", id, "create", { propertyId, name, units }); return { id };
}

export function updateAvailability(user: AuthUser, body: Record<string, unknown>) {
  const propertyId = String(body.propertyId || ""); if (!authorize(user, propertyId, ["manager"])) return null; const db = database(); const room = db.prepare("SELECT * FROM rooms WHERE id=? AND property_id=?").get(String(body.roomId || ""), propertyId) as any;
  const start = String(body.start || ""); const end = String(body.end || ""); const units = Number(body.unitsOpen); const closed = body.closed === true ? 1 : 0;
  if (!room || !/^\d{4}-\d{2}-\d{2}$/.test(start) || !/^\d{4}-\d{2}-\d{2}$/.test(end) || end < start || !Number.isInteger(units) || units < 0 || units > room.units) throw new Error("Choose a room, dates, and an available unit count.");
  const count = (Date.parse(`${end}T00:00:00Z`) - Date.parse(`${start}T00:00:00Z`)) / 86_400_000 + 1; if (count > 366) throw new Error("Availability updates are limited to 366 days.");
  db.exec("BEGIN IMMEDIATE"); try { const statement = db.prepare("INSERT INTO availability(room_id,night,units_open,closed) VALUES(?,?,?,?) ON CONFLICT(room_id,night) DO UPDATE SET units_open=excluded.units_open,closed=excluded.closed"); const cursor = new Date(`${start}T00:00:00Z`); for (let i = 0; i < count; i += 1) { statement.run(room.id, cursor.toISOString().slice(0, 10), units, closed); cursor.setUTCDate(cursor.getUTCDate() + 1); } audit(user.id, "availability", room.id, "range_update", { start, end, units, closed: Boolean(closed) }); db.exec("COMMIT"); return { days: count }; } catch (error) { db.exec("ROLLBACK"); throw error; }
}

export function setUnitStatus(user: AuthUser, body: Record<string, unknown>) {
  const propertyId = String(body.propertyId || ""); if (!authorize(user, propertyId, ["manager", "front_desk", "housekeeper"])) return null;
  const status = String(body.status || ""); if (!['vacant','occupied','dirty','cleaning','maintenance','blocked'].includes(status)) throw new Error("Invalid room-unit status.");
  const db = database(); const unit = db.prepare("SELECT ru.* FROM room_units ru JOIN rooms r ON r.id=ru.room_id WHERE ru.id=? AND r.property_id=?").get(String(body.unitId || ""), propertyId) as any;
  if (!unit) throw new Error("Room unit not found."); db.prepare("UPDATE room_units SET status=? WHERE id=?").run(status, unit.id); audit(user.id, "room_unit", unit.id, "status", { status }); return { id: unit.id, status };
}

export function createRatePlan(user: AuthUser, body: Record<string, unknown>) {
  const propertyId = String(body.propertyId || ""); if (!authorize(user, propertyId, ["manager"])) return null;
  const name = String(body.name || "").trim(); const minimumStay = Number(body.minimumStay || 1); const taxBps = Number(body.taxBps || 0); const fee = Number(body.serviceFee || 0);
  if (!name || !Number.isInteger(minimumStay) || minimumStay < 1 || !Number.isInteger(taxBps) || taxBps < 0 || taxBps > 10000 || !Number.isFinite(fee) || fee < 0) throw new Error("Invalid rate-plan values.");
  const id = uid(); database().prepare("INSERT INTO rate_plans(id,property_id,name,minimum_stay,tax_bps,service_fee_minor) VALUES(?,?,?,?,?,?)").run(id, propertyId, name, minimumStay, taxBps, Math.round(fee * 100)); audit(user.id, "rate_plan", id, "create", { name, minimumStay }); return { id };
}

export function createRateRule(user: AuthUser, body: Record<string, unknown>) {
  const propertyId = String(body.propertyId || ""); if (!authorize(user, propertyId, ["manager"])) return null; const db = database(); const roomId = String(body.roomId || ""); const planId = String(body.ratePlanId || ""); const start = String(body.start || ""); const end = String(body.end || ""); const rate = Number(body.nightlyRate);
  if (!db.prepare("SELECT 1 FROM rooms WHERE id=? AND property_id=?").get(roomId, propertyId) || !db.prepare("SELECT 1 FROM rate_plans WHERE id=? AND property_id=?").get(planId, propertyId) || !/^\d{4}-\d{2}-\d{2}$/.test(start) || !/^\d{4}-\d{2}-\d{2}$/.test(end) || end < start || !Number.isFinite(rate) || rate <= 0) throw new Error("Choose a room, plan, valid dates, and nightly rate.");
  const id = uid(); db.prepare("INSERT INTO rate_rules(id,rate_plan_id,room_id,start_date,end_date,nightly_rate_minor) VALUES(?,?,?,?,?,?)").run(id, planId, roomId, start, end, Math.round(rate * 100)); audit(user.id, "rate_rule", id, "create", { propertyId, roomId, planId, start, end }); return { id };
}

export function createTask(user: AuthUser, body: Record<string, unknown>) {
  const propertyId = String(body.propertyId || ""); if (!authorize(user, propertyId, ["manager", "front_desk"])) return null; const type = String(body.type || ""); const note = String(body.note || "").trim(); if (!['housekeeping','maintenance'].includes(type) || !note) throw new Error("Choose a task type and add a note.");
  const id = uid(); database().prepare("INSERT INTO operational_tasks(id,property_id,room_unit_id,type,note,assigned_to,due_at) VALUES(?,?,?,?,?,?,?)").run(id, propertyId, String(body.roomUnitId || "") || null, type, note, String(body.assignedTo || "") || null, String(body.dueAt || "") || null); audit(user.id, "operational_task", id, "create", { propertyId, type }); return { id };
}

export function updateTaskStatus(user: AuthUser, body: Record<string, unknown>) {
  const propertyId = String(body.propertyId || ""); if (!authorize(user, propertyId, ["manager", "front_desk", "housekeeper"])) return null; const status = String(body.status || ""); if (!['open','in_progress','completed'].includes(status)) throw new Error("Invalid task status."); const db = database(); const task = db.prepare("SELECT * FROM operational_tasks WHERE id=? AND property_id=?").get(String(body.taskId || ""), propertyId) as any; if (!task) throw new Error("Task not found."); db.prepare("UPDATE operational_tasks SET status=?,completed_at=? WHERE id=?").run(status, status === "completed" ? new Date().toISOString() : null, task.id); audit(user.id, "operational_task", task.id, "status", { status }); return { id: task.id, status };
}

export function quote(user: AuthUser, body: Record<string, unknown>) {
  const propertyId = String(body.propertyId || ""); if (!authorize(user, propertyId)) return null; const db = database(); const room = db.prepare("SELECT * FROM rooms WHERE id=? AND property_id=?").get(String(body.roomId || ""), propertyId) as any;
  const start = String(body.start || ""); const end = String(body.end || ""); const units = Number(body.units || 1); if (!room || !/^\d{4}-\d{2}-\d{2}$/.test(start) || !/^\d{4}-\d{2}-\d{2}$/.test(end) || end <= start || !Number.isInteger(units) || units < 1) throw new Error("Choose a room, dates and unit count.");
  return quoteStay(db, room, start, end, units);
}

export function upsertStaff(user: AuthUser, body: Record<string, unknown>) {
  const propertyId = String(body.propertyId || ""); if (!authorize(user, propertyId, ["manager"])) return null; const db = database(); const email = String(body.email || "").trim().toLowerCase(); const role = String(body.role || "");
  if (!/^\S+@\S+\.\S+$/.test(email) || !PMS_STAFF_ROLES.includes(role as any)) throw new Error("Enter a valid staff email and role.");
  const staff = db.prepare("SELECT * FROM users WHERE email=? AND role='owner'").get(email) as any; if (!staff) throw new Error("Create the staff account in the management portal first.");
  const id = createStaffMembership(db, propertyId, staff.id, role as any); audit(user.id, "staff_member", id, "upsert", { propertyId, userId: staff.id, role }); return { id };
}
