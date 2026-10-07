// GET /api/gifts/mine and PUT /api/gifts/mine: reopen or change a gift. The edit token (Authorization: Bearer) is the only key.
import { loadForEdit, updateGift } from "../../../../server/gifts";
import { editToken, json, readJson } from "../../../../server/http";
import { pgStore } from "../../../../server/pg";

export const dynamic = "force-dynamic";
const NOT_VALID = { message: "This edit link is not valid." };

export async function GET(req: Request) {
  try {
    const draft = await loadForEdit(pgStore, editToken(req));
    return draft ? json(draft) : json(NOT_VALID, 403);
  } catch { return json({ message: "We could not load your gift. Please try again." }, 500); }
}

export async function PUT(req: Request) {
  const body = await readJson(req);
  if (body === undefined) return json({ message: "The request could not be read, or it is too large." }, 400);
  try {
    const r = await updateGift(pgStore, editToken(req), body);
    return r.ok ? json({ ok: true }) : json({ message: r.message }, r.status);
  } catch { return json({ message: "We could not save your changes. Please try again." }, 500); }
}
