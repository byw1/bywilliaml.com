# Birthday-page 3-D assets

`tag.glb` is the badge that hangs on the lanyard at `/birthday`: a punched card,
the clip that holds it, and the clamp that closes the strap. It's the model from
Vercel's public lanyard demo, served from this folder rather than their CDN so
the page owns its own assets and works with no third-party host reachable.

Only the geometry is used. The card face and the strap webbing are drawn at
runtime into 2-D canvases by `src/components/birthday/invite-textures.ts`, so
none of the original artwork ships — change `src/lib/birthday/event.ts` and the
printed card changes with it.

Swapping in a different badge means matching three mesh names — `card`, `clip`
and `clamp` — which `src/components/birthday/invite-lanyard.tsx` reads by name,
and re-checking the collider in that file against the new card's size.
