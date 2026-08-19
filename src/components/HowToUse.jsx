import { useState } from 'react'
import { brand } from '../brand'

/** Footer "How to use it" — a quick reference to the four steps, available on
 *  every screen of every build (the walkthrough homepage is demo-only). */

const DEFAULT_STEPS = [
  {
    icon: 'fa-table-cells-large',
    title: 'Pick a template',
    body: 'Choose the layout your post should use. The shape of the export is set here.',
  },
  {
    icon: 'fa-camera',
    title: 'Shoot or upload a photo',
    body:
      'The frame is locked to the export shape, with the template ghosted on top. Drag and zoom until the subject sits clear of the branding.',
  },
  {
    icon: 'fa-tags',
    title: 'Add the details tag',
    body:
      'Optional. Type a name, a couple of detail lines and a price. Drag the tag to place it, and pull a corner to resize.',
  },
  {
    icon: 'fa-layer-group',
    title: 'Doing a whole run?',
    body:
      'Turn on Batch in the studio. Captures stack up instead of interrupting you, and the whole run exports as one zip.',
  },
  {
    icon: 'fa-wand-magic-sparkles',
    title: 'Save or share',
    body:
      'Capture, then Save for a full-resolution PNG on your phone, or Share to send it straight to WhatsApp or Instagram.',
  },
]

export default function HowToUse() {
  const [open, setOpen] = useState(false)
  const steps = brand.guide?.steps?.length ? brand.guide.steps : DEFAULT_STEPS

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="mt-5 h-10 px-5 rounded-full glass-panel flex items-center gap-2 text-ink/80 hover:bg-ink/[0.06] transition active:scale-95"
      >
        <i className="fa-solid fa-circle-question text-brand-400 text-sm" />
        <span className="text-[10px] font-bold uppercase tracking-widest">How to use it</span>
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[120] modal-scrim flex items-center justify-center p-4"
          onClick={() => setOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="modal-card p-6 sm:p-7 rounded-3xl w-full max-w-md max-h-[88vh] overflow-y-auto no-scrollbar text-left"
          >
            <div className="flex justify-between items-start gap-4 mb-5">
              <h3 className="text-xl font-black text-ink tracking-tight">
                <i className="fa-solid fa-circle-question text-brand-400 mr-2" />
                How to use it
              </h3>
              <button
                onClick={() => setOpen(false)}
                className="text-ink/60 hover:text-ink w-8 h-8 rounded-full bg-ink/5 flex items-center justify-center transition-colors shrink-0"
                aria-label="Close"
              >
                <i className="fa-solid fa-xmark" />
              </button>
            </div>

            <ol className="flex flex-col gap-3">
              {steps.map((s, i) => (
                <li key={s.title} className="flex gap-3.5 items-start">
                  <span className="relative shrink-0 w-9 h-9 rounded-xl bg-panel border border-ink/10 flex items-center justify-center">
                    <i className={`fa-solid ${s.icon} text-ink text-[13px]`} />
                    <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-brand-500 text-panel text-[9px] font-black flex items-center justify-center">
                      {i + 1}
                    </span>
                  </span>
                  <div className="min-w-0">
                    <h4 className="font-bold text-ink text-[14px] leading-tight">{s.title}</h4>
                    <p className="text-[12.5px] text-ink/60 leading-relaxed mt-1">{s.body}</p>
                  </div>
                </li>
              ))}
            </ol>

            <p className="text-[11px] text-ink/45 leading-relaxed mt-5">
              <i className="fa-solid fa-lightbulb mr-1.5 text-brand-400" />
              Everything renders on this device — your photos are never uploaded.
            </p>
          </div>
        </div>
      )}
    </>
  )
}
