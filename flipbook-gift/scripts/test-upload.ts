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
no({ type: "image/jpeg", size: UPLOAD_LIMITS.photo.maxBytes + 1 }, 400); no({ type: "image/jpeg", size: 0 }, 400); no({ type: "image/jpeg", size: -5 }, 400); no({ type: "image/jpeg", size: "9" }, 400); no({ type: "image/jpeg", size: NaN }, 400);
no({ type: "image/jpeg", size: 10 }, 503, { ...env, CLOUDINARY_API_SECRET: "" }); console.log("PASS wrong type, size, missing config refused");

// ---- 8.5: audio notes ----
const aok = (i: unknown, now = 1700000000) => { const x = makeTicket(i, env, now); assert(x.ok, JSON.stringify(i)); return x.ticket; };
const ano = (i: unknown, s = 400) => no(i, s);
const a = aok({ kind: "audio", type: "audio/mpeg", size: 2_000_000, name: "hello.mp3" });
assert.equal(a.uploadUrl, "https://api.cloudinary.com/v1_1/demo/video/upload");
assert.deepEqual(Object.keys(a.fields).sort(), ["allowed_formats", "api_key", "folder", "signature", "timestamp"]);
assert.equal(a.fields.folder, "flipbook-audio"); assert.equal(a.fields.allowed_formats, "mp3,m4a,aac,wav");
assert.equal(a.fields.signature, sign({ allowed_formats: "mp3,m4a,aac,wav", folder: "flipbook-audio", timestamp: 1700000000 }, "s3cret")); assert(!JSON.stringify(a).includes("s3cret"));
console.log("PASS audio ticket: video endpoint, audio folder, allowed formats, signed, secret kept");
for (const t of ["audio/mpeg", "audio/mp3", "audio/mp4", "audio/x-m4a", "audio/aac", "audio/wav", "audio/x-wav"]) aok({ kind: "audio", type: t, size: 1000, name: "x" });
console.log("PASS every allowed audio type is signed");
for (const t of ["audio/ogg", "audio/webm", "audio/flac", "audio/x-flac", "video/mp4", "image/jpeg", "text/html"]) ano({ kind: "audio", type: t, size: 1000, name: "x" });
ano({ kind: "audio", size: 1000 }); ano({ kind: "audio", type: "audio/ogg", size: 1000, name: "a.ogg" }); ano({ kind: "audio", type: "audio/webm", size: 1000, name: "a.webm" }); ano({ kind: "audio", type: "", size: 1000, name: "a.flac" });
console.log("PASS OGG, WEBM, FLAC and non-audio types refused");
for (const n of ["a.mp3", "A.M4A", "clip.aac", "x.WAV"]) aok({ kind: "audio", type: "application/octet-stream", size: 1000, name: n });
ano({ kind: "audio", type: "application/octet-stream", size: 1000, name: "a.mp3.exe" }); ano({ kind: "audio", type: "", size: 1000, name: "mp3" }); ano({ kind: "audio", type: "", size: 1000 });
console.log("PASS extension fallback works for the four formats only");
aok({ kind: "audio", type: "audio/mpeg", size: UPLOAD_LIMITS.audio.maxBytes, name: "a.mp3" });
ano({ kind: "audio", type: "audio/mpeg", size: UPLOAD_LIMITS.audio.maxBytes + 1, name: "a.mp3" }); ano({ kind: "audio", type: "audio/mpeg", size: 0, name: "a.mp3" }); ano({ kind: "audio", type: "audio/mpeg", size: "9", name: "a.mp3" }); ano({ kind: "audio", type: "audio/mpeg", size: NaN, name: "a.mp3" });
assert.equal(UPLOAD_LIMITS.audio.maxBytes, 5_000_000);
no({ kind: "audio", type: "audio/mpeg", size: 10, name: "a.mp3" }, 503, { ...env, CLOUDINARY_CLOUD_NAME: "" });
console.log("PASS audio size limit (5 MB) and missing config");
assert.equal(aok({ type: "image/jpeg", size: 10 }).uploadUrl, "https://api.cloudinary.com/v1_1/demo/image/upload"); ano({ kind: "audio", type: "image/jpeg", size: 10 });
console.log("PASS a photo cannot get an audio ticket, and no kind means photo");
console.log("upload signing: all checks passed");
