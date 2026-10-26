import { createServer } from "node:http";
import { config } from "./config";
import { database } from "./database";
import { route } from "./routes/api.routes";

database();
const server = createServer(async (request, response) => {
  response.setHeader("Access-Control-Allow-Origin", config.allowedOrigin);
  response.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  response.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  if (request.method === "OPTIONS") { response.writeHead(204); response.end(); return; }
  try { await route(request, response); } catch (error) { console.error(error); response.writeHead(500, { "Content-Type": "application/json" }); response.end(JSON.stringify({ error: "Internal server error." })); }
});
server.listen(config.port, config.host, () => console.log(`Vabbot PMS backend listening on http://${config.host}:${config.port}`));
