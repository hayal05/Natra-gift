// Dev helper: turns src/engine/*.ts into one plain-JS string (types stripped, imports/exports removed)
// so the engine can be inlined into a test page, the demo, and later the offline export.
// Needs Node 22.13+ (module.stripTypeScriptTypes).
import { stripTypeScriptTypes } from "node:module";
import { readFileSync } from "node:fs";

const FILES = ["geometry", "shading", "pointer", "ui", "flipbook"];

export function bundleEngine(dir = "src/engine") {
  return FILES.map((f) => stripTypeScriptTypes(readFileSync(`${dir}/${f}.ts`, "utf8"), { mode: "strip" }))
    .map((c) => c.replace(/^import[^;]*;\s*$/gm, "").replace(/^export\s+/gm, ""))
    .join("\n");
}

/** Same for the page renderer in src/lib/pages (types.ts is type-only and strips to nothing). */
export function bundleRenderer(dir = "src/lib/pages") {
  return ["sample", "render"].map((f) => stripTypeScriptTypes(readFileSync(`${dir}/${f}.ts`, "utf8"), { mode: "strip" }))
    .map((c) => c.replace(/^import[\s\S]*?;\s*$/gm, "").replace(/^export\s+/gm, ""))
    .join("\n");
}

/** The layout library as plain JS (types and the type import stripped). */
export function bundleLayouts(file = "src/templates/layouts.ts") {
  return stripTypeScriptTypes(readFileSync(file, "utf8"), { mode: "strip" })
    .replace(/^import[\s\S]*?;\s*$/gm, "").replace(/^export\s+/gm, "");
}

/** Layouts + templates + builder as plain JS (for dev sheets and the offline export). */
export function bundleTemplates(dir = "src/templates") {
  return ["layouts", "templates", "build"].map((f) => stripTypeScriptTypes(readFileSync(`${dir}/${f}.ts`, "utf8"), { mode: "strip" }))
    .map((c) => c.replace(/^import[\s\S]*?;\s*$/gm, "").replace(/^export\s+/gm, "")).join("\n");
}
