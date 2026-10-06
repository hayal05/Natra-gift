// Run: npx tsx scripts/test-upload.ts
import assert from "node:assert/strict";
import { UPLOAD_LIMITS, makeTicket, sign } from "../src/server/upload";

// Cloudinary's documented example (docs: "Generating authentication signatures").
assert.equal(sign({ eager: "w_400,h_300,c_pad|w_260,h_200,c_crop", public_id: "sample_image", timestamp: 1315060510 }, "abcd"), "bfd09f95f331f558cbd1320e67aa8d488770583e"); console.log("PASS signature matches Cloudinary's documented example");
const env = { CLOUDINARY_CLOUD_NAME: "demo", CLOUDINARY_API_KEY: "key1", CLOUDINARY_API_SECRET: "s3cret" };
const r = makeTicket({ type: "image/jpeg", size: 900_000 }, env, 1700000000);
assert(r.ok); const f = r.ticket.fields;
assert.equal(r.ticket.uploadUrl, "https://api.cloudinary.com/v1_1/demo/image/upload");
assert.deepEqual(Object.keys(f).sort(), ["allowed_formats", "api_key", "folder", "signature", "timestamp"]);
assert.equal(f.signature, sign({ allowed_formats: "jpg", folder: "flipbook", timestamp: 1700000000 }, "s3cret")); assert(!JSON.stringify(r).includes("s3cret")); console.log("PASS ticket fields are signed and the secret never leaves the server");
const no = (i: unknown, s: number, e = env) => { const x = makeTicket(i, e); assert(!x.ok && x.status === s, JSON.stringify([i, s])); };
no({ type: "image/png", size: 10 }, 400); no({ type: "text/html", size: 10 }, 400); no({ size: 10 }, 400); no(null, 400);
no({ type: "image/jpeg", size: UPLOAD_LIMITS.maxBytes + 1 }, 400); no({ type: "image/jpeg", size: 0 }, 400); no({ type: "image/jpeg", size: -5 }, 400); no({ type: "image/jpeg", size: "9" }, 400); no({ type: "image/jpeg", size: NaN }, 400);
no({ type: "image/jpeg", size: 10 }, 503, { ...env, CLOUDINARY_API_SECRET: "" }); console.log("PASS wrong type, size, missing config refused");
console.log("upload signing: all checks passed");
