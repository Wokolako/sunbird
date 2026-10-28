import assert from "node:assert/strict";
import { commissionQuote, refundQuote } from "../lib/payments/policy";
import { page, pageResult } from "../lib/pagination";
import { commercialPolicy } from "../lib/production/config";

const keys = [
  "PLATFORM_COMMISSION_BPS",
  "PAYOUT_SCHEDULE",
  "PAYOUT_RESERVE_DAYS",
  "FREE_CANCELLATION_HOURS",
  "PARTIAL_REFUND_HOURS",
  "PARTIAL_REFUND_BPS",
] as const;
const before = Object.fromEntries(keys.map((key) => [key, process.env[key]]));

try {
  process.env.PLATFORM_COMMISSION_BPS = "1200";
  process.env.PAYOUT_SCHEDULE = "weekly";
  process.env.PAYOUT_RESERVE_DAYS = "7";
  process.env.FREE_CANCELLATION_HOURS = "48";
  process.env.PARTIAL_REFUND_HOURS = "24";
  process.env.PARTIAL_REFUND_BPS = "5000";

  assert.deepEqual(commissionQuote(10_000), {
    grossMinor: 10_000,
    commissionMinor: 1_200,
    netMinor: 8_800,
    commissionBps: 1_200,
  });
  const checkIn = new Date("2026-12-10T12:00:00Z");
  assert.equal(
    refundQuote({
      amountMinor: 20_000,
      checkIn,
      cancelledAt: new Date("2026-12-08T11:59:00Z"),
      reason: "guest",
    }).amountMinor,
    20_000
  );
  assert.equal(
    refundQuote({
      amountMinor: 20_000,
      checkIn,
      cancelledAt: new Date("2026-12-09T00:00:00Z"),
      reason: "guest",
    }).amountMinor,
    10_000
  );
  assert.equal(
    refundQuote({
      amountMinor: 20_000,
      checkIn,
      cancelledAt: new Date("2026-12-10T00:00:00Z"),
      reason: "guest",
    }).amountMinor,
    0
  );
  assert.equal(
    refundQuote({ amountMinor: 20_000, checkIn, reason: "property" }).amountMinor,
    20_000
  );
  assert.equal(commercialPolicy().reserveDays, 7);
  assert.equal(page({ limit: 1000 }).take, 101);
  assert.deepEqual(
    pageResult(
      Array.from({ length: 3 }, (_, index) => ({ id: String(index) })),
      2
    ),
    { items: [{ id: "0" }, { id: "1" }], nextCursor: "1" }
  );
  console.log(
    "PASS: production commission, cancellation, payout, and cursor pagination policies"
  );
} finally {
  for (const key of keys) {
    const value = before[key];
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
}
