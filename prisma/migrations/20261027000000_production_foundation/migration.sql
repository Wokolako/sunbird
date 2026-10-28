-- CreateEnum
CREATE TYPE "AccountStatus" AS ENUM ('ACTIVE', 'SUSPENDED', 'DELETED');

-- CreateEnum
CREATE TYPE "RefundStatus" AS ENUM ('REQUESTED', 'PENDING', 'SUCCEEDED', 'FAILED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "DisputeStatus" AS ENUM ('WARNING_NEEDS_RESPONSE', 'NEEDS_RESPONSE', 'UNDER_REVIEW', 'WON', 'LOST');

-- CreateEnum
CREATE TYPE "NotificationChannel" AS ENUM ('EMAIL', 'SMS', 'IN_APP');

-- CreateEnum
CREATE TYPE "DeliveryStatus" AS ENUM ('QUEUED', 'SENDING', 'SENT', 'DELIVERED', 'FAILED');

-- CreateEnum
CREATE TYPE "ReviewStatus" AS ENUM ('PENDING', 'PUBLISHED', 'HIDDEN', 'FLAGGED');

-- CreateEnum
CREATE TYPE "StoragePurpose" AS ENUM ('PROPERTY_IMAGE', 'VERIFICATION_DOCUMENT', 'INVOICE', 'REVIEW_ATTACHMENT');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "PaymentStatus" ADD VALUE 'REQUIRES_ACTION';
ALTER TYPE "PaymentStatus" ADD VALUE 'PROCESSING';
ALTER TYPE "PaymentStatus" ADD VALUE 'PARTIALLY_REFUNDED';
ALTER TYPE "PaymentStatus" ADD VALUE 'DISPUTED';

-- DropIndex
DROP INDEX "Reservation_guestId_idx";

-- DropIndex
DROP INDEX "Payment_reservationId_status_idx";

-- DropIndex
DROP INDEX "Review_propertyId_rating_idx";

-- DropIndex
DROP INDEX "Message_recipientId_isRead_idx";

-- DropIndex
DROP INDEX "Message_propertyId_idx";

-- DropIndex
DROP INDEX "Payout_propertyId_status_idx";

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "accountStatus" "AccountStatus" NOT NULL DEFAULT 'ACTIVE',
ADD COLUMN     "clerkUserId" TEXT;

-- AlterTable
ALTER TABLE "Property" ADD COLUMN     "organisationId" TEXT;

-- AlterTable
ALTER TABLE "Payment" ADD COLUMN     "applicationFeeAmount" DECIMAL(12,2),
ADD COLUMN     "checkoutSessionId" TEXT,
ADD COLUMN     "failedAt" TIMESTAMP(3),
ADD COLUMN     "idempotencyKey" TEXT,
ADD COLUMN     "provider" TEXT NOT NULL DEFAULT 'stripe',
ADD COLUMN     "providerPaymentId" TEXT,
ADD COLUMN     "transferredAmount" DECIMAL(12,2),
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "Review" ADD COLUMN     "status" "ReviewStatus" NOT NULL DEFAULT 'PENDING';

-- AlterTable
ALTER TABLE "Message" ADD COLUMN     "conversationId" TEXT;

-- AlterTable
ALTER TABLE "CommissionSetting" ADD COLUMN     "reserveDays" INTEGER NOT NULL DEFAULT 7,
ALTER COLUMN "percentage" SET DEFAULT 12.00,
ALTER COLUMN "payoutSchedule" SET DEFAULT 'WEEKLY';

-- AlterTable
ALTER TABLE "Payout" ADD COLUMN     "failureReason" TEXT,
ADD COLUMN     "providerPayoutId" TEXT,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- CreateTable
CREATE TABLE "RoomInventory" (
    "id" TEXT NOT NULL,
    "roomCategoryId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "unitsAvailable" INTEGER NOT NULL,
    "closed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RoomInventory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Organisation" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "registrationNumber" TEXT NOT NULL,
    "licenceNumber" TEXT,
    "phone" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "verificationReason" TEXT,
    "stripeAccountId" TEXT,
    "stripeChargesReady" BOOLEAN NOT NULL DEFAULT false,
    "stripePayoutsReady" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Organisation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrganisationMembership" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "StaffRole" NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OrganisationMembership_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StoredObject" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "bucket" TEXT NOT NULL,
    "purpose" "StoragePurpose" NOT NULL,
    "contentType" TEXT NOT NULL,
    "sizeBytes" BIGINT NOT NULL,
    "checksum" TEXT,
    "publicUrl" TEXT,
    "isPrivate" BOOLEAN NOT NULL DEFAULT true,
    "uploadedById" TEXT,
    "propertyId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StoredObject_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerificationDocument" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "objectId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "reviewNote" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VerificationDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BookingHold" (
    "id" TEXT NOT NULL,
    "reservationId" TEXT,
    "propertyId" TEXT NOT NULL,
    "roomCategoryId" TEXT NOT NULL,
    "guestId" TEXT NOT NULL,
    "checkInDate" DATE NOT NULL,
    "checkOutDate" DATE NOT NULL,
    "units" INTEGER NOT NULL DEFAULT 1,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "convertedAt" TIMESTAMP(3),
    "releasedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BookingHold_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CancellationPolicy" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "freeCancellationHours" INTEGER NOT NULL DEFAULT 48,
    "partialRefundHours" INTEGER NOT NULL DEFAULT 24,
    "partialRefundBps" INTEGER NOT NULL DEFAULT 5000,
    "propertyCancelRefundBps" INTEGER NOT NULL DEFAULT 10000,
    "noShowRefundBps" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CancellationPolicy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Refund" (
    "id" TEXT NOT NULL,
    "paymentId" TEXT NOT NULL,
    "reservationId" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'GBP',
    "reason" TEXT NOT NULL,
    "status" "RefundStatus" NOT NULL DEFAULT 'REQUESTED',
    "providerRefundId" TEXT,
    "requestedById" TEXT,
    "failureReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Refund_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Dispute" (
    "id" TEXT NOT NULL,
    "paymentId" TEXT NOT NULL,
    "providerDisputeId" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'GBP',
    "reason" TEXT,
    "status" "DisputeStatus" NOT NULL,
    "responseDueAt" TIMESTAMP(3),
    "evidenceDueAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Dispute_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PayoutItem" (
    "id" TEXT NOT NULL,
    "payoutId" TEXT NOT NULL,
    "paymentId" TEXT NOT NULL,
    "gross" DECIMAL(12,2) NOT NULL,
    "commission" DECIMAL(12,2) NOT NULL,
    "net" DECIMAL(12,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PayoutItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Conversation" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "reservationId" TEXT,
    "guestId" TEXT NOT NULL,
    "subject" TEXT,
    "closedAt" TIMESTAMP(3),
    "lastMessageAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Conversation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "data" JSONB,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NotificationDelivery" (
    "id" TEXT NOT NULL,
    "notificationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "channel" "NotificationChannel" NOT NULL,
    "destination" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerId" TEXT,
    "status" "DeliveryStatus" NOT NULL DEFAULT 'QUEUED',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "lastError" TEXT,
    "nextAttemptAt" TIMESTAMP(3),
    "sentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NotificationDelivery_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReviewReply" (
    "id" TEXT NOT NULL,
    "reviewId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReviewReply_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProviderEvent" (
    "id" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "payloadHash" TEXT NOT NULL,
    "processedAt" TIMESTAMP(3),
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProviderEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "RoomInventory_date_closed_roomCategoryId_idx" ON "RoomInventory"("date", "closed", "roomCategoryId");

-- CreateIndex
CREATE UNIQUE INDEX "RoomInventory_roomCategoryId_date_key" ON "RoomInventory"("roomCategoryId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "Organisation_stripeAccountId_key" ON "Organisation"("stripeAccountId");

-- CreateIndex
CREATE INDEX "Organisation_status_createdAt_id_idx" ON "Organisation"("status", "createdAt", "id");

-- CreateIndex
CREATE INDEX "OrganisationMembership_userId_active_idx" ON "OrganisationMembership"("userId", "active");

-- CreateIndex
CREATE UNIQUE INDEX "OrganisationMembership_organisationId_userId_key" ON "OrganisationMembership"("organisationId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "StoredObject_key_key" ON "StoredObject"("key");

-- CreateIndex
CREATE INDEX "StoredObject_propertyId_purpose_createdAt_id_idx" ON "StoredObject"("propertyId", "purpose", "createdAt", "id");

-- CreateIndex
CREATE INDEX "StoredObject_uploadedById_createdAt_id_idx" ON "StoredObject"("uploadedById", "createdAt", "id");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationDocument_objectId_key" ON "VerificationDocument"("objectId");

-- CreateIndex
CREATE INDEX "VerificationDocument_organisationId_status_createdAt_id_idx" ON "VerificationDocument"("organisationId", "status", "createdAt", "id");

-- CreateIndex
CREATE INDEX "BookingHold_roomCategoryId_checkInDate_checkOutDate_expires_idx" ON "BookingHold"("roomCategoryId", "checkInDate", "checkOutDate", "expiresAt");

-- CreateIndex
CREATE INDEX "BookingHold_guestId_expiresAt_idx" ON "BookingHold"("guestId", "expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "CancellationPolicy_propertyId_key" ON "CancellationPolicy"("propertyId");

-- CreateIndex
CREATE UNIQUE INDEX "Refund_providerRefundId_key" ON "Refund"("providerRefundId");

-- CreateIndex
CREATE INDEX "Refund_paymentId_status_createdAt_id_idx" ON "Refund"("paymentId", "status", "createdAt", "id");

-- CreateIndex
CREATE INDEX "Refund_reservationId_createdAt_id_idx" ON "Refund"("reservationId", "createdAt", "id");

-- CreateIndex
CREATE UNIQUE INDEX "Dispute_providerDisputeId_key" ON "Dispute"("providerDisputeId");

-- CreateIndex
CREATE INDEX "Dispute_status_responseDueAt_id_idx" ON "Dispute"("status", "responseDueAt", "id");

-- CreateIndex
CREATE INDEX "PayoutItem_paymentId_idx" ON "PayoutItem"("paymentId");

-- CreateIndex
CREATE UNIQUE INDEX "PayoutItem_payoutId_paymentId_key" ON "PayoutItem"("payoutId", "paymentId");

-- CreateIndex
CREATE UNIQUE INDEX "Conversation_reservationId_key" ON "Conversation"("reservationId");

-- CreateIndex
CREATE INDEX "Conversation_propertyId_lastMessageAt_id_idx" ON "Conversation"("propertyId", "lastMessageAt", "id");

-- CreateIndex
CREATE INDEX "Conversation_guestId_lastMessageAt_id_idx" ON "Conversation"("guestId", "lastMessageAt", "id");

-- CreateIndex
CREATE INDEX "Notification_userId_readAt_createdAt_id_idx" ON "Notification"("userId", "readAt", "createdAt", "id");

-- CreateIndex
CREATE INDEX "NotificationDelivery_status_nextAttemptAt_id_idx" ON "NotificationDelivery"("status", "nextAttemptAt", "id");

-- CreateIndex
CREATE INDEX "NotificationDelivery_userId_createdAt_id_idx" ON "NotificationDelivery"("userId", "createdAt", "id");

-- CreateIndex
CREATE INDEX "ReviewReply_reviewId_createdAt_id_idx" ON "ReviewReply"("reviewId", "createdAt", "id");

-- CreateIndex
CREATE INDEX "ProviderEvent_provider_type_createdAt_id_idx" ON "ProviderEvent"("provider", "type", "createdAt", "id");

-- CreateIndex
CREATE UNIQUE INDEX "User_clerkUserId_key" ON "User"("clerkUserId");

-- CreateIndex
CREATE INDEX "User_accountStatus_createdAt_id_idx" ON "User"("accountStatus", "createdAt", "id");

-- CreateIndex
CREATE INDEX "Property_organisationId_status_createdAt_id_idx" ON "Property"("organisationId", "status", "createdAt", "id");

-- CreateIndex
CREATE INDEX "Reservation_guestId_createdAt_id_idx" ON "Reservation"("guestId", "createdAt", "id");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_providerPaymentId_key" ON "Payment"("providerPaymentId");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_checkoutSessionId_key" ON "Payment"("checkoutSessionId");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_idempotencyKey_key" ON "Payment"("idempotencyKey");

-- CreateIndex
CREATE INDEX "Payment_reservationId_status_createdAt_id_idx" ON "Payment"("reservationId", "status", "createdAt", "id");

-- CreateIndex
CREATE INDEX "Payment_status_createdAt_id_idx" ON "Payment"("status", "createdAt", "id");

-- CreateIndex
CREATE INDEX "Review_propertyId_status_createdAt_id_idx" ON "Review"("propertyId", "status", "createdAt", "id");

-- CreateIndex
CREATE INDEX "Review_guestId_createdAt_id_idx" ON "Review"("guestId", "createdAt", "id");

-- CreateIndex
CREATE INDEX "Message_recipientId_isRead_createdAt_id_idx" ON "Message"("recipientId", "isRead", "createdAt", "id");

-- CreateIndex
CREATE INDEX "Message_propertyId_createdAt_id_idx" ON "Message"("propertyId", "createdAt", "id");

-- CreateIndex
CREATE INDEX "Message_conversationId_createdAt_id_idx" ON "Message"("conversationId", "createdAt", "id");

-- CreateIndex
CREATE UNIQUE INDEX "Payout_providerPayoutId_key" ON "Payout"("providerPayoutId");

-- CreateIndex
CREATE INDEX "Payout_propertyId_status_createdAt_id_idx" ON "Payout"("propertyId", "status", "createdAt", "id");

-- AddForeignKey
ALTER TABLE "Property" ADD CONSTRAINT "Property_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "Organisation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoomInventory" ADD CONSTRAINT "RoomInventory_roomCategoryId_fkey" FOREIGN KEY ("roomCategoryId") REFERENCES "RoomCategory"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_reservationId_fkey" FOREIGN KEY ("reservationId") REFERENCES "Reservation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrganisationMembership" ADD CONSTRAINT "OrganisationMembership_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "Organisation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrganisationMembership" ADD CONSTRAINT "OrganisationMembership_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StoredObject" ADD CONSTRAINT "StoredObject_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StoredObject" ADD CONSTRAINT "StoredObject_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VerificationDocument" ADD CONSTRAINT "VerificationDocument_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "Organisation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VerificationDocument" ADD CONSTRAINT "VerificationDocument_objectId_fkey" FOREIGN KEY ("objectId") REFERENCES "StoredObject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookingHold" ADD CONSTRAINT "BookingHold_reservationId_fkey" FOREIGN KEY ("reservationId") REFERENCES "Reservation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookingHold" ADD CONSTRAINT "BookingHold_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CancellationPolicy" ADD CONSTRAINT "CancellationPolicy_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Refund" ADD CONSTRAINT "Refund_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "Payment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Refund" ADD CONSTRAINT "Refund_reservationId_fkey" FOREIGN KEY ("reservationId") REFERENCES "Reservation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Dispute" ADD CONSTRAINT "Dispute_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "Payment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PayoutItem" ADD CONSTRAINT "PayoutItem_payoutId_fkey" FOREIGN KEY ("payoutId") REFERENCES "Payout"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PayoutItem" ADD CONSTRAINT "PayoutItem_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "Payment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_reservationId_fkey" FOREIGN KEY ("reservationId") REFERENCES "Reservation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotificationDelivery" ADD CONSTRAINT "NotificationDelivery_notificationId_fkey" FOREIGN KEY ("notificationId") REFERENCES "Notification"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotificationDelivery" ADD CONSTRAINT "NotificationDelivery_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReviewReply" ADD CONSTRAINT "ReviewReply_reviewId_fkey" FOREIGN KEY ("reviewId") REFERENCES "Review"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReviewReply" ADD CONSTRAINT "ReviewReply_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- PostgreSQL enforces that one physical room cannot be assigned to overlapping active stays.
CREATE EXTENSION IF NOT EXISTS btree_gist;
ALTER TABLE "Reservation"
ADD CONSTRAINT "Reservation_no_active_room_overlap"
EXCLUDE USING gist (
  "roomUnitId" WITH =,
  daterange("checkInDate", "checkOutDate", '[)') WITH &&
)
WHERE (
  "roomUnitId" IS NOT NULL
  AND "status" IN ('CONFIRMED', 'UPCOMING', 'CHECKED_IN')
);

-- Complete the dedicated Node PMS PostgreSQL conversion.
ALTER TYPE "PropertyType" ADD VALUE IF NOT EXISTS 'GUESTHOUSE';
ALTER TYPE "PropertyType" ADD VALUE IF NOT EXISTS 'SHORT_TERM_LET';
ALTER TYPE "RoomUnitStatus" ADD VALUE IF NOT EXISTS 'CLEANING';
ALTER TYPE "RoomUnitStatus" ADD VALUE IF NOT EXISTS 'BLOCKED';

ALTER TABLE "Reservation" ADD COLUMN IF NOT EXISTS "unitsCount" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "RateRule" ADD COLUMN IF NOT EXISTS "ratePlanId" TEXT;
ALTER TABLE "VerificationDocument" ADD COLUMN IF NOT EXISTS "filename" TEXT NOT NULL DEFAULT 'document';
ALTER TABLE "VerificationDocument" ALTER COLUMN "filename" DROP DEFAULT;

CREATE TABLE IF NOT EXISTS "RatePlan" (
  "id" TEXT NOT NULL, "propertyId" TEXT NOT NULL, "name" TEXT NOT NULL,
  "minimumStay" INTEGER NOT NULL DEFAULT 1, "taxBps" INTEGER NOT NULL DEFAULT 0,
  "serviceFee" DECIMAL(12,2) NOT NULL DEFAULT 0, "active" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "RatePlan_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "RatePlan_propertyId_active_createdAt_id_idx" ON "RatePlan"("propertyId", "active", "createdAt", "id");
ALTER TABLE "RatePlan" ADD CONSTRAINT "RatePlan_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;
CREATE INDEX IF NOT EXISTS "RateRule_ratePlanId_idx" ON "RateRule"("ratePlanId");
ALTER TABLE "RateRule" ADD CONSTRAINT "RateRule_ratePlanId_fkey" FOREIGN KEY ("ratePlanId") REFERENCES "RatePlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE IF NOT EXISTS "OperationalTask" (
  "id" TEXT NOT NULL, "propertyId" TEXT NOT NULL, "roomUnitId" TEXT,
  "type" TEXT NOT NULL, "status" TEXT NOT NULL DEFAULT 'OPEN', "note" TEXT NOT NULL,
  "assignedToId" TEXT, "dueAt" TIMESTAMP(3), "completedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "OperationalTask_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "OperationalTask_propertyId_status_createdAt_id_idx" ON "OperationalTask"("propertyId", "status", "createdAt", "id");
CREATE INDEX IF NOT EXISTS "OperationalTask_assignedToId_status_dueAt_idx" ON "OperationalTask"("assignedToId", "status", "dueAt");
ALTER TABLE "OperationalTask" ADD CONSTRAINT "OperationalTask_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "OperationalTask" ADD CONSTRAINT "OperationalTask_roomUnitId_fkey" FOREIGN KEY ("roomUnitId") REFERENCES "RoomUnit"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE IF NOT EXISTS "PlatformSetting" (
  "key" TEXT NOT NULL, "value" JSONB NOT NULL, "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "PlatformSetting_pkey" PRIMARY KEY ("key")
);

ALTER TABLE "PayoutItem" ADD COLUMN IF NOT EXISTS "providerTransferId" TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS "PayoutItem_providerTransferId_key" ON "PayoutItem"("providerTransferId");
