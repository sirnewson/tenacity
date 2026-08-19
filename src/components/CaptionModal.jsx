import { useEffect, useState } from 'react'
import { useStudio } from '../StudioContext'
import { brand } from '../brand'
import { composeCaption } from '../captions'

/** The other half of posting: the words. Builds a caption from the tag the user
 *  already filled in, in the brand's own phrasing, with hashtags — one tap to
 *  copy, one tap for a different one. */
export default function CaptionModal() {
  const s = useStudio()
  const [open, setOpen] = useState(false)
  const [text, setText] = useState('')
  const [copied, setCopied] = useState(false)

  const build = (previous = '') =>
    composeCaption(brand.captions, {
      product: s.specsModel,
      detail: s.specsDetails,
      price: s.specsPrice,
      brand: brand.clientName,
      currency: brand.currency,
    }, previous)

  useEffect(() => {
    if (open) {
      setText(build())
      setCopied(false)
    }
  }, [open]) // eslint-disable-line react-hooks/exhaustive-deps

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      s.showMessage('Could not reach the clipboard — select and copy manually.', true)
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="h-11 px-5 rounded-full glass-panel flex items-center gap-2 text-ink border border-ink/15 transition active:scale-95"
      >
        <i className="fa-solid fa-pen-nib text-brand-400 text-sm" />
        <span className="text-[11px] font-black uppercase tracking-wider">Caption</span>
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[125] modal-scrim flex items-center justify-center p-4"
          onClick={() => setOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="modal-card p-6 sm:p-7 rounded-3xl w-full max-w-md max-h-[88vh] overflow-y-auto no-scrollbar text-left"
          >
            <div className="flex justify-between items-start gap-4 mb-4">
              <h3 className="text-xl font-black text-ink tracking-tight">
                <i className="fa-solid fa-pen-nib text-brand-400 mr-2" />
                Caption
              </h3>
              <button
                onClick={() => setOpen(false)}
                className="text-ink/60 hover:text-ink w-8 h-8 rounded-full bg-ink/5 flex items-center justify-center transition-colors shrink-0"
                aria-label="Close"
              >
                <i className="fa-solid fa-xmark" />
              </button>
            </div>

            <p className="text-[12px] text-ink/55 leading-relaxed mb-4">
              Written from the tag you filled in. Edit it if you like — then copy and paste it
              with the poster.
            </p>

            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={9}
              className="w-full field rounded-2xl p-4 text-ink text-[13px] leading-relaxed outline-none resize-none"
            />

            <div className="flex gap-3 mt-5">
              <button
                onClick={() => setText(build(text))}
                className="flex-1 py-4 rounded-xl bg-ink/5 hover:bg-ink/10 border border-ink/10 text-ink font-bold transition-colors flex items-center justify-center gap-2"
              >
                <i className="fa-solid fa-shuffle text-xs" />
                Another
              </button>
              <button
                onClick={copy}
                className="flex-[2] py-4 rounded-xl bg-brand-500 hover:bg-brand-400 text-panel font-black shadow-neon transition-all tracking-wide flex items-center justify-center gap-2"
              >
                <i className={`fa-solid ${copied ? 'fa-check' : 'fa-copy'} text-sm`} />
                {copied ? 'Copied' : 'Copy caption'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
