import { verifyWebhook } from "@clerk/backend/webhooks";
import { database } from "../database";
import { config } from "../config";

export async function syncClerkWebhook(headers: Headers, payload: string) {
  if (!config.clerkWebhookSigningSecret) throw new Error("Clerk webhook signing secret is not configured.");
  const event = await verifyWebhook(new Request("http://localhost/api/webhooks/clerk", { method: "POST", headers, body: payload }), { signingSecret: config.clerkWebhookSigningSecret });
  const db = database();
  const eventId = headers.get("svix-id") || "";
  if (!eventId) throw new Error("Webhook event ID is missing.");
  if (db.prepare("SELECT 1 FROM clerk_webhook_events WHERE id=?").get(eventId)) return { duplicate: true };
  db.exec("BEGIN IMMEDIATE");
  try {
    if (event.type === "user.created" || event.type === "user.updated") {
      const user = event.data as any;
      const email = user.email_addresses?.find((item: any) => item.id === user.primary_email_address_id)?.email_address || user.email_addresses?.[0]?.email_address;
      if (!email) throw new Error("Clerk user has no email address.");
      const name = `${user.first_name || ""} ${user.last_name || ""}`.trim() || email;
      const existing = db.prepare("SELECT id FROM users WHERE clerk_user_id=? OR email=?").get(user.id, email.toLowerCase()) as { id: string } | undefined;
      if (existing) db.prepare("UPDATE users SET clerk_user_id=?,name=?,email=?,status='active' WHERE id=?").run(user.id, name, email.toLowerCase(), existing.id);
      else db.prepare("INSERT INTO users(id,name,email,phone,password_hash,role,status,clerk_user_id) VALUES(?,?,?,?,?,'guest','active',?)").run(`clerk_${user.id}`, name, email.toLowerCase(), "", "clerk-managed", user.id);
    }
    if (event.type === "user.deleted" && event.data.id) {
      db.prepare("UPDATE users SET status='suspended' WHERE clerk_user_id=?").run(event.data.id);
    }
    db.prepare("INSERT INTO clerk_webhook_events(id,event_type) VALUES(?,?)").run(eventId, event.type);
    db.exec("COMMIT"); return { duplicate: false };
  } catch (error) { db.exec("ROLLBACK"); throw error; }
}
