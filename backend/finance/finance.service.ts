import { randomUUID } from "node:crypto";
import type { AuthUser } from "../auth/auth.service";
import { audit, dateText, moneyMinor, prisma, propertyAccess } from "../data/prisma";
import { commissionQuote, refundQuote, type CancellationReason } from "../../lib/payments/policy";
import { createAccountOnboardingLink, createConnectedAccount, createStripeRefund, paymentIntentCharge, transferPropertyFunds } from "../../lib/payments/connect";
import { commercialPolicy } from "../../lib/production/config";

const major = (minor: number) => minor / 100;
const reference = (prefix: string) => `${prefix}-${new Date().toISOString().slice(0, 10).replaceAll("-", "")}-${randomUUID().slice(0, 8).toUpperCase()}`;

async function accessibleProperties(user: AuthUser) {
  if (user.role === "admin") return undefined;
  return (await prisma.property.findMany({ where: { OR: [{ organisation: { memberships: { some: { userId: user.id, active: true } } } }, { staff: { some: { userId: user.id, active: true } } }] }, select: { id: true } })).map((item) => item.id);
}

export async function financialWorkspace(user: AuthUser) {
  const propertyIds = await accessibleProperties(user);
  if (user.role !== "admin" && !propertyIds?.length) return { summary: emptySummary(), payments: [], refunds: [], payouts: [], disputes: [], commissions: [] };
  const propertyWhere = propertyIds ? { in: propertyIds } : undefined;
  const [payments, refunds, payouts, disputes, commissionProperties] = await Promise.all([
    prisma.payment.findMany({ where: { reservation: { propertyId: propertyWhere } }, include: { reservation: { include: { property: true, guest: true } }, refunds: true, payoutItems: true }, orderBy: { createdAt: "desc" }, take: 200 }),
    prisma.refund.findMany({ where: { reservation: { propertyId: propertyWhere } }, include: { reservation: { include: { property: true, guest: true } }, payment: true }, orderBy: { createdAt: "desc" }, take: 200 }),
    prisma.payout.findMany({ where: { propertyId: propertyWhere }, include: { property: true, items: true }, orderBy: { createdAt: "desc" }, take: 100 }),
    prisma.dispute.findMany({ where: { payment: { reservation: { propertyId: propertyWhere } } }, include: { payment: { include: { reservation: { include: { property: true } } } } }, orderBy: { createdAt: "desc" }, take: 100 }),
    prisma.property.findMany({ where: { id: propertyWhere }, include: { commissionSetting: true }, orderBy: { name: "asc" } }),
  ]);
  const completed = payments.filter((item) => ["COMPLETED", "PARTIALLY_REFUNDED", "REFUNDED"].includes(item.status));
  const grossMinor = completed.reduce((sum, item) => sum + moneyMinor(item.amount), 0);
  const refundedMinor = refunds.filter((item) => item.status === "SUCCEEDED").reduce((sum, item) => sum + moneyMinor(item.amount), 0);
  const commissionMinor = completed.reduce((sum, item) => sum + (item.applicationFeeAmount ? moneyMinor(item.applicationFeeAmount) : commissionQuote(moneyMinor(item.amount)).commissionMinor), 0);
  const paidOutMinor = payouts.filter((item) => item.status === "PAID").reduce((sum, item) => sum + moneyMinor(item.netPayout), 0);
  const pendingPayoutMinor = payouts.filter((item) => ["PENDING", "PROCESSING"].includes(item.status)).reduce((sum, item) => sum + moneyMinor(item.netPayout), 0);
  return {
    summary: { grossMinor, refundedMinor, commissionMinor, netMinor: grossMinor - refundedMinor - commissionMinor, paidOutMinor, pendingPayoutMinor, paymentCount: payments.length, refundCount: refunds.length, disputeCount: disputes.length },
    payments: payments.map((item) => ({ id: item.id, reservation_id: item.reservationId, property_id: item.reservation.propertyId, property_name: item.reservation.property.name, guest_name: item.reservation.guest.name, guest_email: item.reservation.guest.email, amount_minor: moneyMinor(item.amount), application_fee_minor: item.applicationFeeAmount ? moneyMinor(item.applicationFeeAmount) : commissionQuote(moneyMinor(item.amount)).commissionMinor, transferred_minor: item.transferredAmount ? moneyMinor(item.transferredAmount) : 0, currency: item.currency, status: item.status.toLowerCase(), paid_at: item.paidAt, created_at: item.createdAt, refundable_minor: Math.max(0, moneyMinor(item.amount) - item.refunds.filter((refund) => refund.status === "SUCCEEDED").reduce((sum, refund) => sum + moneyMinor(refund.amount), 0)), in_payout: item.payoutItems.length > 0 })),
    refunds: refunds.map((item) => ({ id: item.id, payment_id: item.paymentId, reservation_id: item.reservationId, property_name: item.reservation.property.name, guest_name: item.reservation.guest.name, amount_minor: moneyMinor(item.amount), currency: item.currency, reason: item.reason, status: item.status.toLowerCase(), provider_refund_id: item.providerRefundId, failure_reason: item.failureReason, created_at: item.createdAt })),
    payouts: payouts.map((item) => ({ id: item.id, property_id: item.propertyId, property_name: item.property.name, reference: item.payoutReference, period_start: dateText(item.periodStart), period_end: dateText(item.periodEnd), gross_minor: moneyMinor(item.grossRevenue), commission_minor: moneyMinor(item.commissionFee), net_minor: moneyMinor(item.netPayout), commission_rate: Number(item.commissionRate), status: item.status.toLowerCase(), item_count: item.items.length, provider_payout_id: item.providerPayoutId, failure_reason: item.failureReason, created_at: item.createdAt })),
    disputes: disputes.map((item) => ({ id: item.id, payment_id: item.paymentId, property_name: item.payment.reservation.property.name, amount_minor: moneyMinor(item.amount), currency: item.currency, reason: item.reason, status: item.status.toLowerCase(), response_due_at: item.responseDueAt, created_at: item.createdAt })),
    commissions: commissionProperties.map((property) => ({ id: property.commissionSetting?.id, property_id: property.id, property_name: property.name, percentage: Number(property.commissionSetting?.percentage ?? commercialPolicy().commissionBps / 100), payout_schedule: (property.commissionSetting?.payoutSchedule ?? "WEEKLY").toLowerCase(), reserve_days: property.commissionSetting?.reserveDays ?? commercialPolicy().reserveDays, effective_from: property.commissionSetting?.effectiveFrom ?? null })),
  };
}

