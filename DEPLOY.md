# Deploying to Railway

This project is a Next.js 16 app configured with `output: "standalone"` in `next.config.ts`, which produces a self-contained server bundle that Railway can run directly.

## Quick deploy (Nixpacks, no Dockerfile)

Railway auto-detects Next.js projects via Nixpacks. This is the simplest path.

1. Push this repo to GitHub (already done — branch `main`).
2. In Railway: **New Project → Deploy from GitHub repo → byw1/bywilliaml.com**.
3. Railway detects Next.js and sets:
   - Build: `npm ci && npm run build`
   - Start: `npm run start`
4. Add a public domain: **Settings → Networking → Generate Domain** (or attach `bywilliaml.com`).

Railway sets `PORT` automatically. `next start` reads it, so no extra config is needed.

### Required settings
- **Node version**: Railway defaults to a recent LTS, which is fine for Next 16 / React 19. If you want to pin it, add to `package.json`:
  ```json
  "engines": { "node": ">=20.0.0" }
  ```
- **Environment variables**: none required today. Add any `NEXT_PUBLIC_*` vars in **Variables** before deploy so they're baked into the client bundle at build time.

## Custom domain

1. **Settings → Networking → Custom Domain** → enter `bywilliaml.com`.
2. At your DNS provider, add the CNAME Railway shows you (apex domains need ALIAS/ANAME or Railway's provided A record).
3. Wait for the cert to provision (usually < 1 min).

## Notes specific to this repo

- `next.config.ts` uses `output: "standalone"`. With Nixpacks + `npm run start` this is harmless — `next start` still works. If you later switch to a Dockerfile, you can take advantage of `.next/standalone` for a smaller image.
- `next.config.ts` whitelists `images.unsplash.com` under `remotePatterns`. The `/links` page pulls its background from Unsplash, so no extra CDN config is needed on Railway.
- The app is fully client-rendered (`'use client'` on every page) with no API routes, DB, or env secrets — so there's nothing stateful to provision.

## Optional: Dockerfile deploy (smaller image, faster cold starts)

If you'd rather build a minimal image using the standalone output, drop this `Dockerfile` at the repo root and Railway will use it instead of Nixpacks:

```dockerfile
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci

FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
EXPOSE 3000
CMD ["node", "server.js"]
```

Railway will inject `PORT`; the standalone `server.js` respects it.

## Redeploys

Every push to `main` triggers a new Railway build automatically (assuming you connected via GitHub). To deploy a feature branch, change the branch under **Settings → Source**.

## Troubleshooting

- **Build fails on `lucide-react` or `gsap`**: run `npm ci` locally to confirm the lockfile resolves; Railway uses `npm ci`, so a stale `package-lock.json` will break the build.
- **Images from Unsplash 404**: confirm `remotePatterns` in `next.config.ts` still includes `images.unsplash.com`.
- **Wrong port / "application failed to respond"**: don't hardcode `3000`. Let `next start` (or the standalone `server.js`) read `process.env.PORT`.
