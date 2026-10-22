import { NextRequest, NextResponse } from 'next/server';
import { portalData, extraAction, bookingRows } from '@/lib/portal-actions';
import { portalRole, sessionCookie } from '@/lib/platform';
import { audit, currentUser, database, hashPassword, issueSession, propertyForOwner, roomForOwner, safeUser, tokenHash, uid, userOrganisation, verifyPassword } from '@/lib/platform';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function reply(data: unknown, status = 200) {
  return NextResponse.json(data, { status, headers: { 'Cache-Control': 'no-store' } });
}
function fail(message: string, status = 400) { return reply({ error: message }, status); }
function text(value: unknown) { return String(value ?? '').trim(); }
function validEmail(value: string) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value); }
function sameOrigin(request: NextRequest) {
  const origin = request.headers.get('origin');
  return !origin || origin === new URL(request.url).origin;
}

export async function GET(request: NextRequest) {
  const db = database();
  const view = request.nextUrl.searchParams.get('view') || 'session';
  const role = portalRole();
  const allowed = role === 'admin' ? ['session','admin','document'] : role === 'owner' ? ['session','mine'] : ['session','search','bookings'];
  if (!allowed.includes(view)) return fail('This service is not available in this portal.', 404);
  const user = await currentUser();
  const extra = portalData(db, user, view);
  if (extra) return extra;
  if (view === 'session') return reply({ user: user ? safeUser(user) : null });
  if (view === 'mine') {
    if (!user || user.role !== 'owner') return fail('Owner sign-in required.', 401);
    const organisation = userOrganisation(db, user.id);
    const properties = db.prepare('SELECT * FROM properties WHERE organisation_id=? ORDER BY created_at DESC').all(organisation?.id);
    const rooms = db.prepare('SELECT r.* FROM rooms r JOIN properties p ON p.id=r.property_id WHERE p.organisation_id=? ORDER BY r.created_at DESC').all(organisation?.id);
    const documents = db.prepare('SELECT id,kind,filename,created_at FROM documents WHERE organisation_id=?').all(organisation?.id);
    const enquiries = db.prepare('SELECT e.* ,p.name AS property_name FROM enquiries e JOIN properties p ON p.id=e.property_id WHERE p.organisation_id=? ORDER BY e.created_at DESC').all(organisation?.id);
    return reply({ user: safeUser(user), organisation, properties, rooms, documents, enquiries, bookings: bookingRows(db,user.id) });
  }
  if (view === 'admin') {
    if (!user || user.role !== 'admin') return fail('Admin sign-in required.', 403);
    const organisations = db.prepare('SELECT o.*,u.name AS owner_name FROM organisations o JOIN users u ON u.id=o.owner_id ORDER BY o.created_at DESC').all();
    const documents = db.prepare('SELECT id,organisation_id,kind,filename,created_at FROM documents ORDER BY created_at DESC').all();
    const users = db.prepare('SELECT id,name,email,phone,role,status,created_at FROM users ORDER BY created_at DESC').all();
    const properties = db.prepare('SELECT p.*,o.name AS organisation_name FROM properties p JOIN organisations o ON o.id=p.organisation_id ORDER BY p.created_at DESC').all();
    const settings = db.prepare('SELECT key,value FROM platform_settings').all();
    const logs = db.prepare('SELECT a.*,u.name AS actor_name FROM audit_log a LEFT JOIN users u ON u.id=a.actor_id ORDER BY a.created_at DESC LIMIT 100').all();
    return reply({ user: safeUser(user), organisations, documents, users, properties, bookings: bookingRows(db), settings, logs });
  }
  if (view === 'search') {
    const query = text(request.nextUrl.searchParams.get('q')).toLowerCase();
    const checkIn = text(request.nextUrl.searchParams.get('checkIn'));
    const checkOut = text(request.nextUrl.searchParams.get('checkOut'));
    const adults = Math.max(1, Number(request.nextUrl.searchParams.get('adults') || 2));
    const children = Math.max(0, Number(request.nextUrl.searchParams.get('children') || 0));
    const requestedRooms = Math.max(1, Number(request.nextUrl.searchParams.get('rooms') || 1));
    if (checkIn && checkOut && checkOut <= checkIn) return fail('Check-out must be after check-in.');
    const properties = db.prepare(`SELECT p.* FROM properties p JOIN organisations o ON o.id=p.organisation_id
      JOIN users owner ON owner.id=o.owner_id WHERE p.status='published' AND o.status='approved' AND owner.status='active'
      AND p.latitude IS NOT NULL AND p.longitude IS NOT NULL ORDER BY p.created_at DESC`).all() as Record<string, any>[];
    const results = properties.filter((property) => !query || [property.name, property.address, property.type].some((part) => String(part).toLowerCase().includes(query)))
      .map((property) => {
        const roomTypes = db.prepare('SELECT * FROM rooms WHERE property_id=? AND adult_capacity>=? AND child_capacity>=? AND units>=?').all(property.id, Math.ceil(adults/requestedRooms), Math.ceil(children/requestedRooms), requestedRooms) as Record<string, any>[];
        const rooms = roomTypes.filter((room) => {
          if (!checkIn || !checkOut) return true;
          const nights = db.prepare('SELECT night,units_open,closed FROM availability WHERE room_id=? AND night>=? AND night<?').all(room.id, checkIn, checkOut) as Record<string, any>[];
          const overrides = new Map(nights.map((night) => [night.night, night]));
          for (let day = new Date(checkIn + 'T00:00:00Z'); day < new Date(checkOut + 'T00:00:00Z'); day.setUTCDate(day.getUTCDate() + 1)) {
            const override = overrides.get(day.toISOString().slice(0, 10));
            if (override?.closed || (override?.units_open ?? room.units) < requestedRooms) return false;
          }
          return true;
        });
        return { ...property, photos: JSON.parse(property.photos), amenities: JSON.parse(property.amenities), rooms: rooms.map((room) => ({ ...room, amenities: JSON.parse(room.amenities), photos: JSON.parse(room.photos) })) };
      }).filter((property) => property.rooms.length > 0);
    return reply({ results });
  }
  if (view === 'document') {
    if (!user || user.role !== 'admin') return fail('Admin sign-in required.', 403);
    const id = text(request.nextUrl.searchParams.get('id'));
    const document = db.prepare('SELECT filename,mime,content FROM documents WHERE id=?').get(id) as Record<string, any> | undefined;
    if (!document) return fail('Document not found.', 404);
    return new NextResponse(document.content, { headers: { 'Content-Type': document.mime, 'Content-Disposition': `attachment; filename="${document.filename.replaceAll('"', '')}"`, 'X-Content-Type-Options': 'nosniff' } });
  }
  return fail('Unknown view.', 404);
}

