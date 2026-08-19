/* Brand colour for the embedded apps.

   Quoty, QR Studio and Caption Writer are self-contained single-file apps with
   their own accents. They are served from this origin, so the frame can reach
   into the document and restate those accents in the client's colour — without
   touching the apps themselves, which stay independently updatable.

   Each app declares its accent differently, so each gets its own patch. */

const shade = (hex, t) => {
  const h = hex.replace('#', '')
  const n = parseInt(h.length === 3 ? h.split('').map((c) => c + c).join('') : h, 16)
  const to = t < 0 ? 0 : 255
  const k = Math.abs(t)
  const ch = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((c) => Math.round(c + (to - c) * k))
  return `#${ch.map((c) => c.toString(16).padStart(2, '0')).join('')}`
}

/** Opacity modifiers compile to their own classes (bg-brand-500/20 becomes
 *  .bg-brand-500\/20), so each one has to be restated separately. */
const OPACITIES = [5, 10, 20, 25, 30, 40, 50, 60, 70, 75, 80, 90]

const rgbTriple = (hex) => {
  const h = hex.replace('#', '')
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h
  const n = parseInt(full, 16)
  return `${(n >> 16) & 255} ${(n >> 8) & 255} ${n & 255}`
}

/** Tailwind-CDN apps compile utilities into real classes, so the patch restates
 *  those classes — bare, and at every opacity they use. */
function tailwindBrandPatch(scale) {
  const rules = []
  Object.entries(scale).forEach(([step, hex]) => {
    rules.push(
      `.bg-brand-${step}{background-color:${hex} !important}`,
      `.hover\\:bg-brand-${step}:hover{background-color:${hex} !important}`,
      `.text-brand-${step}{color:${hex} !important}`,
      `.hover\\:text-brand-${step}:hover{color:${hex} !important}`,
      `.border-brand-${step}{border-color:${hex} !important}`,
      `.hover\\:border-brand-${step}:hover{border-color:${hex} !important}`,
      `.ring-brand-${step}{--tw-ring-color:${hex} !important}`,
      `.focus\\:ring-brand-${step}:focus{--tw-ring-color:${hex} !important}`,
      `.from-brand-${step}{--tw-gradient-from:${hex} !important;--tw-gradient-to:${hex}00 !important;--tw-gradient-stops:var(--tw-gradient-from),var(--tw-gradient-to) !important}`,
      `.via-brand-${step}{--tw-gradient-stops:var(--tw-gradient-from),${hex},var(--tw-gradient-to) !important}`,
      `.to-brand-${step}{--tw-gradient-to:${hex} !important}`,
      `.shadow-brand-${step}\\/30{--tw-shadow-color:${hex}4d !important}`
    )
    const t = rgbTriple(hex)
    OPACITIES.forEach((o) => {
      const a = (o / 100).toFixed(2)
      rules.push(
        `.bg-brand-${step}\\/${o}{background-color:rgb(${t} / ${a}) !important}`,
        `.text-brand-${step}\\/${o}{color:rgb(${t} / ${a}) !important}`,
        `.border-brand-${step}\\/${o}{border-color:rgb(${t} / ${a}) !important}`,
        `.hover\\:border-brand-${step}\\/${o}:hover{border-color:rgb(${t} / ${a}) !important}`
      )
    })
    rules.push(`.group:hover .group-hover\\:text-brand-${step}{color:${hex} !important}`)
  })
  return rules.join('\n')
}

/** An app's own dark surface scale, flipped to a light neutral at every opacity
 *  it uses — so the layering survives the theme change. */
function lightSurfacePatch(name, light) {
  const rules = [`.bg-${name}{background-color:${light} !important}`]
  OPACITIES.forEach((o) =>
    rules.push(`.bg-${name}\\/${o}{background-color:${light} !important}`)
  )
  return rules.join('\n')
}

/* Light mode for the embedded apps.

   Quoty and Caption Writer ship dark. Both express their surfaces through
   something we can restate — Quoty through :root variables, Caption Writer
   through the dark-* and mint-* utilities its Tailwind build compiled — so the
   frame can put them on a light surface without editing either app. */
