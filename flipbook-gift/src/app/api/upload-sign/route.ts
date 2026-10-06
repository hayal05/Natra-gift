// POST /api/upload-sign { type, size } -> { uploadUrl, fields } for a direct, signed upload to Cloudinary.
import { json, readJson } from "../../../server/http";
import { makeTicket } from "../../../server/upload";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const body = await readJson(req);
  const r = makeTicket(body, {
    CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME,
    CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY,
    CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET,
  });
  return r.ok ? json(r.ticket) : json({ message: r.message }, r.status);
}
