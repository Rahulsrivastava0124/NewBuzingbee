# BuzingBee (Next.js)

This project is now migrated to Next.js (JavaScript, Pages Router).

## Environment Variables

Create `.env.local` (dev) and `.env.production` (production) from `.env.example` and set values as needed:

- `NEXT_PUBLIC_BLOG_API_URL` — blog API URL used in browser requests
- `BLOG_API_URL` — optional server/script override for sitemap generation
- `SITE_URL` — canonical website URL used by sitemap generator

Notes:

- `NEXT_PUBLIC_*` values are embedded at build time by Next.js.
- For Docker builds, pass envs as build args (or keep `.env.production` in your build context).
- The app now falls back to `https://api.buzingbee.com/api/blog?` when blog API envs are missing.

## Scripts

- `npm run dev` — start development server on port 3000
- `npm run build` — generate sitemap, compile Tailwind CSS, and build production bundle
- `npm run start` — run the production server
- `npm run test` — run Jest tests
- `npm run lint` — run Next.js lint checks

## Routes

- `/` → Home
- `/services` → Services
- `/about` → About
- `/blog` → Blog listing
- `/blog/[slug]` → Blog details
- `/contact` → Contact

## Project Structure

- `pages/` — Next.js route files
- `src/pages/` — reusable page components rendered by route files
- `src/Components/` — UI components
- `public/` — static assets

## Docker

The Docker build now creates and runs the Next.js standalone server.

Build example with production envs:

- `docker build --build-arg NEXT_PUBLIC_BLOG_API_URL=https://api.buzingbee.com/api/blog? --build-arg BLOG_API_URL=https://api.buzingbee.com/api/blog? --build-arg SITE_URL=https://buzingbee.com -t buzingbee .`
