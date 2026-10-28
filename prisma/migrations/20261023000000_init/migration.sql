-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('GUEST', 'OWNER', 'MANAGER', 'FRONT_DESK', 'HOUSEKEEPER', 'ADMIN');

-- CreateEnum
CREATE TYPE "PropertyType" AS ENUM ('HOTEL', 'LODGE');

-- CreateEnum
CREATE TYPE "PropertyStatus" AS ENUM ('PENDING', 'APPROVED', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "StaffRole" AS ENUM ('OWNER', 'MANAGER', 'FRONT_DESK', 'HOUSEKEEPER');

-- CreateEnum
CREATE TYPE "RoomUnitStatus" AS ENUM ('VACANT_CLEAN', 'VACANT_DIRTY', 'OCCUPIED', 'MAINTENANCE');

-- CreateEnum
CREATE TYPE "ReservationStatus" AS ENUM ('UPCOMING', 'CHECKED_IN', 'CHECKED_OUT', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ReservationSource" AS ENUM ('ONLINE', 'WALK_IN', 'PHONE');

-- CreateEnum
CREATE TYPE "IdVerificationStatus" AS ENUM ('NOT_VERIFIED', 'PENDING', 'VERIFIED', 'REJECTED');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('CREDIT_CARD', 'DEBIT_CARD', 'MOBILE_MONEY', 'BANK_TRANSFER', 'CASH');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'COMPLETED', 'FAILED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "PaymentType" AS ENUM ('DEPOSIT', 'FULL', 'PARTIAL', 'REFUND');

-- CreateEnum
CREATE TYPE "InvoiceStatus" AS ENUM ('DRAFT', 'ISSUED', 'PAID', 'CANCELLED');

-- CreateEnum
CREATE TYPE "RateRuleType" AS ENUM ('WEEKDAY_WEEKEND', 'SEASONAL', 'MIN_STAY', 'RESTRICTION', 'CUSTOM');

-- CreateEnum
CREATE TYPE "DateBlockReason" AS ENUM ('MAINTENANCE', 'PRIVATE_BOOKING', 'OWNER_STAY', 'RENOVATION');

-- CreateEnum
CREATE TYPE "PayoutSchedule" AS ENUM ('WEEKLY', 'BI_WEEKLY', 'MONTHLY');

-- CreateEnum
CREATE TYPE "PayoutStatus" AS ENUM ('PENDING', 'PROCESSING', 'PAID', 'FAILED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT NOT NULL,
    "emailVerified" TIMESTAMP(3),
    "passwordHash" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'GUEST',
    "phone" TEXT,
    "image" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "GuestProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "phone" TEXT,
    "address" TEXT,
    "city" TEXT,
    "stateOrRegion" TEXT,
    "country" TEXT DEFAULT 'Malawi',
    "postalCode" TEXT,
    "emergencyContactName" TEXT,
    "emergencyContactPhone" TEXT,
    "idOrPassportNumber" TEXT,
    "nationality" TEXT,
    "preferredCurrency" TEXT NOT NULL DEFAULT 'MWK',
    "paymentMethodPref" TEXT,
    "specialRequests" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GuestProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Property" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "legalName" TEXT,
    "slug" TEXT NOT NULL,
    "type" "PropertyType" NOT NULL DEFAULT 'LODGE',
    "status" "PropertyStatus" NOT NULL DEFAULT 'PENDING',
    "registrationNumber" TEXT,
    "taxId" TEXT,
    "description" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "stateOrRegion" TEXT NOT NULL,
    "country" TEXT NOT NULL DEFAULT 'Malawi',
    "postalCode" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "starRating" DOUBLE PRECISION,
    "contactEmail" TEXT,
    "contactPhone" TEXT,
    "website" TEXT,
    "rules" TEXT,
    "quietHours" TEXT,
    "petsAllowed" BOOLEAN NOT NULL DEFAULT false,
    "smokingAllowed" BOOLEAN NOT NULL DEFAULT false,
    "checkInTime" TEXT NOT NULL DEFAULT '14:00',
    "checkOutTime" TEXT NOT NULL DEFAULT '10:00',
    "cancellationPolicy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Property_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PropertyStaff" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "StaffRole" NOT NULL DEFAULT 'MANAGER',
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "PropertyStaff_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Amenity" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "icon" TEXT,
    "category" TEXT NOT NULL DEFAULT 'GENERAL',

    CONSTRAINT "Amenity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PropertyAmenity" (
    "propertyId" TEXT NOT NULL,
    "amenityId" TEXT NOT NULL,
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "PropertyAmenity_pkey" PRIMARY KEY ("propertyId","amenityId")
);

-- CreateTable
CREATE TABLE "PropertyPhoto" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "caption" TEXT,
    "isHero" BOOLEAN NOT NULL DEFAULT false,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PropertyPhoto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RoomCategory" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "capacity" INTEGER NOT NULL DEFAULT 2,
    "maxAdults" INTEGER NOT NULL DEFAULT 2,
    "maxChildren" INTEGER NOT NULL DEFAULT 0,
    "bedArrangement" TEXT NOT NULL,
    "basePrice" DECIMAL(12,2) NOT NULL,
    "amenities" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RoomCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RoomUnit" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "roomCategoryId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "floor" TEXT,
    "status" "RoomUnitStatus" NOT NULL DEFAULT 'VACANT_CLEAN',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RoomUnit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Reservation" (
    "id" TEXT NOT NULL,
    "referenceCode" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "roomCategoryId" TEXT NOT NULL,
    "roomUnitId" TEXT,
    "guestId" TEXT NOT NULL,
    "status" "ReservationStatus" NOT NULL DEFAULT 'UPCOMING',
    "source" "ReservationSource" NOT NULL DEFAULT 'ONLINE',
    "checkInDate" DATE NOT NULL,
    "checkOutDate" DATE NOT NULL,
    "adultsCount" INTEGER NOT NULL DEFAULT 1,
    "childrenCount" INTEGER NOT NULL DEFAULT 0,
    "specialRequests" TEXT,
    "idVerificationStatus" "IdVerificationStatus" NOT NULL DEFAULT 'NOT_VERIFIED',
    "totalAmount" DECIMAL(12,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'MWK',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Reservation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReservationAddOn" (
    "id" TEXT NOT NULL,
    "reservationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "unitPrice" DECIMAL(12,2) NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "totalPrice" DECIMAL(12,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReservationAddOn_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payment" (
    "id" TEXT NOT NULL,
    "reservationId" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'MWK',
    "method" "PaymentMethod" NOT NULL DEFAULT 'CREDIT_CARD',
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "paymentType" "PaymentType" NOT NULL DEFAULT 'FULL',
    "transactionReference" TEXT,
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Invoice" (
    "id" TEXT NOT NULL,
    "invoiceNumber" TEXT NOT NULL,
    "reservationId" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "subtotal" DECIMAL(12,2) NOT NULL,
    "taxAmount" DECIMAL(12,2) NOT NULL,
    "totalAmount" DECIMAL(12,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'MWK',
    "status" "InvoiceStatus" NOT NULL DEFAULT 'ISSUED',
    "issuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "paidAt" TIMESTAMP(3),
    "pdfUrl" TEXT,

    CONSTRAINT "Invoice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RateRule" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "roomCategoryId" TEXT,
    "name" TEXT NOT NULL,
    "type" "RateRuleType" NOT NULL DEFAULT 'SEASONAL',
    "startDate" DATE,
    "endDate" DATE,
    "daysOfWeek" INTEGER[] DEFAULT ARRAY[]::INTEGER[],
    "priceMultiplier" DECIMAL(5,2),
    "fixedPrice" DECIMAL(12,2),
    "minStayDays" INTEGER NOT NULL DEFAULT 1,
    "maxStayDays" INTEGER,
    "restrictions" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RateRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DateBlock" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "roomUnitId" TEXT NOT NULL,
    "startDate" DATE NOT NULL,
    "endDate" DATE NOT NULL,
    "reason" "DateBlockReason" NOT NULL DEFAULT 'MAINTENANCE',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DateBlock_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Review" (
    "id" TEXT NOT NULL,
    "reservationId" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "guestId" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "cleanliness" INTEGER,
    "staff" INTEGER,
    "location" INTEGER,
    "valueForMoney" INTEGER,
    "title" TEXT,
    "comment" TEXT NOT NULL,
    "ownerReply" TEXT,
    "repliedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Review_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Message" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT,
    "reservationId" TEXT,
    "senderId" TEXT NOT NULL,
    "recipientId" TEXT NOT NULL,
    "subject" TEXT,
    "content" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommissionSetting" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "percentage" DECIMAL(5,2) NOT NULL DEFAULT 10.00,
    "payoutSchedule" "PayoutSchedule" NOT NULL DEFAULT 'MONTHLY',
    "effectiveFrom" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CommissionSetting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payout" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "payoutReference" TEXT NOT NULL,
    "periodStart" DATE NOT NULL,
    "periodEnd" DATE NOT NULL,
    "grossRevenue" DECIMAL(12,2) NOT NULL,
    "commissionRate" DECIMAL(5,2) NOT NULL,
    "commissionFee" DECIMAL(12,2) NOT NULL,
    "netPayout" DECIMAL(12,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'MWK',
    "status" "PayoutStatus" NOT NULL DEFAULT 'PENDING',
    "processedAt" TIMESTAMP(3),
    "bankReference" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Payout_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "userEmail" TEXT,
    "action" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "entityId" TEXT,
    "details" TEXT,
    "ipAddress" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_role_idx" ON "User"("role");

-- CreateIndex
CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "Account"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "Session"("sessionToken");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_token_key" ON "VerificationToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_identifier_token_key" ON "VerificationToken"("identifier", "token");

-- CreateIndex
CREATE UNIQUE INDEX "GuestProfile_userId_key" ON "GuestProfile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Property_slug_key" ON "Property"("slug");

-- CreateIndex
CREATE INDEX "Property_status_type_city_country_idx" ON "Property"("status", "type", "city", "country");

-- CreateIndex
CREATE INDEX "Property_latitude_longitude_idx" ON "Property"("latitude", "longitude");

-- CreateIndex
CREATE INDEX "Property_starRating_idx" ON "Property"("starRating");

-- CreateIndex
CREATE INDEX "PropertyStaff_userId_role_idx" ON "PropertyStaff"("userId", "role");

-- CreateIndex
CREATE UNIQUE INDEX "PropertyStaff_propertyId_userId_key" ON "PropertyStaff"("propertyId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "Amenity_name_key" ON "Amenity"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Amenity_slug_key" ON "Amenity"("slug");

-- CreateIndex
CREATE INDEX "PropertyPhoto_propertyId_displayOrder_idx" ON "PropertyPhoto"("propertyId", "displayOrder");

-- CreateIndex
CREATE INDEX "RoomCategory_propertyId_basePrice_capacity_idx" ON "RoomCategory"("propertyId", "basePrice", "capacity");

-- CreateIndex
CREATE UNIQUE INDEX "RoomCategory_propertyId_slug_key" ON "RoomCategory"("propertyId", "slug");

-- CreateIndex
CREATE INDEX "RoomUnit_propertyId_status_idx" ON "RoomUnit"("propertyId", "status");

-- CreateIndex
CREATE INDEX "RoomUnit_roomCategoryId_idx" ON "RoomUnit"("roomCategoryId");

-- CreateIndex
CREATE UNIQUE INDEX "RoomUnit_propertyId_name_key" ON "RoomUnit"("propertyId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "Reservation_referenceCode_key" ON "Reservation"("referenceCode");

-- CreateIndex
CREATE INDEX "Reservation_propertyId_checkInDate_checkOutDate_status_idx" ON "Reservation"("propertyId", "checkInDate", "checkOutDate", "status");

-- CreateIndex
CREATE INDEX "Reservation_guestId_idx" ON "Reservation"("guestId");

-- CreateIndex
CREATE INDEX "Reservation_roomUnitId_idx" ON "Reservation"("roomUnitId");

-- CreateIndex
CREATE INDEX "ReservationAddOn_reservationId_idx" ON "ReservationAddOn"("reservationId");

-- CreateIndex
CREATE INDEX "Payment_reservationId_status_idx" ON "Payment"("reservationId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "Invoice_invoiceNumber_key" ON "Invoice"("invoiceNumber");

-- CreateIndex
CREATE INDEX "Invoice_propertyId_invoiceNumber_idx" ON "Invoice"("propertyId", "invoiceNumber");

-- CreateIndex
CREATE INDEX "RateRule_propertyId_roomCategoryId_startDate_endDate_idx" ON "RateRule"("propertyId", "roomCategoryId", "startDate", "endDate");

-- CreateIndex
CREATE INDEX "DateBlock_propertyId_roomUnitId_startDate_endDate_idx" ON "DateBlock"("propertyId", "roomUnitId", "startDate", "endDate");

-- CreateIndex
CREATE UNIQUE INDEX "Review_reservationId_key" ON "Review"("reservationId");

-- CreateIndex
CREATE INDEX "Review_propertyId_rating_idx" ON "Review"("propertyId", "rating");

-- CreateIndex
CREATE INDEX "Message_recipientId_isRead_idx" ON "Message"("recipientId", "isRead");

-- CreateIndex
CREATE INDEX "Message_propertyId_idx" ON "Message"("propertyId");

-- CreateIndex
CREATE UNIQUE INDEX "CommissionSetting_propertyId_key" ON "CommissionSetting"("propertyId");

-- CreateIndex
CREATE UNIQUE INDEX "Payout_payoutReference_key" ON "Payout"("payoutReference");

-- CreateIndex
CREATE INDEX "Payout_propertyId_status_idx" ON "Payout"("propertyId", "status");

-- CreateIndex
CREATE INDEX "AuditLog_entity_entityId_idx" ON "AuditLog"("entity", "entityId");

-- CreateIndex
CREATE INDEX "AuditLog_userId_idx" ON "AuditLog"("userId");

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GuestProfile" ADD CONSTRAINT "GuestProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PropertyStaff" ADD CONSTRAINT "PropertyStaff_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PropertyStaff" ADD CONSTRAINT "PropertyStaff_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PropertyAmenity" ADD CONSTRAINT "PropertyAmenity_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PropertyAmenity" ADD CONSTRAINT "PropertyAmenity_amenityId_fkey" FOREIGN KEY ("amenityId") REFERENCES "Amenity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PropertyPhoto" ADD CONSTRAINT "PropertyPhoto_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoomCategory" ADD CONSTRAINT "RoomCategory_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoomUnit" ADD CONSTRAINT "RoomUnit_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoomUnit" ADD CONSTRAINT "RoomUnit_roomCategoryId_fkey" FOREIGN KEY ("roomCategoryId") REFERENCES "RoomCategory"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reservation" ADD CONSTRAINT "Reservation_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reservation" ADD CONSTRAINT "Reservation_roomCategoryId_fkey" FOREIGN KEY ("roomCategoryId") REFERENCES "RoomCategory"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reservation" ADD CONSTRAINT "Reservation_roomUnitId_fkey" FOREIGN KEY ("roomUnitId") REFERENCES "RoomUnit"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reservation" ADD CONSTRAINT "Reservation_guestId_fkey" FOREIGN KEY ("guestId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReservationAddOn" ADD CONSTRAINT "ReservationAddOn_reservationId_fkey" FOREIGN KEY ("reservationId") REFERENCES "Reservation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_reservationId_fkey" FOREIGN KEY ("reservationId") REFERENCES "Reservation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_reservationId_fkey" FOREIGN KEY ("reservationId") REFERENCES "Reservation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RateRule" ADD CONSTRAINT "RateRule_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RateRule" ADD CONSTRAINT "RateRule_roomCategoryId_fkey" FOREIGN KEY ("roomCategoryId") REFERENCES "RoomCategory"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DateBlock" ADD CONSTRAINT "DateBlock_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DateBlock" ADD CONSTRAINT "DateBlock_roomUnitId_fkey" FOREIGN KEY ("roomUnitId") REFERENCES "RoomUnit"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_reservationId_fkey" FOREIGN KEY ("reservationId") REFERENCES "Reservation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_guestId_fkey" FOREIGN KEY ("guestId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_recipientId_fkey" FOREIGN KEY ("recipientId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommissionSetting" ADD CONSTRAINT "CommissionSetting_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payout" ADD CONSTRAINT "Payout_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;



-- =============================================================================
-- POSTGRESQL EXTENSION & EXCLUSION CONSTRAINTS (NO DOUBLE-BOOKING)
-- =============================================================================

-- 1. Enable btree_gist for combining scalar UUIDs/strings with range types in GIST constraints
CREATE EXTENSION IF NOT EXISTS btree_gist;

-- 2. Add generated daterange column to Reservation
-- stay_range is computed as [checkInDate, checkOutDate)
ALTER TABLE "Reservation"
ADD COLUMN IF NOT EXISTS "stay_range" daterange
GENERATED ALWAYS AS (daterange("checkInDate", "checkOutDate", '[)')) STORED;

-- 3. Enforce exclusion constraint on Reservation: No double-booking for non-cancelled reservations on the same room unit
-- When roomUnitId is assigned (NOT NULL) and status <> 'CANCELLED', no overlapping stay_range allowed!
ALTER TABLE "Reservation"
DROP CONSTRAINT IF EXISTS "no_double_booking_reservation";

ALTER TABLE "Reservation"
ADD CONSTRAINT "no_double_booking_reservation"
EXCLUDE USING gist (
  "roomUnitId" WITH =,
  "stay_range" WITH &&
)
WHERE ("status" <> 'CANCELLED' AND "roomUnitId" IS NOT NULL);

-- 4. Add generated daterange column to DateBlock
ALTER TABLE "DateBlock"
ADD COLUMN IF NOT EXISTS "stay_range" daterange
GENERATED ALWAYS AS (daterange("startDate", "endDate", '[)')) STORED;

-- 5. Enforce exclusion constraint on DateBlock: No overlapping maintenance/private blocks on the same room unit
ALTER TABLE "DateBlock"
DROP CONSTRAINT IF EXISTS "no_double_booking_date_block";

ALTER TABLE "DateBlock"
ADD CONSTRAINT "no_double_booking_date_block"
EXCLUDE USING gist (
  "roomUnitId" WITH =,
  "stay_range" WITH &&
);

-- 6. Enforce cross-table protection between Reservations and DateBlocks via trigger functions
-- Prevents reserving a room unit during a maintenance/private DateBlock, and vice versa.
CREATE OR REPLACE FUNCTION check_reservation_date_block_overlap()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW."roomUnitId" IS NOT NULL AND NEW."status" <> 'CANCELLED' THEN
    IF EXISTS (
      SELECT 1 FROM "DateBlock"
      WHERE "roomUnitId" = NEW."roomUnitId"
        AND "stay_range" && daterange(NEW."checkInDate", NEW."checkOutDate", '[)')
    ) THEN
      RAISE EXCEPTION 'Room unit % is blocked for maintenance or private booking during the requested dates % to %',
        NEW."roomUnitId", NEW."checkInDate", NEW."checkOutDate";
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_check_reservation_date_block ON "Reservation";
CREATE TRIGGER trg_check_reservation_date_block
BEFORE INSERT OR UPDATE OF "roomUnitId", "checkInDate", "checkOutDate", "status"
ON "Reservation"
FOR EACH ROW
EXECUTE FUNCTION check_reservation_date_block_overlap();

CREATE OR REPLACE FUNCTION check_date_block_reservation_overlap()
RETURNS TRIGGER AS $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM "Reservation"
    WHERE "roomUnitId" = NEW."roomUnitId"
      AND "status" <> 'CANCELLED'
      AND "stay_range" && daterange(NEW."startDate", NEW."endDate", '[)')
  ) THEN
    RAISE EXCEPTION 'Room unit % has an active non-cancelled reservation during dates % to %',
      NEW."roomUnitId", NEW."startDate", NEW."endDate";
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_check_date_block_reservation ON "DateBlock";
CREATE TRIGGER trg_check_date_block_reservation
BEFORE INSERT OR UPDATE OF "roomUnitId", "startDate", "endDate"
ON "DateBlock"
FOR EACH ROW
EXECUTE FUNCTION check_date_block_reservation_overlap();

-- 7. Optimized GIST indexes for ultra-fast room availability queries
CREATE INDEX IF NOT EXISTS "idx_reservation_stay_range_gist"
ON "Reservation" USING gist ("roomUnitId", "stay_range")
WHERE "status" <> 'CANCELLED';

CREATE INDEX IF NOT EXISTS "idx_date_block_stay_range_gist"
ON "DateBlock" USING gist ("roomUnitId", "stay_range");
