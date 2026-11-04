# Mon Opticien

Bilingual (French / English) website for **Mon Opticien**, an independent optician in Montplaisir, Tunis. Visitors browse the catalogue, try frames on virtually, reserve frames to try in store, and get their eyeglass prescription explained. Orders and questions go through WhatsApp, and payment happens in store.

Built with **Next.js 15 (App Router)**, **React 19**, **TypeScript**, **Tailwind CSS** and **Supabase**.

## Features

### Storefront
- Catalogue of sunglasses, eyeglasses and contact lenses, with filters (category, face shape, gender, brand, price, polarised) kept in the URL so filtered views can be shared
- Product pages with gallery, technical details, related products and a pre-filled WhatsApp message
- French and English versions of every page, with automatic language detection on `/`
- SEO: per-page titles and descriptions, canonical and `hreflang` links, generated Open Graph images, JSON-LD (`Optician`, `Product`, `BreadcrumbList`, `FAQPage`), `sitemap.xml`, `robots.txt`
- Accessible: semantic markup, keyboard navigation, visible focus, alt text on every image, `prefers-reduced-motion` respected
- Loading skeletons, a custom 404 page, error boundaries, and graceful behaviour when the database is unreachable

### Tools
| Tool | What it does | Privacy |
|---|---|---|
| **Virtual try-on** | Camera or photo try-on with [MediaPipe Face Landmarker](https://ai.google.dev/edge/mediapipe/solutions/vision/face_landmarker). Frames are drawn from each product's shape and colours, or from an uploaded transparent PNG. Estimates the visitor's face shape and recommends frames. | Runs entirely in the browser. No image leaves the device. |
| **Try-on tray** | Visitors pick up to 5 frames and a visit slot (Mon–Sat, 9:00–19:00). They get a reference code and a pre-filled WhatsApp message. | Name, slot and frames are stored for 12 months, then deleted automatically. |
| **Prescription explainer** | Visitors photograph or type in their prescription. Claude reads the values, the visitor reviews them, and a fixed rule-based engine explains them and suggests lenses and frames. | Explicit consent required. The photo is re-encoded in the browser (location data stripped), never stored or logged. Manual entry sends nothing. |

### Admin (`/admin`)
- Product management with image upload to Supabase Storage
- Reservations dashboard: frames to prepare per visit, status tracking, call / WhatsApp links
- Printable QR-code shelf labels that link each frame to its product page

## Getting started

**Requirements:** Node.js ≥ 20.9 and npm.

```bash
npm install
cp .env.example .env.local   # then fill in the values
npm run dev                  # http://localhost:3000
```

**Run it without a database:** set `USE_SEED_DATA=true` in `.env.local`. The catalogue is then read from [`data/products.json`](data/products.json) (read-only), and reservations are saved to a local, git-ignored `.data/` folder.

`npm run dev` and `npm run build` first run `scripts/copy-mediapipe.mjs`. It copies the MediaPipe runtime into `public/vendor/` (git-ignored) and downloads the face model once if it's missing, so the try-on is served from your own domain.

## Environment variables

See [`.env.example`](.env.example) for the full list.

| Variable | Required | Description |
|---|---|---|
| `NEXT_PUBLIC_SITE_URL` | Production | Public URL without a trailing slash. Used for canonical URLs, the sitemap, Open Graph and QR labels. |
| `NEXT_PUBLIC_SUPABASE_URL` | Yes* | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes* | Supabase secret key. **Server-only**: never expose it to the browser. |
| `ADMIN_PASSWORD` | Yes | Admin password. At least 12 characters in production, or login is refused. |
| `ADMIN_SECRET` | Yes | At least 32 characters, used to sign admin sessions. Generate one with `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`. Changing it logs out every session. |
| `USE_SEED_DATA` | No | `true` = preview mode without a database (see above) |
| `ANTHROPIC_API_KEY` | No | Turns on photo reading in the prescription explainer. Without it, only manual entry is offered. The page checks for it at build time, so rebuild after adding it. |
| `PRESCRIPTION_DAILY_LIMIT` | No | Daily cap on AI prescription readings across all visitors (default `300`) |
| `NEXT_PUBLIC_FACEBOOK_URL`, `NEXT_PUBLIC_INSTAGRAM_URL` | No | Social links. Hidden when empty. |
| `NEXT_PUBLIC_GA_ID` | No | Google Analytics 4. It sets cookies, so add a consent banner first. |

\* Not needed when `USE_SEED_DATA=true`.

## Database (Supabase)

1. Create a Supabase project. Then, in the SQL editor, run [`supabase/schema.sql`](supabase/schema.sql). It creates the `products` and `reservations` tables, enables Row Level Security, and creates the `product-images` storage bucket. It's idempotent, so it's safe to re-run and it adds new columns to an existing database.
2. Load the sample catalogue into a **new** database with `npm run seed`.
3. On an **existing** database from before the try-on feature, run [`supabase/update-existing-products.sql`](supabase/update-existing-products.sql) instead. It sets frame shapes and fixes broken sample photos.

The app only talks to Supabase from the server, using the service-role key. RLS is enabled with no policies, so the public anon key can't read or write anything.

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Development server |
| `npm run build` / `npm start` | Production build and server |
| `npm run lint` / `npm run typecheck` | ESLint / TypeScript checks |
| `npm run seed` | Insert `data/products.json` into Supabase (reads `.env.local`) |
| `npm run icons` | Regenerate the favicon set from `public/favicon.svg` |

## Project structure

```
app/
  [locale]/          Public pages (fr, en): home, products, about, delivery, contact,
                     prescription, privacy, 404, OG image
  admin/             Admin pages (separate root layout, noindex)
  api/               Route handlers: admin CRUD, uploads, reservations, prescription
  robots.ts · sitemap.ts · manifest.ts
components/          UI: tray/, tryon/, prescription/, admin/, ui/ primitives
data/                Translations (fr/en), product types, seed catalogue
lib/                 Server data access, auth, validation, rate limiting, request guards,
                     SEO, face-shape and prescription logic
supabase/            SQL schema and migration
scripts/             Seed, icon generation, MediaPipe asset setup
middleware.ts        Locale routing and admin protection
```

## Security

- **Admin auth:** signed, expiring (8 h) session cookie (`HttpOnly`, `Secure`, `SameSite=Strict`) and constant-time password comparison. Checked in the middleware, again on every admin page, and on every admin API route. Weak passwords are rejected in production.
- **CSRF:** every state-changing endpoint requires a same-origin `Origin` / `Sec-Fetch-Site` header.
- **Input validation:** Zod allow-list schemas on every write. Catalogue names and prices are always read from the database, never trusted from the client. Image URLs are limited to allowed hosts.
- **Uploads:** checked by file content, not by extension or the declared type. Raster formats only (no SVG or HTML), 5 MB maximum.
- **Abuse limits:** size-capped body reading on every route (protects against oversized requests), per-IP and global rate limits, a hidden honeypot field on bookings, and a daily cap on AI costs.
- **AI output:** the model returns a strict numeric schema, every value is range-checked on the server, and all explanation text comes from fixed, reviewable rules in code.
- **HTTP headers:** Content-Security-Policy, HSTS, `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy` (camera allowed for this site only), and COOP.
- **Privacy:** cookieless Vercel Analytics (loaded on Vercel only). MediaPipe's usage telemetry is blocked by the CSP. A bilingual privacy policy is at `/fr/privacy` and `/en/privacy`.

**Known limitations**
- Rate limits are kept in memory per server instance. On serverless hosting, use a shared store (for example Upstash Redis) for strict limits.
- Client IPs are read from `x-real-ip` or the last `X-Forwarded-For` hop, which assumes a trusted proxy (Vercel or nginx). Without one, the global login limit still applies.
- The CSP allows `'unsafe-inline'` scripts, which Next.js needs without a nonce setup.
- Admin sessions are stateless. To revoke every session at once, rotate `ADMIN_SECRET`.

## Deployment

The site is designed for **Vercel**:
1. Import the repository and set the environment variables.
2. Turn on **Analytics** and **Speed Insights** in the project dashboard.
3. Redeploy after adding `ANTHROPIC_API_KEY`.

It also runs on any Node host with `npm run build && npm start` behind a reverse proxy that sets `x-real-ip`. Vercel Analytics is skipped automatically outside Vercel.

## License

No open-source license is granted: all rights reserved.
