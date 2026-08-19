/* Geometry of the price-tag plate, shared by the live card (CameraStep) and the
   canvas export (StudioContext.mergeFinalPoster) so the two cannot drift apart.

   Positions are fractions of the plate's width/height; type sizes are fractions
   of its WIDTH. That matters: the plate is sized from the capture area, which is
   narrower on a 9:16 frame than on 4:5. Fixed pixel type would be ~1.6x
   oversized on a story and spill past the plate.

   The values below are the defaults, and suit the flat plates that
   make-brand-assets.py generates. A client whose plate is laid out differently
   overrides individual keys under `tag` in brand.config.js — that file is
   client-owned, so their geometry survives every `new-client.py update`. */
import brand from './brand.config'

const DEFAULTS = {
  // Left column: title + detail lines (fractions of width / height)
  textLeft: 0.12,
  textWidth: 0.36,
  titleTop: 0.17,
  detailTop: 0.42,
  titleLines: 2,

  // Type, as fractions of plate WIDTH (tuned against a 420px-wide plate)
  titleSize: 0.062,
  detailSize: 0.026,
  detailLine: 0.033,
  priceSize: 0.1,
  currencySize: 0.031,
  currencyGap: 0.014,

  // Boxes for the live card in CameraStep. Defaults are the values that were
  // hardcoded in the JSX, so existing builds render identically; a client that
  // overrides them moves the preview and the export together.
  textTop: 0.16,
  textHeight: 0.70,
  priceBoxLeft: 0.55,
  priceBoxTop: 0.20,
  priceBoxWidth: 0.38,
  priceBoxHeight: 0.60,

  // Right panel
  panelLeft: 0.52,
  priceRight: 0.88,
  priceMid: 0.52,

  // Length at which a title drops a size so two lines still fit the plate.
  titleWrapChars: 14,
}

export const TAG = { ...DEFAULTS, ...(brand.tag || {}) }

/** A title long enough to wrap gets a smaller size, so two lines plus the
 *  detail lines still fit the plate. Character count (not measurement) so the
 *  CSS card and the canvas can apply the identical rule. */
export function titleScale(title = '') {
  return String(title).trim().length > TAG.titleWrapChars ? 0.78 : 1
}

/** How many detail lines fit under the title. A wrapped (two-line) title eats
 *  one of them — this is what keeps the text inside the plate instead of
 *  spilling past its bottom edge. */
export function detailLineCount(title = '') {
  return titleScale(title) < 1 ? 2 : 3
}

/** Long prices have to come down a size or two, or they run out of the panel.
 *  Applied identically to the preview and the export. */
export function priceScale(price = '') {
  const n = String(price).trim().length
  if (n <= 6) return 1
  if (n <= 8) return 0.88
  if (n <= 10) return 0.78
  return 0.68
}
