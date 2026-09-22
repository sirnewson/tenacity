import { useState } from 'react'
import BrandLogo from './BrandLogo'
import Credits from './Credits'
import { useStudio } from '../StudioContext'
import { brand, logoTintClass, LOGO_URL, applyPalette, selectCards } from '../brand'

/** Landing screen: explains the whole process before anyone touches a button. */
export default function HomeStep() {
  const { step, switchStep, openOverlayModal } = useStudio()
  const active = step === 'home'
  const g = brand.guide
  const [palette, setPalette] = useState(brand.colors[400].toUpperCase())

  const pick = (hex) => {
    setPalette(hex.toUpperCase())
    applyPalette(hex)
  }

  return (
    <main
      className={`step-container flex-col h-full w-full relative z-10 overflow-y-auto no-scrollbar ${
        active ? 'flex' : 'hidden'
      }`}
      style={{
        paddingTop: 'calc(1.25rem + var(--safe-top))',
        paddingBottom: 'calc(2.5rem + var(--safe-bottom))',
      }}
    >
      <div className="w-full max-w-2xl mx-auto px-5">
        {/* ---- Masthead ---- */}
        <header className="animate-fade-in delay-100">
          <BrandLogo className="h-8 mb-8" />
          <p className="eyebrow">{g.kicker}</p>
          <h1 className="text-[34px] sm:text-5xl font-semibold tracking-tight text-ink mt-2 leading-[1.05]">
            {g.title}
          </h1>
          <p className="text-grey text-[15px] leading-relaxed mt-3 max-w-md">{g.intro}</p>
        </header>

        <div className="aurora-topline h-[2px] rounded-full my-7 animate-fade-in delay-100" />

        {/* ---- The four steps ---- */}
        <ol className="flex flex-col gap-3">
          {g.steps.map((s, i) => (
            <li
              key={s.title}
              className={`glass-panel rounded-3xl p-5 flex gap-4 items-start animate-fade-in ${
                ['delay-100', 'delay-200', 'delay-300', 'delay-400'][i]
              }`}
            >
              <span className="relative shrink-0 w-11 h-11 rounded-2xl border border-ink/10 flex items-center justify-center">
                <i className={`fa-solid ${s.icon} text-ink/70 text-[15px]`} />
                <span className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-ink text-surface text-[10px] font-semibold flex items-center justify-center">
                  {i + 1}
                </span>
              </span>
              <div className="min-w-0">
                <h3 className="font-semibold tracking-tight text-ink text-[16px] leading-tight">
                  {s.title}
                </h3>
                <p className="text-[13px] text-grey leading-relaxed mt-1.5">{s.body}</p>
              </div>
            </li>
          ))}
        </ol>

        {/* ---- Template strip preview ---- */}
        <section className="mt-9 animate-fade-in delay-300">
          <h4 className="eyebrow mb-3">Templates</h4>
          <div className="flex gap-2.5 overflow-x-auto no-scrollbar pb-1">
            {selectCards.map((c) => (
              <div
                key={c.id}
                className="shrink-0 w-[86px] rounded-2xl overflow-hidden border border-ink/10 bg-ink/10"
              >
                <img src={c.bg} alt="" className="w-full aspect-[4/5] object-cover" />
                <p className="text-[9px] font-semibold text-grey px-2 py-1 truncate">{c.title}</p>
              </div>
            ))}
          </div>
          <p className="text-[11px] text-grey mt-2 leading-relaxed">
            Placeholders. In a live build these are your designer&rsquo;s artwork.
          </p>
        </section>

        {/* ---- Palette switcher ---- */}
        {brand.demoMode && (
          <section className="mt-8 glass-panel rounded-2xl p-5 animate-fade-in delay-400">
            <div className="flex items-baseline justify-between gap-3 mb-4">
              <h4 className="text-[10px] text-ink/60 uppercase tracking-widest font-bold">
                {g.paletteLabel}
              </h4>
              <code className="text-[11px] font-semibold text-grey">{palette}</code>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              {brand.palettes.map((p) => (
                <button
                  key={p.hex}
                  onClick={() => pick(p.hex)}
                  title={p.name}
                  aria-label={p.name}
                  className={`w-9 h-9 rounded-full border-2 transition active:scale-95 ${
                    palette === p.hex.toUpperCase()
                      ? 'border-ink scale-110'
                      : 'border-ink/20 hover:border-ink/50'
                  }`}
                  style={{ background: p.hex }}
                />
              ))}
              <label className="w-9 h-9 rounded-full border-2 border-dashed border-ink/25 flex items-center justify-center cursor-pointer hover:border-ink/50 transition">
                <i className="fa-solid fa-eye-dropper text-[11px] text-ink/70" />
                <input
                  type="color"
                  className="hidden"
                  onChange={(e) => pick(e.target.value)}
                />
              </label>
            </div>
            <p className="text-[11px] text-grey mt-3 leading-relaxed">
              Every button and guide line follows this one colour.
            </p>
          </section>
        )}

        {/* ---- Facts ---- */}
        <ul className="mt-8 flex flex-wrap gap-x-4 gap-y-2 animate-fade-in delay-500">
          {g.facts.map((f) => (
            <li key={f.label} className="flex items-center gap-2 text-[12px] text-grey">
              <i className={`fa-solid ${f.icon} text-[10px] opacity-60`} />
              {f.label}
            </li>
          ))}
        </ul>

        {/* ---- Calls to action ---- */}
        <div className="mt-9 flex flex-col gap-3 animate-fade-in delay-500">
          <button
            onClick={() => switchStep('select')}
            className="btn-rainbow btn-download-glow w-full py-4 rounded-full font-semibold text-base tracking-wide flex items-center justify-center gap-2.5 transition"
          >
            <i className="fa-solid fa-play text-sm" />
            {g.ctaPrimary}
          </button>
          {brand.allowOverlayUpload && (
            <button
              onClick={openOverlayModal}
              className="btn-glass w-full py-4 text-ink font-semibold text-sm flex items-center justify-center gap-2.5"
            >
              <i className="fa-solid fa-cloud-arrow-up" />
              {g.ctaSecondary}
            </button>
          )}
        </div>

        {/* ---- Footer ---- */}
        <footer className="mt-10 text-center text-[11px] text-grey leading-relaxed">
          {brand.requestDesign?.href && (
            <a
              href={brand.requestDesign.href}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-glass inline-flex items-center gap-2 px-6 py-3 text-[12px] font-semibold mb-5"
            >
              <i className="fa-brands fa-whatsapp" />
              {brand.requestDesign.label}
            </a>
          )}
          <Credits />
        </footer>
      </div>
    </main>
  )
}
