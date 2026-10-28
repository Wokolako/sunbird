import { createServer } from "node:http";
import { config } from "./config";
import { route } from "./routes/api.routes";
import { deliverQueuedNotifications } from "../lib/notifications/service";
import { generateScheduledPayouts } from "./finance/finance.service";
import { prisma } from "./data/prisma";

const server = createServer(async (request, response) => {
  response.setHeader("Access-Control-Allow-Origin", config.allowedOrigin);
  response.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  response.setHeader("Access-Control-Allow-Methods", "GET, POST, PATCH, OPTIONS");
  if (request.method === "OPTIONS") { response.writeHead(204); response.end(); return; }
  try { await route(request, response); } catch (error) { console.error(error); response.writeHead(500, { "Content-Type": "application/json" }); response.end(JSON.stringify({ error: "Internal server error." })); }
});

// Scheduled Notification Queue & Booking Hold Worker (runs every 30 seconds)
const WORKER_INTERVAL_MS = 30_000;
let workerRunning = false;

async function runBackgroundTasks() {
  if (workerRunning) return;
  workerRunning = true;
  try {
    // 1. Clean up expired booking holds (15-min lock expiry)
    const expiredHolds = await prisma.bookingHold.updateMany({
      where: {
        expiresAt: { lt: new Date() },
        releasedAt: null,
        convertedAt: null,
      },
      data: { releasedAt: new Date() },
    });
    if (expiredHolds.count > 0) {
      console.log(`[Worker] Released ${expiredHolds.count} expired booking hold(s).`);
    }

    // 2. Deliver queued notifications
    const delivered = await deliverQueuedNotifications(25);
    if (delivered.length > 0) {
      console.log(`[Worker] Delivered ${delivered.length} queued notification(s).`);
    }

    // 3. Automated payout generation per property schedule
    const payouts = await generateScheduledPayouts();
    if (payouts && payouts.created > 0) {
      console.log(`[Worker] Generated ${payouts.created} scheduled payout(s) per property schedule.`);
    }
  } catch (err) {
    console.error("[Worker] Background task execution error:", err instanceof Error ? err.message : err);
  } finally {
    workerRunning = false;
  }
}

const workerTimer = setInterval(runBackgroundTasks, WORKER_INTERVAL_MS);
// Run initial pass after 3 seconds
setTimeout(runBackgroundTasks, 3_000);

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => {
    clearInterval(workerTimer);
    server.close();
  });
}

server.listen(config.port, config.host, () => console.log(`Vabbot PMS backend listening on http://${config.host}:${config.port}`));

