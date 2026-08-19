# Tenacity Creator Studio

A mobile-first React studio for creating branded Tenacity social posters
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

## Testing on a real phone

Saving behaves differently on a phone than on a desktop, so it has to be tested
on a device. A plain `http://192.168.x.x` LAN address is **not** a secure
context: `navigator.mediaDevices` (camera) and `navigator.share` (saving to the
camera roll) are both `undefined` there, on iOS Safari and Android Chrome alike.

```bash
npm run dev:https   # serves https:// on localhost and the LAN address
```

Open the printed `https://<lan-ip>:5173` on the phone. The certificate in
`.certs/` is self-signed, so the browser shows a warning once — on iOS tap
**Show Details -> visit this website**. After accepting, the page is a proper
secure context and camera + save work as they do in production.

To regenerate the certificate (e.g. after the LAN IP changes):

```bash
openssl req -x509 -newkey rsa:2048 -nodes -sha256 -days 825   -keyout .certs/dev-key.pem -out .certs/dev-cert.pem   -subj "/CN=<lan-ip>" -addext "subjectAltName=IP:<lan-ip>,IP:127.0.0.1,DNS:localhost"
```

### How saving is routed

`src/platform.js` picks the strategy up front, because a failed save cannot be
detected after the fact — `<a download>` on iOS throws nothing, it just does
nothing.

| Environment | Strategy | Why |
| --- | --- | --- |
| iOS, in-app browsers (secure) | native share sheet | only route to the camera roll |
| iOS, in-app browsers (insecure) | open image, long-press | Web Share unavailable without HTTPS |
| Android Chrome, desktop | `<a download>` | honoured; file lands in Downloads |

The poster is handed over as a **blob URL**, never a `data:` URL — a 1080x1350
PNG base64-encodes to several MB, and an `<a download>` href that large is
ignored by mobile Safari and blocked by Chrome on Android.

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
Created by Sir Newson. Built at YXM Digital.
Licensed between Sir Newson & Tenacity.
