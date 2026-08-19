/* The brand's memory: who they are, how they sound, what they sell.
   Plain markdown, stored on the device, editable in the app. It exists so that
   anything generated later — captions today, images and video when Generate
   Content lands — is grounded in this brand rather than a generic one. */

const KEY = 'yxm.brand.memory'
const CATALOGUE_KEY = 'yxm.brand.catalogue'

export const MEMORY_TEMPLATE = `# Brand memory

Everything below is context. Keep it short and true — it is what the tools read
before they write anything for you.

## Who we are
One or two lines. What the business does, and for whom.

## How we sound
Three words for the tone (e.g. warm, direct, no hype).
Words we use:
Words we never use:

## What we sell
- Category — the lines we are known for
- Category — anything seasonal

## Who buys from us
Who they are, and what they care about when they buy.

## Offers and rhythm
When offers run, what "this week" usually means, any weekly post we always do.

## Contact
Phone / WhatsApp:
Website:
Branches:

## Rules
- Always mention the price when there is one.
- Never promise stock we cannot confirm.
`

export function loadMemory() {
  try {
    return localStorage.getItem(KEY) ?? MEMORY_TEMPLATE
  } catch {
    return MEMORY_TEMPLATE
  }
}

export function saveMemory(text) {
  try {
    localStorage.setItem(KEY, text)
    return true
  } catch {
    return false
  }
}

/** Rough completeness signal — how many sections have something under them. */
export function memoryStats(text = '') {
  const sections = text.split(/^##\s+/m).slice(1)
  const filled = sections.filter((s) => {
    const body = s.split('\n').slice(1).join('\n')
    return body.replace(/[-\s]/g, '').length > 12
  })
  return { total: sections.length, filled: filled.length, words: (text.match(/\S+/g) || []).length }
}

// ------------------------------------------------------------------ catalogue
/** A product list the business uploads once: barcode, name, details, price.
 *  Lets the scanner fill the tag instead of someone typing on a phone. */
export function parseCatalogue(csv) {
  const rows = String(csv || '')
    .split(/\r?\n/)
    .map((r) => r.trim())
    .filter(Boolean)
  if (!rows.length) return []
  const split = (r) => r.split(/[,;\t]/).map((c) => c.trim().replace(/^"|"$/g, ''))
  const head = split(rows[0]).map((h) => h.toLowerCase())
  const looksLikeHeader = head.some((h) => /barcode|code|ean|sku|name|product|price/.test(h))
  const idx = {
    code: head.findIndex((h) => /barcode|code|ean|sku/.test(h)),
    name: head.findIndex((h) => /name|product|item|description/.test(h)),
    details: head.findIndex((h) => /detail|pack|size|spec/.test(h)),
    price: head.findIndex((h) => /price|amount|cost/.test(h)),
  }
  const body = looksLikeHeader ? rows.slice(1) : rows
  return body
    .map((r) => {
      const c = split(r)
      const at = (i, fallback) => (i >= 0 ? c[i] : c[fallback]) || ''
      return {
        code: at(idx.code, 0),
        name: at(idx.name, 1),
        details: at(idx.details, 2),
        price: at(idx.price, 3),
      }
    })
    .filter((p) => p.code)
}

export function loadCatalogue() {
  try {
    return JSON.parse(localStorage.getItem(CATALOGUE_KEY) || '[]')
  } catch {
    return []
  }
}

export function saveCatalogue(items) {
  try {
    localStorage.setItem(CATALOGUE_KEY, JSON.stringify(items))
    return true
  } catch {
    return false
  }
}

export function findByCode(code) {
  const c = String(code || '').trim()
  return loadCatalogue().find((p) => String(p.code).trim() === c) || null
}
