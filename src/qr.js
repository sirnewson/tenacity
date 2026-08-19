import qrcode from 'qrcode-generator'

/** Render a QR to a data URL. Type 0 = auto-size to the payload; 'M' error
 *  correction survives a phone camera pointed at a printed or on-screen post. */
export function makeQr(text, cellSize = 8, margin = 2) {
  if (!text) return null
  try {
    const qr = qrcode(0, 'M')
    qr.addData(String(text))
    qr.make()
    return qr.createDataURL(cellSize, margin)
  } catch {
    return null // payload too long for the largest symbol
  }
}

/** Where the QR badge sits, as fractions of the poster. Shared by the live
 *  preview and the export so they cannot drift. */
export const QR_CORNERS = {
  'bottom-left': { x: 0.055, y: 0.945, ax: 0, ay: 1 },
  'bottom-right': { x: 0.945, y: 0.945, ax: 1, ay: 1 },
  'top-left': { x: 0.055, y: 0.055, ax: 0, ay: 0 },
  'top-right': { x: 0.945, y: 0.055, ax: 1, ay: 0 },
}

/** Badge size as a fraction of the poster's shorter edge. */
export const QR_SIZES = { S: 0.16, M: 0.2, L: 0.26 }
