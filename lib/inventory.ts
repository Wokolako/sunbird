type RoomInventory = { id: string; units: number };

export function validStayDates(start: string, end: string) {
  const validDate = (value: string) => /^\d{4}-\d{2}-\d{2}$/.test(value)
    && Number.isFinite(Date.parse(value))
    && new Date(value).toISOString().slice(0, 10) === value;
  if (!validDate(start) || !validDate(end)) return false;
  const nights = (Date.parse(end) - Date.parse(start)) / 86400000;
  return nights > 0 && nights <= 365;
}

/** Available inventory is the lowest remaining unit count across the stay. Checkout is exclusive. */
export function availableUnits(db: any, room: RoomInventory, start: string, end: string, excludeBookingId = '') {
  if (!validStayDates(start, end)) return 0;
  const overrides = new Map<string, { units_open: number; closed: number }>(
    db.prepare('SELECT night, units_open, closed FROM availability WHERE room_id=? AND night>=? AND night<?')
      .all(room.id, start, end).map((row: any) => [row.night, row]),
  );
  const reservations = db.prepare(`SELECT check_in, check_out, rooms FROM booking_requests
    WHERE room_id=? AND id<>? AND status IN ('confirmed','checked_in') AND check_in<? AND check_out>?`)
    .all(room.id, excludeBookingId, end, start);
  let remaining = room.units;
  for (let date = new Date(start); date < new Date(end); date.setUTCDate(date.getUTCDate() + 1)) {
    const night = date.toISOString().slice(0, 10);
    const override = overrides.get(night);
    if (override?.closed) return 0;
    const occupied = reservations.reduce((sum: number, booking: any) =>
      sum + (booking.check_in <= night && booking.check_out > night ? booking.rooms : 0), 0);
    remaining = Math.min(remaining, Math.max(0, Math.min(room.units, override?.units_open ?? room.units) - occupied));
  }
  return remaining;
}
