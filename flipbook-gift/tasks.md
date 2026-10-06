# Tasks: Digital Gift Flipbook (Minimal MVP)

Source of truth: `prompt.md` (wins on any conflict). Progress: `project-status.md`.
Legend: `[ ]` todo, `[~]` in progress, `[x]` done, `[!]` blocked

**Size target: 3,000 to 5,000 lines (estimate ~4,850, near the ceiling). 31 tasks. Do not over-engineer: this is just a digital gift flipbook, with optional advanced page controls.**

Priorities: 1) Envelope surprise, 2) Finger-controlled page fold, 3) Attractive digital-magazine templates, 4) Easy personalization, 5) Offline interactive download.

## Rules to keep it small

1. Three routes only: `/` (landing + template picker), `/create` (edit + preview + publish popup), `/g/[token]` (recipient).
2. No accounts. A secret edit token (hash stored) lets the creator reopen their gift via `/create?edit=<token>`.
3. Every template arrives finished; only recipient and sender names are required. Advanced controls are optional and live in a collapsed "Customize" panel.
4. Drafts live in localStorage until the first upload or publish.
5. **Layouts are data, not code:** a layout is a list of slots (text, photo) at fixed positions; one generic renderer draws any layout. Adding a layout means adding data.
6. Controls are limited to presets (theme fonts, theme palette, sized steps). No free-form drag or resize, no custom fonts.
7. One `gifts` table with content as JSON (per page: layout id, slot content, slot style overrides).
8. Offline export = one self-contained `.html` file.
9. **Every page layout has at least one photo slot.** No text-only pages.
10. Anything not listed below is deferred. Do not add it.

---

## Phase 0: Setup (2)

- [x] 0.1 Decision: no sign-up or sign-in
- [x] 0.2 Scaffold Next.js + TypeScript + Tailwind; folders `src/engine`, `src/templates`, `src/lib`, `src/app`; `.env.example`; copy brief in as `prompt.md`

## Phase 1: Flipbook engine (6) (highest risk, build first)

Pure TypeScript in `src/engine`; no React, DB, or Cloudinary imports.

- [x] 1.1 API (`create`, `next`, `prev`, `destroy`) and fold geometry: corner drag gives fold line, clipped front, mirrored back
- [x] 1.2 Backside rendering and shadows/highlights
- [x] 1.3 Pointer Events (touch, mouse, stylus) with pointer capture and `touch-action`
- [x] 1.4 Release: complete if dragged far enough, otherwise snap back, eased animation
- [x] 1.5 Single-page layout, resize, high-DPI, discreet prev/next buttons, first/last page, loading and error state
- [x] 1.6 Demo page; verified by finger on a real phone

**Done when:** dragging a page corner on a phone folds the paper, shows the reverse side, and completes or snaps back. No slide transitions.

## Phase 2: Layouts, templates, landing (5)

- [x] 2.1 Slot-based layout model and generic renderer (text, photo, and shape slots; text styles; photo pan/zoom, fit, filter, frame; background)
- [x] 2.2 Layout library of about 24 layouts (each with at least one photo slot): cover (4), full photo, framed photo, polaroid, split photo with caption, 2-photo and 3-photo collage, letter, two-column text, big quote, quote over photo, closing (all defined as data)
- [x] 2.3 The 10 templates as theme (palette, 2 font pairs, masthead, cover layout) + 6 to 8 pages using the layouts + warm sample copy: Love Story, Anniversary, Wedding, Best Friends, Birthday Surprise, I'm Sorry, Our Memories, Appreciation, Long Distance, Just Because (digital magazine look)
- [x] 2.4 Sample photos (generated placeholders tinted per theme)
- [x] 2.5 Landing page: short pitch, how it works, live sample book, template cards linking to `/create?t=<id>`

**Done when:** all 10 templates look clearly different on phone and desktop, and every layout renders correctly with real and sample content.

## Phase 3: Create screen (9)

- [x] 3.1 localStorage draft prefilled with sample content; recipient and sender names; invitation message auto-filled
- [x] 3.2 Flat page editor: tap a slot to select it; page thumbnail strip below
- [x] 3.3 Layout picker per page (swap layout; content carries over where slots match)
- [x] 3.4 Text controls: edit, font (theme pair), size S/M/L, alignment, color (theme palette)
- [~] 3.5 Photo controls: replace, drag to pan, zoom, fill or fit, filter (none/warm/B&W), frame (none/border/rounded)
  - [x] 3.5a Photo helpers and tests: `setPhoto(page, slotId, patch)` in `src/lib/editor.ts` (undefined removes a key, empty adjustments leave a clean photo, zoom clamped 1 to 3, pan clamped -1 to 1); cases in `scripts/test-editor.ts`
  - [x] 3.5b "Photo" section in Customize (shown when a photo slot is selected): Fill/Fit chips and Frame chips (none/border/rounded)
  - [x] 3.5c Filter chips (none/warm/B&W)
  - [x] 3.5d Zoom slider (1 to 3) with a reset to 1x (the "drag the photo to move it" hint moved to 3.5f, so no text promises a drag that does not work yet)
  - [x] 3.5e Drag-to-pan math (pure helper + tests): pixel drag to panX/panY using image size and slot size; no movement when the photo fits inside the box
  - [~] 3.5f Drag-to-pan on the page canvas: pointer events only while a photo slot is selected, `touch-action: none` only in that state, movement threshold so a tap still selects; add the hint "Zoom in, then drag the photo to move it" under the zoom slider; code done; STILL TO DO: finger test on a real phone (tick this box after it passes)
  - [x] 3.5g Replace photo (file picker, images only, clear message for wrong type or too-large file, resets pan and zoom; stored as a data URI until 3.8 adds resize and upload) and "Reset photo"; update `project-status.md`
