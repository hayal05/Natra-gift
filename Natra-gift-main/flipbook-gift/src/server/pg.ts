// Neon Postgres store (task 4.1). Needs DATABASE_URL. The table is created on first use.
import { neon } from "@neondatabase/serverless";
import type { GiftRow, GiftStore } from "./gifts";

let sql: ReturnType<typeof neon> | undefined;
let ready: Promise<unknown> | undefined;

function db() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set");
  sql ??= neon(url);
  ready ??= sql`CREATE TABLE IF NOT EXISTS gifts (
    id text PRIMARY KEY,
    edit_token_hash text NOT NULL UNIQUE,
    private_token text NOT NULL UNIQUE,
    recipient_name text NOT NULL,
    sender_name text NOT NULL,
    template_id text NOT NULL,
    content jsonb NOT NULL,
    status text NOT NULL DEFAULT 'published',
    created_at timestamptz NOT NULL DEFAULT now()
  )`.catch((e) => { ready = undefined; throw e; });
  return ready.then(() => sql!);
}

const toRow = (r: Record<string, unknown>): GiftRow => ({
  id: r.id as string, editTokenHash: r.edit_token_hash as string, privateToken: r.private_token as string,
  recipientName: r.recipient_name as string, senderName: r.sender_name as string, templateId: r.template_id as string,
  content: r.content as GiftRow["content"], status: "published", createdAt: new Date(r.created_at as string),
});

export const pgStore: GiftStore = {
  async insert(r) {
    const q = await db();
    await q`INSERT INTO gifts (id, edit_token_hash, private_token, recipient_name, sender_name, template_id, content, status)
            VALUES (${r.id}, ${r.editTokenHash}, ${r.privateToken}, ${r.recipientName}, ${r.senderName}, ${r.templateId}, ${JSON.stringify(r.content)}::jsonb, ${r.status})`;
  },
  async byEditHash(h) { const q = await db(); const rows = (await q`SELECT * FROM gifts WHERE edit_token_hash = ${h} LIMIT 1`) as Record<string, unknown>[]; return rows[0] ? toRow(rows[0]) : null; },
  async byPrivateToken(t) { const q = await db(); const rows = (await q`SELECT * FROM gifts WHERE private_token = ${t} AND status = 'published' LIMIT 1`) as Record<string, unknown>[]; return rows[0] ? toRow(rows[0]) : null; },
  async update(h, p) {
    const q = await db();
    const rows = (await q`UPDATE gifts SET recipient_name = ${p.recipientName}, sender_name = ${p.senderName}, template_id = ${p.templateId}, content = ${JSON.stringify(p.content)}::jsonb
                          WHERE edit_token_hash = ${h} RETURNING id`) as unknown[];
    return rows.length > 0;
  },
};

/** For /api/health: true if the database answers. */
export async function ping(): Promise<boolean> {
  try {
    const q = await db();
    await q`SELECT 1`;
    return true;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[database] health check failed:", message);
    return false;
  }
}
