import { randomUUID } from "node:crypto";
import type { Prisma, Property, ReservationStatus } from "@prisma/client";
import { validStayDates } from "../../lib/inventory";
import { signedDownloadUrl, uploadObject } from "../../lib/storage/r2";
import type { AuthUser } from "../auth/auth.service";
import { audit, dateOnly, dateText, moneyMinor, prisma, propertyAccess, roleToApi } from "../data/prisma";
import * as pms from "../pms/pms.service";
import * as properties from "../properties/property.service";
import * as finance from "../finance/finance.service";
import { stripeConfiguration, stripeClient } from "../../lib/payments/stripe";
import { queueNotification } from "../../lib/notifications/service";
import { geocode } from "../../lib/maps/mapbox";

type Row = Record<string, any>;
const text = (value: unknown) => String(value ?? "").trim();
const apiPropertyStatus = (status: string) => status === "APPROVED" ? "published" : status === "SUSPENDED" ? "paused" : "draft";
const apiReservationStatus = (status: string) => ({ REQUESTED: "pending", UPCOMING: "confirmed", CONFIRMED: "confirmed", CHECKED_IN: "checked_in", CHECKED_OUT: "completed", CANCELLED: "cancelled", DECLINED: "declined" }[status] || status.toLowerCase());
const apiOrganisationStatus = (status: string) => status.toLowerCase();
const apiPropertyType = (type: string) => type.toLowerCase();
const publicPhoto = (photo: string) => photo.startsWith("/uploads/") ? `/api/backend${photo}` : photo;
const safeUser = (user: AuthUser) => ({ id: user.id, name: user.name, email: user.email, role: user.role });

const propertyShape = (property: any) => ({
  ...property,
  type: apiPropertyType(property.type), status: apiPropertyStatus(property.status), organisation_id: property.organisationId,
  house_rules: property.rules || "", cancellation_policy: property.cancellationPolicy || "", check_in: property.checkInTime, check_out: property.checkOutTime,
  photos: (property.photos || []).map((item: any) => publicPhoto(typeof item === "string" ? item : item.url)),
  amenities: (property.amenities || []).map((item: any) => item.amenity?.name || item.name || item),
});
const roomShape = (room: any) => ({
  ...room, property_id: room.propertyId, adult_capacity: room.maxAdults, child_capacity: room.maxChildren, beds: room.bedArrangement,
  size_sqm: null, units: room.roomUnits?.length ?? room._count?.roomUnits ?? 0, nightly_rate_minor: moneyMinor(room.basePrice), photos: [], amenities: room.amenities || [],
});
const bookingShape = (booking: any) => ({
  ...booking, guest_id: booking.guestId, property_id: booking.propertyId, room_id: booking.roomCategoryId, room_unit_id: booking.roomUnitId,
  check_in: dateText(booking.checkInDate), check_out: dateText(booking.checkOutDate), guests: booking.adultsCount + booking.childrenCount, rooms: booking.unitsCount,
  total_minor: moneyMinor(booking.totalAmount), status: apiReservationStatus(booking.status), property_name: booking.property?.name, room_name: booking.roomCategory?.name,
  guest_name: booking.guest?.name, guest_email: booking.guest?.email,
});
const organisationShape = (organisation: any) => ({ ...organisation, registration_number: organisation.registrationNumber, licence_number: organisation.licenceNumber, verification_reason: organisation.verificationReason, payout_status: organisation.stripePayoutsReady ? "connected" : "not_connected", owner_name: organisation.memberships?.find((item: any) => item.role === "OWNER")?.user?.name });

async function organisationFor(userId: string) {
  return prisma.organisation.findFirst({ where: { memberships: { some: { userId, role: "OWNER", active: true } } } });
}

async function availableUnits(roomId: string, start: string, end: string, excludeId?: string, tx: Prisma.TransactionClient | typeof prisma = prisma) {
  const room = await tx.roomCategory.findUnique({ where: { id: roomId }, include: { _count: { select: { roomUnits: true } } } });
  if (!room) return 0;
  const [inventory, reservations, holds] = await Promise.all([
    tx.roomInventory.findMany({ where: { roomCategoryId: roomId, date: { gte: dateOnly(start), lt: dateOnly(end) } } }),
    tx.reservation.findMany({ where: { roomCategoryId: roomId, id: excludeId ? { not: excludeId } : undefined, status: { in: ["CONFIRMED", "UPCOMING", "CHECKED_IN"] }, checkInDate: { lt: dateOnly(end) }, checkOutDate: { gt: dateOnly(start) } } }),
    tx.bookingHold.findMany({ where: { roomCategoryId: roomId, reservationId: excludeId ? { not: excludeId } : undefined, expiresAt: { gt: new Date() }, releasedAt: null, convertedAt: null, checkInDate: { lt: dateOnly(end) }, checkOutDate: { gt: dateOnly(start) } } }),
  ]);
  let remaining = room._count.roomUnits;
  for (let cursor = dateOnly(start); cursor < dateOnly(end); cursor = new Date(cursor.getTime() + 86_400_000)) {
    const override = inventory.find((item) => +item.date === +cursor);
    if (override?.closed) return 0;
    const held = holds.filter((item) => item.checkInDate <= cursor && item.checkOutDate > cursor).reduce((sum, item) => sum + item.units, 0);
    const occupied = reservations.filter((item) => item.checkInDate <= cursor && item.checkOutDate > cursor).reduce((sum, item) => sum + item.unitsCount, 0) + held;
    remaining = Math.min(remaining, Math.max(0, Math.min(room._count.roomUnits, override?.unitsAvailable ?? room._count.roomUnits) - occupied));
  }
  return remaining;
}

