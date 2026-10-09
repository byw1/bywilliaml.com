# bywilliaml.com

An animated personal site and link-in-bio, live at **[bywilliaml.com](https://bywilliaml.com)**.

Built with Next.js 16 (App Router), React 19, Tailwind CSS v4, and framer-motion. Every page of the site proper is statically prerendered. The parts that write to a database — the booking system (`/meet`, `/admin`) and the birthday RSVP page (`/birthday`) — are the dynamic exceptions: they need Postgres and a handful of environment variables, and the rest of the site builds and runs fine without them.

It's open source under the [MIT license](LICENSE): fork it, gut the content, and make it your own portfolio.

## What's inside

- **`/`** — the link hub: a draggable stack of 3-D hardcover books (real spines, page edges, perspective), a profile card, and a macOS-style dock with cosine magnification for socials.
- **`/about`** — a drag-to-flip polaroid stack, bio, 3-D tilt cards with a pointer-tracked spotlight, an auto-scrolling book carousel, and manila folders that hinge open on hover.
- **`/projects-test`** — 3-D tilt project cards with a pointer-tracked glare, staggered entrances, and a live/building status that turns a card into a real link when the project ships.
- **`/builds`** — side projects, unlinked from the homepage on purpose. Charades leads, with the in-progress domains below it.
- **`/charades`** — the landing page for Charades: Make Your Own Decks (the iPhone party game, source at [byw1/Deckhead](https://github.com/byw1/Deckhead)). A 3-D Dex built from three.js primitives with real deck cards floating around him, a playable tilt demo, the deck wall and the app's own type and colours. `/charades/privacy` is the App Store privacy policy, and `/charades/decks` hands out the Claude skill and runs a deck maker that turns any AI's JSON into a QR code and a `.charades` file, entirely in the browser.
- **`/blackjack`** — a complete single-deck blackjack game (dealer AI, betting, confetti). It's the placeholder behind the "Projects" card until the real page takes over.
- **`404`** — a playable emoji slot machine with coins, a bet slider, and a jackpot screen flash. Try any bad URL.
- **`/birthday`** — a party invite on a physics lanyard you can grab and fling across the whole screen (three.js, Rapier), with confetti drifting behind the page. The scene is a fixed backdrop that takes no pointer events of its own, so the badge is never boxed into a column and every link on top of it still works; it reads pointer events from the page element instead. Opens on the same signature intro as the homepage, then an RSVP form and a live guest wall. The card face and the strap webbing are drawn into 2-D canvases at runtime from the event details, so there is no artwork to keep in sync. Names, notes and plus-ones go on the wall; phone numbers and email addresses never leave the server. Noindexed — it's for people with the link.
- **`/meet`** — a self-hosted Calendly. Public booking links (`/meet/personal`, `/meet/work`) that write to different calendars — Gmail and Zoho — while checking **all** connected calendars for conflicts, so the two can never collide. Every booking gets a Google Meet link, including the Zoho-hosted ones. See [`SCHEDULING.md`](SCHEDULING.md).
- **`/admin`** — Google sign-in behind an email allowlist; connect calendar accounts, choose which ones block time, and edit each link's hours.
- **`/blog`** — 301s to [the Substack](https://bywilliaml.substack.com/archive).

Animation details worth stealing: the newer components (project cards, book carousel) write transforms to the DOM as CSS custom properties inside a single `requestAnimationFrame` — no React state on pointer move — and honor `prefers-reduced-motion`. "Random" visuals that render on the server (confetti trajectories, slot reels) derive from a seeded PRNG (`mulberry32` in `src/lib/utils.ts`) so hydration never mismatches.

## Run it

```bash
npm ci        # install from the lockfile
npm run dev   # http://localhost:3000

npm run build # production build (static prerender, type-checked)
npm run start # serve the build
npm run lint  # eslint
npm test      # scheduling rules (node:test)
npm run migrate # apply db/migrations to $DATABASE_URL
```

Node 20.9+ (Next 16's floor). No `.env` needed for the site itself; copy
`.env.example` to `.env.local` if you want `/meet`, `/admin` or the `/birthday`
guest wall to run. The invite itself renders without a database — only the RSVP
list needs one.

## Make it yours

All content is plain TypeScript data at the top of each page — there's no CMS to configure.

| Edit this | To change |
| --- | --- |
| `src/app/page.tsx` | The four link cards, social URLs, profile name/status |
| `src/app/layout.tsx` | Site title and description |
| `src/app/about/page.tsx` | Bio, polaroids, infographic cards, books, folders |
| `src/app/projects-test/page.tsx` | Projects (rank, status, accent colors, links) |
| `src/app/builds/page.tsx` | The build projects list |
| `src/components/charades/data.ts` | Charades links (GitHub, App Store once live), deck names and sample cards |
| `src/app/charades/privacy/page.tsx` | The Charades privacy policy; keep it in step with `PRIVACY.md` in byw1/Deckhead |
| `public/charades/charades-deck-maker.zip` | The Claude skill, zipped from `skill/charades-deck-maker` in byw1/Deckhead |
| `src/app/youtube-channels/page.tsx` | The channel list (avatars live in `public/youtube/`) |
| `src/app/videogames/page.tsx` | The games list |
| `src/lib/birthday/event.ts` | The party: date, time, place, dress code, RSVP deadline — read by the page, the 3-D card and the countdown |
| `src/app/globals.css` | Fonts and the black/white palette |
| `/admin` (not a file) | Booking links, hours, and which calendars block time |
| `next.config.ts` | Redirects and the image-host allowlist (`remotePatterns`) — add your own image domains here |
| `src/app/favicon.ico` | Still the default Next.js icon; replace it with yours |

Reusable pieces live in `src/components/ui/` — `perspective-book`, `mac-os-dock`, `polaroid-stack`, `tilt-card`, `project-card`, `animated-folder`, `liquid-glass` — each self-contained with typed props.

## Deploying

Production runs on Railway; `DEPLOY.md` documents that setup. Nothing is Railway-specific though — `next build && next start` on any Node host works, and Vercel deploys it with zero config. The booking system and the birthday RSVPs additionally need a Postgres database and the variables listed in `SCHEDULING.md`.

## Credits

Designed and built end-to-end with [Claude Code](https://claude.com/claude-code). MIT licensed — attribution appreciated, not required.
