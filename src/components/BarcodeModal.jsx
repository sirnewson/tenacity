import { useEffect, useRef, useState } from 'react'
import { useStudio } from '../StudioContext'
import { findByCode, loadCatalogue } from '../brandMemory'

/** Point the camera at the shelf barcode and the price tag fills itself.
 *  Uses the browser's own BarcodeDetector — no library, no upload. Where it is
 *  missing (iOS Safari today) the code can be typed instead, which is still
 *  faster than typing the product, the pack and the price. */
export const barcodeSupported = () => typeof window !== 'undefined' && 'BarcodeDetector' in window

export default function BarcodeModal({ open, onClose, onResult }) {
  const s = useStudio()
  const videoRef = useRef(null)
  const streamRef = useRef(null)
  const rafRef = useRef(null)
  const [status, setStatus] = useState('starting')
  const [manual, setManual] = useState('')
  const catalogue = loadCatalogue()

  useEffect(() => {
    if (!open) return undefined
    let cancelled = false

    const stop = () => {
      cancelAnimationFrame(rafRef.current)
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop())
        streamRef.current = null
      }
    }

    const run = async () => {
      if (!barcodeSupported()) {
        setStatus('unsupported')
        return
      }
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: 'environment' } },
          audio: false,
        })
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop())
          return
        }
        streamRef.current = stream
        const v = videoRef.current
        if (v) {
          v.srcObject = stream
          await v.play().catch(() => {})
        }
        setStatus('scanning')

        const detector = new window.BarcodeDetector({
          formats: ['ean_13', 'ean_8', 'upc_a', 'upc_e', 'code_128', 'code_39', 'itf', 'qr_code'],
        })

        const tick = async () => {
          if (cancelled || !videoRef.current) return
          try {
            const found = await detector.detect(videoRef.current)
            if (found?.length) {
              const code = found[0].rawValue
              stop()
              handle(code)
              return
            }
          } catch {
            /* a frame that cannot be decoded is normal — keep going */
          }
          rafRef.current = requestAnimationFrame(tick)
        }
        rafRef.current = requestAnimationFrame(tick)
      } catch {
        setStatus('blocked')
      }
    }

    run()
    return () => {
      cancelled = true
      stop()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const handle = (code) => {
    const hit = findByCode(code)
    if (hit) {
      onResult({ code, ...hit })
      s.showMessage(`${hit.name || code} — filled from your product list.`, false)
    } else {
      onResult({ code, name: '', details: '', price: '' })
      s.showMessage(`Scanned ${code} — not in the product list yet.`, true)
    }
    onClose()
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[130] modal-scrim flex items-center justify-center p-4">
      <div className="modal-card p-5 rounded-3xl w-full max-w-sm">
        <div className="flex justify-between items-center gap-4 mb-4">
          <h3 className="text-lg font-black text-ink tracking-tight">
            <i className="fa-solid fa-barcode text-brand-400 mr-2" />
            Scan a barcode
          </h3>
          <button
            onClick={onClose}
            className="text-ink/60 hover:text-ink w-8 h-8 rounded-full bg-ink/5 flex items-center justify-center transition shrink-0"
            aria-label="Close"
          >
            <i className="fa-solid fa-xmark" />
          </button>
        </div>

        {status === 'scanning' || status === 'starting' ? (
          <div className="relative rounded-2xl overflow-hidden bg-black aspect-[4/3]">
            <video
              ref={videoRef}
              playsInline
              muted
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div className="absolute inset-x-6 top-1/2 -translate-y-1/2 h-24 border-2 border-white/80 rounded-lg" />
            <div className="absolute inset-x-6 top-1/2 h-0.5 bg-red-500 shadow-[0_0_12px_rgba(239,68,68,0.9)]" />
            <span className="absolute bottom-2 inset-x-0 text-center text-[10px] font-bold uppercase tracking-widest text-white/80">
              {status === 'starting' ? 'Starting camera…' : 'Line up the barcode'}
            </span>
          </div>
        ) : (
          <div className="rounded-2xl bg-ink/5 border border-ink/10 p-5 text-center">
            <i className="fa-solid fa-keyboard text-2xl text-ink/40 mb-3" />
            <p className="text-[12.5px] text-ink/70 leading-relaxed">
              {status === 'unsupported'
                ? 'This browser cannot scan barcodes. Chrome on Android can — or type the number.'
                : 'Camera blocked. Allow it in the browser, or type the number.'}
            </p>
          </div>
        )}

        <div className="mt-4">
          <label className="text-[10px] text-brand-400 font-bold uppercase tracking-widest mb-2 block">
            Or type the code
          </label>
          <div className="flex gap-2">
            <input
              value={manual}
              onChange={(e) => setManual(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && manual.trim() && handle(manual.trim())}
              inputMode="numeric"
              placeholder="6161100000000"
              className="flex-1 field rounded-xl px-3 py-3 text-ink text-[13px] font-mono outline-none"
            />
            <button
              onClick={() => manual.trim() && handle(manual.trim())}
              disabled={!manual.trim()}
              className="px-4 rounded-xl bg-brand-500 text-panel font-black text-[12px] disabled:opacity-40 active:scale-95 transition"
            >
              Find
            </button>
          </div>
        </div>

        <p className="text-[11px] text-ink/45 leading-relaxed mt-4">
          {catalogue.length
            ? `${catalogue.length} products loaded. A match fills the name, pack and price.`
            : 'No product list yet — add a CSV in Brand memory and scans will fill the tag by themselves.'}
        </p>
      </div>
    </div>
  )
}
