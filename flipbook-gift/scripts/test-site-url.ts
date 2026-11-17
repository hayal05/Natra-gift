// Run: npx tsx scripts/test-site-url.ts
import assert from "node:assert/strict";
import { siteUrl } from "../src/server/http";

const old = process.env.NEXT_PUBLIC_SITE_URL;
try {
  process.env.NEXT_PUBLIC_SITE_URL = "https://previous-custom-domain.example";
  const render = new Request("https://natra-gift.onrender.com/api/gifts", { method: "POST" });
  assert.equal(siteUrl(render), "https://natra-gift.onrender.com", "use current host even when old custom-domain env remains");
  const another = new Request("https://new-host.example/api/gifts", { method: "POST" });
  assert.equal(siteUrl(another), "https://new-host.example");
  assert.equal(siteUrl(new Request("http://localhost:3000/api/gifts")), "http://localhost:3000");
  console.log("PASS: published links use current deployment origin");
} finally {
  if (old === undefined) delete process.env.NEXT_PUBLIC_SITE_URL;
  else process.env.NEXT_PUBLIC_SITE_URL = old;
}
