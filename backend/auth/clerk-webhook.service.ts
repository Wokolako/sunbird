import { verifyWebhook } from "@clerk/backend/webhooks";
import { config } from "../config";
import { prisma } from "../data/prisma";
import { createHash } from "node:crypto";

export async function syncClerkWebhook(headers: Headers, payload: string) {
  if (!config.clerkWebhookSigningSecret)
    throw new Error("Clerk webhook signing secret is not configured.");
  const event = await verifyWebhook(
    new Request("http://localhost/api/webhooks/clerk", {
      method: "POST",
      headers,
      body: payload,
    }),
    { signingSecret: config.clerkWebhookSigningSecret }
  );
  const eventId = headers.get("svix-id") || "";
  if (!eventId) throw new Error("Webhook event ID is missing.");
  if (await prisma.providerEvent.findUnique({ where: { id: eventId } }))
    return { duplicate: true };
  await prisma.$transaction(async (tx) => {
    if (event.type === "user.created" || event.type === "user.updated") {
      const user = event.data as any;
      const email =
        user.email_addresses?.find(
          (item: any) => item.id === user.primary_email_address_id
        )?.email_address || user.email_addresses?.[0]?.email_address;
      if (!email) throw new Error("Clerk user has no email address.");
      const name = `${user.first_name || ""} ${user.last_name || ""}`.trim() || email;
      const existing = await tx.user.findFirst({ where: { OR: [{ clerkUserId: user.id }, { email: email.toLowerCase() }] } });
      if (existing) await tx.user.update({ where: { id: existing.id }, data: { clerkUserId: user.id, name, email: email.toLowerCase(), accountStatus: "ACTIVE" } });
      else await tx.user.create({ data: { clerkUserId: user.id, name, email: email.toLowerCase(), role: "GUEST" } });
    }
    if (event.type === "user.deleted" && event.data.id) {
      await tx.user.updateMany({ where: { clerkUserId: event.data.id }, data: { accountStatus: "DELETED" } });
    }
    await tx.providerEvent.create({ data: { id: eventId, provider: "clerk", type: event.type, payloadHash: createHash("sha256").update(payload).digest("hex"), processedAt: new Date() } });
  });
  return { duplicate: false };
}