export function session(user: AuthUser | null) { return { user: user ? safeUser(user) : null }; }

export async function search(query: URLSearchParams) {
  const term = text(query.get("q")), checkIn = text(query.get("checkIn")), checkOut = text(query.get("checkOut"));
  const adults = Math.max(1, Number(query.get("adults") || 2)), children = Math.max(0, Number(query.get("children") || 0)), requestedRooms = Math.max(1, Number(query.get("rooms") || 1));
  if ((checkIn || checkOut) && !validStayDates(checkIn, checkOut)) throw new Error("Choose valid check-in and check-out dates, up to 365 nights.");
  if (![adults, children, requestedRooms].every(Number.isInteger) || adults > 1000 || children > 1000 || requestedRooms > 1000) throw new Error("Choose valid guest and room counts.");
  const propertiesFound = await prisma.property.findMany({
    where: { status: "APPROVED", organisation: { status: "APPROVED" }, latitude: { not: null }, longitude: { not: null }, ...(term ? { OR: [{ name: { contains: term, mode: "insensitive" } }, { address: { contains: term, mode: "insensitive" } }, { city: { contains: term, mode: "insensitive" } }] } : {}) },
    include: { photos: { orderBy: { displayOrder: "asc" } }, amenities: { include: { amenity: true } }, roomCategories: { where: { maxAdults: { gte: Math.ceil(adults / requestedRooms) }, maxChildren: { gte: Math.ceil(children / requestedRooms) } }, include: { roomUnits: { select: { id: true } } } } }, orderBy: [{ createdAt: "desc" }, { id: "desc" }], take: 100,
  });
  const results = [];
  for (const property of propertiesFound) {
    const rooms = [];
    for (const room of property.roomCategories) if (!checkIn || !checkOut || await availableUnits(room.id, checkIn, checkOut) >= requestedRooms) rooms.push(roomShape(room));
    if (rooms.length) results.push({ ...propertyShape(property), rooms });
  }
  return { results };
}

export async function geocodeLocation(searchQuery: string) {
  const query = text(searchQuery);
  if (!query) return { results: [] };

  // 1. Mapbox Geocoding if configured
  if (process.env.MAPBOX_ACCESS_TOKEN) {
    try {
      const results = await geocode(query);
      if (results && results.length) {
        return {
          results: results.map((r) => ({
            id: r.id,
            name: r.name,
            address: r.address,
            latitude: r.latitude,
            longitude: r.longitude,
          })),
        };
      }
    } catch {}
  }

  // 2. OpenStreetMap Nominatim fallback
  try {
    const url = new URL("https://nominatim.openstreetmap.org/search");
    url.searchParams.set("q", query);
    url.searchParams.set("format", "json");
    url.searchParams.set("limit", "5");
    const res = await fetch(url.toString(), {
      headers: { "User-Agent": "VabbotResorts/1.0" },
      signal: AbortSignal.timeout(4000),
    });
    if (res.ok) {
      const data = (await res.json()) as any[];
      if (Array.isArray(data) && data.length) {
        return {
          results: data.map((item) => ({
            id: String(item.place_id || item.osm_id),
            name: item.name || item.display_name.split(",")[0],
            address: item.display_name,
            latitude: parseFloat(item.lat),
            longitude: parseFloat(item.lon),
          })),
        };
      }
    }
  } catch {}

  // 3. Curated UK & Malawi destination catalog fallback
  const curated = [
    { id: "windermere", name: "Windermere", address: "Windermere, Lake District, Cumbria, UK", latitude: 54.3807, longitude: -2.9056 },
    { id: "keswick", name: "Keswick", address: "Keswick, Lake District, Cumbria, UK", latitude: 54.6013, longitude: -3.1347 },
    { id: "ambleside", name: "Ambleside", address: "Ambleside, Cumbria, UK", latitude: 54.4312, longitude: -2.9634 },
    { id: "london", name: "London", address: "London, Greater London, England, UK", latitude: 51.5074, longitude: -0.1278 },
    { id: "lilongwe", name: "Lilongwe", address: "Lilongwe, Central Region, Malawi", latitude: -13.9626, longitude: 33.7741 },
    { id: "blantyre", name: "Blantyre", address: "Blantyre, Southern Region, Malawi", latitude: -15.7861, longitude: 35.0058 },
    { id: "mangochi", name: "Mangochi", address: "Mangochi, Lake Malawi, Southern Region, Malawi", latitude: -14.4782, longitude: 35.2645 },
    { id: "cape-maclear", name: "Cape Maclear", address: "Cape Maclear, Chembe, Lake Malawi National Park, Malawi", latitude: -14.0256, longitude: 34.8494 },
    { id: "salima", name: "Salima", address: "Senga Bay, Salima, Lake Malawi, Central Region, Malawi", latitude: -13.7222, longitude: 34.6186 },
    { id: "mzuzu", name: "Mzuzu", address: "Mzuzu, Northern Region, Malawi", latitude: -11.4581, longitude: 34.0151 },
  ];

  const matched = curated.filter(
    (c) =>
      c.name.toLowerCase().includes(query.toLowerCase()) ||
      c.address.toLowerCase().includes(query.toLowerCase())
  );

  return { results: matched.length ? matched : curated.slice(0, 5) };
}

