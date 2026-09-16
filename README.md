# increasefilesize.com

Free browser-based tools that increase the file size of a JPG, PNG or PDF to an
exact byte target, for upload forms that enforce a **minimum** file size.

Every file the visitor picks is processed in their own browser. There is no
upload endpoint in the application, so files are never transmitted, never
stored, and hosting stays near free.

---

## Getting it running

```bash
npm install
cp .env.example .env          # then edit the values (see below)
npm run db:push               # creates the SQLite database from prisma/schema.prisma
npm run db:seed               # admin user + 10 starter articles + 41 landing pages
npm run dev                   # http://localhost:3000
```

Sign in to the admin at `/admin/login` with the `ADMIN_EMAIL` and
`ADMIN_PASSWORD` you set in `.env`.

### Environment variables

| Variable | What it does |
| --- | --- |
| `DATABASE_URL` | `file:./dev.db` for SQLite, or a Postgres connection string |
| `NEXTAUTH_SECRET` | Session signing key — `openssl rand -base64 32` |
| `NEXTAUTH_URL` | The site's canonical URL (Vercel sets this for you) |
| `NEXT_PUBLIC_SITE_URL` | Used for canonical tags, sitemap and JSON-LD |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | Seeds the single admin account. Change before deploying |
| `MEDIA_DRIVER` | `local` (dev) or `s3` (Cloudflare R2 / S3 in production) |

---

## How the engines work

All three engines are pure byte manipulation. In the default **pad** mode the
compressed image data is never decoded or re-encoded, so the output is
pixel-for-pixel identical to the input — there is no mechanism by which quality
could drop.

| Format | Where the padding goes | Why it is safe |
| --- | --- | --- |
| **JPG** | `COM` (comment) marker segments inserted after the SOI and any leading `APPn` segments | COM segments are defined by the JPEG spec as skippable; JFIF/Exif structure is left in place |
| **PNG** | Ancillary `tEXt` chunks inserted before `IEND`, with correct CRC-32 | Ancillary chunks are the part of the PNG spec that decoders may ignore; `IDAT` is untouched |
| **PDF** | An inert stream object referenced from the document catalog under a private key | A valid, referenced object that nothing renders; readers pass over unknown catalog keys |

Byte-exactness: a JPG COM segment is at minimum 5 bytes and a PNG `tEXt` chunk
at minimum 14, so residuals smaller than that (only possible when the source is
already within a few bytes of the target) are placed after the JPEG `EOI` or the
PDF trailing `%%EOF`, which decoders also ignore. Every target is hit exactly.

The optional **increase resolution** mode is a genuine change: the image is
redrawn at larger pixel dimensions with the Canvas API, then padded to the exact
target. Use it when you want more pixels; use padding when you only need the
byte count to change.

`src/lib/engines/` is organised so the byte logic is pure and testable:

```
bytes.ts     shared helpers, CRC-32, size parsing/formatting
jpeg.ts      padJpeg()  — pure, no DOM
png.ts       padPng()   — pure, no DOM
pdf.ts       padPdf()   — pdf-lib, loaded on demand to keep it out of the initial bundle
browser.ts   orchestration: format sniffing, canvas re-encode, upscale, Blob output
```

---

## Adding landing pages

`src/config/target-pages.ts` is the source of truth. Add an entry and the
dynamic route at `src/app/(site)/[slug]/page.tsx`, the sitemap, the internal
linking blocks and the footer all pick it up.

Pages can also be added at runtime from **/admin/pages** without a deploy: rows
in the `TargetPage` table are merged over the static config, and the new URL is
rendered on demand and then cached.

Per-page copy is composed in `src/lib/page-content.ts` from the page's format,
target size and keyword, with phrase variants selected by a hash of the slug —
so pages are templated but not duplicates. `src/config/size-context.ts` adds
genuinely different prose per target size (what a 20KB file actually is, which
forms ask for 100KB, and so on).

---

## Architecture notes

- **Route groups.** `src/app/(site)` and `src/app/(admin)` have separate root
  layouts, so the admin never renders the public header, footer or analytics
  beacon, and the public site never ships the admin's JavaScript.
- **Analytics.** `/api/events` accepts a small JSON body describing *what*
  happened — type, format, target size, an anonymous rolling visitor id. It has
  a 2KB body cap and an allow-list of fields, so no file content can reach it.
  The dashboard at `/admin` reads the `Event` table directly.
- **Database fallbacks.** Public pages read the static config first and layer
  the database on top through `safeQuery`, so a database outage degrades to the
  seeded content rather than a 500.
- **Media.** `src/lib/storage.ts` has one function to change (`putObject`) to
  move blog images from the local `/public/uploads` folder to R2 or S3.
  Vercel's filesystem is read-only at runtime, so production needs the S3
  driver if you want to upload images from the admin.

### Moving to Postgres

1. Change `provider` to `"postgresql"` in `prisma/schema.prisma`.
2. Point `DATABASE_URL` at Neon or Supabase.
3. `npx prisma migrate deploy`.

No model changes are needed — the schema deliberately avoids provider-specific
types and enums.

---

## Verification

```bash
npm run typecheck          # TypeScript, no errors
npm run build              # production build
npm run verify:engines     # byte-exactness across ~60 format/size combinations
npm run verify:browser     # drives the real UI in Chromium (needs the app running)
npm run verify:responsive  # phone + desktop layout, no horizontal overflow
```

`verify:browser` is the important one. For each case it picks a file through the
real file input, runs the tool, downloads the result, and asserts that the file
is byte-exactly the requested size **and that no network request carried the
file**. It finishes by loading the page, switching the browser offline, and
running the tool again — which only passes because nothing is uploaded.

Current results: all engine and browser checks pass, and Lighthouse scores
100 / 100 / 100 / 100 (performance, accessibility, best practices, SEO) on
mobile for a landing page.

---

## Deploying to Vercel

1. Push the repository to GitHub and import it in Vercel.
2. Set the environment variables above, with `DATABASE_URL` pointing at a
   hosted Postgres (Vercel's filesystem will not persist SQLite).
3. Set `MEDIA_DRIVER=s3` and the `S3_*` variables if you want to upload blog
   images in production.
4. Deploy. `npm run build` runs `prisma generate` first.

After the first deploy, run the seed once against the production database to
create the admin user and starter content.