function emptySummary() { return { grossMinor: 0, refundedMinor: 0, commissionMinor: 0, netMinor: 0, paidOutMinor: 0, pendingPayoutMinor: 0, paymentCount: 0, refundCount: 0, disputeCount: 0 }; }

export async function createRefundRequest(user: AuthUser, reservationId: string, reason: CancellationReason) {
  const reservation = await prisma.reservation.findUnique({ where: { id: reservationId }, include: { payments: { where: { status: { in: ["COMPLETED", "PARTIALLY_REFUNDED"] } }, include: { refunds: true }, orderBy: { paidAt: "desc" }, take: 1 } } });
  if (!reservation || !reservation.payments[0]) return null;
  if (user.role !== "admin" && user.role !== "guest" && !(await propertyAccess(user, reservation.propertyId, ["OWNER", "MANAGER"]))) return null;
  if (user.role === "guest" && reservation.guestId !== user.id) return null;
  const payment = reservation.payments[0];
  const alreadyRefunded = payment.refunds.filter((item) => item.status === "SUCCEEDED").reduce((sum, item) => sum + moneyMinor(item.amount), 0);
  const quote = refundQuote({ amountMinor: Math.max(0, moneyMinor(payment.amount) - alreadyRefunded), checkIn: reservation.checkInDate, reason });
  if (!quote.amountMinor) return null;
  const existing = payment.refunds.find((item) => ["REQUESTED", "PENDING"].includes(item.status));
  if (existing) return { id: existing.id, amountMinor: moneyMinor(existing.amount), status: existing.status.toLowerCase() };
  const refund = await prisma.refund.create({ data: { paymentId: payment.id, reservationId, amount: major(quote.amountMinor), currency: payment.currency, reason, requestedById: user.id } });
  await audit(user, "refund", refund.id, "request", { reservationId, amountMinor: quote.amountMinor, refundBps: quote.refundBps, reason });
  return { id: refund.id, amountMinor: quote.amountMinor, status: "requested" };
}

