// GET /api/health: for UptimeRobot. 200 when the app and the database answer, 503 otherwise. Reveals nothing else.
import { ping } from "../../../server/pg";

export const dynamic = "force-dynamic";

export async function GET() {
  const ok = await ping();
  return Response.json({ ok }, { status: ok ? 200 : 503, headers: { "Cache-Control": "no-store" } });
}
