# Phoneplace Creator Pro

A mobile-first React studio for creating branded Phoneplace Kenya social posters
(Reel 9:16, Classic/Dark/Neon/New-Product 4:5, or a custom PNG template).
Capture from camera or upload a photo, drop an editable product tag, then run the
"magic reveal" to composite a downloadable 1080×1350 (or 1080×1920) poster.

Ported from a single-file prototype to Vite + React + Tailwind.

## Run

```bash
npm install
npm run dev      # http://localhost:5173 (auto-picks another port if busy)
npm run build    # production build -> dist/
npm run preview  # preview the production build
```

## Structure

- `src/StudioContext.jsx` — all app state, camera/upload logic, canvas compositing,
  and the magic-reveal animation sequence.
- `src/components/`
  - `SplashScreen.jsx` — centered logo splash (2s).
  - `SelectStep.jsx` — template picker + socials footer.
  - `CameraStep.jsx` — viewfinder, draggable tag, thumb-reach control bar.
  - `ResultStep.jsx` — reveal area + Save / Retake / Edit / Home.
  - `SpecsModal.jsx` — product-tag editor.
  - `AlertToast.jsx` — transient messages.
- `src/constants.js` — formats, template cards, social links, logo URL.

## Magic-reveal sequence

1. **Matrix rain** — glowing green code rain over the base photo (~2s).
   Completion is gated by a `setTimeout`, not `requestAnimationFrame`, so the
   sequence never stalls if the tab is backgrounded / not compositing.
2. **Glowing fill** — the template overlay wipes in from top → bottom with a
   travelling neon scan line (~2s); the product tag flips in with a particle burst.
3. **Ready** — overlay is forced fully visible and the **Save Poster** button glows.

## Mobile ergonomics

- `100dvh` layout with `env(safe-area-inset-*)` padding (notch/home-bar safe).
- No top-corner buttons — Back / Magic / Flip / Tag sit in a control bar directly
  above the shutter; Retake / Edit / Home sit beneath Save Poster on the result screen.
- `viewport-fit=cover`, `user-scalable=no`, responsive capture area that preserves
  the exact 4:5 / 9:16 aspect on any screen.

---
Created by Sir Newson. Built at YXM.digital.
Licensed between Sir Newson & Phoneplace Kenya.
