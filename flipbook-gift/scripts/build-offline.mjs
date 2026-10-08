// Prepares what the offline export (task 6.1) inlines into the downloaded file; run automatically before `dev` and `build`.
//  public/offline/runtime.js   engine + envelope + renderer + layouts + the page flow, one minified script
//  public/offline/fonts/*.woff2 + manifest.json   latin subsets of every theme font, only the weights the renderer asks for
import { build } from "esbuild";
import { copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";

const OUT = "public/offline";
rmSync(OUT, { recursive: true, force: true });
mkdirSync(`${OUT}/fonts`, { recursive: true });

await build({ entryPoints: ["src/offline/runtime.ts"], bundle: true, minify: true, format: "iife", target: "es2020", outfile: `${OUT}/runtime.js`, legalComments: "none", define: { "process.env.NEXT_PUBLIC_UPLOADS": '"0"', "process.env.NODE_ENV": '"production"' } });

// Guard: a plain browser file has no `process`; if any imported module reads it, the whole file shows a blank page (found 2026-10-08).
if (/\bprocess\.(env|cwd|platform)/.test(readFileSync(`${OUT}/runtime.js`, "utf8"))) throw new Error("public/offline/runtime.js references `process`; the offline file would not open. Import from a narrower module.");

const WEIGHTS = [400, 600, 700, 800, 900]; // the weights loadFonts() requests, plus italic 400
const manifest = {};
for (const slug of readdirSync("node_modules/@fontsource")) {
  const dir = `node_modules/@fontsource/${slug}`;
  const family = /font-family:\s*'([^']+)'/.exec(readFileSync(`${dir}/index.css`, "utf8"))?.[1];
  if (!family) continue;
  const files = [];
  const want = [...WEIGHTS.map((w) => [w, "normal"]), [400, "italic"]];
  for (const [w, style] of want) {
    const name = `${slug}-latin-${w}-${style}.woff2`;
    if (!existsSync(`${dir}/files/${name}`)) continue;
    copyFileSync(`${dir}/files/${name}`, `${OUT}/fonts/${name}`);
    files.push({ weight: w, style, file: name });
  }
  if (files.length) manifest[family] = files;
}
writeFileSync(`${OUT}/fonts/manifest.json`, JSON.stringify(manifest));
console.log(`offline runtime and ${Object.keys(manifest).length} font families written to ${OUT}`);