export async function processRefund(user: AuthUser, refundId: string) {
  if (user.role !== "admin") return null;
  const refund = await prisma.refund.findUnique({ where: { id: refundId }, include: { payment: { include: { refunds: true } } } });
  if (!refund) throw new Error("Refund request not found.");
  if (!["REQUESTED", "FAILED"].includes(refund.status)) throw new Error("This refund is already being processed.");
  if (!refund.payment.providerPaymentId) throw new Error("The payment has no Stripe payment-intent reference.");
  await prisma.refund.update({ where: { id: refund.id }, data: { status: "PENDING", failureReason: null } });
  try {
    const stripeRefund = await createStripeRefund({ paymentIntentId: refund.payment.providerPaymentId, refundId: refund.id, amountMinor: moneyMinor(refund.amount) });
    const succeeded = stripeRefund.status === "succeeded";
    await prisma.$transaction(async (tx) => {
      await tx.refund.update({ where: { id: refund.id }, data: { providerRefundId: stripeRefund.id, status: succeeded ? "SUCCEEDED" : "PENDING" } });
      if (succeeded) {
        const total = refund.payment.refunds.filter((item) => item.status === "SUCCEEDED").reduce((sum, item) => sum + moneyMinor(item.amount), moneyMinor(refund.amount));
        await tx.payment.update({ where: { id: refund.paymentId }, data: { status: total >= moneyMinor(refund.payment.amount) ? "REFUNDED" : "PARTIALLY_REFUNDED" } });
      }
      await audit(user, "refund", refund.id, "process", { providerRefundId: stripeRefund.id, status: stripeRefund.status }, tx);
    });
    return { id: refund.id, status: succeeded ? "succeeded" : "pending" };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Stripe refund failed.";
    await prisma.refund.update({ where: { id: refund.id }, data: { status: "FAILED", failureReason: message } });
    throw new Error(message);
  }
}

export async function updateCommission(user: AuthUser, input: { propertyId: string; percentage: number; schedule: string; reserveDays: number }) {
  if (user.role !== "admin") return null;
  if (!Number.isFinite(input.percentage) || input.percentage < 0 || input.percentage > 50 || !Number.isInteger(input.reserveDays) || input.reserveDays < 0 || input.reserveDays > 90) throw new Error("Enter a valid commission and reserve period.");
  const schedule = ({ weekly: "WEEKLY", bi_weekly: "BI_WEEKLY", monthly: "MONTHLY" } as const)[input.schedule as "weekly" | "bi_weekly" | "monthly"];
  if (!schedule) throw new Error("Choose a payout schedule.");
  const setting = await prisma.commissionSetting.upsert({ where: { propertyId: input.propertyId }, update: { percentage: input.percentage, payoutSchedule: schedule, reserveDays: input.reserveDays, effectiveFrom: new Date() }, create: { propertyId: input.propertyId, percentage: input.percentage, payoutSchedule: schedule, reserveDays: input.reserveDays } });
  await audit(user, "commission", setting.id, "update", input);
  return { id: setting.id };
}

