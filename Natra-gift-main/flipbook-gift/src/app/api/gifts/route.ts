// POST /api/gifts: publish a finished draft. Answers { giftUrl, editUrl }; the edit link is never shown again.
import { createGift } from "../../../server/gifts";
import { json, readJson, siteUrl } from "../../../server/http";
import { pgStore } from "../../../server/pg";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const body = await readJson(req);
  if (body === undefined) return json({ message: "The request could not be read, or it is too large." }, 400);
  try {
    const r = await createGift(pgStore, body, siteUrl(req));
    return r.ok ? json(r.value, 201) : json({ message: r.message }, r.status);
  } catch (error) {
    console.error("[POST /api/gifts] publish failed", error);
    return json({ message: "We could not save your gift. Please check the deployment logs." }, 500);
  }
}
