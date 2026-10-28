import { commercialPolicy } from "../production/config";

export type CancellationReason = "guest" | "property" | "platform" | "no_show";

export function refundQuote(input: {
  amountMinor: number;
  checkIn: Date;
  cancelledAt?: Date;
  reason: CancellationReason;
}) {
  if (!Number.isInteger(input.amountMinor) || input.amountMinor < 0)
    throw new Error("Refund amount is invalid.");
  const policy = commercialPolicy();
  const cancelledAt = input.cancelledAt || new Date();
  const hoursBefore = (input.checkIn.getTime() - cancelledAt.getTime()) / 3_600_000;
  let refundBps = 0;
  if (input.reason === "property" || input.reason === "platform") refundBps = 10000;
  else if (input.reason === "no_show") refundBps = 0;
  else if (hoursBefore >= policy.freeCancellationHours) refundBps = 10000;
  else if (hoursBefore >= policy.partialRefundHours) refundBps = policy.partialRefundBps;
  return {
    amountMinor: Math.round((input.amountMinor * refundBps) / 10000),
    refundBps,
    hoursBeforeCheckIn: Math.floor(hoursBefore),
    policy,
  };
}

export function commissionQuote(grossMinor: number) {
  if (!Number.isInteger(grossMinor) || grossMinor < 0)
    throw new Error("Gross amount is invalid.");
  const policy = commercialPolicy();
  const commissionMinor = Math.round((grossMinor * policy.commissionBps) / 10000);
  return {
    grossMinor,
    commissionMinor,
    netMinor: grossMinor - commissionMinor,
    commissionBps: policy.commissionBps,
  };
}