const LIGHT = {
  quoty: `:root{
    --ink:#ffffff !important;
    --panel:#f7f8fb !important;
    --panel-2:#eef1f6 !important;
    --line:#dfe3ec !important;
    --txt:#12141a !important;
    --txt-dim:#5b6274 !important;
  }
  body{background:#ffffff !important;color:#12141a !important}
  /* the stage and the deck hardcode their own dark surface */
  .stage{background:#f4f6fa !important}
  .deck{background:rgba(255,255,255,0.96) !important;
    box-shadow:0 14px 34px -26px rgba(18,20,26,0.4) !important}
  input,textarea,select{background:#ffffff !important;color:#12141a !important;
    border-color:#dfe3ec !important}`,

  captions: `body{background:#ffffff !important;color:#12141a !important}
  .bg-dark-900{background-color:#ffffff !important}
  .bg-dark-800{background-color:#f6f8f7 !important}
  .bg-dark-700{background-color:#eef2f0 !important}
  .border-dark-700,.border-dark-800{border-color:#e2e8e5 !important}
  .text-mint-100{color:#12141a !important}
  .text-mint-200{color:rgba(18,20,26,0.62) !important}
  .text-white{color:#12141a !important}
  input,textarea,select{background:#ffffff !important;color:#12141a !important;
    border-color:#e2e8e5 !important}
  input::placeholder,textarea::placeholder{color:rgba(18,20,26,0.38) !important}
  /* its own panel + field classes carry the dark surface */
  .glass-panel{
    background:linear-gradient(145deg,rgba(255,255,255,0.96),rgba(246,248,247,0.9)) !important;
    border:1px solid rgba(18,20,26,0.08) !important;
    border-top:1px solid rgba(18,20,26,0.06) !important;
    border-left:1px solid rgba(18,20,26,0.06) !important;
    box-shadow:0 16px 38px -26px rgba(18,20,26,0.28) !important}
  .input-cyber{
    background:#ffffff !important;color:#12141a !important;
    border:1px solid rgba(18,20,26,0.12) !important;
    box-shadow:inset 0 1px 3px rgba(18,20,26,0.05) !important}
  .gradient-text{-webkit-text-fill-color:initial !important}
  .bg-gradient-to-b.from-dark-900,.from-dark-900{--tw-gradient-from:#ffffff !important}
  ${lightSurfacePatch('dark-900', '#ffffff')}
  ${lightSurfacePatch('dark-800', '#f6f8f7')}
  ${lightSurfacePatch('dark-700', '#eef2f0')}
  .text-mint-100\/80,.text-mint-200\/80{color:rgba(18,20,26,0.6) !important}
  .border-mint-200\/20{border-color:rgba(18,20,26,0.12) !important}
  /* its small labels relied on a glow for contrast on black — on white they
     need real ink, whatever the brand colour is */
  .text-brand-500\/50,.text-brand-500\/40,.text-brand-500\/30,.text-brand-500\/25{
    color:rgba(18,20,26,0.7) !important}`,

  // QR Studio already ships a light scheme — just make sure dark is not forced.
  qr: `html{color-scheme:light}
  html.dark{color-scheme:light}`,
}

export function themePatchFor(appId, hex, light = true) {
  if (!hex) return ''
  const scale = {
    50: shade(hex, 0.92),
    100: shade(hex, 0.84),
    400: shade(hex, 0.22),
    500: hex,
    600: shade(hex, -0.16),
    700: shade(hex, -0.32),
    dim: `${hex}1a`,
  }

  const base = light ? LIGHT[appId] || '' : ''

  if (appId === 'quoty') {
    // Card is the only mode we offer, in either theme. One variable drives
    // its whole accent.
    return `${base}
.modes button[data-mode="lyric"],.modes button[data-mode="logo"]{display:none !important}
:root{--accent:${hex} !important}`
  }

  if (appId === 'captions') {
    return `${base}
${tailwindBrandPatch(scale)}
.bg-brand-dim{background-color:${scale.dim} !important}
.text-brand-dim{color:${hex} !important}
[class*="shadow-[0_0_"]{--tw-shadow-color:${hex} !important}
::selection{background:${hex};color:#000}`
  }

  if (appId === 'qr') {
    return `${base}
${tailwindBrandPatch(scale)}
::selection{background:${hex};color:#fff}`
  }

  return `${base}
${tailwindBrandPatch(scale)}`
}

