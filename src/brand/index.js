/* Derived brand data — you should not need to edit this file.
   Everything here is computed from src/brand.config.js. */
import brand from '../brand.config'

export { brand }

const asset = (file) => `${brand.assetDir.replace(/\/$/, '')}/${file}`

/** An uploaded logo (Settings) wins over the one shipped with the build. */
export const logoUrl = () => brand.logoDataUrl || asset(brand.logo)
export const LOGO_URL = asset(brand.logo)

/** Tailwind classes that flatten a single-colour logo to suit the theme.
 *  `logoTint: 'black' | 'white' | 'none'` in brand.config.js. */
export function logoTintClass(extra = '') {
  const tint =
    brand.logoTint === 'black'
      ? 'brightness-0'
      : brand.logoTint === 'white'
      ? 'brightness-0 invert'
      : ''
  return [tint, extra].filter(Boolean).join(' ')
}

export const SIZES = {
  '4:5': { width: 1080, height: 1350, aspectRatio: 4 / 5 },
  '9:16': { width: 1080, height: 1920, aspectRatio: 9 / 16 },
  '1:1': { width: 1080, height: 1080, aspectRatio: 1 },
}

const DELAYS = ['delay-100', 'delay-200', 'delay-300', 'delay-400', 'delay-500']

/** Canvas + overlay data for the built-in templates, keyed by id. */
export const formats = Object.fromEntries(
  brand.templates.map((t) => {
    const size = SIZES[t.size] || SIZES['4:5']
    return [t.id, { id: t.id, name: t.name, overlayUrl: asset(t.file), ...size }]
  })
)

/** Home-screen picker cards (also drives the in-editor template strip). */
export const selectCards = brand.templates.map((t, i) => ({
  id: t.id,
  icon: t.icon || 'fa-image',
  iconColor: t.iconColor || 'text-white',
  title: t.name,
  sub: t.sub || '',
  bg: asset(t.file),
  delay: DELAYS[i % DELAYS.length],
}))

/** Price-tag plates, keyed by style id. */
export const tagStyles = Object.fromEntries(
  brand.tagStyles.map((t) => [t.id, { ...t, url: asset(t.file) }])
)

export const defaultTagStyle = brand.tagStyles.some((t) => t.id === brand.defaultTagStyle)
  ? brand.defaultTagStyle
  : brand.tagStyles[0].id

export const socials = (brand.socials || []).map((s) => ({ brand: 'fa-brands', ...s }))

/** Closest named aspect for an arbitrary pixel size — used to label uploads. */
export function describeAspect(width, height) {
  const r = width / height
  const match = Object.entries(SIZES).reduce(
    (best, [name, s]) => {
      const diff = Math.abs(s.aspectRatio - r)
      return diff < best.diff ? { name, diff } : best
    },
    { name: null, diff: Infinity }
  )
  return match.diff < 0.02 ? match.name : `${width}×${height}`
}

// ----------------------------------------------------------------- theming
const hexToRgb = (hex) => {
  const h = hex.replace('#', '')
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h
  const n = parseInt(full, 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

const triple = (rgb) => rgb.join(' ')
const mix = (a, b, t) => a.map((v, i) => Math.round(v + (b[i] - v) * t))

/** Derive the four shades from a single brand hex (400 is the hex itself). */
export function shadesFrom(hex) {
  const base = hexToRgb(hex)
  return {
    300: triple(mix(base, [255, 255, 255], 0.45)),
    400: triple(base),
    500: triple(mix(base, [0, 0, 0], 0.2)),
    600: triple(mix(base, [0, 0, 0], 0.5)),
  }
}

/** Write a shade map ({300: "r g b", …}) into CSS custom properties. */
export function applyShades(shades) {
  const root = document.documentElement
  Object.entries(shades).forEach(([shade, value]) => {
    root.style.setProperty(`--brand-${shade}`, value)
  })
}

/** Swap the whole palette from one hex — used by the demo palette switcher. */
export function applyPalette(hex) {
  applyShades(shadesFrom(hex))
}

/** Paints the theme, palette, title and favicon. Called once from main.jsx. */
export function applyBrandTheme() {
  const root = document.documentElement
  // Light is the default; the token block for each theme lives in index.css.
  root.dataset.theme = brand.theme === 'dark' ? 'dark' : 'light'

  // Optional per-brand overrides of the theme's own colours — lets one build be
  // yellow-and-black and the next cream-and-charcoal without touching the CSS.
  if (brand.surface) root.style.setProperty('--surface', triple(hexToRgb(brand.surface)))
  if (brand.surfaceGlow)
    root.style.setProperty('--surface-glow', triple(hexToRgb(brand.surfaceGlow)))
  if (brand.ink) root.style.setProperty('--ink', triple(hexToRgb(brand.ink)))
  if (brand.panel) root.style.setProperty('--panel', triple(hexToRgb(brand.panel)))

  applyShades(
    Object.fromEntries(
      Object.entries(brand.colors).map(([shade, hex]) => [shade, triple(hexToRgb(hex))])
    )
  )

  document.title = brand.appTitle

  if (brand.favicon) {
    const link = document.querySelector("link[rel='icon']") || document.createElement('link')
    link.rel = 'icon'
    link.href = `data:image/svg+xml,${encodeURIComponent(
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">${brand.favicon}</text></svg>`
    )}`
    document.head.appendChild(link)
  }
}