export async function publicProperty(propertyId: string) {
  const property = await prisma.property.findFirst({ where: { id: propertyId, status: "APPROVED", organisation: { status: "APPROVED" } }, include: { photos: { orderBy: { displayOrder: "asc" } }, amenities: { include: { amenity: true } }, roomCategories: { include: { roomUnits: { select: { id: true } } } } } });
  return property ? { ...propertyShape(property), rooms: property.roomCategories.map(roomShape) } : null;
}

export async function managerWorkspace(user: AuthUser) {
  if (user.role !== "owner") return null;
  const ownedOrganisation = await prisma.organisation.findFirst({ where: { memberships: { some: { userId: user.id, active: true, role: "OWNER" } } }, include: { memberships: { include: { user: true } } } });
  const assignedProperty = ownedOrganisation ? null : await prisma.property.findFirst({ where: { staff: { some: { userId: user.id, active: true } } }, include: { organisation: { include: { memberships: { include: { user: true } } } } } });
  const organisation = ownedOrganisation || assignedProperty?.organisation || null;
  if (!organisation) return { user: safeUser(user), organisation: null, properties: [], rooms: [], documents: [], enquiries: [], bookings: [] };
  const propertyScope = ownedOrganisation ? { organisationId: organisation.id } : { staff: { some: { userId: user.id, active: true } } };
  const [propertyRows, documents, messages, bookings, financials] = await Promise.all([
    prisma.property.findMany({ where: propertyScope, include: { photos: { orderBy: { displayOrder: "asc" } }, amenities: { include: { amenity: true } }, roomCategories: { include: { roomUnits: { select: { id: true } } } } }, orderBy: { createdAt: "desc" } }),
    ownedOrganisation ? prisma.verificationDocument.findMany({ where: { organisationId: organisation.id }, include: { object: true }, orderBy: { createdAt: "desc" } }) : Promise.resolve([]),
    prisma.message.findMany({ where: { property: propertyScope }, include: { property: true, sender: true }, orderBy: { createdAt: "desc" }, take: 100 }),
    prisma.reservation.findMany({ where: { property: propertyScope }, include: { property: true, roomCategory: true, guest: true }, orderBy: { createdAt: "desc" }, take: 100 }),
    finance.financialWorkspace(user),
  ]);
  return { user: safeUser(user), organisation: organisationShape(organisation), properties: propertyRows.map(propertyShape), rooms: propertyRows.flatMap((property) => property.roomCategories.map(roomShape)), documents: documents.map((document) => ({ id: document.id, kind: document.kind, filename: document.filename, created_at: document.createdAt })), enquiries: messages.map((message) => ({ id: message.id, property_id: message.propertyId, property_name: message.property?.name, guest_name: message.sender.name, message: message.content, created_at: message.createdAt })), bookings: bookings.map(bookingShape), finance: financials };
}

