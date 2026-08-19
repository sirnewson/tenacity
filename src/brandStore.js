/* Runtime brand overrides.
   brand.config.js is the build's default. Anything changed on the Settings page
   is saved here and merged over it at boot, so a client can be re-skinned on
   the device without a rebuild — and reset back to the config in one tap. */
import brand from './brand.config'
import { applyBrandTheme, shadesFrom } from './brand'

const KEY = 'yxm.brand.overrides'

/** The fields Settings can change. Anything not listed stays with the build. */
export const EDITABLE = [
  'clientName',
  'appTitle',
  'headline',
  'headlineSuffix',
  'subhead',
  'theme',
  'ctaStyle',
  'currency',
  'logoTint',
  'logoPlate',
  'logoDataUrl',
  'colors',
  'surface',
  'ink',
  'demoMode',
  'allowOverlayUpload',
]

// The build's own values, kept so Reset can put them back.
const DEFAULTS = Object.freeze(
  JSON.parse(JSON.stringify(Object.fromEntries(EDITABLE.map((k) => [k, brand[k]]))))
)

export const brandDefaults = () => JSON.parse(JSON.stringify(DEFAULTS))

export function loadOverrides() {
  try {
    return JSON.parse(localStorage.getItem(KEY) || '{}')
  } catch {
    return {}
  }
}

/** Merge saved overrides into the live brand object and repaint the theme.
 *  Called once before the first render, and again after every save. */
export function applyOverrides(next = loadOverrides()) {
  Object.assign(brand, next)
  applyBrandTheme()
  return brand
}

export function saveOverrides(patch) {
  const next = { ...loadOverrides(), ...patch }
  try {
    localStorage.setItem(KEY, JSON.stringify(next))
  } catch {
    /* private mode — the change still applies for this session */
  }
  applyOverrides(next)
  return next
}

export function resetOverrides() {
  try {
    localStorage.removeItem(KEY)
  } catch {
    /* nothing saved */
  }
  Object.assign(brand, brandDefaults())
  applyBrandTheme()
  return brand
}

/** One hex in, the four shades the whole UI runs on. */
export function paletteFrom(hex, theme = brand.theme) {
  const t = shadesFrom(hex) // "r g b" triples
  const toHex = (triple) =>
    '#' + triple.split(' ').map((n) => Number(n).toString(16).padStart(2, '0')).join('').toUpperCase()
  const shades = {
    300: toHex(t[300]),
    400: toHex(t[400]),
    500: toHex(t[500]),
    600: toHex(t[600]),
  }
  // On a dark surface the mid shades need to sit lighter to stay legible.
  if (theme === 'dark') {
    return { 300: shades[300], 400: shades[400], 500: hex.toUpperCase(), 600: shades[500] }
  }
  return shades
}

/** Export / import a whole brand profile, so a skin can move between devices. */
export function exportProfile() {
  return JSON.stringify({ brand: loadOverrides(), savedAt: new Date().toISOString() }, null, 2)
}

export function importProfile(json) {
  const data = JSON.parse(json)
  const patch = data.brand ?? data
  const clean = Object.fromEntries(Object.entries(patch).filter(([k]) => EDITABLE.includes(k)))
  return saveOverrides(clean)
}
