import { useRef, useState } from 'react'
import { useStudio } from '../StudioContext'
import { brand } from '../brand'

/** Explains what an overlay is, then takes one. */
export default function OverlayUploadModal() {
  const { overlayModalOpen, closeOverlayModal, addOverlayAndUse } = useStudio()
  const [busy, setBusy] = useState(false)
  const [dragging, setDragging] = useState(false)
  const inputRef = useRef(null)
  const h = brand.overlayHelp

  if (!overlayModalOpen) return null

  const take = async (file) => {
    if (!file || busy) return
    setBusy(true)
    await addOverlayAndUse(file)
    setBusy(false)
  }

  return (
    <div
      className="fixed inset-0 z-[110] modal-scrim flex items-center justify-center p-4"
      onClick={closeOverlayModal}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="modal-card p-6 sm:p-7 rounded-3xl w-full max-w-md max-h-[92vh] overflow-y-auto no-scrollbar"
      >
        <div className="flex justify-between items-start gap-4 mb-4">
          <h3 className="text-xl font-black text-ink tracking-tight">
            <i className="fa-solid fa-cloud-arrow-up text-brand-400 mr-2" />
            {h.title}
          </h3>
          <button
            onClick={closeOverlayModal}
            className="text-ink/60 hover:text-ink w-8 h-8 rounded-full bg-ink/5 flex items-center justify-center transition-colors shrink-0"
            aria-label="Close"
          >
            <i className="fa-solid fa-xmark" />
          </button>
        </div>

        <p className="text-[13px] text-ink/60 leading-relaxed">{h.intro}</p>

        {/* Diagram: what part of the frame does what */}
        <div className="mt-5 flex gap-4 items-center">
          <div className="relative w-[92px] aspect-[4/5] rounded-lg border border-ink/12 overflow-hidden shrink-0 bg-ink/10">
            <div className="absolute inset-x-0 top-0 h-[14%] bg-brand-500/70" />
            <div className="absolute inset-x-0 bottom-0 h-[18%] bg-brand-500/70" />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-[8px] font-black uppercase tracking-wider text-ink/50 rotate-[-8deg]">
                photo
              </span>
            </div>
          </div>
          <ul className="text-[12px] text-ink/60 leading-relaxed space-y-1.5">
            <li>
              <span className="inline-block w-2.5 h-2.5 rounded-sm bg-brand-500/70 mr-2 align-middle" />
              Your artwork — logo, contact, frame
            </li>
            <li>
              <span className="inline-block w-2.5 h-2.5 rounded-sm border border-ink/25 mr-2 align-middle" />
              Transparent — the photo shows here
            </li>
          </ul>
        </div>

        <ul className="mt-5 space-y-2.5">
          {h.rules.map((r) => (
            <li key={r} className="flex gap-2.5 text-[12.5px] text-ink/70 leading-relaxed">
              <i className="fa-solid fa-check text-brand-400 mt-1 text-[11px] shrink-0" />
              <span>{r}</span>
            </li>
          ))}
        </ul>

        {/* Drop zone */}
        <label
          onDragOver={(e) => {
            e.preventDefault()
            setDragging(true)
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault()
            setDragging(false)
            take(e.dataTransfer.files?.[0])
          }}
          className={`mt-6 block rounded-2xl border-2 border-dashed p-6 text-center cursor-pointer transition ${
            dragging
              ? 'border-brand-400 bg-brand-500/10'
              : 'border-ink/15 hover:border-brand-500/60 hover:bg-ink/5'
          }`}
        >
          <input
            ref={inputRef}
            type="file"
            accept="image/png,image/*"
            className="hidden"
            onChange={(e) => take(e.target.files?.[0])}
          />
          <i
            className={`fa-solid ${
              busy ? 'fa-spinner fa-spin' : 'fa-image'
            } text-2xl text-brand-400`}
          />
          <p className="text-sm font-bold text-ink mt-3">
            {busy ? 'Reading your overlay…' : 'Choose a PNG'}
          </p>
          <p className="text-[11px] text-ink/45 mt-1">or drop the file here</p>
        </label>

        <p className="text-[11px] text-ink/45 mt-4 leading-relaxed">
          <i className="fa-solid fa-lock mr-1.5" />
          {h.footnote}
        </p>
      </div>
    </div>
  )
}
