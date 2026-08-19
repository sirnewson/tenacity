import { useStudio } from '../StudioContext'
import StepHeader from './StepHeader'
import { brand } from '../brand'
import { composeCaption } from '../captions'
import { useState } from 'react'

/** Review the run: every poster shot in this batch, then one zip out.
 *  This is the Monday-morning screen — ten products, one export. */
export default function BatchStep() {
  const s = useStudio()
  const active = s.step === 'batch'
  const { batch, batchBusy } = s
  const [copied, setCopied] = useState(false)

  const copyAllCaptions = async () => {
    const text = batch
      .map((item, i) => {
        const cap = composeCaption(brand.captions, {
          product: item.product,
          detail: item.details,
          price: item.price,
          brand: brand.clientName,
          currency: brand.currency,
        })
        return `${i + 1}. ${item.product || 'Post ' + (i + 1)}\n${cap}`
      })
      .join('\n\n———\n\n')
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2200)
    } catch {
      s.showMessage('Could not reach the clipboard.', true)
    }
  }

  return (
    <main
      className={`step-container flex-col h-full w-full relative z-20 app-bg overflow-y-auto no-scrollbar ${
        active ? 'flex' : 'hidden'
      }`}
      style={{
        paddingTop: 'calc(1rem + var(--safe-top))',
        paddingBottom: 'calc(2rem + var(--safe-bottom))',
      }}
    >
      <div className="w-full max-w-2xl mx-auto px-4">
        <StepHeader title="Batch" count={batch.length} back="camera" backLabel="Keep shooting" />

        {batch.length === 0 ? (
          <div className="glass-panel rounded-2xl p-8 text-center">
            <i className="fa-solid fa-layer-group text-3xl text-ink/25 mb-4" />
            <p className="text-sm font-bold text-ink">Nothing in the batch yet</p>
            <p className="text-[12px] text-ink/55 leading-relaxed mt-2">
              Turn on <span className="font-bold">Batch</span> in the studio, then capture as many
              products as you like. Each one lands here.
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {batch.map((item, i) => (
                <div
                  key={item.id}
                  className="relative rounded-xl overflow-hidden glass-panel animate-fade-in delay-100"
                >
                  <img src={item.url} alt="" className="w-full object-cover" />
                  <span className="absolute top-1.5 left-1.5 w-5 h-5 rounded-full bg-brand-500 text-panel text-[9px] font-black flex items-center justify-center">
                    {i + 1}
                  </span>
                  <button
                    onClick={() => s.removeFromBatch(item.id)}
                    className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80 transition"
                    aria-label="Remove"
                  >
                    <i className="fa-solid fa-xmark text-[10px]" />
                  </button>
                  <div className="px-2 py-1.5 flex items-center gap-1.5">
                    <span className="text-[10px] font-bold text-ink truncate flex-1">
                      {item.product || `Poster ${i + 1}`}
                    </span>
                    <button
                      onClick={() => s.saveBatchItem(item, i)}
                      className="text-ink/50 hover:text-ink transition shrink-0"
                      aria-label="Save this one"
                    >
                      <i className="fa-solid fa-download text-[10px]" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 flex flex-col gap-3">
              <button
                onClick={s.saveBatch}
                disabled={batchBusy}
                className={`w-full py-4 rounded-full font-black text-base tracking-wide flex items-center justify-center gap-2.5 transition disabled:opacity-50 ${
                  brand.ctaStyle === 'rainbow'
                    ? 'btn-rainbow'
                    : 'bg-gradient-to-r from-brand-500 to-brand-600 text-panel border-2 border-brand-300 active:scale-95'
                }`}
              >
                <i className={`fa-solid ${batchBusy ? 'fa-spinner fa-spin' : 'fa-file-zipper'}`} />
                {batchBusy ? 'Packing…' : `Save all ${batch.length} as a zip`}
              </button>

              <div className="flex gap-3">
                <button
                  onClick={copyAllCaptions}
                  className="flex-1 py-3.5 rounded-full glass-panel border border-ink/15 text-ink font-bold text-[12px] flex items-center justify-center gap-2 hover:bg-ink/[0.06] transition active:scale-95"
                >
                  <i className={`fa-solid ${copied ? 'fa-check' : 'fa-pen-nib'} text-xs`} />
                  {copied ? 'Copied' : 'Copy all captions'}
                </button>
                <button
                  onClick={s.clearBatch}
                  className="px-5 py-3.5 rounded-full glass-panel border border-ink/15 text-ink/60 font-bold text-[12px] hover:text-ink transition active:scale-95"
                >
                  Clear
                </button>
              </div>
            </div>

            <p className="text-[11px] text-ink/45 leading-relaxed mt-5 text-center">
              The zip holds every poster at full resolution, numbered in the order you shot them.
            </p>
          </>
        )}
      </div>
    </main>
  )
}
