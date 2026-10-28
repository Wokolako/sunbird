import type { ServerResponse } from "node:http";
import type { AuthenticatedRequest } from "../auth/auth.middleware";
import { propertyAccess } from "../data/prisma";
import { prisma } from "../data/prisma";
import { savePropertyImage } from "./image.service";

const json = (response: ServerResponse, status: number, data: unknown) => {
  response.writeHead(status, {
    "Content-Type": "application/json",
    "Cache-Control": "no-store",
  });
  response.end(JSON.stringify(data));
};
export async function upload(
  request: AuthenticatedRequest,
  response: ServerResponse,
  body: Record<string, unknown>
) {
  const propertyId = String(body.propertyId || "");
  if (!(await propertyAccess(request.user!, propertyId, ["OWNER", "MANAGER"])))
    return json(response, 403, { error: "Property access denied." });
  try {
    const image = await savePropertyImage(body);
    if (process.env.R2_ACCOUNT_ID) await prisma.storedObject.upsert({
      where: { key: image.key },
      update: { publicUrl: image.url, sizeBytes: BigInt(image.bytes) },
      create: { key: image.key, bucket: process.env.R2_BUCKET || "vabbot-uploads", purpose: "PROPERTY_IMAGE", contentType: image.mime, sizeBytes: BigInt(image.bytes), publicUrl: image.url, isPrivate: false, uploadedById: request.user!.id, propertyId },
    });
    return json(response, 201, { ok: true, image });
  } catch (error) {
    return json(response, 400, {
      error: error instanceof Error ? error.message : "Image upload failed.",
    });
  }
}
