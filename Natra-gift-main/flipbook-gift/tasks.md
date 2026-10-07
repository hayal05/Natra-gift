# Tasks: Digital Gift Flipbook (Minimal MVP)

Source of truth: `prompt.md` (wins on any conflict). Progress: `project-status.md`.
Legend: `[ ]` todo, `[~]` in progress, `[x]` done, `[!]` blocked

**Size target: 3,000 to 5,000 lines (estimate ~4,850, near the ceiling). 31 tasks, plus 9 audio-note tasks in Phase 8 (added 2026-10-07) and 7 scheduled voice-recording tasks in Phase 9 (added 2026-10-07, not started; about 250 lines). Do not over-engineer: this is just a digital gift flipbook, with optional advanced page controls.**

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

## Phase 8: Audio notes (9) (added 2026-10-07)

An audio note is an optional voice/sound clip attached to ONE page (`PageData.audio = { src, duration }`). The creator adds it in the editor; the recipient hears it from the book, on that page, through the gift link. Parts of it already exist (`src/lib/audio.ts`, the "Audio note" block in `PageEditor.tsx`, the play button in `GiftView.tsx`, audio signing in `src/server/upload.ts`, validation in `src/server/gifts.ts`) but were built outside this task list, have no tests, and do not yet work end to end. Findings that drive these tasks:

- The recipient page falls back to the first note in the book when the current page has none, so the button appears on the wrong page.
- Preview has no player.
- The offline file keeps the note as a remote URL and has no player (silent, and not offline).
- The server accepts any `res.cloudinary.com` audio URL (photos are locked to our cloud name).
- The editor offers audio even when uploads are not set up (photos are gated by `NEXT_PUBLIC_UPLOADS`).
- OGG, WEBM and FLAC are accepted but may not play on iPhone Safari.
- `test-gifts.ts` and `test-upload.ts` have no audio cases.

Decisions (2026-10-07): one note per page; the play button shows only on the page that owns the note and the note stops when the page turns (no fallback to other pages); a note is 5 MB and 3 minutes at most.

- [x] 8.1 Behaviour rules and format policy: the decisions above are the rules; accept only MP3, M4A, AAC and WAV (play on every phone); remove OGG, WEBM and FLAC from `AUDIO_TYPES`, the extension lists in `src/lib/audio.ts` and `src/server/upload.ts`, the file input `accept`, the `formats` signed for Cloudinary and the help text in the editor
- [x] 8.2 One shared, framework-free audio player (`src/audio/player.ts`, plain DOM like `src/envelope`, no React or app imports so the offline file can inline it): `createAudioPlayer(container, { src, duration, label })` returns `{ show(page), stop(), destroy() }`-style control with play/pause button, elapsed or total time, `aria-label`s, 44 px touch target, safe-area insets, and a clear error state when the file cannot play (never a silent dead button)
- [x] 8.3 (code done; wiring checked in headless Chromium with the real player; the full page was NOT run, and no real phone) Recipient page (`GiftView.tsx`): replace the floating button with the shared player; it appears only while the current page has a note (no fallback to the first note), the note pauses and resets when the page turns or the book is closed, plus a short hint on that page ("Tap to hear a voice note"); no autoplay (browsers block it and it would startle the reader)
- [x] 8.4 (code done; checked with the real fold engine in headless Chromium; the full app was NOT run, no real phone) Preview (`PreviewBook.tsx`): the same player and the same rules, so the creator hears exactly what the recipient will; `onPageChange` wired in
- [x] 8.5 (done; all `scripts/test-*.ts` pass; `tsc` could not be fully run here because npm installs were blocked, and no errors appear in the changed files) Server hardening and tests: audio `src` must be `https://res.cloudinary.com/<NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME>/video/upload/...` (cloud check applies when the variable is set, like photos); duration 1 to 180; add audio cases to `scripts/test-gifts.ts` (valid note kept, other cloud refused, non-Cloudinary and `http:` refused, bad duration refused, note survives layout swap, duplicate and move) and `scripts/test-upload.ts` (allowed types, extension fallback, size limit, signed `folder` and `allowed_formats`)
- [x] 8.6 (code done; type-checked only against missing React types, not run in a browser) Editor gating and messages (`PageEditor.tsx`, `src/lib/audio.ts`): the "Audio note" block is usable only when uploads are enabled (`UPLOADS_ENABLED`); otherwise it says why it is off, like photos; the server's "Uploads are not set up" answer gets its own plain message instead of the generic one; Remove audio also stops the player; the editor shows which pages have a note (small marker on the thumbnail)
- [x] 8.7 (decision 2026-10-07: YES, include audio; code done and type-checked, NOT yet run: the offline runtime needs `npm run build:offline` and a browser check in 8.8) Include audio in the offline file. Plan was, if yes: inline the note as a data URI in `src/lib/offline.ts` (like photos; a 5 MB note adds about 6.7 MB, so show the file size before download), add the shared player to `src/offline/runtime.ts` and rebuild `build-offline.mjs`, keep the file free of `http(s)` references. If no: the offline file drops notes and the Send popup says so before download
- [~] 8.8 (done in this sandbox: all `test-*.ts` pass, no code errors in `tsc`, offline file built from the app's own `buildOfflineHtml` and played with the network off on a phone viewport; STILL TO DO, owner's side: items below; tick this box after they pass) Verify: `npx tsc --noEmit` and all `scripts/test-*.ts`; headless Chromium (touch phone viewport) with a mocked gift and a small real MP3/M4A/WAV: button only on the right page, hidden elsewhere, pauses on page turn and Close, no console errors, Preview behaves the same, offline file (if 8.7 is yes) plays with the network off. **Owner's side:** real Cloudinary upload of each accepted format, publish, open the gift link on a real iPhone (Safari) and an Android phone, and the offline file in airplane mode (tick this task only after these pass)
- [x] 8.9 (done 2026-10-07; README, status and task list updated) Housekeeping: add `NEXT_PUBLIC_UPLOADS=1` and the Cloudinary account's maximum file size for audio (match 5 MB) to the README checks; update `README.md` limits, `project-status.md` (phase tracker and a session entry), and tick these tasks