export async function adminWorkspace(user: AuthUser) {
  if (user.role !== "admin") return null;
  const [organisations, documents, users, propertiesFound, bookings, settings, logs, financials] = await Promise.all([
    prisma.organisation.findMany({ include: { memberships: { include: { user: true } } }, orderBy: { createdAt: "desc" }, take: 100 }),
    prisma.verificationDocument.findMany({ include: { object: true }, orderBy: { createdAt: "desc" }, take: 100 }),
    prisma.user.findMany({ orderBy: { createdAt: "desc" }, take: 100 }),
    prisma.property.findMany({ include: { organisation: true, photos: true, amenities: { include: { amenity: true } } }, orderBy: { createdAt: "desc" }, take: 100 }),
    prisma.reservation.findMany({ include: { guest: true, property: true, roomCategory: true }, orderBy: { createdAt: "desc" }, take: 100 }),
    prisma.platformSetting.findMany(), prisma.auditLog.findMany({ include: { user: true }, orderBy: { createdAt: "desc" }, take: 100 }),
    finance.financialWorkspace(user),
  ]);
  return { user: safeUser(user), organisations: organisations.map(organisationShape), documents: documents.map((document) => ({ id: document.id, organisation_id: document.organisationId, kind: document.kind, filename: document.filename, created_at: document.createdAt })), users: users.map((item) => ({ id: item.id, name: item.name, email: item.email, phone: item.phone, role: roleToApi(item.role), status: item.accountStatus.toLowerCase(), created_at: item.createdAt })), properties: propertiesFound.map((property) => ({ ...propertyShape(property), organisation_name: property.organisation?.name })), bookings: bookings.map(bookingShape), settings: settings.map((item) => ({ key: item.key, value: String(item.value) })), logs: logs.map((log) => ({ ...log, actor_name: log.user?.name, actor_id: log.userId, entity_type: log.entity, entity_id: log.entityId, after_json: log.details, created_at: log.createdAt })), finance: financials };
}

export async function adminDocument(user: AuthUser, id: string) {
  if (user.role !== "admin") return null;
  const document = await prisma.verificationDocument.findUnique({ where: { id }, include: { object: true } });
  if (!document) return null;
  return { filename: document.filename, mime: document.object.contentType, url: await signedDownloadUrl(document.object.key) };
}

export async function guestBookings(user: AuthUser) {
  if (user.role !== "guest") return null;
  return (await prisma.reservation.findMany({ where: { guestId: user.id }, include: { property: true, roomCategory: true }, orderBy: { createdAt: "desc" }, take: 100 })).map(bookingShape);
}

export async function onboardOwner(user: AuthUser, body: Row) {
  if (user.role === "admin") throw new Error("Administrator accounts cannot own properties.");
  const existing = await organisationFor(user.id); if (existing) return { id: existing.id, status: apiOrganisationStatus(existing.status) };
  const name = text(body.organisationName), type = text(body.organisationType), registrationNumber = text(body.registrationNumber), phone = text(body.phone), address = text(body.address);
  if (!name || !["hotel", "lodge", "guesthouse", "short_term_let"].includes(type)) throw new Error("Enter an organisation name and type.");
  if (!registrationNumber || !phone || !address) throw new Error("Registration number, phone, and business address are required.");
  const organisation = await prisma.$transaction(async (tx) => {
    const created = await tx.organisation.create({ data: { name, type, registrationNumber, licenceNumber: text(body.licenceNumber) || null, phone, email: user.email, address, memberships: { create: { userId: user.id, role: "OWNER" } } } });
    await tx.user.update({ where: { id: user.id }, data: { role: "OWNER", phone } });
    await audit(user, "organisation", created.id, "create", { name, type, status: "pending" }, tx); return created;
  });
  return { id: organisation.id, status: "pending" };
}

export async function requestStay(user: AuthUser, body: Row) {
  if (user.role !== "guest") return null;
  const propertyId = text(body.propertyId), roomId = text(body.roomId), start = text(body.start), end = text(body.end), guests = Number(body.guests), units = Number(body.rooms);
  const accepting = await prisma.platformSetting.findUnique({ where: { key: "accepting_requests" } });
  if (accepting?.value === false) throw new Error("New stay requests are temporarily paused. Please try again later.");
  if (!validStayDates(start, end) || !Number.isInteger(guests) || guests < 1 || !Number.isInteger(units) || units < 1) throw new Error("Choose valid dates, guests, and rooms.");
  return prisma.$transaction(async (tx) => {
    const room = await tx.roomCategory.findFirst({ where: { id: roomId, propertyId, property: { status: "APPROVED", organisation: { status: "APPROVED" } } } });
    if (!room || room.capacity < Math.ceil(guests / units)) throw new Error("That room does not fit this stay.");
    if (await availableUnits(roomId, start, end, undefined, tx) < units) throw new Error("Those rooms are no longer available for the selected dates.");
    const quote = await pms.quoteRoom(roomId, start, end, units);
    const reservation = await tx.reservation.create({ data: { referenceCode: `VR-${Date.now().toString(36).toUpperCase()}-${randomUUID().slice(0, 5).toUpperCase()}`, propertyId, roomCategoryId: roomId, guestId: user.id, status: "REQUESTED", checkInDate: dateOnly(start), checkOutDate: dateOnly(end), adultsCount: guests, unitsCount: units, totalAmount: quote.totalMinor / 100, currency: "GBP" } });
    await audit(user, "booking", reservation.id, "request", { propertyId, roomId, start, end, units }, tx);
    return { id: reservation.id, totalMinor: quote.totalMinor };
  }, { isolationLevel: "Serializable" });
}

