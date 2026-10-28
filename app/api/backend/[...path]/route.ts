import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function proxy(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  const { path } = await context.params;
  const backend = (process.env.BACKEND_API_URL || "http://127.0.0.1:4000").replace(
    /\/$/,
    ""
  );
  const target = new URL(`${backend}/${path.map(encodeURIComponent).join("/")}`);
  request.nextUrl.searchParams.forEach((value, key) =>
    target.searchParams.append(key, value)
  );

  let token: string | null = null;
  try {
    const { getToken } = await auth();
    token = await getToken();
  } catch {
    // Clerk auth unavailable (missing CLERK_SECRET_KEY) — continue without token
  }
  const headers = new Headers();
  const contentType = request.headers.get("content-type");
  const accept = request.headers.get("accept");
  if (contentType) headers.set("content-type", contentType);
  if (accept) headers.set("accept", accept);
  if (token) headers.set("authorization", `Bearer ${token}`);

  try {
    const upstream = await fetch(target, {
      method: request.method,
      headers,
      body: ["GET", "HEAD"].includes(request.method)
        ? undefined
        : await request.arrayBuffer(),
      cache: "no-store",
    });
    const responseHeaders = new Headers();
    for (const name of ["content-type", "content-disposition", "cache-control", "etag"])
      if (upstream.headers.get(name))
        responseHeaders.set(name, upstream.headers.get(name)!);
    return new NextResponse(upstream.body, {
      status: upstream.status,
      headers: responseHeaders,
    });
  } catch {
    return NextResponse.json(
      { error: "The Vabbot backend is unavailable. Start it with npm run backend:dev." },
      { status: 503 }
    );
  }
}

export const GET = proxy;
export const POST = proxy;
export const PATCH = proxy;
