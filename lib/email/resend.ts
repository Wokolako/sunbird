export async function sendEmail(input: {
  to: string;
  subject: string;
  html: string;
  text?: string;
}) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;
  if (!apiKey || !from) throw new Error("Resend email is not configured.");
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "Idempotency-Key": crypto.randomUUID(),
    },
    body: JSON.stringify({ from, ...input }),
    signal: AbortSignal.timeout(10000),
  });
  const data = (await response.json()) as { id?: string; message?: string };
  if (!response.ok || !data.id) throw new Error(data.message || "Email delivery failed.");
  return { provider: "resend", id: data.id };
}
