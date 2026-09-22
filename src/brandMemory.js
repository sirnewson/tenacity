/* The product list the barcode scanner reads: barcode, name, details, price.
   Uploaded once as a CSV in Settings and kept on the device, so scanning a
   product in the studio fills the price tag instead of someone typing it. */

const CATALOGUE_KEY = 'yxm.brand.catalogue'

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
