import { randomUUID } from "node:crypto";
import type { PropertyType } from "@prisma/client";
import type { AuthUser } from "../auth/auth.service";
import { audit, prisma, propertyAccess, slugify } from "../data/prisma";

const text = (value: unknown) => String(value ?? "").trim();
const typeMap: Record<string, PropertyType> = {
  hotel: "HOTEL",
  lodge: "LODGE",
  guesthouse: "GUESTHOUSE",
  short_term_let: "SHORT_TERM_LET",
};

function isAllowedImage(url: string) {
  if (/^\/uploads\/[a-f0-9-]+\.(jpg|png|webp)$/.test(url) || /^\/assets\/[a-zA-Z0-9_.-]+\.(jpg|jpeg|png|webp)$/.test(url)) return true;
  const publicBase = process.env.R2_PUBLIC_BASE_URL;
  if (!publicBase) return false;
  try {
    const image = new URL(url);
    const base = new URL(publicBase);
    return image.protocol === "https:" && image.origin === base.origin;
  } catch { return false; }
}

function details(body: Record<string, unknown>) {
  const latitude = body.latitude === "" || body.latitude == null ? null : Number(body.latitude);
  const longitude = body.longitude === "" || body.longitude == null ? null : Number(body.longitude);
  if (latitude !== null && (!Number.isFinite(latitude) || latitude < -90 || latitude > 90)) throw new Error("Latitude is invalid.");
  if (longitude !== null && (!Number.isFinite(longitude) || longitude < -180 || longitude > 180)) throw new Error("Longitude is invalid.");
  const photos = Array.isArray(body.photos) ? body.photos.map(text).map((url) => url.replace(/^\/api\/backend/, "")).filter(isAllowedImage).slice(0, 40) : [];
  const amenities = Array.isArray(body.amenities) ? body.amenities.map(text).filter(Boolean).slice(0, 80) : [];
  return { latitude, longitude, photos, amenities };
}

export async function createProperty(user: AuthUser, body: Record<string, unknown>) {
  if (user.role !== "owner") return null;
  const organisationId = text(body.organisationId);
  const name = text(body.name);
  const type = typeMap[text(body.type)];
  const membership = await prisma.organisationMembership.findFirst({ where: { organisationId, userId: user.id, active: true, role: "OWNER" } });
  if (!membership) return null;
  if (!name || !type) throw new Error("Enter a hotel name and valid property type.");
  const property = await prisma.$transaction(async (tx) => {
    const created = await tx.property.create({ data: { organisationId, name, slug: `${slugify(name)}-${randomUUID().slice(0, 8)}`, type, description: "", address: "", city: "", stateOrRegion: "", country: "United Kingdom", status: "PENDING" } });
    await tx.propertyStaff.create({ data: { propertyId: created.id, userId: user.id, role: "OWNER" } });
    await audit(user, "property", created.id, "create", { organisationId, name, type }, tx);
    return created;
  });
  return { id: property.id };
}

export async function updateProperty(user: AuthUser, propertyId: string, body: Record<string, unknown>) {
  if (!(await propertyAccess(user, propertyId, ["OWNER", "MANAGER"]))) return null;
  const current = await prisma.property.findUnique({ where: { id: propertyId } });
  if (!current) return null;
  const parsed = details(body);
  const name = text(body.name) || current.name;
  await prisma.$transaction(async (tx) => {
    await tx.property.update({ where: { id: propertyId }, data: {
      name,
      description: text(body.description), address: text(body.address), city: text(body.city), stateOrRegion: text(body.stateOrRegion), country: text(body.country) || current.country,
      latitude: parsed.latitude, longitude: parsed.longitude, rules: text(body.houseRules), cancellationPolicy: text(body.cancellationPolicy), checkInTime: text(body.checkIn) || "14:00", checkOutTime: text(body.checkOut) || "10:00",
    } });
    if (Array.isArray(body.photos)) {
      await tx.propertyPhoto.deleteMany({ where: { propertyId } });
      if (parsed.photos.length) await tx.propertyPhoto.createMany({ data: parsed.photos.map((url, index) => ({ propertyId, url, isHero: index === 0, displayOrder: index })) });
    }
    if (Array.isArray(body.amenities)) {
      await tx.propertyAmenity.deleteMany({ where: { propertyId } });
      for (const amenityName of parsed.amenities) {
        const slug = slugify(amenityName);
        const amenity = await tx.amenity.upsert({ where: { slug }, update: { name: amenityName }, create: { slug, name: amenityName } });
        await tx.propertyAmenity.create({ data: { propertyId, amenityId: amenity.id } });
      }
    }
    await audit(user, "property", propertyId, "update", { name, ...parsed }, tx);
  });
  return { id: propertyId };
}

export async function publishProperty(user: AuthUser, propertyId: string) {
  if (!(await propertyAccess(user, propertyId, ["OWNER", "MANAGER"]))) return null;
  const property = await prisma.property.findUnique({ where: { id: propertyId }, include: { organisation: true, photos: true, roomCategories: { select: { id: true } } } });
  if (!property) return null;
  if (property.organisation?.status !== "APPROVED") throw new Error("The hotel organisation must be verified before publication.");
  if (!property.description || !property.address || property.latitude == null || property.longitude == null || !property.rules || !property.cancellationPolicy || property.photos.length < 5 || !property.roomCategories.length)
    throw new Error("Add address, map pin, description, rules, policy, five images, and at least one room type before publishing.");
  await prisma.$transaction(async (tx) => {
    await tx.property.update({ where: { id: propertyId }, data: { status: "APPROVED" } });
    await audit(user, "property", propertyId, "publish", { status: "published" }, tx);
  });
  return { id: propertyId, status: "published" };
}