export async function generatePayouts(user: AuthUser) {
  if (user.role !== "admin") return null;
  const policy = commercialPolicy();
  const properties = await prisma.property.findMany({ include: { commissionSetting: true, organisation: true } });
  const created: string[] = [];
  for (const property of properties) {
    const reserveDays = property.commissionSetting?.reserveDays ?? policy.reserveDays;
    const cutoff = new Date(Date.now() - reserveDays * 86_400_000);
    const payments = await prisma.payment.findMany({ where: { status: { in: ["COMPLETED", "PARTIALLY_REFUNDED"] }, paidAt: { lte: cutoff }, reservation: { propertyId: property.id, status: "CHECKED_OUT" }, payoutItems: { none: {} } }, include: { refunds: true } });
    if (!payments.length) continue;
    const percentage = Number(property.commissionSetting?.percentage ?? policy.commissionBps / 100);
    const itemData = payments.map((payment) => { const refunded = payment.refunds.filter((item) => item.status === "SUCCEEDED").reduce((sum, item) => sum + moneyMinor(item.amount), 0); const gross = Math.max(0, moneyMinor(payment.amount) - refunded); const commission = Math.round(gross * percentage / 100); return { paymentId: payment.id, gross, commission, net: gross - commission }; }).filter((item) => item.net > 0);
    if (!itemData.length) continue;
    const payout = await prisma.payout.create({ data: { propertyId: property.id, payoutReference: reference("PO"), periodStart: new Date(Math.min(...payments.map((item) => item.paidAt?.getTime() || Date.now()))), periodEnd: cutoff, grossRevenue: major(itemData.reduce((sum, item) => sum + item.gross, 0)), commissionRate: percentage, commissionFee: major(itemData.reduce((sum, item) => sum + item.commission, 0)), netPayout: major(itemData.reduce((sum, item) => sum + item.net, 0)), items: { create: itemData.map((item) => ({ paymentId: item.paymentId, gross: major(item.gross), commission: major(item.commission), net: major(item.net) })) } } });
    created.push(payout.id);
    await audit(user, "payout", payout.id, "generate", { propertyId: property.id, items: itemData.length });
  }
  return { created: created.length, ids: created };
}

export async function startConnectOnboarding(user: AuthUser) {
  if (user.role !== "owner") return null;
  const organisation = await prisma.organisation.findFirst({ where: { memberships: { some: { userId: user.id, active: true, role: "OWNER" } } } });
  if (!organisation) throw new Error("Your organisation could not be found.");
  let accountId = organisation.stripeAccountId;
  if (!accountId) {
    const account = await createConnectedAccount({ email: organisation.email, country: process.env.STRIPE_ACCOUNT_COUNTRY || "GB", organisationId: organisation.id });
    accountId = account.id;
    await prisma.organisation.update({ where: { id: organisation.id }, data: { stripeAccountId: accountId } });
    await audit(user, "organisation", organisation.id, "stripe_connect_create", { accountId });
  }
  const link = await createAccountOnboardingLink({ accountId, organisationId: organisation.id });
  return { url: link.url };
}

export async function processPayout(user: AuthUser, payoutId: string) {
  if (user.role !== "admin") return null;
  const payout = await prisma.payout.findUnique({ where: { id: payoutId }, include: { property: { include: { organisation: true } }, items: { include: { payment: true } } } });
  if (!payout) throw new Error("Payout not found.");
  if (!["PENDING", "FAILED"].includes(payout.status)) throw new Error("This payout cannot be processed again.");
  const account = payout.property.organisation;
  if (!account?.stripeAccountId || !account.stripePayoutsReady) throw new Error("The property organisation has not completed Stripe payout onboarding.");
  await prisma.payout.update({ where: { id: payout.id }, data: { status: "PROCESSING", failureReason: null } });
  try {
    for (const item of payout.items) {
      if (item.providerTransferId) continue;
      if (!item.payment.providerPaymentId) throw new Error(`Payment ${item.paymentId} has no Stripe payment intent.`);
      const chargeId = await paymentIntentCharge(item.payment.providerPaymentId);
      const transfer = await transferPropertyFunds({ bookingId: item.payment.reservationId, chargeId, connectedAccountId: account.stripeAccountId, grossMinor: moneyMinor(item.gross), netMinor: moneyMinor(item.net) });
      await prisma.$transaction([prisma.payoutItem.update({ where: { id: item.id }, data: { providerTransferId: transfer.id } }), prisma.payment.update({ where: { id: item.paymentId }, data: { transferredAmount: item.net } })]);
    }
    await prisma.payout.update({ where: { id: payout.id }, data: { status: "PAID", processedAt: new Date(), providerPayoutId: `transfers:${payout.id}` } });
    await audit(user, "payout", payout.id, "pay", { amountMinor: moneyMinor(payout.netPayout) });
    return { id: payout.id, status: "paid" };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Payout failed.";
    await prisma.payout.update({ where: { id: payout.id }, data: { status: "FAILED", failureReason: message } });
    throw new Error(message);
  }
}
