# Digital Gift Flipbook

Make a gift book from photos and words, send a private link, and the recipient opens an envelope and turns real-feeling folding pages with a finger.
Also downloadable as one file that works offline. No accounts: the creator keeps a secret edit link.

Routes: `/` (landing and templates), `/create` (edit, preview, send), `/g/<token>` (recipient). API: `/api/gifts`, `/api/gifts/mine`, `/api/gifts/<token>`, `/api/upload-sign`, `/api/health`.

## Run it on your computer

```bash
npm install
cp .env.example .env        # fill it in (see below); the app runs without it, but publishing and uploads stay off
npm run dev                 # http://localhost:3000
```

`npm run dev` and `npm run build` first run `scripts/build-offline.mjs`, which prepares the player and fonts that the "Download offline" file is made from (`public/offline`, not committed).

### Environment variables

| Variable | What for |
|---|---|
| `DATABASE_URL` | Neon Postgres connection string. The `gifts` table is created on first use. |
| `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` | Signed photo and voice-note uploads. The secret never leaves the server. |
| `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` | Same cloud name; publishing then accepts photos only from your account. |
| `NEXT_PUBLIC_SITE_URL` | Public address used in the links, no trailing slash. |
| `NEXT_PUBLIC_PUBLISH` | `1` turns on real publishing in the Send popup. |
| `NEXT_PUBLIC_UPLOADS` | `1` uploads photos and voice notes to Cloudinary (otherwise photos stay in the draft and the voice-note block says it is off). |

`NEXT_PUBLIC_*` values are fixed at build time: rebuild after changing them.

## Check it works

```bash
npx tsc --noEmit
for t in scripts/test-*.ts; do npx tsx $t; done    # logic tests: editor, layouts, templates, gifts, upload, geometry
npm run build && npm start
curl localhost:3000/api/health                      # {"ok":true} once DATABASE_URL works
```

Then, by hand: make a gift, Send, open the link in a private window, open the envelope, fold a page; press "Download offline" and open the file with the network off.
The one-time Cloudinary check: upload a photo in `/create`; if it fails, the cloud name, key and secret are the first suspects.
Voice notes need `NEXT_PUBLIC_UPLOADS=1`. In Cloudinary (Settings > Upload / Account limits) make sure the maximum file size for audio and video is at least 5 MB, the app's own limit; a lower account limit makes uploads fail even though the app accepts them. Then add a note to a page, publish, open the link on an iPhone (Safari) and an Android phone: the play button must appear only on that page, and the file must play from a tap. Try one file of each accepted type (MP3, M4A, AAC, WAV).

## Deploy on Render

1. Put the project in a Git repository (GitHub or GitLab).
2. Create a Neon project and a Cloudinary account; copy the values listed above.
3. In Render: New > Blueprint, pick the repository. `render.yaml` sets the build (`npm ci --include=dev && npm run build`), start (`npm start`), health check (`/api/health`) and the variables.
4. Fill in the variables Render asks for. Set `NEXT_PUBLIC_SITE_URL` to your Render address (for example `https://flipbook-gift.onrender.com`) and deploy again if you set it afterwards.
5. Open the site, make and publish a test gift, then open the link on a phone.

The free Render plan sleeps after about 15 minutes without visits, so the first visit afterwards takes about a minute. See the next section.

## Keep it awake and watch it (UptimeRobot)

Create an HTTP(s) monitor on `https://<your-site>/api/health` with a 5-minute interval and an email alert. It pings the site often enough to keep it awake on most days (Render does not promise this) and tells you when the database stops answering: the route returns `503` then.

## Backups

- Gifts live in one Neon table (`gifts`). Neon keeps a short history you can restore from; its length depends on your plan, so check it. For a copy you own, run `pg_dump "$DATABASE_URL" --table=gifts > gifts.sql` now and then.
- Photos and voice notes live in Cloudinary and stay there; the gift stores only their addresses. Do not delete the `flipbook` (photos) or `flipbook-audio` (voice notes) folders.
- Edit links are not stored in readable form (only a hash), so a lost edit link cannot be recovered or reissued. Tell creators to save it.
- Offline files are built on the creator's device and are not stored anywhere on the server.

## Voice notes

One optional note per page, set in the editor. Formats: MP3, M4A, AAC, WAV. At most 5 MB and 3 minutes. The recipient (and Preview) sees a play button only on the page that owns the note; it stops when the page turns or the book is closed; it never starts by itself. "Download offline" stores each note inside the file (a 5 MB note adds about 6.7 MB), and the Send popup says so before the download.

### Recording a voice note in the browser

In the editor's "Audio note" block, "Record" lets the creator speak instead of choosing a file: Record, Stop, listen, then "Use this recording" (or Record again / Discard). The browser encodes it as a WAV file (16 kHz, mono, 16-bit, 32 KB per second), so it follows the same format rules and goes through the same upload, Preview, gift link and offline file as any note. Recording stops by itself at 2:30 (about 4.8 MB, just under the 5 MB limit; 5 MB would be reached at about 2:36). Rules: needs `NEXT_PUBLIC_UPLOADS=1`; needs HTTPS (works on `localhost` and on Render, not on a plain `http://` address; the Record button is hidden with a reason otherwise); the microphone is released on stop, cancel, error, page change and when Preview opens; if the upload fails the recording is kept so it can be retried. Nothing extra runs on the server.
Check by hand: on an iPhone (Safari) and Android (Chrome) record, listen, use, publish, and play it from the gift link on that page only; deny the microphone permission, see the message, allow it again; record to the 2:30 stop and confirm the upload passes your Cloudinary file-size limit; play it in the offline file in airplane mode.

## Known limits

No accounts, one voice note per page (an uploaded file or a recording up to 2:30), up to 8 added text or photo components per page, no undo (deleting a component or page asks first), no rate limiting (size caps and signed uploads only), no way yet to reopen a gift from `/create?edit=<token>` (the API exists: `GET`/`PUT /api/gifts/mine` with the edit token as a `Bearer` header), no undo. See `tasks.md` (deferred list) and `project-status.md`.
