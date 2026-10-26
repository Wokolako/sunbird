import { randomUUID } from "node:crypto";
import { database } from "../database";
import type { AuthUser } from "../auth/auth.service";
import { pmsAccess } from "../../lib/pms";

const uid = () => randomUUID().replaceAll("-", "");
const text = (value: unknown) => String(value ?? "").trim();
const propertyTypes = ["hotel", "lodge", "guesthouse", "short_term_let"];
const audit = (actorId: string, id: string, action: string, after: unknown) => database().prepare("INSERT INTO audit_log(id,actor_id,entity_type,entity_id,action,after_json) VALUES(?,?,?,?,?,?)").run(uid(), actorId, "property", id, action, JSON.stringify(after));

function ownsOrganisation(user: AuthUser, organisationId: string) {
  return Boolean(database().prepare("SELECT 1 FROM organisations WHERE id=? AND owner_id=?").get(organisationId, user.id));
}
function checkDetails(body: Record<string, unknown>) {
  const latitude = body.latitude === "" || body.latitude == null ? null : Number(body.latitude); const longitude = body.longitude === "" || body.longitude == null ? null : Number(body.longitude);
  if (latitude !== null && (!Number.isFinite(latitude) || latitude < -90 || latitude > 90)) throw new Error("Latitude is invalid.");
  if (longitude !== null && (!Number.isFinite(longitude) || longitude < -180 || longitude > 180)) throw new Error("Longitude is invalid.");
  const images = Array.isArray(body.photos) ? body.photos.map(text).filter((url) => /^\/uploads\/[a-f0-9-]+\.(jpg|png|webp)$/.test(url)).slice(0, 40) : [];
  return { description: text(body.description), address: text(body.address), latitude, longitude, photos: JSON.stringify(images), amenities: JSON.stringify(Array.isArray(body.amenities) ? body.amenities.map(text).filter(Boolean).slice(0, 80) : []), accessibility: text(body.accessibility), languages: text(body.languages), houseRules: text(body.houseRules), cancellationPolicy: text(body.cancellationPolicy), checkIn: text(body.checkIn) || "14:00", checkOut: text(body.checkOut) || "10:00", bookingMode: body.bookingMode === "instant" ? "instant" : "request" };
}

export function createProperty(user: AuthUser, body: Record<string, unknown>) {
  if (user.role !== "owner") return null;
  const organisationId = text(body.organisationId); const name = text(body.name); const type = text(body.type);
  if (!ownsOrganisation(user, organisationId)) return null;
  if (!name || !propertyTypes.includes(type)) throw new Error("Enter a hotel name and valid property type.");
  const id = uid(); database().prepare("INSERT INTO properties(id,organisation_id,name,type) VALUES(?,?,?,?)").run(id, organisationId, name, type); audit(user.id, id, "create", { organisationId, name, type }); return { id };
}

export function updateProperty(user: AuthUser, propertyId: string, body: Record<string, unknown>) {
  const db = database(); const property = db.prepare("SELECT * FROM properties WHERE id=?").get(propertyId) as any;
  if (!property || !pmsAccess(db, user, propertyId, ["manager"])) return null;
  const details = checkDetails(body); const name = text(body.name) || property.name;
  db.prepare(`UPDATE properties SET name=?,description=?,address=?,latitude=?,longitude=?,photos=?,amenities=?,accessibility=?,languages=?,house_rules=?,cancellation_policy=?,check_in=?,check_out=?,booking_mode=? WHERE id=?`).run(name, details.description, details.address, details.latitude, details.longitude, details.photos, details.amenities, details.accessibility, details.languages, details.houseRules, details.cancellationPolicy, details.checkIn, details.checkOut, details.bookingMode, propertyId);
  audit(user.id, propertyId, "update", { name, ...details }); return { id: propertyId };
}

export function publishProperty(user: AuthUser, propertyId: string) {
  const db = database(); const property = db.prepare("SELECT * FROM properties WHERE id=?").get(propertyId) as any;
  if (!property || !pmsAccess(db, user, propertyId, ["manager"])) return null;
  const organisation = db.prepare("SELECT * FROM organisations WHERE id=?").get(property.organisation_id) as any;
  const rooms = db.prepare("SELECT COUNT(*) AS count FROM rooms WHERE property_id=?").get(propertyId) as any;
  if (organisation?.status !== "approved") throw new Error("The hotel organisation must be verified before publication.");
  if (!property.description || !property.address || property.latitude == null || property.longitude == null || !property.house_rules || !property.cancellation_policy || JSON.parse(property.photos).length < 5 || !rooms.count) throw new Error("Add address, map pin, description, rules, policy, five images, and at least one room type before publishing.");
  db.prepare("UPDATE properties SET status='published' WHERE id=?").run(propertyId); audit(user.id, propertyId, "publish", { status: "published" }); return { id: propertyId, status: "published" };
}
