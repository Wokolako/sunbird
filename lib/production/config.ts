import { z } from "zod";

const schema = z.object({
  DATABASE_URL: z.string().url(),
  DIRECT_URL: z.string().url(),
  PLATFORM_COMMISSION_BPS: z.coerce.number().int().min(0).max(5000).default(1200),
  PAYOUT_SCHEDULE: z.enum(["weekly", "bi_weekly", "monthly"]).default("weekly"),
  PAYOUT_RESERVE_DAYS: z.coerce.number().int().min(0).max(90).default(7),
  FREE_CANCELLATION_HOURS: z.coerce.number().int().min(0).max(720).default(48),
  PARTIAL_REFUND_HOURS: z.coerce.number().int().min(0).max(720).default(24),
  PARTIAL_REFUND_BPS: z.coerce.number().int().min(0).max(10000).default(5000),
  MAPBOX_ACCESS_TOKEN: z.string().min(1),
  RESEND_API_KEY: z.string().startsWith("re_"),
  EMAIL_FROM: z.string().min(3),
  TWILIO_ACCOUNT_SID: z.string().startsWith("AC"),
  TWILIO_AUTH_TOKEN: z.string().min(1),
  TWILIO_PHONE_NUMBER: z.string().min(5),
  R2_ACCOUNT_ID: z.string().min(1),
  R2_ACCESS_KEY_ID: z.string().min(1),
  R2_SECRET_ACCESS_KEY: z.string().min(1),
  R2_BUCKET: z.string().min(1),
  R2_PUBLIC_BASE_URL: z.string().url().optional(),
  STRIPE_SECRET_KEY: z.string().startsWith("sk_"),
  STRIPE_WEBHOOK_SECRET: z.string().startsWith("whsec_"),
  STRIPE_CONNECT_ENABLED: z.enum(["true", "false"]).default("false"),
  GUEST_APP_URL: z.string().url(),
  MANAGER_APP_URL: z.string().url(),
  ADMIN_APP_URL: z.string().url(),
  CRON_SECRET: z.string().min(16),
});

export type ProductionConfig = z.infer<typeof schema>;

export function productionConfig(
  environment: Record<string, string | undefined> = process.env
): ProductionConfig {
  return schema.parse(environment);
}

export function commercialPolicy(
  environment: Record<string, string | undefined> = process.env
) {
  const commissionBps = Number(environment.PLATFORM_COMMISSION_BPS || 1200);
  const reserveDays = Number(environment.PAYOUT_RESERVE_DAYS || 7);
  const freeCancellationHours = Number(environment.FREE_CANCELLATION_HOURS || 48);
  const partialRefundHours = Number(environment.PARTIAL_REFUND_HOURS || 24);
  const partialRefundBps = Number(environment.PARTIAL_REFUND_BPS || 5000);
  if (
    !Number.isInteger(commissionBps) ||
    commissionBps < 0 ||
    commissionBps > 5000 ||
    !Number.isInteger(reserveDays) ||
    reserveDays < 0 ||
    !Number.isInteger(freeCancellationHours) ||
    !Number.isInteger(partialRefundHours) ||
    partialRefundHours > freeCancellationHours ||
    !Number.isInteger(partialRefundBps) ||
    partialRefundBps < 0 ||
    partialRefundBps > 10000
  )
    throw new Error("Commercial policy environment variables are invalid.");
  return {
    commissionBps,
    payoutSchedule: environment.PAYOUT_SCHEDULE || "weekly",
    reserveDays,
    freeCancellationHours,
    partialRefundHours,
    partialRefundBps,
  };
}
