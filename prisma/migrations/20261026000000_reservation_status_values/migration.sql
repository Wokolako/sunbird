-- PostgreSQL requires newly added enum values to be committed before a later
-- migration can use them in constraints or indexes.
ALTER TYPE "ReservationStatus" ADD VALUE IF NOT EXISTS 'REQUESTED';
ALTER TYPE "ReservationStatus" ADD VALUE IF NOT EXISTS 'HELD';
ALTER TYPE "ReservationStatus" ADD VALUE IF NOT EXISTS 'PAYMENT_PENDING';
ALTER TYPE "ReservationStatus" ADD VALUE IF NOT EXISTS 'CONFIRMED';
ALTER TYPE "ReservationStatus" ADD VALUE IF NOT EXISTS 'DECLINED';
ALTER TYPE "ReservationStatus" ADD VALUE IF NOT EXISTS 'EXPIRED';
