import { useEffect, useState } from 'react'
import { useStudio } from '../StudioContext'
import { brand } from '../brand'
import { makeQr } from '../qr'

/** Puts a scannable badge on the poster: WhatsApp order, a till number, a menu,
 *  a listing page. Presets come from brand.config.js so a client never has to
 *  type a URL on a phone. */
export default function QrModal() {
  const { qrModalOpen, closeQrModal, qr, setQr } = useStudio()
  const presets = brand.qr?.presets || []
  const [value, setValue] = useState('')
  const [label, setLabel] = useState('')
  const [corner, setCorner] = useState('bottom-right')
  const [size, setSize] = useState('M')

  useEffect(() => {
    if (!qrModalOpen) return
    setValue(qr.value || presets[0]?.value || '')
    setLabel(qr.label || brand.qr?.caption || 'SCAN ME')
    setCorner(qr.corner || 'bottom-right')
    setSize(qr.size || 'M')
  }, [qrModalOpen]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!qrModalOpen) return null

  const preview = makeQr(value, 4, 1)

  const apply = () =>
    setQr({ on: Boolean(value.trim()), value: value.trim(), label: label.trim(), corner, size }) ||
    closeQrModal()

  return (
    <div
      className="fixed inset-0 z-[115] modal-scrim flex items-center justify-center p-4"
      onClick={closeQrModal}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="modal-card p-6 sm:p-7 rounded-3xl w-full max-w-md max-h-[92vh] overflow-y-auto no-scrollbar"
      >
        <div className="flex justify-between items-start gap-4 mb-5">
          <h3 className="text-xl font-black text-ink tracking-tight">
            <i className="fa-solid fa-qrcode text-brand-400 mr-2" />
            {brand.qr?.title || 'Add a scan code'}
          </h3>
          <button
            onClick={closeQrModal}
            className="text-ink/60 hover:text-ink w-8 h-8 rounded-full bg-ink/5 flex items-center justify-center transition-colors shrink-0"
            aria-label="Close"
          >
            <i className="fa-solid fa-xmark" />
          </button>
        </div>

        {presets.length > 0 && (
          <>
            <label className="text-[10px] text-brand-400 font-bold uppercase tracking-widest mb-2 block">
              What should it open?
            </label>
            <div className="grid grid-cols-1 gap-2 mb-5">
              {presets.map((p) => {
                const selected = value === p.value
                return (
                  <button
                    key={p.id}
                    onClick={() => {
                      setValue(p.value)
                      if (p.caption) setLabel(p.caption)
                    }}
                    className={`flex items-center gap-3 rounded-xl px-4 py-3 border text-left transition ${
                      selected
                        ? 'border-brand-500 bg-brand-500/10'
                        : 'border-ink/10 hover:border-ink/30'
                    }`}
                  >
                    <i className={`fa-solid ${p.icon} text-brand-400 w-4 text-center`} />
                    <span className="min-w-0">
                      <span className="block text-[13px] font-bold text-ink leading-tight">
                        {p.label}
                      </span>
                      <span className="block text-[11px] text-ink/45 truncate">{p.value}</span>
                    </span>
                  </button>
                )
              })}
            </div>
          </>
        )}

        <label className="text-[10px] text-brand-400 font-bold uppercase tracking-widest mb-2 block">
          Or paste any link
        </label>
        <input
          type="url"
          inputMode="url"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="https://…"
          className="w-full field rounded-xl p-4 text-ink text-sm font-medium outline-none mb-5"
        />

        <label className="text-[10px] text-brand-400 font-bold uppercase tracking-widest mb-2 block">
          Caption under the code
        </label>
        <input
          type="text"
          value={label}
          onChange={(e) => setLabel(e.target.value.slice(0, 18))}
          placeholder="SCAN TO ORDER"
          className="w-full field rounded-xl p-4 text-ink text-sm font-bold outline-none mb-5"
        />

        <div className="grid grid-cols-2 gap-4 mb-5">
          <div>
            <label className="text-[10px] text-brand-400 font-bold uppercase tracking-widest mb-2 block">
              Corner
            </label>
            <div className="grid grid-cols-2 gap-1.5">
              {[
                ['top-left', 'fa-arrow-up-left'],
                ['top-right', 'fa-arrow-up-right'],
                ['bottom-left', 'fa-arrow-down-left'],
                ['bottom-right', 'fa-arrow-down-right'],
              ].map(([c, icon]) => (
                <button
                  key={c}
                  onClick={() => setCorner(c)}
                  aria-label={c}
                  className={`h-10 rounded-lg border flex items-center justify-center transition ${
                    corner === c
                      ? 'border-brand-500 bg-brand-500/15 text-ink'
                      : 'border-ink/10 text-ink/50 hover:border-ink/30'
                  }`}
                >
                  <i className={`fa-solid ${icon} text-xs`} />
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-[10px] text-brand-400 font-bold uppercase tracking-widest mb-2 block">
              Size
            </label>
            <div className="flex flex-col gap-1.5">
              {['S', 'M', 'L'].map((sz) => (
                <button
                  key={sz}
                  onClick={() => setSize(sz)}
                  className={`h-[30px] rounded-lg border text-[11px] font-black transition ${
                    size === sz
                      ? 'border-brand-500 bg-brand-500/15 text-ink'
                      : 'border-ink/10 text-ink/50 hover:border-ink/30'
                  }`}
                >
                  {sz}
                </button>
              ))}
            </div>
          </div>
        </div>

        {preview && (
          <div className="flex items-center gap-3 mb-6 p-3 rounded-xl bg-ink/[0.04] border border-ink/10">
            <img src={preview} alt="" className="w-16 h-16 rounded bg-white p-1" />
            <p className="text-[11px] text-ink/60 leading-relaxed">
              Point a phone camera at this to check it before you post. It is burned into the
              poster at full resolution.
            </p>
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={() => {
              setQr({ on: false, value: '', label, corner, size })
              closeQrModal()
            }}
            className="flex-1 py-4 rounded-xl bg-ink/5 hover:bg-ink/10 border border-ink/10 text-ink font-bold transition-colors"
          >
            Remove
          </button>
          <button
            onClick={apply}
            disabled={!value.trim()}
            className="flex-[2] py-4 rounded-xl bg-brand-500 hover:bg-brand-400 text-panel font-black shadow-neon transition-all tracking-wide disabled:opacity-40"
          >
            Put it on the poster
          </button>
        </div>
      </div>
    </div>
  )
}
