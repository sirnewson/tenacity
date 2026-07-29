import { useEffect, useState } from 'react'
import { useStudio } from '../StudioContext'
import { cardThemes } from '../constants'

export default function SpecsModal() {
  const {
    specsModalOpen,
    specsModel,
    specsDetails,
    specsPrice,
    cardScaleRef,
    cardTheme,
    setCardTheme,
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
      className={`fixed inset-0 z-[100] bg-black/90 backdrop-blur-md flex items-center justify-center p-4 transition-opacity duration-300 ${
        shown ? 'opacity-100' : 'opacity-0'
      }`}
      onClick={closeSpecsModal}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={`glass-panel p-6 sm:p-8 rounded-3xl w-full max-w-md border border-white/10 transition-transform duration-300 shadow-2xl ${
          shown ? 'scale-100' : 'scale-95'
        }`}
      >
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            <i className="fa-solid fa-tags text-brand-400 mr-2" /> Add Detail Tag
          </h3>
          <button
            onClick={closeSpecsModal}
            className="text-gray-400 hover:text-white w-8 h-8 rounded-full bg-white/5 flex items-center justify-center transition-colors"
          >
            <i className="fa-solid fa-xmark" />
          </button>
        </div>

        <div className="space-y-6">
          <div>
            <label className="text-[10px] text-brand-400 font-bold uppercase tracking-widest mb-2 block">
              Product Name (Auto-wraps)
            </label>
            <input
              type="text"
              value={model}
              onChange={(e) => setModel(e.target.value)}
              placeholder="e.g. Galaxy A37 5G"
              className="w-full bg-black/50 border border-gray-600 focus:border-brand-500 rounded-xl p-4 text-white text-lg font-bold outline-none transition-colors shadow-inner"
            />
          </div>
          <div>
            <label className="text-[10px] text-brand-400 font-bold uppercase tracking-widest mb-2 block">
              Product Details (Multiple lines allowed)
            </label>
            <textarea
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder="e.g. Tenacity 3-pin&#10;With pure brass"
              rows={3}
              className="w-full bg-black/50 border border-gray-600 focus:border-brand-500 rounded-xl p-4 text-white text-sm font-medium outline-none transition-colors shadow-inner resize-none"
            />
          </div>
          <div>
            <label className="text-[10px] text-brand-400 font-bold uppercase tracking-widest mb-2 block">
              Price
            </label>
            <input
              type="text"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="e.g. 6,000/="
              className="w-full bg-black/50 border border-gray-600 focus:border-brand-500 rounded-xl p-4 text-white text-lg font-bold outline-none transition-colors shadow-inner"
            />
          </div>
          <div>
            <label className="text-[10px] text-brand-400 font-bold uppercase tracking-widest mb-2 block">
              Theme
            </label>
            <div className="grid grid-cols-3 gap-3">
              {Object.entries(cardThemes).map(([key, t]) => {
                const selected = cardTheme === key
                return (
                  <button
                    key={key}
                    onClick={() => setCardTheme(key)}
                    className={`rounded-xl p-3 flex flex-col items-center gap-2 border transition-all ${
                      selected
                        ? 'border-brand-500 ring-2 ring-brand-500/40'
                        : 'border-white/10 hover:border-white/30'
                    }`}
                  >
                    <span
                      className="w-full h-8 rounded-md border border-white/20"
                      style={{
                        backgroundImage: `linear-gradient(to bottom right, ${t.grad[0]}, ${t.grad[1]})`,
                      }}
                    />
                    <span className="text-[11px] font-bold text-white flex items-center gap-1.5">
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

        <div className="flex gap-4 mt-8">
          <button
            onClick={clearSpecs}
            className="flex-1 py-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold transition-colors"
          >
            Remove Tag
          </button>
          <button
            onClick={() => applySpecs(model, details, price, scale)}
            className="flex-[2] py-4 rounded-xl bg-brand-500 hover:bg-brand-400 text-dark-950 font-black shadow-neon transition-all tracking-wide"
          >
            Apply to Screen
          </button>
        </div>
      </div>
    </div>
  )
}
