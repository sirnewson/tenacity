import { useEffect, useState } from 'react'
import { useStudio } from '../StudioContext'
import { brand, tagStyles } from '../brand'
import BarcodeModal, { barcodeSupported } from './BarcodeModal'

export default function SpecsModal() {
  const {
    specsModalOpen,
    specsModel,
    specsDetails,
    specsPrice,
    cardScaleRef,
    tagStyle,
    setTagStyle,
    applySpecs,
    clearSpecs,
    closeSpecsModal,
  } = useStudio()
  const [model, setModel] = useState('')
  const [details, setDetails] = useState('')
  const [price, setPrice] = useState('')
  const [scale, setScale] = useState(1)
  const [render, setRender] = useState(false)
  const [shown, setShown] = useState(false)
  const [scanning, setScanning] = useState(false)
  const f = brand.tagFields

  // Mount/unmount with transition
  useEffect(() => {
    if (specsModalOpen) {
      setModel(specsModel)
      setDetails(specsDetails)
      setPrice(specsPrice)
      setScale(cardScaleRef.current.scale || 1)
      setRender(true)
      const t = setTimeout(() => setShown(true), 10)
      return () => clearTimeout(t)
    } else {
      setShown(false)
      const t = setTimeout(() => setRender(false), 300)
      return () => clearTimeout(t)
    }
  }, [specsModalOpen, specsModel, cardScaleRef])

  if (!render) return null

  return (
    <div
      className={`fixed inset-0 z-[100] modal-scrim flex items-center justify-center p-4 transition-opacity duration-300 ${
        shown ? 'opacity-100' : 'opacity-0'
      }`}
      onClick={closeSpecsModal}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={`modal-card p-6 sm:p-8 rounded-3xl w-full max-w-md transition-transform duration-300 max-h-[92vh] overflow-y-auto no-scrollbar ${
          shown ? 'scale-100' : 'scale-95'
        }`}
      >
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl sm:text-2xl font-black text-ink tracking-tight">
            <i className="fa-solid fa-tags text-brand-400 mr-2" /> {f.title}
          </h3>
          <button
            onClick={closeSpecsModal}
            className="text-ink/60 hover:text-ink w-8 h-8 rounded-full bg-ink/5 flex items-center justify-center transition-colors"
          >
            <i className="fa-solid fa-xmark" />
          </button>
        </div>

        <div className="space-y-6">
          <div>
            <div className="flex items-center justify-between gap-3 mb-2">
              <label className="text-[10px] text-brand-400 font-bold uppercase tracking-widest">
                {f.nameLabel}
              </label>
              <button
                onClick={() => setScanning(true)}
                className="px-3 py-1.5 rounded-full bg-brand-500/15 border border-brand-500/40 text-ink text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 active:scale-95 transition"
              >
                <i className="fa-solid fa-barcode text-[10px]" />
                Scan
                {!barcodeSupported() && <span className="text-ink/45 font-bold">· type</span>}
              </button>
            </div>
            <input
              type="text"
              value={model}
              onChange={(e) => setModel(e.target.value)}
              placeholder={f.namePlaceholder}
              className="w-full field rounded-xl p-4 text-ink text-lg font-bold outline-none transition-colors shadow-inner"
            />
          </div>
          <div>
            <label className="text-[10px] text-brand-400 font-bold uppercase tracking-widest mb-2 block">
              {f.detailsLabel}
            </label>
            <textarea
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder={f.detailsPlaceholder}
              rows={3}
              className="w-full field rounded-xl p-4 text-ink text-sm font-medium outline-none transition-colors shadow-inner resize-none"
            />
          </div>
          <div>
            <label className="text-[10px] text-brand-400 font-bold uppercase tracking-widest mb-2 block">
              {f.priceLabel}
            </label>
            <input
              type="text"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder={f.pricePlaceholder}
              className="w-full field rounded-xl p-4 text-ink text-lg font-bold outline-none transition-colors shadow-inner"
            />
          </div>
          <div>
            <label className="text-[10px] text-brand-400 font-bold uppercase tracking-widest mb-2 block">
              Tag Style
            </label>
            <div className="grid grid-cols-3 gap-3">
              {Object.values(tagStyles).map((t) => {
                const selected = tagStyle === t.id
                return (
                  <button
                    key={t.id}
                    onClick={() => setTagStyle(t.id)}
                    className={`rounded-xl p-3 flex flex-col items-center gap-2 border transition-all ${
                      selected
                        ? 'border-brand-500 ring-2 ring-brand-500/40'
                        : 'border-ink/10 hover:border-ink/30'
                    }`}
                  >
                    <span
                      className="w-full h-8 rounded-md border border-ink/10 bg-ink/[0.06] bg-contain bg-center bg-no-repeat"
                      style={{ backgroundImage: `url('${t.url}')` }}
                    />
                    <span className="text-[11px] font-bold text-ink flex items-center gap-1.5">
                      <i className={`fa-solid ${t.icon} text-brand-400 text-[10px]`} />
                      {t.name}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          <div>
            <label className="text-[10px] text-brand-400 font-bold uppercase tracking-widest mb-2 block">
              Tag Scale
            </label>
            <input
              type="range"
              min="0.4"
              max="2"
              step="0.05"
              value={scale}
              onChange={(e) => setScale(parseFloat(e.target.value))}
              className="w-full"
            />
          </div>
        </div>

        <BarcodeModal
          open={scanning}
          onClose={() => setScanning(false)}
          onResult={(hit) => {
            if (hit.name) setModel(hit.name)
            if (hit.details) setDetails(hit.details)
            if (hit.price) setPrice(hit.price)
            if (!hit.name && hit.code) setModel(hit.code)
          }}
        />

        <div className="flex gap-4 mt-8">
          <button
            onClick={clearSpecs}
            className="flex-1 py-4 rounded-xl bg-ink/5 hover:bg-ink/[0.06] border border-ink/10 text-ink font-bold transition-colors"
          >
            Remove Tag
          </button>
          <button
            onClick={() => applySpecs(model, details, price, scale)}
            className="flex-[2] py-4 rounded-xl bg-brand-500 hover:bg-brand-400 text-panel font-black shadow-neon transition-all tracking-wide"
          >
            Apply to Screen
          </button>
        </div>
      </div>
    </div>
  )
}