const statusToDb: Record<string, ReservationStatus> = { pending: "REQUESTED", confirmed: "CONFIRMED", checked_in: "CHECKED_IN", completed: "CHECKED_OUT", cancelled: "CANCELLED", declined: "DECLINED" };
export async function updateBookingStatus(user: AuthUser, body: Row) {
  const id = text(body.id), requested = text(body.status), next = statusToDb[requested]; if (!next) throw new Error("That booking status change is not allowed.");
  const booking = await prisma.reservation.findUnique({ where: { id } }); if (!booking) throw new Error("Stay request not found.");
  const current = apiReservationStatus(booking.status);
  if (user.role === "guest") { if (booking.guestId !== user.id || !["pending", "confirmed"].includes(current) || requested !== "cancelled") return null; }
  else if (user.role === "owner") {
    if (!(await propertyAccess(user, booking.propertyId, ["OWNER", "MANAGER"]))) return null;
    const transitions: Record<string, string[]> = { pending: ["confirmed", "declined"], confirmed: ["checked_in", "cancelled"], checked_in: ["completed"] };
    if (!transitions[current]?.includes(requested)) throw new Error("That booking status change is not allowed.");
    if (requested === "confirmed" && await availableUnits(booking.roomCategoryId, dateText(booking.checkInDate), dateText(booking.checkOutDate), booking.id) < booking.unitsCount) throw new Error("There is no longer enough inventory to accept this stay.");
  } else return null;
  await prisma.$transaction(async (tx) => { await tx.reservation.update({ where: { id }, data: { status: next } }); await audit(user, "booking", id, "status", { from: current, to: requested }, tx); });
  if (requested === "cancelled") await finance.createRefundRequest(user, id, user.role === "guest" ? "guest" : "property");
  return { id, status: requested };
}

export async function managerAction(user: AuthUser, body: Row) {
  const action = text(body.action); if (action === "onboard-owner") return onboardOwner(user, body);
  const organisation = await organisationFor(user.id); if (user.role !== "owner" || !organisation) return null;
  if (action === "create-property") return properties.createProperty(user, { ...body, organisationId: organisation.id });
  if (action === "update-property") return properties.updateProperty(user, text(body.id), body);
  if (action === "publish-property") return properties.publishProperty(user, text(body.id));
  if (action === "create-room") return pms.createRoomType(user, body);
  if (action === "set-availability") { const room = await prisma.roomCategory.findFirst({ where: { id: text(body.roomId), property: { organisationId: organisation.id } } }); return room ? pms.updateAvailability(user, { ...body, propertyId: room.propertyId }) : null; }
  if (action === "booking-status") return updateBookingStatus(user, body);
  if (action === "update-rate") { const room = await prisma.roomCategory.findFirst({ where: { id: text(body.roomId), property: { organisationId: organisation.id } } }); const rate = Number(body.nightlyRate); if (!room) return null; if (!Number.isFinite(rate) || rate <= 0) throw new Error("Enter a valid nightly rate."); await prisma.roomCategory.update({ where: { id: room.id }, data: { basePrice: rate } }); await audit(user, "room", room.id, "rate", { nightlyRateMinor: Math.round(rate * 100) }); return { id: room.id }; }
  if (action === "property-status") { const property = await prisma.property.findFirst({ where: { id: text(body.id), organisationId: organisation.id } }); const status = text(body.status); if (!property) return null; if (!["draft", "paused"].includes(status)) throw new Error("Invalid listing status."); await prisma.property.update({ where: { id: property.id }, data: { status: status === "paused" ? "SUSPENDED" : "PENDING" } }); await audit(user, "property", property.id, "status", { status }); return { id: property.id, status }; }
  if (action === "upload-document") return uploadDocument(user, organisation.id, body);
  if (action === "request-refund") return finance.createRefundRequest(user, text(body.reservationId), "property");
  if (action === "connect-onboarding") return finance.startConnectOnboarding(user);
  if (action === "run-payouts") return finance.generatePayouts(user, text(body.propertyId));
  throw new Error("Unknown manager action.");
}

