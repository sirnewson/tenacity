import { useStudio } from '../StudioContext'
import BrandLogo from './BrandLogo'
import { brand, LOGO_URL, logoTintClass } from '../brand'

/** The suite home: every tool the business needs, one tap each.
 *  `native` opens the poster studio in this app; `embed` opens a bundled
 *  single-file app full screen. */
const rgbOf = (hex = '#888888') => {
  const h = hex.replace('#', '')
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h
  const n = parseInt(full, 16)
  return `${(n >> 16) & 255} ${(n >> 8) & 255} ${n & 255}`
}

export default function AppHub() {
  const { step, openApp, switchStep, brandVersion } = useStudio()
  const active = step === 'hub'
  const apps = brand.apps || []

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
        <div className="flex justify-end mb-1">
          <button
            onClick={() => switchStep('settings')}
            className="h-9 px-4 rounded-full glass-panel flex items-center gap-2 text-ink/70 hover:text-ink hover:bg-ink/[0.06] transition active:scale-95"
          >
            <i className="fa-solid fa-sliders text-[11px]" />
            <span className="text-[10px] font-bold uppercase tracking-wider">Brand</span>
          </button>
        </div>

        <header key={brandVersion} className="flex flex-col items-center text-center animate-fade-in delay-100 mb-8">
          <BrandLogo className="h-10 sm:h-12 mb-5" />
          <span className="text-[10px] font-black uppercase tracking-[0.22em] text-brand-300">
            {brand.suite?.kicker || 'Everything in one place'}
          </span>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight mt-3">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-brand-300 to-brand-500">
              {brand.suite?.title || 'Your business toolkit'}
            </span>
          </h1>
          <p className="text-ink/60 text-sm sm:text-base leading-relaxed mt-4 max-w-lg">
            {brand.suite?.intro}
          </p>
        </header>

        {Object.entries(
          apps.reduce((acc, a) => {
            const g = a.group || 'Apps'
            ;(acc[g] = acc[g] || []).push(a)
            return acc
          }, {})
        ).map(([group, list]) => (
        <div key={group} className="mb-6">
        <h2 className="text-[10px] font-black uppercase tracking-[0.18em] text-ink/40 mb-2.5 px-1">
          {group}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {list.map((app, i) => (
            <button
              key={app.id}
              onClick={() =>
                app.kind === 'native' ? switchStep(app.screen || 'select') : openApp(app.id)
              }
              style={{ '--tint': rgbOf(app.tint) }}
              className={`group card-tint rounded-2xl p-5 text-left flex gap-4 items-start active:scale-[0.98] animate-fade-in ${
                ['delay-100', 'delay-200', 'delay-300', 'delay-400', 'delay-500'][i % 5]
              }`}
            >
              <span
                className="shrink-0 w-12 h-12 rounded-xl flex items-center justify-center border bg-panel/70"
                style={{ borderColor: `${app.tint}44`, boxShadow: `inset 0 0 0 3px ${app.tint}14` }}
              >
                <i className={`fa-solid ${app.icon} text-[17px]`} style={{ color: app.tint }} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-2">
                  <span className="font-black text-ink text-[15px] leading-tight">{app.name}</span>
                  {app.badge && (
                    <span className="px-1.5 py-0.5 rounded-full bg-brand-500 text-panel text-[8px] font-black uppercase tracking-wider">
                      {app.badge}
                    </span>
                  )}
                </span>
                <span className="block text-[12.5px] text-ink/60 leading-relaxed mt-1">
                  {app.tagline}
                </span>
              </span>
              <i className="fa-solid fa-arrow-right text-ink/25 text-xs mt-1 group-hover:text-ink/60 transition" />
            </button>
          ))}
        </div>
        </div>
        ))}

        {brand.suite?.facts?.length > 0 && (
          <ul className="mt-8 flex flex-col gap-2.5 animate-fade-in delay-500">
            {brand.suite.facts.map((f) => (
              <li key={f.label} className="flex items-center gap-3 text-[13px] text-ink/70">
                <i className={`fa-solid ${f.icon} text-brand-400 w-4 text-center`} />
                {f.label}
              </li>
            ))}
          </ul>
        )}

        <footer className="mt-10 text-center text-[11px] text-ink/45 leading-relaxed">
          {brand.requestDesign?.href && (
            <a
              href={brand.requestDesign.href}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-5 py-2 rounded-full border border-ink/10 text-ink/70 hover:text-ink hover:border-ink/30 transition mb-5"
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
