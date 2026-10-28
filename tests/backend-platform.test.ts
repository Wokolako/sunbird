import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const runtimeFiles = [
  "backend/server.ts",
  "backend/auth/auth.service.ts",
  "backend/auth/clerk-webhook.service.ts",
  "backend/platform/platform.service.ts",
  "backend/pms/pms.service.ts",
  "backend/properties/property.service.ts",
  "backend/uploads/image.controller.ts",
  "scripts/create-admin.mjs",
];
for (const filename of runtimeFiles) {
  const source = readFileSync(path.join(root, filename), "utf8");
  assert.doesNotMatch(source, /node:sqlite|DatabaseSync|DATABASE_PATH|database\(\)|\.prepare\(/, `${filename} must use Prisma/PostgreSQL`);
}
const schema = readFileSync(path.join(root, "prisma/schema.prisma"), "utf8");
for (const model of ["Organisation", "PlatformSetting", "OperationalTask", "RatePlan", "RoomInventory", "Reservation", "VerificationDocument", "ProviderEvent"])
  assert.match(schema, new RegExp(`model ${model}\\s*\\{`));
assert.match(readFileSync(path.join(root, "backend/data/prisma.ts"), "utf8"), /propertyAccess/);
console.log("PASS: dedicated Node runtime uses the Prisma PostgreSQL data layer");
