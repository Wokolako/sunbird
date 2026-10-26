import { NextRequest, NextResponse } from "next/server";
import { audit, currentUser, database, hashPassword, uid } from "@/lib/platform";
import { PMS_STAFF_ROLES, createStaffMembership, pmsAccess, pmsReport, quoteStay } from "@/lib/pms";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const reply = (data: unknown, status = 200) => NextResponse.json(data, { status, headers: { "Cache-Control": "no-store" } });
const fail = (error: string, status = 400) => reply({ error }, status);
const text = (value: unknown) => String(value ?? "").trim();
const date = (value: string) => /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : "";
const sameOrigin = (request: NextRequest) => !request.headers.get("origin") || request.headers.get("origin") === new URL(request.url).origin;

async function access(propertyId: string, roles?: (typeof PMS_STAFF_ROLES)[number][]) {
  const user = await currentUser();
  if (!user) return { error: fail("Manager sign-in required.", 401) };
  const db = database();
  const permission = pmsAccess(db, user, propertyId, roles);
  return permission ? { db, user, permission } : { error: fail("You do not have access to this property.", 403) };
}

export async function GET(request: NextRequest) {
  const propertyId = text(request.nextUrl.searchParams.get("propertyId"));
  const view = text(request.nextUrl.searchParams.get("view")) || "dashboard";
  const result = await access(propertyId);
  if ("error" in result) return result.error;
  const { db, permission } = result;
  if (view === "dashboard") {
    const today = new Date().toISOString().slice(0, 10);
    const end = new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10);
    return reply({ permission, report: pmsReport(db, propertyId, today, end),
      arrivals: db.prepare("SELECT b.*,u.name AS guest_name,r.name AS room_name FROM booking_requests b JOIN users u ON u.id=b.guest_id JOIN rooms r ON r.id=b.room_id WHERE b.property_id=? AND b.check_in=? AND b.status IN ('confirmed','checked_in')").all(propertyId, today),
      departures: db.prepare("SELECT b.*,u.name AS guest_name,r.name AS room_name FROM booking_requests b JOIN users u ON u.id=b.guest_id JOIN rooms r ON r.id=b.room_id WHERE b.property_id=? AND b.check_out=? AND b.status='checked_in'").all(propertyId, today),
      units: db.prepare("SELECT ru.*,r.name AS room_name FROM room_units ru JOIN rooms r ON r.id=ru.room_id WHERE r.property_id=? ORDER BY r.name,ru.label").all(propertyId),
      tasks: db.prepare("SELECT t.*,ru.label AS unit_label FROM operational_tasks t LEFT JOIN room_units ru ON ru.id=t.room_unit_id WHERE t.property_id=? AND t.status!='completed' ORDER BY t.created_at DESC").all(propertyId),
    });
  }
  if (view === "calendar") {
    const roomId = text(request.nextUrl.searchParams.get("roomId"));
    const start = date(text(request.nextUrl.searchParams.get("start"))); const end = date(text(request.nextUrl.searchParams.get("end")));
    const room = db.prepare("SELECT r.* FROM rooms r WHERE r.id=? AND r.property_id=?").get(roomId, propertyId);
    if (!room || !start || !end || end < start) return fail("Choose a room and valid date range.");
    return reply({ room, availability: db.prepare("SELECT * FROM availability WHERE room_id=? AND night>=? AND night<=? ORDER BY night").all(roomId, start, end),
      rates: db.prepare("SELECT rr.*,rp.name AS rate_plan_name,rp.minimum_stay,rp.tax_bps,rp.service_fee_minor FROM rate_rules rr JOIN rate_plans rp ON rp.id=rr.rate_plan_id WHERE rr.room_id=? AND rr.end_date>=? AND rr.start_date<=? ORDER BY rr.start_date").all(roomId, start, end) });
  }
  return fail("Unknown PMS view.", 404);
}

