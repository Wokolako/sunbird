CREATE INDEX "Reservation_propertyId_createdAt_idx"
ON "Reservation" ("propertyId", "createdAt" DESC);

CREATE INDEX "Payment_reservationId_createdAt_idx"
ON "Payment" ("reservationId", "createdAt" DESC);
