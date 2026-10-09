"use client";
// Word-style font picker (task 11.2d). A closed box shows the current font NAME written in its own face; tapping it opens
// a list: "Theme fonts" (the book's Headline and Reading fonts, so a book-wide font change still follows them) and "All fonts"
// by category. On a phone the open list is a sheet that rises from the bottom (the tools panel is only about 236 px tall);
// from `sm` up it drops down under the box. Every row is the font name in its own face (task 11.3 swaps these for the tiny
// name-only subsets so opening the list never downloads whole fonts). No package: combobox + listbox written by hand.
import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from "react";
import { FONT_LIST, ROLE_LABEL, SEARCH_MIN, cssFamily, fontById, nameCss, fontGroups, searchFonts, type FontEntry, type FontPair, type FontRole } from "../lib/pages";

/** What the picker reports: a registry font (`family`), or back to a theme role (`font`, `family` undefined). */
export type FontChoice = { family: string; font?: undefined } | { family?: undefined; font: FontRole };

interface Props {
  /** Registry id of the picked font, or undefined while the text follows a theme role. */
  family?: string;
  /** The theme role in effect (used for the closed label and the tick when no family is picked). */
  role: FontRole;
  /** The book's two theme fonts, so their rows can be drawn in their own face. */
  fonts: FontPair;
  onChange: (c: FontChoice) => void;
}

type Item = { key: string; label: string; css: string; choice: FontChoice; on: boolean; hint?: string };

