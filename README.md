# bywilliaml.com

An animated personal site and link-in-bio, live at **[bywilliaml.com](https://bywilliaml.com)**.

Built with Next.js 16 (App Router), React 19, Tailwind CSS v4, and framer-motion. Every page is statically prerendered — there's no database, no API routes, and no environment variables, so it runs anywhere Node runs.

It's open source under the [MIT license](LICENSE): fork it, gut the content, and make it your own portfolio.

## What's inside

- **`/`** — the link hub: a draggable stack of 3-D hardcover books (real spines, page edges, perspective), a profile card, and a macOS-style dock with cosine magnification for socials.
- **`/about`** — a drag-to-flip polaroid stack, bio, 3-D tilt cards with a pointer-tracked spotlight, an auto-scrolling book carousel, and manila folders that hinge open on hover.
- **`/projects-test`** — 3-D tilt project cards with a pointer-tracked glare, staggered entrances, and a live/building status that turns a card into a real link when the project ships.
- **`/blackjack`** — a complete single-deck blackjack game (dealer AI, betting, confetti). It's the placeholder behind the "Projects" card until the real page takes over.
- **`404`** — a playable emoji slot machine with coins, a bet slider, and a jackpot screen flash. Try any bad URL.
- **`/blog`** — 301s to [the Substack](https://bywilliaml.substack.com/archive).

Animation details worth stealing: the newer components (project cards, book carousel) write transforms to the DOM as CSS custom properties inside a single `requestAnimationFrame` — no React state on pointer move — and honor `prefers-reduced-motion`. "Random" visuals that render on the server (confetti trajectories, slot reels) derive from a seeded PRNG (`mulberry32` in `src/lib/utils.ts`) so hydration never mismatches.

## Run it

```bash
npm ci        # install from the lockfile
npm run dev   # http://localhost:3000

npm run build # production build (static prerender, type-checked)
npm run start # serve the build
npm run lint  # eslint
```

Node 20.9+ (Next 16's floor). No `.env` needed.

## Make it yours

All content is plain TypeScript data at the top of each page — there's no CMS to configure.

| Edit this | To change |
| --- | --- |
| `src/app/page.tsx` | The four link cards, social URLs, profile name/status |
| `src/app/layout.tsx` | Site title and description |
| `src/app/about/page.tsx` | Bio, polaroids, infographic cards, books, folders |
| `src/app/projects-test/page.tsx` | Projects (rank, status, accent colors, links) |
| `src/app/youtube-channels/page.tsx` | The channel list |
| `src/app/globals.css` | Fonts and the black/white palette |
| `next.config.ts` | Redirects and the image-host allowlist (`remotePatterns`) — add your own image domains here |
| `src/app/favicon.ico` | Still the default Next.js icon; replace it with yours |

Reusable pieces live in `src/components/ui/` — `perspective-book`, `mac-os-dock`, `polaroid-stack`, `tilt-card`, `project-card`, `animated-folder`, `liquid-glass` — each self-contained with typed props.

## Deploying

Production runs on Railway; `DEPLOY.md` documents that setup. Nothing is Railway-specific though — `next build && next start` on any Node host works, and Vercel deploys it with zero config.

## Credits

Designed and built end-to-end with [Claude Code](https://claude.com/claude-code). MIT licensed — attribution appreciated, not required.