- [x] 3.6 Page controls: add, duplicate, delete, move (4 to 16 pages), page background color
  - [x] 3.6a Page helpers and tests in `src/lib/editor.ts`: `addPage`, `duplicatePage`, `deletePage`, `movePage`, `setPageBg`, limits `MIN_PAGES` 4 and `MAX_PAGES` 16 (nothing is changed when a limit would be broken). Assumption to confirm: page 1 is the cover, so it cannot be deleted or moved and nothing can be moved above it
  - [x] 3.6b Page toolbar above the thumbnail strip: "Add page" (a new framed-photo page with a sample photo, after the current page, which becomes selected) and "Duplicate"; both disabled at 16 pages, with the reason shown
  - [x] 3.6c "Delete" with a confirm step ("Delete page 3?" Delete / Keep); disabled on the cover and at 4 pages, with the reason shown; the neighbouring page is selected afterwards
  - [x] 3.6d "Move earlier" and "Move later"; disabled at the ends and on the cover; the moved page stays selected and the thumbnail strip keeps it in view
  - [x] 3.6e Page background colour: palette chips plus "Layout's own" in a "Page" section of Customize; check that text stays readable on every colour, and fix the chips offered if not
  - [x] 3.6f Wrap-up: thumbnail strip and selection behave after every action, phone check, update `project-status.md`
- [x] 3.7 Book style presets: palette and font-pair swap
- [x] 3.8 Browser-side photo resize and upload to Cloudinary with progress (resize on; upload code written and tested against mocks, switched on with NEXT_PUBLIC_UPLOADS=1 once 4.2 exists)
- [~] 3.9 Preview toggle (real fold engine) and publish popup: one tap publishes, copies the link, opens the share sheet, shows the edit link once, offers "Download offline"
  - [x] 3.9a Edit/Preview toggle on the pages step (`PreviewBook.tsx`, the real fold engine on the draft; the editor stays mounted but hidden, so selection survives)
  - [x] 3.9b Send popup (`PublishDialog.tsx`, `src/lib/publish.ts`): sample-photo warning, publish and copy link, share sheet, edit link shown once with copy, error and retry, "Download offline" disabled with its reason. Publishing is OFF (`NEXT_PUBLIC_PUBLISH=1` turns it on) until 4.1 exists; the popup says so and the Publish button is disabled
  - [ ] 3.9c 4.1 now exists with that contract (`{ giftUrl, editUrl }`): once DATABASE_URL works, set `NEXT_PUBLIC_PUBLISH=1` and tick 3.9. "Download offline" is already enabled (6.1) and works without publishing

## Phase 4: Backend (3)

- [x] 4.1 (built and logic-tested; the Neon store has NOT run against a real database) Neon `gifts` table (id, edit_token_hash, private_token, recipient_name, sender_name, template_id, content JSONB (per page: layout id, slot content, style overrides), status, created_at); create, update, publish routes; edit token required for every write
- [x] 4.2 (built and logic-tested; the routes and real Cloudinary were not run) Public fetch by private token (published only) and Cloudinary signed-upload route with type and size limits
- [x] 4.3 (built and logic-tested; the routes were not run) Validation and sanitization of all input; `/api/health`

**Done when:** writes need the edit token, a recipient token cannot edit, drafts return not-found.

## Phase 5: Recipient experience (3, top priority)

- [x] 5.1 (built and checked in headless Chromium; not yet seen on a real phone) Framework-free envelope module (reused in export): "Someone has a special surprise for you." / "Open Your Gift ❤️", smooth opening animation, shows recipient, sender, and message, themed to the template
- [x] 5.2 (built and checked in headless Chromium with the gift API mocked; not run against a real database or phone) Recipient page `/g/[token]`: loading and not-found states, images preload behind the envelope, `noindex`
- [x] 5.3 (built and checked in headless Chromium; not on a real phone) Envelope opens into the book on its cover, ready to fold. **The book is full screen when opened**: fixed full-viewport reading mode (works on iPhone) plus the Fullscreen API where supported, with a close button; same in the offline export

## Phase 6: Offline export (2)

- [x] 6.1 (built and checked end to end in headless Chromium; not on a real phone) Inline images as data URIs and build one self-contained `.html` (engine, envelope, CSS, fonts, content); no remote requests
- [~] 6.2 (desktop and phone-sized Chromium done; STILL TO DO: a real phone, airplane mode, finger folding; tick this box after it passes) Verified offline on desktop and phone; finger folding works

## Phase 7: Deploy (1)

- [x] 7.1 (written and the build rehearsed in a clean copy; not deployed to a real Render service) Render config and a short README (env vars, run, deploy, UptimeRobot on `/api/health`, backup note)

---

## Quality gates

- [x] Tested by finger on a real phone (fold engine, 2026-10-04; re-test the full book in Phase 5/6)
- [ ] Phone and desktop layouts checked
- [ ] No dead buttons; no fake success; basic loading and error states
- [ ] Wrong, missing, and recipient tokens rejected for edits
- [ ] Exported file works offline

## Deferred (do not build unless asked)

Dashboard, two-page spread, free-form drag/resize of slots, custom fonts, layers, undo/redo, multi-photo auto-fill, separate intro screen, cleanup jobs, rate limiter, ZIP/JSZip, extra tables, reduced-motion polish, tests beyond manual checks, user accounts.