export async function adminAction(user: AuthUser, body: Row) {
  if (user.role !== "admin") return null; const action = text(body.action);
  if (action === "user-status") { const target = await prisma.user.findUnique({ where: { id: text(body.id) } }); if (!target) throw new Error("Account not found."); if (target.role === "ADMIN") throw new Error("Super administrator accounts cannot be suspended here."); const status = text(body.status); if (!["active", "suspended"].includes(status)) throw new Error("Choose an account status."); await prisma.$transaction(async (tx) => { await tx.user.update({ where: { id: target.id }, data: { accountStatus: status === "active" ? "ACTIVE" : "SUSPENDED" } }); if (status === "suspended") await tx.session.deleteMany({ where: { userId: target.id } }); await audit(user, "user", target.id, "status", { from: target.accountStatus, to: status }, tx); }); return { id: target.id, status }; }
  if (action === "verify-organisation") { const id = text(body.id), status = text(body.status), reason = text(body.reason); if (!["approved", "rejected", "more_documents"].includes(status)) throw new Error("Invalid verification decision."); if (status !== "approved" && !reason) throw new Error("A reason is required."); const organisation = await prisma.organisation.findUnique({ where: { id }, include: { verificationDocuments: true } }); if (!organisation) throw new Error("Organisation not found."); if (status === "approved" && !["business_registration", "proof_of_address", "owner_id"].every((kind) => organisation.verificationDocuments.some((document) => document.kind === kind))) throw new Error("Business registration, proof of address and owner ID are required."); await prisma.$transaction(async (tx) => { await tx.organisation.update({ where: { id }, data: { status: status.toUpperCase(), verificationReason: reason || null } }); await audit(user, "organisation", id, "verification", { from: organisation.status, status, reason }, tx); }); return { id, status }; }
  if (action === "property-status") { const id = text(body.id), status = text(body.status), property = await prisma.property.findUnique({ where: { id } }); if (!property) throw new Error("Listing not found."); if (!["draft", "paused"].includes(status)) throw new Error("Select draft or paused."); await prisma.property.update({ where: { id }, data: { status: status === "paused" ? "SUSPENDED" : "PENDING" } }); await audit(user, "property", id, "status", { from: property.status, to: status }); return { id, status }; }
  if (action === "booking-status") { const id = text(body.id), status = text(body.status), booking = await prisma.reservation.findUnique({ where: { id } }); if (!booking) throw new Error("Stay request not found."); if (status !== "cancelled" || !["REQUESTED", "CONFIRMED", "UPCOMING"].includes(booking.status)) throw new Error("That booking status change is not allowed."); await prisma.reservation.update({ where: { id }, data: { status: "CANCELLED" } }); await audit(user, "booking", id, "status", { from: booking.status, to: "cancelled" }); return { id, status: "cancelled" }; }
  if (action === "request-refund") return finance.createRefundRequest(user, text(body.reservationId), "platform");
  if (action === "process-refund") return finance.processRefund(user, text(body.id));
  if (action === "commission-setting") return finance.updateCommission(user, { propertyId: text(body.propertyId), percentage: Number(body.percentage), schedule: text(body.schedule), reserveDays: Number(body.reserveDays) });
  if (action === "generate-payouts") return finance.generatePayouts(user);
  if (action === "process-payout") return finance.processPayout(user, text(body.id));
  if (action === "platform-settings") { const acceptingRequests = body.acceptingRequests === true; await prisma.platformSetting.upsert({ where: { key: "accepting_requests" }, update: { value: acceptingRequests }, create: { key: "accepting_requests", value: acceptingRequests } }); await audit(user, "platform", "settings", "update", { acceptingRequests }); return { acceptingRequests }; }
  throw new Error("Unknown administrator action.");
}

async function uploadDocument(user: AuthUser, organisationId: string, body: Row) {
  const kind = text(body.kind), filename = text(body.filename).slice(0, 120), mime = text(body.mime), allowedKinds = ["business_registration", "proof_of_address", "owner_id", "accommodation_licence"];
  if (!allowedKinds.includes(kind)) return null; if (!["application/pdf", "image/jpeg", "image/png"].includes(mime)) throw new Error("Upload a PDF, JPEG or PNG up to 5 MB.");
  const encoded = text(body.base64).replace(/^data:[^;]+;base64,/, ""), bytes = Buffer.from(encoded, "base64"); if (!filename || !encoded || !bytes.length || bytes.length > 5_000_000) throw new Error("Upload a PDF, JPEG or PNG up to 5 MB.");
  const stored = await uploadObject({ folder: "verification", filename: `${organisationId}-${filename}`, contentType: mime, body: bytes, private: true });
  const document = await prisma.$transaction(async (tx) => { const object = await tx.storedObject.create({ data: { key: stored.key, bucket: stored.bucket, purpose: "VERIFICATION_DOCUMENT", contentType: mime, sizeBytes: BigInt(stored.sizeBytes), isPrivate: true, uploadedById: user.id } }); const created = await tx.verificationDocument.create({ data: { organisationId, objectId: object.id, kind, filename } }); await audit(user, "document", created.id, "upload", { kind, filename }, tx); return created; });
  return { id: document.id };
}