export async function POST(request: NextRequest) {
  if (!sameOrigin(request)) return fail("Cross-origin request blocked.", 403);
  let body: Record<string, any>; try { body = await request.json(); } catch { return fail("Valid JSON is required."); }
  const action = text(body.action); const propertyId = text(body.propertyId);
  const restricted = action === "set-unit-status" || action === "update-task-status" || action === "assign-unit";
  const result = await access(propertyId, restricted ? ["manager", "front_desk", "housekeeper"] : ["manager", "front_desk"]);
  if ("error" in result) return result.error;
  const { db, user, permission } = result;
  if (action === "assign-unit" && !["owner", "admin", "manager", "front_desk"].includes(permission.role)) return fail("Front-desk permission required.", 403);
  if (["create-staff", "create-unit", "create-rate-plan", "set-rate-rule"].includes(action) && permission.role !== "owner" && permission.role !== "manager") return fail("Manager permission required.", 403);
  if (action === "create-staff") {
    const email = text(body.email).toLowerCase(); const role = text(body.role);
    if (!/^\S+@\S+\.\S+$/.test(email) || !PMS_STAFF_ROLES.includes(role as any)) return fail("Enter a valid staff email and role.");
    let staff = db.prepare("SELECT * FROM users WHERE email=?").get(email);
    if (staff && staff.role !== "owner") return fail("This account cannot be added as property staff.");
    if (!staff) {
      const name = text(body.name); const password = text(body.password);
      if (!name || password.length < 12) return fail("A name and temporary password of at least 12 characters are required.");
      staff = { id: uid(), name, email, phone: text(body.phone), role: "owner" };
      db.prepare("INSERT INTO users(id,name,email,phone,password_hash,role) VALUES(?,?,?,?,?, 'owner')").run(staff.id, name, email, staff.phone, hashPassword(password));
    }
    const id = createStaffMembership(db, propertyId, staff.id, role as any);
    audit(db, user.id, "staff_member", id, "upsert", null, { propertyId, userId: staff.id, role });
    return reply({ ok: true, id }, 201);
  }
  if (action === "create-unit") {
    const roomId = text(body.roomId); const label = text(body.label); const floor = text(body.floor);
    const room = db.prepare("SELECT id FROM rooms WHERE id=? AND property_id=?").get(roomId, propertyId);
    if (!room || !label) return fail("Choose a room type and unit label.");
    const id = uid(); db.prepare("INSERT INTO room_units(id,room_id,label,floor) VALUES(?,?,?,?)").run(id, roomId, label, floor);
    audit(db, user.id, "room_unit", id, "create", null, { roomId, label, floor }); return reply({ ok: true, id }, 201);
  }
  if (action === "set-unit-status") {
    const unitId = text(body.unitId); const status = text(body.status);
    if (!["vacant","occupied","dirty","cleaning","maintenance","blocked"].includes(status)) return fail("Invalid room-unit status.");
    const unit = db.prepare("SELECT ru.* FROM room_units ru JOIN rooms r ON r.id=ru.room_id WHERE ru.id=? AND r.property_id=?").get(unitId, propertyId);
    if (!unit) return fail("Room unit not found."); db.prepare("UPDATE room_units SET status=? WHERE id=?").run(status, unitId);
    audit(db, user.id, "room_unit", unitId, "status", { status: unit.status }, { status }); return reply({ ok: true });
  }
  if (action === "create-rate-plan") {
    const name = text(body.name); const minimumStay = Number(body.minimumStay || 1); const taxBps = Number(body.taxBps || 0); const fee = Number(body.serviceFee || 0);
    if (!name || !Number.isInteger(minimumStay) || minimumStay < 1 || minimumStay > 365 || !Number.isInteger(taxBps) || taxBps < 0 || taxBps > 10000 || !Number.isFinite(fee) || fee < 0) return fail("Enter valid rate-plan values.");
    const id = uid(); db.prepare("INSERT INTO rate_plans(id,property_id,name,minimum_stay,tax_bps,service_fee_minor) VALUES(?,?,?,?,?,?)").run(id, propertyId, name, minimumStay, taxBps, Math.round(fee * 100));
    audit(db, user.id, "rate_plan", id, "create", null, { propertyId, name, minimumStay, taxBps, serviceFeeMinor: Math.round(fee * 100) }); return reply({ ok: true, id }, 201);
  }
  if (action === "set-rate-rule") {
    const roomId = text(body.roomId); const planId = text(body.ratePlanId); const start = date(text(body.start)); const end = date(text(body.end)); const rate = Number(body.nightlyRate);
    const room = db.prepare("SELECT id FROM rooms WHERE id=? AND property_id=?").get(roomId, propertyId); const plan = db.prepare("SELECT id FROM rate_plans WHERE id=? AND property_id=?").get(planId, propertyId);
    if (!room || !plan || !start || !end || end < start || !Number.isFinite(rate) || rate <= 0) return fail("Enter a room, plan, valid dates and nightly price.");
    const id = uid(); db.prepare("INSERT INTO rate_rules(id,rate_plan_id,room_id,start_date,end_date,nightly_rate_minor) VALUES(?,?,?,?,?,?)").run(id, planId, roomId, start, end, Math.round(rate * 100));
    audit(db, user.id, "rate_rule", id, "create", null, { planId, roomId, start, end, nightlyRateMinor: Math.round(rate * 100) }); return reply({ ok: true, id }, 201);
  }
  if (action === "create-task") {
    const type = text(body.type); const unitId = text(body.unitId) || null; const note = text(body.note); if (!["housekeeping","maintenance"].includes(type) || !note) return fail("Choose a task type and add a note.");
    const id = uid(); db.prepare("INSERT INTO operational_tasks(id,property_id,room_unit_id,type,note,assigned_to,due_at) VALUES(?,?,?,?,?,?,?)").run(id, propertyId, unitId, type, note, text(body.assignedTo) || null, text(body.dueAt) || null);
    audit(db, user.id, "operational_task", id, "create", null, { propertyId, type, unitId }); return reply({ ok: true, id }, 201);
  }
  if (action === "update-task-status") {
    const taskId = text(body.taskId); const status = text(body.status); if (!["open","in_progress","completed"].includes(status)) return fail("Invalid task status.");
    const task = db.prepare("SELECT * FROM operational_tasks WHERE id=? AND property_id=?").get(taskId, propertyId); if (!task) return fail("Task not found.");
    db.prepare("UPDATE operational_tasks SET status=?,completed_at=? WHERE id=?").run(status, status === "completed" ? new Date().toISOString() : null, taskId); audit(db, user.id, "operational_task", taskId, "status", { status: task.status }, { status }); return reply({ ok: true });
  }
  if (action === "assign-unit") {
    const bookingId = text(body.bookingId); const unitId = text(body.unitId); const booking = db.prepare("SELECT * FROM booking_requests WHERE id=? AND property_id=? AND status IN ('confirmed','checked_in')").get(bookingId, propertyId); const unit = db.prepare("SELECT ru.* FROM room_units ru JOIN rooms r ON r.id=ru.room_id WHERE ru.id=? AND r.property_id=?").get(unitId, propertyId);
    if (!booking || !unit || unit.room_id !== booking.room_id) return fail("Choose a valid booking and matching room unit.");
    db.prepare("UPDATE booking_requests SET room_unit_id=? WHERE id=?").run(unitId, bookingId); audit(db, user.id, "booking", bookingId, "assign_unit", { roomUnitId: booking.room_unit_id }, { roomUnitId: unitId }); return reply({ ok: true });
  }
  if (action === "quote") {
    const room = db.prepare("SELECT * FROM rooms WHERE id=? AND property_id=?").get(text(body.roomId), propertyId); const start = date(text(body.start)); const end = date(text(body.end)); const units = Number(body.units || 1); if (!room || !start || !end || end <= start || !Number.isInteger(units) || units < 1) return fail("Choose a room, dates and unit count.");
    try { return reply(quoteStay(db, room, start, end, units)); } catch (error) { return fail(error instanceof Error ? error.message : "Could not calculate quote."); }
  }
  return fail("Unknown PMS action.", 404);
}
