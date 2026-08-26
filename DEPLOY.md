# Deploying

Production runs on [Railway](https://railway.com). This file describes that setup as it actually is; if you've forked this repo, the short version is that any host that can run `npm run build && npm run start` on Node 20.9+ will serve it, and Vercel deploys it with zero config.

## The Railway setup

- **Source**: GitHub repo `byw1/bywilliaml.com`, branch `main`. Every push to `main` triggers a build and deploy automatically.
- **Builder**: Railpack (Railway's auto-detection — no Dockerfile, no `railway.json`). It resolves Node from its current default (22.x today), runs `npm install`, then `npm run build`, and starts the app with `npm run start`.
- **Port**: Railway injects `PORT`; `next start` reads it. Don't hardcode a port anywhere.
- **Environment variables**: none. The app has no API routes, no database, and no secrets.
- **Domains**: `bywilliaml.com` (custom, CNAME → Railway) plus the generated `*.up.railway.app` hostname. Certificates are automatic.

## Things the config actually does

- `next.config.ts` sets `output: "standalone"`, but the start command is `next start` — Next logs a warning about the mismatch on every boot and serves fine anyway. If you containerize, use the standalone output properly: `CMD ["node", ".next/standalone/server.js"]`. If you stay on `next start`, you can delete the `output` line.
- `next.config.ts` holds the redirects (`/blog` → the Substack archive, `/coming-soon` → `/blackjack`) and the image-host allowlist. `remotePatterns` currently whitelists `avatars.githubusercontent.com` (homepage + About avatar) and `images.unsplash.com` (About polaroids). The optimized-image routes on `/` and `/about` break for any host not listed there — add your own domains when you swap the content.
- Every route is statically prerendered at build time. There is nothing stateful to provision.

## Gotchas learned the hard way

- **Node isn't pinned.** Railpack resolves "current default" at build time, so redeploying an unchanged commit can build against a newer Node than last time. Pin it with an `engines` field in `package.json` if that ever bites.
- **Railpack uses `npm install`, not `npm ci`** — it logs "no package manager detected" despite the committed lockfile. Builds therefore aren't strictly lockfile-reproducible.
- **The build-time clock is real**: anything rendered from `new Date()` at build time (the profile card's clock) shows whenever the last build ran, not the current time.

## Redeploys

Push to `main`. Webhook latency is a few seconds and a full build-and-deploy lands in about a minute. There's no staging environment — a push goes straight to the apex domain — so run `npm run build` locally before pushing anything you're unsure about.