export async function createCheckoutSession(user: AuthUser, body: Row) {
  if (user.role !== "guest") return null;
  const bookingId = text(body.bookingId);
  const booking = await prisma.reservation.findFirst({
    where: { id: bookingId, guestId: user.id },
    include: { property: true, roomCategory: true },
  });
  if (!booking) throw new Error("Reservation not found.");
  if (!["REQUESTED", "UPCOMING", "CONFIRMED"].includes(booking.status)) {
    throw new Error("This reservation is not awaiting payment.");
  }

  // 1. Create or refresh a 15-minute temporary room hold lock
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000);
  await prisma.bookingHold.deleteMany({
    where: { reservationId: booking.id, convertedAt: null },
  });
  const hold = await prisma.bookingHold.create({
    data: {
      reservationId: booking.id,
      propertyId: booking.propertyId,
      roomCategoryId: booking.roomCategoryId,
      guestId: user.id,
      checkInDate: booking.checkInDate,
      checkOutDate: booking.checkOutDate,
      units: booking.unitsCount,
      expiresAt,
    },
  });

  // 2. Stripe Checkout session or development fallback
  const origin = text(body.origin) || "http://localhost:3000";
  const successUrl = `${origin}/bookings/success?session_id={CHECKOUT_SESSION_ID}&booking_id=${booking.id}`;
  const cancelUrl = `${origin}/bookings/cancelled?booking_id=${booking.id}`;

  const stripeConfig = stripeConfiguration();
  if (stripeConfig) {
    const stripe = stripeClient(stripeConfig);
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: "gbp",
            product_data: {
              name: `${booking.property.name} - ${booking.roomCategory.name}`,
              description: `Reservation ${booking.referenceCode} (${dateText(booking.checkInDate)} to ${dateText(booking.checkOutDate)})`,
            },
            unit_amount: moneyMinor(booking.totalAmount),
          },
          quantity: 1,
        },
      ],
      metadata: {
        reservation_id: booking.id,
        booking_hold_id: hold.id,
        guest_id: user.id,
      },
      success_url: successUrl,
      cancel_url: cancelUrl,
    });
    return { ok: true, checkoutUrl: session.url, holdExpiresAt: expiresAt };
  } else {
    // Development / mock checkout URL directly redirecting to success
    const mockSessionId = `mock_sess_${Date.now().toString(36)}`;
    const devUrl = `${origin}/bookings/success?session_id=${mockSessionId}&booking_id=${booking.id}&dev_mode=true`;
    return { ok: true, checkoutUrl: devUrl, holdExpiresAt: expiresAt };
  }
}