/* Opening state for an embedded app.
   Quoty ships square and empty; we want it open on a 4:5 post with a prompt in
   the box, so the first thing a user sees is the shape they actually publish. */
const INIT = {
  /* QR Studio decodes an uploaded file by handing the raw pixels to jsQR. A PNG
     with a transparent background — which the generator on the other tab can
     produce — arrives as rgba(0,0,0,0), so the code reads black-on-black and
     the app reports "no valid QR pattern found".

     Wrapping jsQR rather than editing the app: retry with inversion, then
     flatten onto white, then downscale. The app keeps working as shipped and
     stays replaceable. */
  qr: (doc) => {
    const win = doc.defaultView
    if (!win || typeof win.jsQR !== 'function') return false
    if (win.jsQR.__yxmPatched) return true

    const original = win.jsQR
    const attempt = (data, w, h, opts) =>
      original(data, w, h, { ...(opts || {}), inversionAttempts: 'attemptBoth' })

    const flattenOnWhite = (data, w, h) => {
      const c = doc.createElement('canvas')
      c.width = w
      c.height = h
      const x = c.getContext('2d')
      x.putImageData(new win.ImageData(data, w, h), 0, 0)
      x.globalCompositeOperation = 'destination-over'
      x.fillStyle = '#ffffff'
      x.fillRect(0, 0, w, h)
      return { ctx: x, image: x.getImageData(0, 0, w, h) }
    }

    const patched = (data, w, h, opts) => {
      let found = attempt(data, w, h, opts)
      if (found) return found

      const flat = flattenOnWhite(data, w, h)
      found = attempt(flat.image.data, w, h, opts)
      if (found) return found

      // a photo straight off a phone is often too big for a clean read
      const longest = Math.max(w, h)
      if (longest > 900) {
        const k = 800 / longest
        const sw = Math.round(w * k)
        const sh = Math.round(h * k)
        const small = doc.createElement('canvas')
        small.width = sw
        small.height = sh
        const sx = small.getContext('2d')
        sx.drawImage(flat.ctx.canvas, 0, 0, sw, sh)
        const shrunk = sx.getImageData(0, 0, sw, sh)
        found = attempt(shrunk.data, sw, sh, opts)
        if (found) return found
      }
      return null
    }

    patched.__yxmPatched = true
    win.jsQR = patched
    return true
  },

  quoty: (doc) => {
    const ratio = doc.querySelector('button[data-w="4"][data-h="5"]')
    if (!ratio) return false
    if (!ratio.classList.contains('on')) ratio.click()
    const q = doc.getElementById('in-quote')
    // Quoty opens with its own sample sentence; replace that, but never
    // overwrite something a person has typed.
    const SAMPLE = /quick brown fox/i
    if (q && (!q.value.trim() || SAMPLE.test(q.value))) {
      q.value = 'Share your thoughts'
      q.dispatchEvent(new doc.defaultView.Event('input', { bubbles: true }))
      q.dispatchEvent(new doc.defaultView.Event('change', { bubbles: true }))
    }
    return true
  },
}

/** Apply that opening state, retrying briefly — onLoad can beat the app's own
 *  boot, and there is no event to tell us it finished. */
export function initFrame(iframe, appId, attempt = 0) {
  const run = INIT[appId]
  if (!run) return
  try {
    const doc = iframe?.contentDocument
    if (doc && run(doc)) return
  } catch {
    return // cross-origin — nothing to do
  }
  if (attempt < 12) setTimeout(() => initFrame(iframe, appId, attempt + 1), 150)
}

const STYLE_ID = 'yxm-brand-patch'

/** Drop the patch into a same-origin frame. Silent if the document is not
 *  reachable — the app simply keeps its own colours. */
export function paintFrame(iframe, appId, hex, light = true) {
  try {
    const doc = iframe?.contentDocument
    if (!doc?.head) return false
    const css = themePatchFor(appId, hex, light)
    if (!css) return false
    let el = doc.getElementById(STYLE_ID)
    if (!el) {
      el = doc.createElement('style')
      el.id = STYLE_ID
      doc.head.appendChild(el)
    }
    el.textContent = css
    return true
  } catch {
    return false
  }
}
