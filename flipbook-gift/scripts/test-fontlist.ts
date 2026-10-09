// Manual check for the font registry (11.2b). Run: tsx scripts/test-fontlist.ts
import { readFileSync } from "node:fs";
import { FONT_LIST, FONT_CATEGORIES, fontById, isFontId, cssFamily, resolveFamily, capWeight, fontGroups, searchFonts, ROLE_LABEL } from "../src/lib/pages/fontlist.ts";

let fails = 0;
const ok = (name: string, cond: boolean) => { if (!cond) { console.log("FAIL " + name); fails++; } };

ok("20 shipped + 26 custom entries", FONT_LIST.length === 46 && FONT_LIST.filter((e) => e.custom).length === 26);
ok("families unique", new Set(FONT_LIST.map((e) => e.family)).size === FONT_LIST.length);
ok("ids unique", new Set(FONT_LIST.map((e) => e.id)).size === FONT_LIST.length);
ok("labels unique", new Set(FONT_LIST.map((e) => e.label)).size === FONT_LIST.length);
for (const e of FONT_LIST) {
  ok(`${e.id}: id is a slug`, /^[a-z0-9]+(-[a-z0-9]+)*$/.test(e.id));
  ok(`${e.id}: label and family`, e.label.length > 0 && e.family.length > 0);
  ok(`${e.id}: known category`, FONT_CATEGORIES.includes(e.category));
  ok(`${e.id}: has a 400 (shipped fonts)`, e.custom || e.weights.includes(400));
  ok(`${e.id}: weights sorted, unique, 100..900`, e.weights.every((w, i) => w >= 100 && w <= 900 && (i === 0 || w > e.weights[i - 1])));
}

// Every family the app already ships is in the registry (so no theme font is missing from the picker).
const shipped = [...readFileSync("src/app/fonts.ts", "utf8").matchAll(/@fontsource\/([a-z0-9-]+)\//g)].map((m) => m[1]);
for (const s of new Set(shipped)) ok(`fontsource ${s} is in the registry`, isFontId(s));
// Weights and italic agree with the CSS files the app imports.
for (const e of FONT_LIST.filter((x) => !x.custom)) {
  const lines = readFileSync("src/app/fonts.ts", "utf8").split("\n").filter((l) => l.includes(`@fontsource/${e.id}/`));
  const w = [...new Set(lines.filter((l) => !l.includes("italic")).map((l) => +l.match(/latin-(\d+)\.css/)![1]))].sort((a, b) => a - b);
  ok(`${e.id}: weights match fonts.ts (${w})`, JSON.stringify(w) === JSON.stringify(e.weights));
  ok(`${e.id}: italic matches fonts.ts`, lines.some((l) => l.includes("italic")) === e.italic);
}

// Custom fonts (11.3): files exist, names are in step with the CSS and the registry.
import { existsSync } from "node:fs";
import { CUSTOM_FONTS } from "../src/lib/pages/custom-fonts.ts";
import { nameCss } from "../src/lib/pages/fontlist.ts";
const css = readFileSync("src/app/custom-fonts.css", "utf8");
for (const c of CUSTOM_FONTS) {
  ok(`${c.id}: woff2 files exist`, existsSync(`public/fonts/${c.file}`) && (!c.nameFile || existsSync(`public/fonts/${c.nameFile}`)));
  const face = (fam: string, file: string) => css.includes(`font-family: "${fam}"; font-style: normal; font-weight: ${c.weight};`) && css.includes(`/fonts/${file}`);
  ok(`${c.id}: @font-face for font${c.nameFile ? " and name face" : ""}`, face(c.family, c.file) && (!c.nameFile || face(`${c.family} Name`, c.nameFile)));
  ok(`${c.id}: ASCII family name`, /^[\x20-\x7e]+$/.test(c.family));
  ok(`${c.id}: registry weight and picker row`, fontById(c.id)?.weights.join() === String(c.weight) && (c.nameFile ? nameCss(fontById(c.id)!).startsWith(`'${c.family} Name'`) : !nameCss(fontById(c.id)!).includes(c.family)));
  ok(`${c.id}: capWeight never fakes a bold`, capWeight(fontById(c.id)!, 400) === c.weight && capWeight(fontById(c.id)!, 900) === c.weight);
}

// Lookups
ok("fontById known", fontById("lora")?.label === "Lora");
for (const bad of [undefined, null, "", "Lora", "nope", 3, {}, "__proto__", "constructor"]) ok(`fontById(${JSON.stringify(bad)}) undefined`, fontById(bad) === undefined);
ok("isFontId", isFontId("inter") && !isFontId("Inter"));

// Fallback to the role font
const role = "'Cormorant Garamond', serif";
ok("unknown id falls back to the role family", resolveFamily("nope", role) === role && resolveFamily(undefined, role) === role);
ok("known id wins over the role", resolveFamily("poppins", role) === cssFamily(fontById("poppins")!));
ok("css family quoted with fallback", cssFamily(fontById("dm-sans")!) === "'DM Sans', system-ui, -apple-system, 'Segoe UI', sans-serif");

// capWeight: never a weight the font lacks
const lato = fontById("lato")!, abril = fontById("abril-fatface")!, inter = fontById("inter")!;
ok("lato 800 -> 700", capWeight(lato, 800) === 700);
ok("lato 600 -> 400", capWeight(lato, 600) === 400);
ok("lato 900 -> 900", capWeight(lato, 900) === 900);
ok("abril 700 -> 400", capWeight(abril, 700) === 400 && capWeight(abril, 900) === 400);
ok("abril 100 -> 400 (lightest real)", capWeight(abril, 100) === 400);
ok("inter 500 -> 400, 1000 -> 900", capWeight(inter, 500) === 400 && capWeight(inter, 1000) === 900);
for (const e of FONT_LIST) for (const want of [100, 400, 500, 600, 700, 800, 900, 1000]) ok(`${e.id} cap(${want}) is real`, e.weights.includes(capWeight(e, want)));

// Groups and search
const groups = fontGroups();
ok("groups cover every font once", groups.reduce((n, g) => n + g.fonts.length, 0) === FONT_LIST.length);
ok("group order follows categories", groups.map((g) => g.category).join() === FONT_CATEGORIES.join());
ok("search empty = all", searchFonts("  ").length === 46);
ok("search by label", searchFonts("sans").map((e) => e.id).includes("dm-sans") && searchFonts("SANS").length === searchFonts("sans").length);
ok("search by category", searchFonts("serif").length >= 4 && FONT_LIST.filter((e) => e.category === "Display").every((d) => searchFonts("disp").includes(d)));
ok("search no match", searchFonts("zzz").length === 0);
ok("role labels", ROLE_LABEL.display === "Headline font" && ROLE_LABEL.body === "Reading font");

console.log(fails ? `${fails} FAILED` : "all font registry checks passed");
process.exit(fails ? 1 : 0);
