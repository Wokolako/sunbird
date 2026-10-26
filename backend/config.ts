import path from "node:path";

export const config = {
  port: Number(process.env.BACKEND_PORT || 4000),
  host: process.env.BACKEND_HOST || "127.0.0.1",
  databasePath: process.env.DATABASE_PATH || path.join(process.cwd(), "data", "finder.sqlite"),
  uploadDirectory: process.env.UPLOAD_DIRECTORY || path.join(process.cwd(), "data", "uploads"),
  allowedOrigin: process.env.BACKEND_ALLOWED_ORIGIN || "http://localhost:3001",
};
