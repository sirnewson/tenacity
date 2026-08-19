import { useState } from 'react'
import BrandLogo from './BrandLogo'
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
        <header className="flex flex-col items-center text-center animate-fade-in delay-100">
          <BrandLogo className="h-11 sm:h-14 mb-5" />
          <span className="text-[10px] font-black uppercase tracking-[0.22em] text-brand-300">
            {g.kicker}
          </span>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight mt-3">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-brand-300 to-brand-500">
              {g.title}
            </span>
          </h1>
          <p className="text-ink/60 text-sm sm:text-base leading-relaxed mt-4 max-w-lg">
            {g.intro}
          </p>
        </header>

        {/* ---- The four steps ---- */}
        <ol className="mt-9 flex flex-col gap-3">
          {g.steps.map((s, i) => (
            <li
              key={s.title}
              className={`glass-panel rounded-2xl p-4 sm:p-5 flex gap-4 items-start animate-fade-in ${
                ['delay-100', 'delay-200', 'delay-300', 'delay-400'][i]
              }`}
            >
              <span className="relative shrink-0 w-11 h-11 rounded-xl bg-panel border border-ink/10 flex items-center justify-center shadow-sm">
                <i className={`fa-solid ${s.icon} text-ink`} />
                <span className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-brand-500 text-panel text-[10px] font-black flex items-center justify-center shadow-neon">
                  {i + 1}
                </span>
              </span>
              <div className="min-w-0">
                <h3 className="font-bold text-ink text-[15px] leading-tight">{s.title}</h3>
                <p className="text-[13px] text-ink/60 leading-relaxed mt-1.5">{s.body}</p>
              </div>
            </li>
          ))}
        </ol>

        {/* ---- Template strip preview ---- */}
        <section className="mt-9 animate-fade-in delay-300">
          <h4 className="text-[10px] text-ink/45 uppercase tracking-widest font-bold mb-3">
            Templates in this demo
          </h4>
          <div className="flex gap-2.5 overflow-x-auto no-scrollbar pb-1">
            {selectCards.map((c) => (
              <div
                key={c.id}
                className="shrink-0 w-[86px] rounded-xl overflow-hidden border border-ink/10 bg-ink/10"
              >
                <img src={c.bg} alt="" className="w-full aspect-[4/5] object-cover" />
                <p className="text-[9px] font-bold text-ink/75 px-1.5 py-1 truncate">{c.title}</p>
              </div>
            ))}
          </div>
          <p className="text-[11px] text-ink/45 mt-2 leading-relaxed">
            These are placeholders. In a live build they are your designer&rsquo;s artwork — or
            upload one below and see your own.
          </p>
        </section>

        {/* ---- Palette switcher ---- */}
        {brand.demoMode && (
          <section className="mt-8 glass-panel rounded-2xl p-5 animate-fade-in delay-400">
            <div className="flex items-baseline justify-between gap-3 mb-4">
              <h4 className="text-[10px] text-ink/60 uppercase tracking-widest font-bold">
                {g.paletteLabel}
              </h4>
              <code className="text-[11px] font-bold text-brand-300">{palette}</code>
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
            <p className="text-[11px] text-ink/45 mt-3 leading-relaxed">
              Every glow, button and guide line in the app follows this one colour.
            </p>
          </section>
        )}

        {/* ---- Facts ---- */}
        <ul className="mt-8 flex flex-col gap-2.5 animate-fade-in delay-500">
          {g.facts.map((f) => (
            <li key={f.label} className="flex items-center gap-3 text-[13px] text-ink/70">
              <i className={`fa-solid ${f.icon} text-brand-400 w-4 text-center`} />
              {f.label}
            </li>
          ))}
        </ul>

        {/* ---- Calls to action ---- */}
        <div className="mt-9 flex flex-col gap-3 animate-fade-in delay-500">
          <button
            onClick={() => switchStep('select')}
            className="btn-rainbow btn-download-glow w-full py-4 rounded-full font-black text-base tracking-wide flex items-center justify-center gap-2.5 transition"
          >
            <i className="fa-solid fa-play text-sm" />
            {g.ctaPrimary}
          </button>
          {brand.allowOverlayUpload && (
            <button
              onClick={openOverlayModal}
              className="w-full py-4 rounded-full glass-panel border border-ink/15 text-ink font-bold text-sm tracking-wide flex items-center justify-center gap-2.5 hover:bg-ink/5 active:scale-95 transition"
            >
              <i className="fa-solid fa-cloud-arrow-up" />
              {g.ctaSecondary}
            </button>
          )}
        </div>

        {/* ---- Footer ---- */}
        <footer className="mt-10 text-center text-[11px] text-ink/45 leading-relaxed">
          {brand.requestDesign?.href && (
            <a
              href={brand.requestDesign.href}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-5 py-2 rounded-full border border-ink/10 text-ink/70 hover:text-ink hover:border-ink/25 transition mb-5"
            >
              <i className="fa-brands fa-whatsapp text-brand-400" />
              {brand.requestDesign.label}
            </a>
          )}
          <p>
            {brand.credits.map((c, i) => (
              <span key={c.href}>
                <a
                  href={c.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-brand-400 hover:text-brand-300 font-semibold"
                >
                  {c.label}
                </a>
                {i < brand.credits.length - 1 ? ' · ' : ''}
              </span>
            ))}
          </p>
        </footer>
      </div>
    </main>
  )
}
