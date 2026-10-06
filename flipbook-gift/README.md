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
| `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` | Signed photo uploads. The secret never leaves the server. |
| `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` | Same cloud name; publishing then accepts photos only from your account. |
| `NEXT_PUBLIC_SITE_URL` | Public address used in the links, no trailing slash. |
| `NEXT_PUBLIC_PUBLISH` | `1` turns on real publishing in the Send popup. |
| `NEXT_PUBLIC_UPLOADS` | `1` uploads photos to Cloudinary (otherwise they stay in the draft). |

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
- Photos live in Cloudinary and stay there; the gift stores only their addresses. Do not delete the `flipbook` folder.
- Edit links are not stored in readable form (only a hash), so a lost edit link cannot be recovered or reissued. Tell creators to save it.
- Offline files are built on the creator's device and are not stored anywhere on the server.

## Known limits

No accounts, no rate limiting (size caps and signed uploads only), no way yet to reopen a gift from `/create?edit=<token>` (the API exists: `GET`/`PUT /api/gifts/mine` with the edit token as a `Bearer` header), no undo. See `tasks.md` (deferred list) and `project-status.md`.
