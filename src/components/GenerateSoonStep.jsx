import { useEffect, useState } from 'react'
import { useStudio } from '../StudioContext'
import { brand } from '../brand'
import { loadMemory, memoryStats } from '../brandMemory'

/** Generate Content — not built yet, and said plainly. What it shows instead is
 *  the work that makes it good when it lands: the brand memory, the templates
 *  and the product list this build already holds. */
export default function GenerateSoonStep() {
  const s = useStudio()
  const active = s.step === 'soon'
  const [stats, setStats] = useState({ filled: 0, total: 0, words: 0 })

  useEffect(() => {
    if (active) setStats(memoryStats(loadMemory()))
  }, [active])

  const ready = stats.total ? Math.round((stats.filled / stats.total) * 100) : 0

  const WILL = [
    {
      icon: 'fa-image',
      title: 'Post images from a brief',
      body: 'Describe the offer in a line. It composes the post using your templates, your colours and your product photo — not a stock look.',
    },
    {
      icon: 'fa-film',
      title: 'Short video and stories',
      body: 'The same post as a moving 9:16 — product in, price in, logo out — ready for status and reels.',
    },
    {
      icon: 'fa-pen-fancy',
      title: 'Copy that sounds like you',
      body: 'Captions and hashtags written from the brand memory, so they read like your business rather than a template.',
    },
    {
      icon: 'fa-calendar-week',
      title: 'A week at a time',
      body: 'Give it the week’s offers and get the full set — feed, story and caption for each one.',
    },
  ]

  return (
    <main
      className={`step-container flex-col h-full w-full relative z-20 app-bg overflow-y-auto no-scrollbar ${
        active ? 'flex' : 'hidden'
      }`}
      style={{
        paddingTop: 'calc(1rem + var(--safe-top))',
        paddingBottom: 'calc(2.5rem + var(--safe-bottom))',
      }}
    >
      <div className="w-full max-w-2xl mx-auto px-4">
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => s.switchStep('hub')}
            className="h-10 px-4 rounded-full glass-panel flex items-center gap-2 text-ink/80 hover:bg-ink/[0.06] transition active:scale-95"
          >
            <i className="fa-solid fa-arrow-left text-xs" />
            <span className="text-[10px] font-bold uppercase tracking-wider">Apps</span>
          </button>
          <span className="px-2.5 py-1 rounded-full bg-brand-500 text-panel text-[9px] font-black uppercase tracking-widest">
            Coming soon
          </span>
        </div>

        <header className="text-center mb-8">
          <span className="inline-flex w-14 h-14 rounded-2xl bg-brand-500/15 border border-brand-500/30 items-center justify-center mb-4">
            <i className="fa-solid fa-wand-magic-sparkles text-brand-400 text-lg" />
          </span>
          <h1 className="text-3xl font-black tracking-tight">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-brand-300 to-brand-500">
              Generate Content
            </span>
          </h1>
          <p className="text-ink/60 text-sm leading-relaxed mt-3 max-w-lg mx-auto">
            Describe what you are promoting. The app writes the post and builds the image and the
            video around your branding, your products and the way you speak.
          </p>
        </header>

        <div className="flex flex-col gap-3">
          {WILL.map((w, i) => (
            <div
              key={w.title}
              className={`glass-panel rounded-2xl p-4 flex gap-4 items-start animate-fade-in ${
                ['delay-100', 'delay-200', 'delay-300', 'delay-400'][i]
              }`}
            >
              <span className="shrink-0 w-10 h-10 rounded-xl bg-ink/5 border border-ink/10 flex items-center justify-center">
                <i className={`fa-solid ${w.icon} text-ink/70 text-[13px]`} />
              </span>
              <div className="min-w-0">
                <h3 className="font-bold text-ink text-[14px] leading-tight">{w.title}</h3>
                <p className="text-[12.5px] text-ink/60 leading-relaxed mt-1">{w.body}</p>
              </div>
            </div>
          ))}
        </div>

        {/* What it will read — and how ready this brand is */}
        <section className="mt-8 glass-panel rounded-2xl p-5">
          <h3 className="font-black text-ink text-[14px] mb-1">What it will read</h3>
          <p className="text-[12px] text-ink/60 leading-relaxed">
            Nothing gets invented about your business. It works from what this build already holds.
          </p>

          <div className="mt-4 flex flex-col gap-2.5">
            <Row
              icon="fa-brain"
              label="Brand memory"
              value={`${stats.filled} of ${stats.total} sections`}
              done={ready >= 60}
            />
            <Row
              icon="fa-table-cells-large"
              label="Your templates"
              value={`${(brand.templates || []).length} loaded`}
              done={(brand.templates || []).length > 0}
            />
            <Row icon="fa-palette" label="Colours and logo" value="From this build" done />
            <Row
              icon="fa-barcode"
              label="Product list"
              value="Optional CSV"
              done={false}
            />
          </div>

          <div className="mt-5">
            <div className="flex items-center justify-between text-[11px] font-bold text-ink/60 mb-1.5">
              <span>Brand memory filled in</span>
              <span>{ready}%</span>
            </div>
            <div className="h-2 rounded-full bg-ink/10 overflow-hidden">
              <div
                className="h-full rounded-full bg-brand-500 transition-all"
                style={{ width: `${Math.max(4, ready)}%` }}
              />
            </div>
          </div>

          <button
            onClick={() => s.switchStep('memory')}
            className="w-full mt-5 py-3.5 rounded-full bg-ink/5 hover:bg-ink/10 border border-ink/10 text-ink font-bold text-[12.5px] transition active:scale-95"
          >
            <i className="fa-solid fa-brain text-xs mr-2" />
            Fill in the brand memory now
          </button>
        </section>

        {brand.requestDesign?.href && (
          <div className="mt-7 text-center">
            <a
              href={brand.requestDesign.href}
              target="_blank"
              rel="noopener noreferrer"
              className={`inline-flex items-center gap-2.5 px-7 py-3.5 rounded-full font-black text-[13px] tracking-wide transition ${
                brand.ctaStyle === 'rainbow' ? 'btn-rainbow' : 'bg-brand-500 text-panel'
              }`}
            >
              <i className="fa-brands fa-whatsapp" />
              Tell us what you'd want it to make
            </a>
            <p className="text-[11px] text-ink/45 mt-3">
              We are building this next. What you ask for shapes it.
            </p>
          </div>
        )}
      </div>
    </main>
  )
}

function Row({ icon, label, value, done }) {
  return (
    <div className="flex items-center gap-3">
      <i className={`fa-solid ${icon} text-ink/45 w-4 text-center text-[12px]`} />
      <span className="text-[12.5px] text-ink font-medium flex-1">{label}</span>
      <span className="text-[11px] text-ink/50">{value}</span>
      <i
        className={`fa-solid ${
          done ? 'fa-circle-check text-brand-400' : 'fa-circle text-ink/20'
        } text-[11px]`}
      />
    </div>
  )
}
