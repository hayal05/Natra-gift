// GET /api/gifts/<private token>: the published gift for the recipient page. Unknown, malformed or edit tokens are all 404.
import { loadForRecipient } from "../../../../server/gifts";
import { pgStore } from "../../../../server/pg";

export const dynamic = "force-dynamic";
const headers = { "Cache-Control": "no-store", "X-Robots-Tag": "noindex, nofollow" };

export async function GET(_req: Request, ctx: { params: Promise<{ token: string }> }) {
  const { token } = await ctx.params;
  try {
    const gift = await loadForRecipient(pgStore, token);
    return gift ? Response.json(gift, { headers }) : Response.json({ message: "This gift was not found." }, { status: 404, headers });
  } catch { return Response.json({ message: "We could not load this gift. Please try again." }, { status: 500, headers }); }
}