**Done when:** a creator adds a voice note to page 3, the Send link opens on a phone, and the play button appears only on page 3 and plays the note.

---

## Phase 9: Voice recording in the browser (7) (scheduled 2026-10-07, build only on the owner's go-ahead)

Lets the creator record a voice note in `/create` instead of choosing a file. Estimate: about 250 added lines (range 200 to 350). No server change and no extra load on Render: the recording becomes a normal audio file and goes through the existing signed upload, validation, Preview, recipient page and offline file.

Decisions (2026-10-07): recordings are encoded in the browser as WAV (16 kHz, mono, 16-bit) so they follow the existing format policy and play on every phone (MP3, M4A, AAC and WAV only; no WEBM). At 32 KB per second a recording hits the 5 MB cap at about 2 min 36 s, so recording stops by itself at 2:30 (the 3-minute rule stays for uploaded files). One note per page, no autoplay, same rules as Phase 8. Needs HTTPS (works on `localhost` and on Render).

- [x] 9.1 (done 2026-10-07: constants and `recordingSupported()` added to `src/lib/audio.ts`, not yet used by any screen; checked with `tsx`) Rules and housekeeping: add the decisions above to `src/lib/audio.ts` as constants (`RECORD_MAX_SECONDS` 150, `RECORD_SAMPLE_RATE` 16000); remove "in-browser voice recording" from the Deferred list; add `RECORDING_SUPPORTED` check (`navigator.mediaDevices.getUserMedia` and `AudioContext` exist, secure context)
- [x] 9.2 (done 2026-10-07: `src/audio/wav.ts` and `scripts/test-audio.ts`, 27 checks pass with `tsx`; strict `tsc` clean on the encoder) WAV encoder, pure and tested (`src/audio/wav.ts`, no DOM): float chunks to 16 kHz mono (simple downsample with averaging), 16-bit PCM, 44-byte header, returns a `Blob`/bytes; cases in a new `scripts/test-audio.ts` (header fields, length, silence and a sine wave round trip, 150 s stays under 5 MB, odd sample rates 44.1k and 48k)
- [x] 9.3 (done 2026-10-07: `src/audio/recorder.ts` and `scripts/test-recorder.ts`, 27 checks pass with a fake microphone; the AudioWorklet path and a real microphone are NOT yet run: they come in 9.6) Recorder module (`src/audio/recorder.ts`, plain TypeScript, no React): `createRecorder({ onTick, onStop, onError })` with `start()`, `stop()`, `cancel()`; uses `getUserMedia` plus `AudioWorklet` (fallback `ScriptProcessor` for old Safari); timer callback each second; auto-stop at `RECORD_MAX_SECONDS`; always releases the microphone (tracks stopped, context closed) on stop, cancel and error; typed errors: `denied`, `no-mic`, `unsupported`, `busy`, `failed`
- [x] 9.4 (done 2026-10-07: code in `PageEditor.tsx`, `CreateScreen.tsx` passes `active`; NOT run in a browser, no React in this sandbox; shown/seen only in 9.6) Editor UI (`PageEditor.tsx`, "Audio note" block): "Record" button beside "Choose audio"; while recording: a clear "Recording 0:42 / 2:30" line, Stop and Cancel; after stopping: Listen, "Use this recording", "Record again"; hidden with a reason when `RECORDING_SUPPORTED` is false; plain messages for each error type (blocked mic permission says how to allow it); recording is cancelled when the page changes, the editor unmounts or Preview opens
- [x] 9.5 (done 2026-10-07 together with 9.4; upload NOT run against real Cloudinary) Use the recording: "Use this recording" sends the WAV through the existing `uploadAudio` (progress, replaces any note on the page, duration set from the recording); gated by `AUDIO_ENABLED` like file upload; failure keeps the old note and the recording so the creator can retry
- [~] 9.6 (done 2026-10-07 for the recorder, WAV and upload in real headless Chromium with a fake microphone and the real AudioWorklet; STILL TO DO: the editor screen itself, Preview and the offline file with a recorded note, because React/Next cannot be installed here; tick when run) Verify in the sandbox: `tsx scripts/test-audio.ts` and all other `test-*.ts`; headless Chromium with a fake microphone (`--use-fake-device-for-media-stream --use-fake-ui-for-media-stream`): record, stop, listen, use, the uploaded body is a valid WAV under 5 MB, auto-stop at the limit (limit shortened for the test), denied permission and no-microphone paths show their messages, microphone released after every path, recording cancelled on page change, no console errors; Preview and the offline file play a recorded note
- [~] 9.7 (done 2026-10-07: README, status and task list; the owner-side checks below are still to do, tick when they pass) Housekeeping: README (recording, limits, HTTPS needed, size math), `project-status.md` (phase tracker and session entry), tick tasks. **Owner's side (tick Phase 9 only after these pass):** real iPhone (Safari: microphone prompt, recording, playback of the result, recording while the screen locks or a call comes in), real Android (Chrome: same), denied then re-allowed permission, a 2:30 recording uploads under the Cloudinary file-size limit, the recorded note plays on the gift link and in the offline file in airplane mode

**Done when:** a creator taps Record on page 3, speaks, stops, listens, taps "Use this recording", sends the link, and the recipient hears it on page 3 only, on iPhone and Android.

**Cost note:** nothing here runs on the server beyond the existing signing route, so the Render free tier is not affected.

---

## Quality gates

- [x] Tested by finger on a real phone (fold engine, 2026-10-04; re-test the full book in Phase 5/6)
- [ ] Phone and desktop layouts checked
- [ ] No dead buttons; no fake success; basic loading and error states
- [ ] Wrong, missing, and recipient tokens rejected for edits
- [ ] Exported file works offline
- [ ] Audio note plays on its own page only, through the gift link, on a real iPhone and Android phone (Phase 8)
- [ ] Recorded voice note works on a real iPhone and Android phone, and is released from the microphone afterwards (Phase 9)

## Deferred (do not build unless asked)

Dashboard, two-page spread, free-form drag/resize of slots, custom fonts, layers, undo/redo, multi-photo auto-fill, separate intro screen, cleanup jobs, rate limiter, ZIP/JSZip, extra tables, in-browser voice recording (now scheduled as Phase 9, not built), more than one note per page, audio autoplay, reduced-motion polish, tests beyond manual checks, user accounts.
