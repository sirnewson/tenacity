/* Grid layouts for a 9:16 story.

   Each layout is a list of cells in normalised coordinates (0..1 of the frame),
   so the same numbers drive the on-screen grid and the 1080×1920 export and the
   two cannot drift. Gap and corner radius are applied at draw time, in pixels
   scaled to whichever size is being drawn.

   The set is deliberately small. A shop posting a showcase wants "one big",
   "two stacked", "four up" — not forty options to scroll past. */

export const STORY_SIZE = { width: 1080, height: 1920 }

export const LAYOUTS = [
  { id: 'single', name: 'Single', cells: [[0, 0, 1, 1]] },
  {
    id: 'stack2',
    name: 'Two up',
    cells: [
      [0, 0, 1, 0.5],
      [0, 0.5, 1, 0.5],
    ],
  },
  {
    id: 'hero2',
    name: 'Hero + two',
    cells: [
      [0, 0, 1, 0.58],
      [0, 0.58, 0.5, 0.42],
      [0.5, 0.58, 0.5, 0.42],
    ],
  },
  {
    id: 'three',
    name: 'Three up',
    cells: [
      [0, 0, 1, 0.4],
      [0, 0.4, 1, 0.3],
      [0, 0.7, 1, 0.3],
    ],
  },
  {
    id: 'quad',
    name: 'Four up',
    cells: [
      [0, 0, 0.5, 0.5],
      [0.5, 0, 0.5, 0.5],
      [0, 0.5, 0.5, 0.5],
      [0.5, 0.5, 0.5, 0.5],
    ],
  },
  {
    id: 'six',
    name: 'Six up',
    cells: [
      [0, 0, 0.5, 1 / 3],
      [0.5, 0, 0.5, 1 / 3],
      [0, 1 / 3, 0.5, 1 / 3],
      [0.5, 1 / 3, 0.5, 1 / 3],
      [0, 2 / 3, 0.5, 1 / 3],
      [0.5, 2 / 3, 0.5, 1 / 3],
    ],
  },
  {
    id: 'feature',
    name: 'Feature + strip',
    cells: [
      [0, 0, 1, 0.72],
      [0, 0.72, 1 / 3, 0.28],
      [1 / 3, 0.72, 1 / 3, 0.28],
      [2 / 3, 0.72, 1 / 3, 0.28],
    ],
  },
]

export const layoutById = (id) => LAYOUTS.find((l) => l.id === id) || LAYOUTS[0]

/** Where a cell lands, in pixels, once the gap is taken off it. */
export function cellRect(cell, { width, height, gap = 0 }) {
  const [x, y, w, h] = cell
  const half = gap / 2
  const left = x * width + (x === 0 ? gap : half)
  const top = y * height + (y === 0 ? gap : half)
  const right = (x + w) * width - (Math.abs(x + w - 1) < 0.001 ? gap : half)
  const bottom = (y + h) * height - (Math.abs(y + h - 1) < 0.001 ? gap : half)
  return { x: left, y: top, w: Math.max(0, right - left), h: Math.max(0, bottom - top) }
}

/** Cover-fit an image inside a rect, honouring the cell's own pan and zoom. */
export function coverRect(img, rect, { zoom = 1, x = 0, y = 0 } = {}) {
  const ir = (img.naturalWidth || img.width) / (img.naturalHeight || img.height)
  const cr = rect.w / rect.h
  let dw = rect.w
  let dh = rect.h
  if (ir > cr) dw = rect.h * ir
  else dh = rect.w / ir
  dw *= zoom
  dh *= zoom
  const overX = Math.max(0, dw - rect.w)
  const overY = Math.max(0, dh - rect.h)
  return {
    dx: rect.x + (rect.w - dw) / 2 + (x * overX) / 2,
    dy: rect.y + (rect.h - dh) / 2 + (y * overY) / 2,
    dw,
    dh,
  }
}

function roundedPath(ctx, r, radius) {
  const rad = Math.min(radius, r.w / 2, r.h / 2)
  ctx.beginPath()
  ctx.moveTo(r.x + rad, r.y)
  ctx.arcTo(r.x + r.w, r.y, r.x + r.w, r.y + r.h, rad)
  ctx.arcTo(r.x + r.w, r.y + r.h, r.x, r.y + r.h, rad)
  ctx.arcTo(r.x, r.y + r.h, r.x, r.y, rad)
  ctx.arcTo(r.x, r.y, r.x + r.w, r.y, rad)
  ctx.closePath()
}

/**
 * Draw a whole story onto a canvas context.
 *
 * @param {CanvasRenderingContext2D} ctx
 * @param {object} o
 * @param {object} o.layout    one of LAYOUTS
 * @param {Array}  o.images    per cell: { img, zoom, x, y } or null
 * @param {number} o.width @param {number} o.height
 * @param {number} o.gap       px at this size
 * @param {number} o.radius    px at this size
 * @param {string} o.background
 * @param {string} o.filter    canvas filter for the photos
 * @param {number} o.grow      0..1 of the auto-motion zoom, for the video export
 */
export function drawStory(ctx, {
  layout,
  images = [],
  width,
  height,
  gap = 0,
  radius = 0,
  background = '#ffffff',
  filter = 'none',
  grow = 0,
}) {
  ctx.save()
  ctx.fillStyle = background
  ctx.fillRect(0, 0, width, height)

  layout.cells.forEach((cell, i) => {
    const rect = cellRect(cell, { width, height, gap })
    const slot = images[i]
    ctx.save()
    roundedPath(ctx, rect, radius)
    ctx.clip()
    if (slot?.img) {
      // the auto motion is a slow push in; each cell leans a different way so
      // the frame breathes instead of sliding as one block
      const drift = grow * (i % 2 === 0 ? 1 : -1)
      const { dx, dy, dw, dh } = coverRect(slot.img, rect, {
        zoom: (slot.zoom || 1) * (1 + grow * 0.06),
        x: (slot.x || 0) + drift * 0.08,
        y: slot.y || 0,
      })
      ctx.filter = filter
      ctx.drawImage(slot.img, dx, dy, dw, dh)
      ctx.filter = 'none'
    } else {
      ctx.fillStyle = 'rgba(0,0,0,0.06)'
      ctx.fill()
    }
    ctx.restore()
  })
  ctx.restore()
}
