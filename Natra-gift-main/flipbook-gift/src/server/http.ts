// Shared bits for the API routes (task 4.1).
import { MAX_BODY_BYTES } from "./gifts";

export const json = (body: unknown, status = 200) => Response.json(body, { status, headers: { "Cache-Control": "no-store" } });

/** Reads a JSON body with a size cap. Returns undefined for a missing, oversized or malformed body. */
export async function readJson(req: Request): Promise<unknown> {
  const len = Number(req.headers.get("content-length") ?? 0);
  if (len > MAX_BODY_BYTES) return undefined;
  const text = await req.text();
  if (text.length > MAX_BODY_BYTES) return undefined;
  try { return JSON.parse(text); } catch { return undefined; }
}

/** The edit token travels in a header, never in a URL that could end up in logs. */
export const editToken = (req: Request) => req.headers.get("authorization")?.replace(/^Bearer /, "") ?? null;

export const siteUrl = (req: Request) => (process.env.NEXT_PUBLIC_SITE_URL || new URL(req.url).origin).replace(/\/$/, "");