export async function confirmBookingPayment(user: AuthUser, body: Row) {
  const bookingId = text(body.bookingId);
  const sessionId = text(body.sessionId);
  const booking = await prisma.reservation.findFirst({
    where: { id: bookingId, guestId: user.id },
    include: { property: true, roomCategory: true, payments: true, invoices: true },
  });
  if (!booking) throw new Error("Reservation not found.");

  // Mark hold as converted
  await prisma.bookingHold.updateMany({
    where: { reservationId: booking.id, convertedAt: null },
    data: { convertedAt: new Date() },
  });

  // Update reservation to CONFIRMED
  const updated = await prisma.reservation.update({
    where: { id: booking.id },
    data: { status: "CONFIRMED" },
  });

  // Create payment record if not exists
  let payment = booking.payments[0];
  if (!payment) {
    payment = await prisma.payment.create({
      data: {
        reservationId: booking.id,
        amount: booking.totalAmount,
        currency: "GBP",
        status: "COMPLETED",
        providerPaymentId: sessionId || `pay_${Date.now()}`,
        paidAt: new Date(),
      },
    });
  }

  // Create invoice if not exists
  let invoice = booking.invoices[0];
  if (!invoice) {
    const invNum = `INV-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const total = Number(booking.totalAmount);
    const subtotal = total / 1.1; // 10% tax breakdown
    const tax = total - subtotal;
    invoice = await prisma.invoice.create({
      data: {
        invoiceNumber: invNum,
        reservationId: booking.id,
        propertyId: booking.propertyId,
        subtotal,
        taxAmount: tax,
        totalAmount: total,
        status: "PAID",
        paidAt: new Date(),
      },
    });
  }

  // Queue confirmation notification
  await queueNotification({
    userId: user.id,
    type: "BOOKING_CONFIRMED",
    title: `Booking Confirmed: ${booking.property.name}`,
    body: `Your stay (${dateText(booking.checkInDate)} - ${dateText(booking.checkOutDate)}) at ${booking.property.name} is confirmed. Ref: ${booking.referenceCode}.`,
    email: user.email,
  });

  return { ok: true, booking: updated, invoiceNumber: invoice.invoiceNumber };
}

export async function sendMessage(user: AuthUser, body: Row) {
  const propertyId = text(body.propertyId);
  const reservationId = text(body.reservationId) || undefined;
  const content = text(body.content);
  if (!content) throw new Error("Message content is required.");

  let recipientId = text(body.recipientId);
  if (!recipientId) {
    if (user.role === "guest") {
      const propStaff = await prisma.propertyStaff.findFirst({
        where: { propertyId, role: { in: ["OWNER", "MANAGER"] } },
        select: { userId: true },
      });
      if (propStaff) recipientId = propStaff.userId;
      else {
        const orgOwner = await prisma.organisationMembership.findFirst({
          where: { organisation: { properties: { some: { id: propertyId } } }, role: "OWNER" },
          select: { userId: true },
        });
        if (orgOwner) recipientId = orgOwner.userId;
      }
    } else {
      if (reservationId) {
        const res = await prisma.reservation.findUnique({ where: { id: reservationId }, select: { guestId: true } });
        if (res) recipientId = res.guestId;
      }
    }
  }

  if (!recipientId) recipientId = user.id;

  const message = await prisma.message.create({
    data: {
      propertyId: propertyId || null,
      reservationId: reservationId || null,
      senderId: user.id,
      recipientId,
      content,
      isRead: false,
    },
    include: {
      sender: { select: { id: true, name: true, role: true } },
      property: { select: { id: true, name: true } },
    },
  });

  const recipient = await prisma.user.findUnique({ where: { id: recipientId } });
  if (recipient) {
    await queueNotification({
      userId: recipientId,
      type: "NEW_MESSAGE",
      title: `New message from ${user.name}`,
      body: content.slice(0, 100),
      email: recipient.email,
    });
  }

  return { ok: true, message };
}

export async function getMessages(user: AuthUser, query: URLSearchParams) {
  const propertyId = text(query.get("propertyId"));
  const reservationId = text(query.get("reservationId"));

  const where: Prisma.MessageWhereInput = {
    OR: [
      { senderId: user.id },
      { recipientId: user.id },
    ],
  };
  if (propertyId) where.propertyId = propertyId;
  if (reservationId) where.reservationId = reservationId;

  const list = await prisma.message.findMany({
    where,
    include: {
      sender: { select: { id: true, name: true, role: true } },
      property: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: "asc" },
    take: 100,
  });

  return list.map((m) => ({
    id: m.id,
    property_id: m.propertyId,
    property_name: m.property?.name,
    reservation_id: m.reservationId,
    sender_id: m.senderId,
    sender_name: m.sender.name,
    is_me: m.senderId === user.id,
    content: m.content,
    created_at: m.createdAt,
  }));
}

export async function getUserNotifications(user: AuthUser) {
  return prisma.notification.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 20,
    select: {
      id: true,
      type: true,
      title: true,
      body: true,
      readAt: true,
      createdAt: true,
    },
  });
}

export async function markNotificationsRead(user: AuthUser) {
  await prisma.notification.updateMany({
    where: { userId: user.id, readAt: null },
    data: { readAt: new Date() },
  });
  return { ok: true };
}

export async function getInvoiceData(user: AuthUser, query: URLSearchParams) {
  const bookingId = text(query.get("bookingId"));
  const booking = await prisma.reservation.findFirst({
    where: {
      id: bookingId,
      OR: [
        { guestId: user.id },
        { property: { staff: { some: { userId: user.id } } } },
        { property: { organisation: { memberships: { some: { userId: user.id } } } } },
      ],
    },
    include: {
      property: true,
      roomCategory: true,
      guest: true,
      payments: true,
      invoices: true,
    },
  });
  if (!booking) return null;

  const invoice = booking.invoices[0];
  const payment = booking.payments[0];
  const total = Number(booking.totalAmount);
  const subtotal = invoice ? Number(invoice.subtotal) : total / 1.1;
  const tax = invoice ? Number(invoice.taxAmount) : total - subtotal;

  return {
    invoiceNumber: invoice?.invoiceNumber || `INV-${new Date(booking.createdAt).getFullYear()}-${booking.referenceCode.slice(-4)}`,
    referenceCode: booking.referenceCode,
    issueDate: dateText(invoice?.issuedAt || booking.createdAt),
    paidDate: invoice?.paidAt ? dateText(invoice.paidAt) : payment?.paidAt ? dateText(payment.paidAt) : null,
    status: (invoice?.status || (booking.status === "CONFIRMED" ? "PAID" : "PENDING")).toUpperCase(),
    propertyName: booking.property.name,
    propertyAddress: booking.property.address || "United Kingdom",
    propertyPhone: booking.property.contactPhone || "+44 15394 42200",
    propertyEmail: booking.property.contactEmail || "billing@vabbot.com",
    guestName: booking.guest.name,
    guestEmail: booking.guest.email,
    checkIn: dateText(booking.checkInDate),
    checkOut: dateText(booking.checkOutDate),
    roomName: booking.roomCategory.name,
    unitsCount: booking.unitsCount,
    adultsCount: booking.adultsCount,
    currency: booking.currency,
    subtotal: subtotal.toFixed(2),
    taxAmount: tax.toFixed(2),
    totalAmount: total.toFixed(2),
    paymentMethod: payment?.providerPaymentId?.startsWith("mock_") ? "Card Payment (Test Mode)" : "Card / Stripe Checkout",
  };
}
