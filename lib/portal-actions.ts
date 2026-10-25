import { availableUnits, validStayDates } from "./inventory";
﻿import { NextResponse } from "next/server";
import {
  audit,
  uid,
  hashPassword,
  issueSession,
  sessionCookie,
  propertyForOwner,
  roomForOwner,
} from "./platform";
type Row = Record<string, any>;
const respond = (value: unknown, status = 200) =>
  NextResponse.json(value, { status, headers: { "Cache-Control": "no-store" } });
const fail = (error: string, status = 400) => respond({ error }, status);
export function portalData(db: any, user: Row | null, view: string) {
  if (view === "bookings") {
    if (!user || user.role !== "guest") return fail("Guest sign-in required.", 401);
    return respond({
      bookings: db
        .prepare(
          `SELECT b.*,p.name AS property_name,p.address,p.check_in AS arrival_time,p.check_out AS departure_time,r.name AS room_name FROM booking_requests b JOIN properties p ON p.id=b.property_id JOIN rooms r ON r.id=b.room_id WHERE b.guest_id=? ORDER BY b.created_at DESC`
        )
        .all(user.id),
    });
  }
  return null;
}
export function bookingRows(db: any, userId?: string) {
  return db
    .prepare(
      `SELECT b.*,u.name AS guest_name,CASE WHEN b.status IN ('confirmed','checked_in','completed') THEN u.email ELSE '' END AS guest_email,p.name AS property_name,r.name AS room_name FROM booking_requests b JOIN users u ON u.id=b.guest_id JOIN properties p ON p.id=b.property_id JOIN rooms r ON r.id=b.room_id JOIN organisations o ON o.id=p.organisation_id ${userId ? "WHERE o.owner_id=?" : ""} ORDER BY b.created_at DESC`
    )
    .all(...(userId ? [userId] : []));
}
export function extraAction(db: any, user: Row | null, body: Row) {
  const action = String(body.action || "");
  if (action === "register-guest") {
    const name = String(body.name || "").trim(),
      email = String(body.email || "")
        .trim()
        .toLowerCase(),
      phone = String(body.phone || "").trim(),
      password = String(body.password || "");
    if (!name || !/^\S+@\S+\.\S+$/.test(email) || !phone || password.length < 12)
      return fail(
        "Enter your name, email, phone and a password of at least 12 characters."
      );
    if (db.prepare("SELECT 1 FROM users WHERE email=?").get(email))
      return fail("An account with this email already exists.", 409);
    const id = uid();
    db.prepare(
      "INSERT INTO users(id,name,email,phone,password_hash,role) VALUES(?,?,?,?,?,'guest')"
    ).run(id, name, email, phone, hashPassword(password));
    const response = respond(
      { ok: true, user: { id, name, email, phone, role: "guest" } },
      201
    );
    response.cookies.set(sessionCookie(), issueSession(db, id), {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 604800,
    });
    return response;
  }
  if (!user) return null;
  if (action === "request-stay") {
    const property = db
      .prepare(
        `SELECT p.* FROM properties p JOIN organisations o ON o.id=p.organisation_id JOIN users u ON u.id=o.owner_id WHERE p.id=? AND p.status='published' AND o.status='approved' AND u.status='active'`
      )
      .get(String(body.propertyId));
    if (!property) return fail("This listing is not available.", 404);
    const room = db
      .prepare("SELECT * FROM rooms WHERE id=? AND property_id=?")
      .get(String(body.roomId), property.id);
    const start = String(body.start || ""),
      end = String(body.end || ""),
      guests = Number(body.guests),
      rooms = Number(body.rooms || 1);
    const nights = (Date.parse(end) - Date.parse(start)) / 86400000;
    if (
      !room ||
      !validStayDates(start, end) ||
      !/^\d{4}-\d{2}-\d{2}$/.test(start) ||
      !/^\d{4}-\d{2}-\d{2}$/.test(end) ||
      start < new Date().toISOString().slice(0, 10) ||
      !Number.isInteger(nights) ||
      nights < 1 ||
      nights > 365 ||
      !Number.isInteger(guests) ||
      guests < 1 ||
      !Number.isInteger(rooms) ||
      rooms < 1 ||
      rooms > room.units ||
      guests > (room.adult_capacity + room.child_capacity) * rooms
    )
      return fail("Choose valid dates, guests and available rooms.");
    if (
      db
        .prepare("SELECT value FROM platform_settings WHERE key='accepting_requests'")
        .get()?.value === "false"
    )
      return fail("New stay requests are temporarily paused. Please try again later.");
    const duplicate = db
      .prepare(
        "SELECT id FROM booking_requests WHERE guest_id=? AND room_id=? AND check_in=? AND check_out=? AND status IN ('pending','confirmed','checked_in')"
      )
      .get(user.id, room.id, start, end);
    if (duplicate) return respond({ ok: true, id: duplicate.id });
    if (!validStayDates(start, end) || availableUnits(db, room, start, end) < rooms) return fail("Not enough rooms are available for these dates. Choose another room or different dates.", 409);
    const id = uid();
    db.prepare(
      "INSERT INTO booking_requests(id,guest_id,property_id,room_id,check_in,check_out,guests,rooms,total_minor) VALUES(?,?,?,?,?,?,?,?,?)"
    ).run(
      id,
      user.id,
      property.id,
      room.id,
      start,
      end,
      guests,
      rooms,
      room.nightly_rate_minor * nights * rooms
    );
    audit(db, user.id, "booking", id, "request", null, {
      propertyId: property.id,
      start,
      end,
      guests,
    });
    return respond({ ok: true, id }, 201);
  }
  if (action === "booking-status") {
    const booking = db
      .prepare("SELECT * FROM booking_requests WHERE id=?")
      .get(String(body.id));
    if (!booking) return fail("Request not found.", 404);
    const status = String(body.status);
    if (
      user.role === "guest" &&
      (booking.guest_id !== user.id ||
        status !== "cancelled" ||
        !["pending", "confirmed"].includes(booking.status))
    )
      return fail("You cannot change this request.", 403);
    if (user.role === "owner" && !propertyForOwner(db, booking.property_id, user.id))
      return fail("Request not found.", 404);
    const transitions: Record<string, string[]> = {
      pending: ["confirmed", "declined", "cancelled"],
      confirmed: ["checked_in", "cancelled"],
      checked_in: ["completed"],
      completed: [],
      cancelled: [],
      declined: [],
    };
    if (!transitions[booking.status]?.includes(status))
      return fail("This status change is not available.");
    db.exec("BEGIN IMMEDIATE");
    try {
      if (status === "confirmed") {
        const room = db.prepare("SELECT * FROM rooms WHERE id=?").get(booking.room_id);
        if (availableUnits(db, room, booking.check_in, booking.check_out, booking.id) < booking.rooms) {
          db.exec("ROLLBACK");
          return fail("Not enough rooms are available for every night. Choose another room or decline the request.", 409);
        }
      }
      db.prepare("UPDATE booking_requests SET status=? WHERE id=?").run(
        status,
        booking.id
      );
      audit(db, user.id, "booking", booking.id, "status", booking, { status });
      db.exec("COMMIT");
      return respond({ ok: true });
    } catch (error) {
      db.exec("ROLLBACK");
      throw error;
    }
  }
  if (action === "update-rate") {
    const room = roomForOwner(db, String(body.roomId), user.id);
    if (!room) return fail("Room not found.", 404);
    const rate = Number(body.nightlyRate);
    if (!Number.isFinite(rate) || rate <= 0 || rate > 1000000000)
      return fail("Enter a valid nightly price.");
    db.prepare("UPDATE rooms SET nightly_rate_minor=? WHERE id=?").run(
      Math.round(rate * 100),
      room.id
    );
    audit(db, user.id, "room", room.id, "rate", room, { nightlyRate: rate });
    return respond({ ok: true });
  }
  if (action === "user-status") {
    const target = db
      .prepare("SELECT id,role,status FROM users WHERE id=?")
      .get(String(body.id));
    if (!target) return fail("Account not found.", 404);
    if (target.role === "admin")
      return fail("Super administrator accounts cannot be suspended here.");
    const status =
      body.status === "active"
        ? "active"
        : body.status === "suspended"
          ? "suspended"
          : "";
    if (!status) return fail("Choose an account status.");
    db.prepare("UPDATE users SET status=? WHERE id=?").run(status, target.id);
    if (status === "suspended")
      db.prepare("DELETE FROM sessions WHERE user_id=?").run(target.id);
    audit(db, user.id, "user", target.id, "status", target, { status });
    return respond({ ok: true });
  }
  if (action === "property-status") {
    const property = db
      .prepare("SELECT * FROM properties WHERE id=?")
      .get(String(body.id));
    if (!property) return fail("Listing not found.", 404);
    const status = String(body.status);
    if (!["draft", "paused"].includes(status))
      return fail(
        "Select draft or paused. Managers must meet verification checks before publishing."
      );
    if (user.role === "owner" && !propertyForOwner(db, property.id, user.id))
      return fail("Listing not found.", 404);
    db.prepare("UPDATE properties SET status=? WHERE id=?").run(status, property.id);
    audit(db, user.id, "property", property.id, "status", property, { status });
    return respond({ ok: true });
  }
  if (action === "platform-settings") {
    const accepting = body.acceptingRequests === true ? "true" : "false";
    db.prepare(
      "INSERT INTO platform_settings(key,value) VALUES('accepting_requests',?) ON CONFLICT(key) DO UPDATE SET value=excluded.value"
    ).run(accepting);
    audit(db, user.id, "platform", "settings", "update", null, {
      acceptingRequests: accepting === "true",
    });
    return respond({ ok: true });
  }
  return null;
}