export async function POST(request: NextRequest) {
  if (!sameOrigin(request)) return fail('Cross-origin request blocked.', 403);
  const db = database();
  const contentType = request.headers.get('content-type') || '';
  if (contentType.includes('multipart/form-data')) {
    if (portalRole() !== 'owner') return fail('Not available in this portal.', 404);
    const user = await currentUser();
    if (!user || user.role !== 'owner') return fail('Owner sign-in required.', 401);
    const organisation = userOrganisation(db, user.id);
    if (!organisation) return fail('Organisation not found.', 404);
    const form = await request.formData();
    const file = form.get('file');
    const kind = text(form.get('kind'));
    if (!(file instanceof File) || !['business_registration', 'proof_of_address', 'owner_id', 'accommodation_licence'].includes(kind)) return fail('Choose a required document type and file.');
    if (!['application/pdf', 'image/jpeg', 'image/png'].includes(file.type) || file.size > 5_000_000) return fail('Upload a PDF, JPEG or PNG up to 5 MB.');
    const bytes = Buffer.from(await file.arrayBuffer());
    const id = uid();
    db.prepare('INSERT INTO documents (id,organisation_id,kind,filename,mime,content) VALUES (?,?,?,?,?,?)').run(id, organisation.id, kind, file.name.slice(0, 120), file.type, bytes);
    audit(db, user.id, 'document', id, 'upload', null, { kind, filename: file.name });
    return reply({ ok: true, id }, 201);
  }
  let body: Record<string, any>;
  try { body = await request.json(); } catch { return fail('Valid JSON is required.'); }
  const action = text(body.action);
  const role = portalRole();
  const allowedActions = role === 'admin' ? ['login','logout','verify-organisation','user-status','property-status','platform-settings','booking-status'] : role === 'owner' ? ['register-owner','login','logout','create-property','update-property','create-room','update-rate','set-availability','publish-property','property-status','booking-status'] : ['register-guest','login','logout','request-stay','booking-status'];
  if (!allowedActions.includes(action)) return fail('Not available in this portal.', 404);
  const actor = await currentUser();
  if (!['login','logout','register-guest','register-owner'].includes(action) && !actor) return fail('Sign in to continue.',401);
  const extra = extraAction(db, actor, body);
  if(extra) return extra;

  if (action === 'register-owner') {
    const name = text(body.name), email = text(body.email).toLowerCase(), phone = text(body.phone), password = text(body.password);
    const organisationName = text(body.organisationName), organisationType = text(body.organisationType);
    const registrationNumber = text(body.registrationNumber), address = text(body.address);
    if (!name || !validEmail(email) || !phone || password.length < 12 || !organisationName || !['hotel','lodge','guesthouse','short_term_let'].includes(organisationType) || !registrationNumber || !address) return fail('Complete all required fields. Password must have at least 12 characters.');
    if (db.prepare('SELECT 1 FROM users WHERE email=?').get(email)) return fail('An account with this email already exists.', 409);
    const userId = uid(), orgId = uid();
    db.exec('BEGIN IMMEDIATE');
    try {
      db.prepare('INSERT INTO users (id,name,email,phone,password_hash,role) VALUES (?,?,?,?,?,?)').run(userId, name, email, phone, hashPassword(password), 'owner');
      db.prepare('INSERT INTO organisations (id,owner_id,name,type,registration_number,licence_number,contact_name,phone,email,address) VALUES (?,?,?,?,?,?,?,?,?,?)')
        .run(orgId, userId, organisationName, organisationType, registrationNumber, text(body.licenceNumber), name, phone, email, address);
      audit(db, userId, 'organisation', orgId, 'register', null, { name: organisationName, status: 'pending' });
      db.exec('COMMIT');
    } catch (error) { db.exec('ROLLBACK'); throw error; }
    const token = issueSession(db, userId);
    const response = reply({ ok: true, user: { id: userId, name, email, phone, role: 'owner' } }, 201);
    response.cookies.set(sessionCookie(), token, { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', path: '/', maxAge: 604800 });
    return response;
  }
  if (action === 'login') {
    const email = text(body.email).toLowerCase(), password = text(body.password);
    const attempt = db.prepare('SELECT * FROM login_attempts WHERE email=?').get(email) as Record<string, any> | undefined;
    if (attempt && attempt.blocked_until > Date.now()) return fail('Too many attempts. Try again later.', 429);
    const user = db.prepare('SELECT * FROM users WHERE email=?').get(email) as Record<string, any> | undefined;
    if (!user || user.role !== portalRole() || user.status !== 'active' || !verifyPassword(password, user.password_hash)) {
      const count = (attempt?.attempts || 0) + 1;
      db.prepare('INSERT INTO login_attempts(email,attempts,blocked_until) VALUES (?,?,?) ON CONFLICT(email) DO UPDATE SET attempts=excluded.attempts,blocked_until=excluded.blocked_until')
        .run(email, count, count >= 5 ? Date.now() + 15 * 60_000 : 0);
      return fail('Incorrect email or password.', 401);
    }
    db.prepare('DELETE FROM login_attempts WHERE email=?').run(email);
    const token = issueSession(db, user.id);
    const response = reply({ ok: true, user: safeUser(user) });
    response.cookies.set(sessionCookie(), token, { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', path: '/', maxAge: 604800 });
    return response;
  }
  if (action === 'logout') {
    const token = (await request.cookies).get(sessionCookie())?.value;
    if (token) db.prepare('DELETE FROM sessions WHERE token_hash=?').run(tokenHash(token));
    const response = reply({ ok: true });
    response.cookies.delete(sessionCookie());
    return response;
  }

  const user = await currentUser();
  if (!user) return fail('Sign in to continue.', 401);
  if (action === 'create-property') {
    if (user.role !== 'owner') return fail('Owner access required.', 403);
    const organisation = userOrganisation(db, user.id);
    if (!organisation) return fail('Organisation not found.', 404);
    const name = text(body.name), type = text(body.type);
    if (!name || !['hotel','lodge','guesthouse','short_term_let'].includes(type)) return fail('Name and property type are required.');
    const id = uid();
    db.prepare('INSERT INTO properties (id,organisation_id,name,type) VALUES (?,?,?,?)').run(id, organisation.id, name, type);
    audit(db, user.id, 'property', id, 'create', null, { name, type, status: 'draft' });
    return reply({ ok: true, id }, 201);
  }
  if (action === 'update-property') {
    if (user.role !== 'owner') return fail('Owner access required.', 403);
    const property = propertyForOwner(db, text(body.id), user.id);
    if (!property) return fail('Property not found.', 404);
    const fields = {
      description: text(body.description), address: text(body.address),
      latitude: body.latitude === '' ? null : Number(body.latitude),
      longitude: body.longitude === '' ? null : Number(body.longitude),
      photos: JSON.stringify(Array.isArray(body.photos) ? body.photos.filter((url: unknown) => typeof url === 'string' && (/^https:\/\//.test(url) || /^\/assets\/[a-zA-Z0-9_.-]+\.(jpg|jpeg|png|webp)$/.test(url))).slice(0, 40) : []),
      amenities: JSON.stringify(Array.isArray(body.amenities) ? body.amenities.map(text).filter(Boolean) : []),
      accessibility: text(body.accessibility), languages: text(body.languages),
      house_rules: text(body.houseRules), cancellation_policy: text(body.cancellationPolicy),
      check_in: text(body.checkIn) || '14:00', check_out: text(body.checkOut) || '10:00',
      booking_mode: body.bookingMode === 'instant' ? 'instant' : 'request',
    };
    if (fields.latitude !== null && (!Number.isFinite(fields.latitude) || fields.latitude < -90 || fields.latitude > 90)) return fail('Latitude is invalid.');
    if (fields.longitude !== null && (!Number.isFinite(fields.longitude) || fields.longitude < -180 || fields.longitude > 180)) return fail('Longitude is invalid.');
    db.prepare(`UPDATE properties SET description=?,address=?,latitude=?,longitude=?,photos=?,amenities=?,accessibility=?,languages=?,house_rules=?,cancellation_policy=?,check_in=?,check_out=?,booking_mode=? WHERE id=?`)
      .run(...Object.values(fields), property.id);
    audit(db, user.id, 'property', property.id, 'update', property, fields);
    return reply({ ok: true });
  }
  if (action === 'create-room') {
    if (user.role !== 'owner') return fail('Owner access required.', 403);
    const property = propertyForOwner(db, text(body.propertyId), user.id);
    if (!property) return fail('Property not found.', 404);
    const name = text(body.name), beds = text(body.beds), adults = Number(body.adults), children = Number(body.children || 0), units = Number(body.units), rate = Number(body.nightlyRate);
    if (!name || !beds || !Number.isInteger(adults) || adults < 1 || !Number.isInteger(children) || children < 0 || !Number.isInteger(units) || units < 1 || !Number.isFinite(rate) || rate <= 0) return fail('Enter a valid room name, beds, capacity, units and nightly rate.');
    const id = uid();
    db.prepare('INSERT INTO rooms(id,property_id,name,adult_capacity,child_capacity,beds,size_sqm,units,nightly_rate_minor) VALUES (?,?,?,?,?,?,?,?,?)')
      .run(id, property.id, name, adults, children, beds, Number(body.sizeSqm) || null, units, Math.round(rate * 100));
    audit(db, user.id, 'room', id, 'create', null, { name, adults, children, beds, units, nightlyRateMinor: Math.round(rate * 100) });
    return reply({ ok: true, id }, 201);
  }
  if (action === 'set-availability') {
    if (user.role !== 'owner') return fail('Owner access required.', 403);
    const room = roomForOwner(db, text(body.roomId), user.id);
    if (!room) return fail('Room not found.', 404);
    const start = text(body.start), end = text(body.end), count = Number(body.unitsOpen), closed = body.closed ? 1 : 0;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(start) || !/^\d{4}-\d{2}-\d{2}$/.test(end) || end < start || !Number.isInteger(count) || count < 0 || count > room.units) return fail('Choose a valid date range and unit count.');
    const days = Math.round((Date.parse(end) - Date.parse(start)) / 86400000) + 1;
    if (days < 1 || days > 366) return fail('Choose a range of at most 366 days.');
    const before = db.prepare('SELECT * FROM availability WHERE room_id=? AND night>=? AND night<=?').all(room.id, start, end);
    db.exec('BEGIN IMMEDIATE');
    try {
      const statement = db.prepare('INSERT INTO availability(room_id,night,units_open,closed) VALUES (?,?,?,?) ON CONFLICT(room_id,night) DO UPDATE SET units_open=excluded.units_open,closed=excluded.closed');
      const date = new Date(start + 'T00:00:00Z');
      for (let i = 0; i < days; i++) {
        statement.run(room.id, date.toISOString().slice(0, 10), count, closed);
        date.setUTCDate(date.getUTCDate() + 1);
      }
      audit(db, user.id, 'availability', room.id, 'date_range_update', before, { start, end, unitsOpen: count, closed: Boolean(closed) });
      db.exec('COMMIT');
    } catch (error) { db.exec('ROLLBACK'); throw error; }
    return reply({ ok: true, days });
  }
  if (action === 'publish-property') {
    if (user.role !== 'owner') return fail('Owner access required.', 403);
    const property = propertyForOwner(db, text(body.id), user.id);
    if (!property) return fail('Property not found.', 404);
    const organisation = userOrganisation(db, user.id);
    if (organisation?.status !== 'approved') return fail('The organisation must be verified first.');
    // Stay requests collect no payment; provider verification is required when paid checkout launches.
    if (property.latitude == null || property.longitude == null || !property.address || !property.description || !property.house_rules || !property.cancellation_policy || JSON.parse(property.photos).length < 5) return fail('Add a map pin, address, description, rules, cancellation policy and at least five photos.');
    const room = db.prepare('SELECT 1 FROM rooms WHERE property_id=?').get(property.id);
    if (!room) return fail('Add a room type before publishing.');
    db.prepare("UPDATE properties SET status='published' WHERE id=?").run(property.id);
    audit(db, user.id, 'property', property.id, 'publish', { status: property.status }, { status: 'published' });
    return reply({ ok: true });
  }
  if (action === 'verify-organisation') {
    if (user.role !== 'admin') return fail('Admin access required.', 403);
    const id = text(body.id), status = text(body.status), reason = text(body.reason);
    if (!['approved','rejected','more_documents'].includes(status)) return fail('Invalid verification decision.');
    if (status !== 'approved' && !reason) return fail('A reason is required.');
    const organisation = db.prepare('SELECT * FROM organisations WHERE id=?').get(id) as Record<string, any> | undefined;
    if (!organisation) return fail('Organisation not found.', 404);
    if (status === 'approved') {
      const kinds = (db.prepare('SELECT DISTINCT kind FROM documents WHERE organisation_id=?').all(id) as Array<{ kind: string }>).map((row) => row.kind);
      if (!['business_registration','proof_of_address','owner_id'].every((kind) => kinds.includes(kind))) return fail('Business registration, proof of address and owner ID are required.');
    }
    db.prepare('UPDATE organisations SET status=?,verification_reason=? WHERE id=?').run(status, reason, id);
    audit(db, user.id, 'organisation', id, 'verification', { status: organisation.status, reason: organisation.verification_reason }, { status, reason });
    return reply({ ok: true });
  }
  return fail('Unknown action.', 404);
}
