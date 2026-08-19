/* Caption composer. Assembles a post caption from the tag the user already
   filled in, plus the brand's own phrasing — no network, no AI, instant.
   Every call reshuffles, so tapping "Another" gives a genuinely different
   caption rather than the same sentence twice. */

const pick = (arr, exclude) => {
  const pool = arr.length > 1 && exclude ? arr.filter((a) => a !== exclude) : arr
  return pool[Math.floor(Math.random() * pool.length)]
}

const DEFAULT = {
  openers: ['{product} — {price}.', 'Now in: {product}, {price}.', '{product}. {price}. That simple.'],
  bodies: ['{detail}', 'Ask for it in store.', 'Limited stock.'],
  ctas: ['Tap the link in bio.', 'Call or WhatsApp us to order.', 'Tag someone who needs this.'],
  hashtags: ['#Kenya', '#Nairobi', '#ShopLocal'],
}

/** Build one caption. `fields` = { product, detail, price, brand, currency }. */
export function composeCaption(cfg = {}, fields = {}, previous = '') {
  const c = { ...DEFAULT, ...cfg }
  const price = fields.price
    ? `${fields.currency ? fields.currency + ' ' : ''}${fields.price}`
    : ''
  const detail = (fields.detail || '').split('\n').filter(Boolean).join(' · ')

  const fill = (s) =>
    (s || '')
      .replaceAll('{product}', fields.product || 'This one')
      .replaceAll('{price}', price)
      .replaceAll('{detail}', detail)
      .replaceAll('{brand}', fields.brand || '')
      .replace(/\s+([.,!?])/g, '$1')
      .replace(/\s{2,}/g, ' ')
      .replace(/^[\s—·-]+|[\s—·-]+$/g, '')
      .trim()

  const prevOpener = previous.split('\n')[0]
  const lines = [fill(pick(c.openers, prevOpener))]

  const body = fill(pick(c.bodies))
  if (body && body !== lines[0]) lines.push(body)

  const cta = fill(pick(c.ctas))
  if (cta) lines.push(cta)

  // Four tags, shuffled, brand tag first if there is one.
  const tags = [...(c.hashtags || [])]
  for (let i = tags.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[tags[i], tags[j]] = [tags[j], tags[i]]
  }
  const brandTag = (c.hashtags || []).find((t) => t.toLowerCase().includes(
    (fields.brand || '').split(' ')[0].toLowerCase()
  ))
  const chosen = [brandTag, ...tags.filter((t) => t !== brandTag)].filter(Boolean).slice(0, 5)
  if (chosen.length) lines.push('', chosen.join(' '))

  return lines.join('\n')
}