export default function FontPicker({ family, role, fonts, onChange }: Props) {
  const uid = useId();
  const root = useRef<HTMLDivElement>(null);
  const button = useRef<HTMLButtonElement>(null);
  const field = useRef<HTMLInputElement>(null);
  const list = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const typed = useRef({ text: "", at: 0 });
  const searchable = FONT_LIST.length > SEARCH_MIN;

  const picked = fontById(family);
  const roleItem = (r: FontRole): Item => ({ key: "role-" + r, label: ROLE_LABEL[r], css: fonts[r], choice: { font: r }, on: !picked && role === r, hint: "Follows the book" });
  const fontItem = (e: FontEntry): Item => ({ key: e.id, label: e.label, css: nameCss(e), choice: { family: e.id }, on: picked?.id === e.id });

  // The rows, in the order the keyboard walks them. While searching, only matches (no theme rows, no group headings).
  const sections = useMemo(() => {
    const q = query.trim();
    if (q) return [{ title: "Results", items: searchFonts(q).map(fontItem) }];
    return [
      { title: "Theme fonts", items: [roleItem("display"), roleItem("body")] },
      ...fontGroups().map((g) => ({ title: g.category, items: g.fonts.map(fontItem) })),
    ];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, family, role, fonts]);
  const items = useMemo(() => sections.flatMap((s) => s.items), [sections]);

  const shut = (refocus: boolean) => { setOpen(false); setQuery(""); if (refocus) button.current?.focus(); };
  const openList = () => {
    setQuery("");
    const at = items.findIndex((i) => i.on);
    setActive(Math.max(0, at));
    setOpen(true);
  };
  const choose = (i: Item) => { onChange(i.choice); shut(true); };

  // Focus the search box (or the list) when it opens; close on an outside press.
  useEffect(() => {
    if (!open) return;
    (field.current ?? list.current)?.focus({ preventScroll: true });
    const away = (e: PointerEvent) => { if (!root.current?.contains(e.target as Node)) shut(false); };
    document.addEventListener("pointerdown", away);
    return () => document.removeEventListener("pointerdown", away);
  }, [open]);

  // Keep the active row in view.
  useEffect(() => {
    if (open) document.getElementById(`${uid}-o${active}`)?.scrollIntoView({ block: "nearest" });
  }, [open, active, uid]);
  useEffect(() => { setActive((a) => Math.min(a, Math.max(0, items.length - 1))); }, [items.length]);

  const onKey = (e: ReactKeyboardEvent) => {
    const last = items.length - 1;
    if (e.key === "Escape") { e.preventDefault(); e.stopPropagation(); shut(true); }
    else if (e.key === "ArrowDown") { e.preventDefault(); setActive((a) => Math.min(last, a + 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setActive((a) => Math.max(0, a - 1)); }
    else if (e.key === "Home" && !query) { e.preventDefault(); setActive(0); }
    else if (e.key === "End" && !query) { e.preventDefault(); setActive(last); }
    else if (e.key === "Enter") { e.preventDefault(); if (items[active]) choose(items[active]); }
    else if (e.key === "Tab") shut(false);
    else if (!searchable && e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
      // Type to jump (only when there is no search box): letters typed in quick succession build a prefix.
      const t = typed.current, now = Date.now();
      t.text = (now - t.at > 700 ? "" : t.text) + e.key.toLowerCase(); t.at = now;
      const hit = items.findIndex((i) => i.label.toLowerCase().startsWith(t.text));
      if (hit >= 0) setActive(hit);
    }
  };

  const current = picked ? { label: picked.label, css: cssFamily(picked) } : { label: ROLE_LABEL[role], css: fonts[role] };
  const listId = `${uid}-list`;
  let n = -1;

  return (
    <div ref={root} className="relative min-w-0 flex-1">
      <button
        ref={button}
        type="button"
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-label={`Font: ${current.label}. Change font`}
        onClick={() => (open ? shut(false) : openList())}
        onKeyDown={(e) => { if (!open && (e.key === "ArrowDown" || e.key === "ArrowUp")) { e.preventDefault(); openList(); } }}
        className="flex min-h-[44px] w-full items-center justify-between gap-2 rounded-md border border-stone-300 bg-white px-3 text-left text-sm text-stone-900 transition hover:border-stone-500"
      >
        <span className="truncate" style={{ fontFamily: current.css }}>{current.label}</span>
        <svg width="14" height="14" viewBox="0 0 20 20" aria-hidden="true" className={"shrink-0 text-stone-500 transition " + (open ? "rotate-180" : "")}><path d="M4 7l6 6 6-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
      </button>

      {open && (
        <>
          {/* Phone: dim backdrop behind the sheet. A tap on it closes the list. */}
          <div aria-hidden="true" onClick={() => shut(false)} className="fixed inset-0 z-40 bg-black/30 sm:hidden" />
          <div
            onKeyDown={onKey}
            className="fixed inset-x-0 bottom-0 z-50 flex max-h-[70vh] flex-col rounded-t-2xl border border-stone-200 bg-white shadow-2xl sm:absolute sm:inset-x-auto sm:bottom-auto sm:left-0 sm:top-full sm:mt-1 sm:max-h-72 sm:w-full sm:min-w-[14rem] sm:rounded-xl"
          >
            <div className="flex items-center justify-between px-4 pt-3 sm:hidden">
              <span className="text-sm font-bold text-stone-800">Choose a font</span>
              <button type="button" onClick={() => shut(true)} className="min-h-[44px] px-2 text-xs font-bold text-stone-600">Close</button>
            </div>
            {searchable && (
              <div className="p-2">
                <input
                  ref={field}
                  type="search"
                  value={query}
                  onChange={(e) => { setQuery(e.target.value); setActive(0); }}
                  placeholder="Search fonts"
                  role="searchbox"
                  aria-label="Search fonts"
                  aria-controls={listId}
                  aria-activedescendant={items[active] ? `${uid}-o${active}` : undefined}
                  className="min-h-[44px] w-full rounded-md border border-stone-300 px-3 text-base text-stone-900 outline-none focus:border-rose-700"
                />
              </div>
            )}
            <div
              ref={list}
              id={listId}
              role="listbox"
              tabIndex={-1}
              aria-label="Fonts"
              aria-activedescendant={items[active] ? `${uid}-o${active}` : undefined}
              className="min-h-0 flex-1 overflow-y-auto overscroll-contain pb-2 outline-none"
            >
              {items.length === 0 && <p className="px-4 py-3 text-sm text-stone-500">No font matches “{query}”.</p>}
              {sections.map((s) => s.items.length > 0 && (
                <div key={s.title} role="group" aria-label={s.title}>
                  <div aria-hidden="true" className="sticky top-0 bg-stone-50 px-4 py-1 text-[11px] font-bold uppercase tracking-wide text-stone-500">{s.title}</div>
                  {s.items.map((i) => {
                    n++;
                    const idx = n;
                    return (
                      <div
                        key={i.key}
                        id={`${uid}-o${idx}`}
                        role="option"
                        aria-selected={i.on}
                        onPointerMove={() => setActive(idx)}
                        onClick={() => choose(i)}
                        className={"flex min-h-[44px] cursor-pointer items-center gap-3 px-4 text-base text-stone-900 " + (idx === active ? "bg-rose-50" : "")}
                      >
                        <span className="flex w-4 shrink-0 justify-center text-rose-700" aria-hidden="true">{i.on ? "✓" : ""}</span>
                        <span className="min-w-0 flex-1 truncate" style={{ fontFamily: i.css }}>{i.label}</span>
                        {i.hint && <span className="shrink-0 text-[11px] text-stone-500">{i.hint}</span>}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
