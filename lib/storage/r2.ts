import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { randomUUID } from "node:crypto";

export type StoredUpload = {
  key: string;
  bucket: string;
  contentType: string;
  sizeBytes: number;
  publicUrl: string | null;
};

function settings() {
  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  const bucket = process.env.R2_BUCKET;
  if (!accountId || !accessKeyId || !secretAccessKey || !bucket)
    throw new Error("Cloudflare R2 is not configured.");
  return { accountId, accessKeyId, secretAccessKey, bucket };
}

function client() {
  const value = settings();
  return new S3Client({
    region: "auto",
    endpoint: `https://${value.accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: value.accessKeyId,
      secretAccessKey: value.secretAccessKey,
    },
  });
}

function safeExtension(filename: string) {
  const match = filename.toLowerCase().match(/\.([a-z0-9]{1,8})$/);
  return match ? `.${match[1]}` : "";
}

export async function uploadObject(input: {
  folder: "properties" | "verification" | "invoices" | "backups";
  filename: string;
  contentType: string;
  body: Uint8Array;
  private?: boolean;
}): Promise<StoredUpload> {
  const value = settings();
  const key = `${input.folder}/${new Date().toISOString().slice(0, 10)}/${randomUUID()}${safeExtension(input.filename)}`;
  await client().send(
    new PutObjectCommand({
      Bucket: value.bucket,
      Key: key,
      Body: input.body,
      ContentType: input.contentType,
      CacheControl: input.private
        ? "private, no-store"
        : "public, max-age=31536000, immutable",
      Metadata: { originalName: input.filename.slice(0, 120) },
    })
  );
  const publicBase = process.env.R2_PUBLIC_BASE_URL?.replace(/\/$/, "");
  return {
    key,
    bucket: value.bucket,
    contentType: input.contentType,
    sizeBytes: input.body.byteLength,
    publicUrl: input.private || !publicBase ? null : `${publicBase}/${key}`,
  };
}

export async function signedDownloadUrl(key: string, expiresIn = 300) {
  const value = settings();
  return getSignedUrl(
    client(),
    new GetObjectCommand({ Bucket: value.bucket, Key: key }),
    { expiresIn: Math.min(Math.max(expiresIn, 30), 3600) }
  );
}

export async function deleteObject(key: string) {
  const value = settings();
  await client().send(new DeleteObjectCommand({ Bucket: value.bucket, Key: key }));
}
