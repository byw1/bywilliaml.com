# About-page polaroid photos

Drop the photos for the About page's polaroid stack in this folder.

- **Shape**: the frame shows a square crop (240×240 on screen), center-cropped
  from whatever you upload. Roughly square photos look best.
- **Size**: at least 600×600 px so it stays sharp on retina screens. Bigger is
  fine — Next's image optimizer resizes at request time.
- **Format**: jpg, png, or webp.
- **Names**: anything readable, e.g. `william.jpg`, `sunset-hike.jpg`.

Then reference them in the `POLAROIDS` array at the top of
`src/app/about/page.tsx` — a local file here is `src: '/polaroids/william.jpg'`
(no host allowlisting needed, unlike remote URLs).
