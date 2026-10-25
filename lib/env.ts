import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  NEXTAUTH_SECRET: z.string().min(16, "NEXTAUTH_SECRET must be at least 16 characters"),
  NEXTAUTH_URL: z.string().url().default("http://localhost:3000"),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  ADMIN_EMAIL: z.string().email().optional(),
  ADMIN_PASSWORD: z.string().min(8).optional(),
});

export const env = envSchema.parse({
  DATABASE_URL:
    process.env.DATABASE_URL ||
    "postgresql://postgres:postgres@localhost:5432/sunbird_db?schema=public",
  NEXTAUTH_SECRET:
    process.env.NEXTAUTH_SECRET ||
    "development-secret-change-me-in-production-at-least-32-chars-long",
  NEXTAUTH_URL: process.env.NEXTAUTH_URL || "http://localhost:3000",
  NODE_ENV: process.env.NODE_ENV || "development",
  ADMIN_EMAIL: process.env.ADMIN_EMAIL,
  ADMIN_PASSWORD: process.env.ADMIN_PASSWORD,
});
