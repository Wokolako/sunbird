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
