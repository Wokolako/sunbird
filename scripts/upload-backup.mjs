import { createReadStream, statSync } from "node:fs";
import path from "node:path";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";

const filename = process.argv[2];
if (!filename) throw new Error("Pass the backup filename to upload.");
const required = [
  "R2_ACCOUNT_ID",
  "R2_ACCESS_KEY_ID",
  "R2_SECRET_ACCESS_KEY",
  "R2_BACKUP_BUCKET",
];
for (const name of required)
  if (!process.env[name]) throw new Error(`${name} is required.`);
const client = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});
const key = `postgres/${new Date().toISOString().slice(0, 10)}/${path.basename(filename)}`;
await client.send(
  new PutObjectCommand({
    Bucket: process.env.R2_BACKUP_BUCKET,
    Key: key,
    Body: createReadStream(filename),
    ContentLength: statSync(filename).size,
    ContentType: "application/octet-stream",
    Metadata: { database: "vabbot-resorts", format: "pg-custom" },
  })
);
console.log(`Uploaded backup: ${key}`);
