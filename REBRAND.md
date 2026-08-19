# Rebranding the tool for a new client

> This is the **Mock** build. Before shipping it to a client, also switch off the
> demo-only features in `src/brand.config.js`:
>
> ```js
> demoMode: false,           // hide the walkthrough homepage + palette switcher
> allowOverlayUpload: false  // lock templates to the client's own artwork
> ```

Everything a client "owns" lives in two places:

```
src/brand.config.js          <- names, colours, copy, template list
public/brand/<client>/       <- their overlays, logo, tag plates
```

Nothing else needs to change.

---

## 1. Collect the artwork

Ask the client's designer for **transparent PNGs** at the exact export size:

| Format | Size | Use |
| --- | --- | --- |
| `4:5` | 1080 × 1350 | Feed post |
| `9:16` | 1080 × 1920 | Story / reel |
| `1:1` | 1080 × 1080 | Square post |

The transparent area is where the customer's photo shows through. A footer bar,
a frame, a corner badge — anything works, as long as the file is full-bleed at
the sizes above.

You also want a **logo** with a transparent background (any size; it's displayed
about 80 px tall).

## 2. Drop the files in

```
public/brand/acme/
  template-footer.png
  template-story.png
  logo.png
```

## 3. Generate matching price-tag plates

Create `tools/briefs/acme.json`:

```json
{
  "slug": "acme",
  "brandName": "ACME EVENTS",
  "phone": "+254 700 000 000",
  "website": "acme.co.ke",
  "primary": "#FB23B3",
  "accent": "#6A044B",
  "dark": "#0B0B0F",
  "generateTemplates": false,
  "generateLogo": false
}
```

Then:

```bash
npm run brand:assets acme
```

That writes `tag-brand.png`, `tag-dark.png` and `tag-accent.png` into
`public/brand/acme/` in the client's colours.

> No artwork yet? Set `generateTemplates` and `generateLogo` to `true` and the
> script also produces five placeholder poster templates and a wordmark, so you
> can demo the tool the same day. See `public/brand/demo/` for an example.

## 4. Edit `src/brand.config.js`

```js
slug: 'acme',                    // saved files: acme_poster_1699…png
clientName: 'ACME Events',
appTitle: 'ACME Creator Studio', // browser tab
assetDir: '/brand/acme',         // <- points at the folder from step 2
logo: 'logo.png',
logoForceWhite: false,           // true if their logo is dark/single-colour

colors: { 300: '#…', 400: '#…', 500: '#…', 600: '#…' },  // light → deepest
currency: 'KSH',                 // '' hides it on the tag

templates: [
  { id: 'footer', name: 'Classic Post', sub: 'Signature footer',
    file: 'template-footer.png', size: '4:5', icon: 'fa-image',
    iconColor: 'text-pink-300' },
  …
],

socials: [ … ],                  // WhatsApp / IG / FB / TikTok links
requestDesign: { … },            // "Request Design" button target
share: { … },                    // native share sheet title + text
credits: [ … ],                  // footer credit links
```

Icons are [Font Awesome 6 free](https://fontawesome.com/search?o=r&m=free) names.
Colour shades: **300** is the lightest (small caps, hints), **400** is the main
brand colour (buttons, glow), **500**/**600** are the gradient tail.

## 5. Check it

```bash
npm run dev
```

Walk through: splash → template picker → editor → tag → capture → Save.

Then build and hand it over:

```bash
npm run build          # -> dist/  (static, drop on any host)
```

---

## Gotchas

- **Camera needs HTTPS.** On `localhost` it works; over a LAN IP on plain HTTP the
  browser blocks it. Deploy to HTTPS (Netlify/Vercel/Cloudflare Pages) before a
  client tests on their phone — otherwise they only get photo upload.
- **Overlay must be the exact canvas size.** A 1000×1250 file will be stretched to
  1080×1350 and look soft.
- **Tag text zones are fixed** to the plate geometry (title at 12%/19%, details at
  12%/43%, price right-aligned at 88%/52%). If a designer supplies a custom plate,
  match that layout — or adjust the percentages in `CameraStep.jsx` **and**
  `StudioContext.mergeFinalPoster()` together, since the preview and the export
  read the same numbers.
