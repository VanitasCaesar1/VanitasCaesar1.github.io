# vanitascaesar1.github.io

Chakravarthi Chintapatla's homepage.

The source is a Next.js app in `web/` (Tailwind, shadcn/ui, Motion, and one WebGL shader for the dithered pixel art). It is exported as static files and copied to the repo root, which GitHub Pages serves (branch `main`, folder `/`). The files at the root other than `web/`, `scripts/`, `.github/` and this README are generated: edit `web/`, not them.

- `web/lib/content.ts`: every word on the page
- `web/components/dither/DitherArt.tsx`: the pixel art shader (clouds, eclipse, bands, globe)
- `web/public/`: the resume, the 1997 GeoCities version (`geocities.html`), images, icons and textures
- `scripts/build-site.mjs`: build `web/` and copy the export to the root
- `scripts/update-commits.mjs`, `scripts/update-contributions.mjs`: the commit counter and the GitHub graph data; the daily workflow (`.github/workflows/commit-counter.yml`) runs the counter and rebuilds

Work on it:

```sh
cd web && npm install && npm run dev        # http://localhost:3000
node scripts/build-site.mjs                 # before committing: refresh the root
```

Credits: icons from Simple Icons (CC0); cloud and ocean textures from NASA Blue Marble (public domain), via the three.js examples; Geist fonts under the SIL Open Font License.
