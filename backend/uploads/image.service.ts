import { mkdirSync, writeFileSync, existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { config } from "../config";

const types: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };
const MAX_IMAGE_BYTES = 5_000_000;

export function savePropertyImage(input: { filename?: unknown; mime?: unknown; base64?: unknown }) {
  const mime = String(input.mime || ""); const extension = types[mime];
  if (!extension) throw new Error("Upload a JPEG, PNG, or WebP image.");
  const value = String(input.base64 || "").replace(/^data:[^;]+;base64,/, "");
  if (!value || !/^[A-Za-z0-9+/=]+$/.test(value)) throw new Error("A base64-encoded image is required.");
  const bytes = Buffer.from(value, "base64");
  if (!bytes.length || bytes.length > MAX_IMAGE_BYTES) throw new Error("Images must be no larger than 5 MB.");
  mkdirSync(config.uploadDirectory, { recursive: true });
  const key = `${randomUUID()}.${extension}`;
  writeFileSync(path.join(config.uploadDirectory, key), bytes, { flag: "wx" });
  return { key, url: `/uploads/${key}`, mime, bytes: bytes.length };
}

export function readPropertyImage(key: string) {
  if (!/^[a-f0-9-]+\.(jpg|png|webp)$/.test(key)) return null;
  const file = path.join(config.uploadDirectory, key); if (!existsSync(file)) return null;
  const extension = path.extname(key); const mime = extension === ".jpg" ? "image/jpeg" : extension === ".png" ? "image/png" : "image/webp";
  return { mime, content: readFileSync(file) };
}
