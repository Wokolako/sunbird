import { NotificationChannel, Prisma } from "@prisma/client";
import prisma from "../prisma";
import { sendEmail } from "../email/resend";
import { getSmsProvider } from "../sms";
import { baseLayout } from "./templates";

export async function queueNotification(input: {
  userId: string;
  type: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  email?: string;
  phone?: string;
}) {
  return prisma.notification.create({
    data: {
      userId: input.userId,
      type: input.type,
      title: input.title,
      body: input.body,
      data: input.data as Prisma.InputJsonValue | undefined,
      deliveries: {
        create: [
          ...(input.email
            ? [
                {
                  userId: input.userId,
                  channel: NotificationChannel.EMAIL,
                  destination: input.email,
                  provider: "resend",
                },
              ]
            : []),
          ...(input.phone
            ? [
                {
                  userId: input.userId,
                  channel: NotificationChannel.SMS,
                  destination: input.phone,
                  provider: "twilio",
                },
              ]
            : []),
          {
            userId: input.userId,
            channel: NotificationChannel.IN_APP,
            destination: input.userId,
            provider: "internal",
            status: "DELIVERED" as const,
            sentAt: new Date(),
          },
        ],
      },
    },
  });
}

export async function deliverQueuedNotifications(limit = 50) {
  const deliveries = await prisma.notificationDelivery.findMany({
    where: {
      status: "QUEUED",
      OR: [{ nextAttemptAt: null }, { nextAttemptAt: { lte: new Date() } }],
      channel: { in: ["EMAIL", "SMS"] },
    },
    include: { notification: true },
    orderBy: { createdAt: "asc" },
    take: Math.min(Math.max(limit, 1), 100),
  });
  const results = [];
  for (const delivery of deliveries) {
    try {
      const customHtml = (delivery.notification.data as Record<string, unknown> | null)?.html as string | undefined;
      const htmlBody = customHtml || baseLayout(
        delivery.notification.title,
        `<h2 style="color: #0f172a; margin-top:0;">${escapeHtml(delivery.notification.title)}</h2><p style="color: #334155; line-height: 1.6;">${escapeHtml(delivery.notification.body)}</p>`
      );
      const providerResult =
        delivery.channel === "EMAIL"
          ? await sendEmail({
              to: delivery.destination,
              subject: delivery.notification.title,
              html: htmlBody,
              text: delivery.notification.body,
            })
          : await getSmsProvider().sendNotification(
              delivery.destination,
              delivery.notification.body
            );
      if ("success" in providerResult && !providerResult.success)
        throw new Error(providerResult.error || "SMS delivery failed.");
      const providerId =
        "id" in providerResult ? providerResult.id : providerResult.messageId;
      await prisma.notificationDelivery.update({
        where: { id: delivery.id },
        data: {
          status: "SENT",
          providerId,
          attempts: { increment: 1 },
          sentAt: new Date(),
          lastError: null,
        },
      });
      results.push({ id: delivery.id, status: "sent" });
    } catch (error) {
      const attempts = delivery.attempts + 1;
      await prisma.notificationDelivery.update({
        where: { id: delivery.id },
        data: {
          status: attempts >= 5 ? "FAILED" : "QUEUED",
          attempts,
          lastError: error instanceof Error ? error.message.slice(0, 1000) : "Failed",
          nextAttemptAt:
            attempts >= 5 ? null : new Date(Date.now() + 2 ** attempts * 60_000),
        },
      });
      results.push({ id: delivery.id, status: "failed" });
    }
  }
  return results;
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => {
    const entities: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };
    return entities[character];
  });
}
