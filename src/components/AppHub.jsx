import { useRef } from 'react'
import { useStudio } from '../StudioContext'
import useReveal from '../useReveal'
import BrandLogo from './BrandLogo'
import StudioMock from './StudioMock'
import Credits from './Credits'
import { brand, heroUrl } from '../brand'

/** The home screen: one big card per studio, each previewing the work it makes.
 *  Every entry is a screen in this app — `screen` says which one, defaulting to
 *  the poster studio. */
export default function AppHub() {
  const { step, switchStep } = useStudio()
  const active = step === 'hub'
  const apps = brand.apps || []
  const scroller = useRef(null)
  useReveal(scroller, active, [apps.length])
  const title = brand.suite?.title || ''
  const lastSpace = title.lastIndexOf(' ')
  const head = lastSpace > 0 ? title.slice(0, lastSpace) : title
  const tail = lastSpace > 0 ? title.slice(lastSpace + 1) : ''

  return (
    <main
      ref={scroller}
      className={`step-container flex-col h-full w-full relative z-10 overflow-y-auto no-scrollbar ${
        active ? 'flex' : 'hidden'
      }`}
      style={{ paddingBottom: 'calc(7rem + var(--safe-bottom))' }}
    >
      {/* ---- masthead, over the client's picture when they have one ---- */}
      <div className="relative w-full">
        {heroUrl && (
          <>
            <div
              className="hero-shot intro-settle"
              style={{ backgroundImage: `url('${heroUrl}')` }}
            />
            <div className="hero-scrim" />
          </>
        )}
        <div
          className="relative w-full max-w-3xl lg:max-w-5xl mx-auto px-6"
          style={{ paddingTop: 'calc(1.5rem + var(--safe-top))', paddingBottom: '1.5rem' }}
        >
          <header className="max-w-[19rem] sm:max-w-none">
            <span className="intro-rise inline-block">
              <BrandLogo className="h-10" plateClassName="px-3 py-2" />
            </span>
            {brand.suite?.kicker && (
              <p className="eyebrow intro-rise mt-7" style={{ animationDelay: '0.08s' }}>
                {brand.suite.kicker}
              </p>
            )}
            <h1
              className="intro-rise text-[38px] sm:text-6xl font-semibold tracking-tight text-ink mt-7 leading-[0.98]"
              style={{ animationDelay: '0.14s' }}
            >
              {head}
              {tail && (
                <>
                  <br />
                  <span className={brand.ctaStyle === 'rainbow' ? 'aurora-text' : 'text-brand-400'}>
                    {tail}
                  </span>
                </>
              )}
            </h1>
            {brand.suite?.intro && (
              <p
                className="intro-rise text-grey text-[15px] leading-relaxed mt-4 max-w-[19rem]"
                style={{ animationDelay: '0.22s' }}
              >
                {brand.suite.intro}
              </p>
            )}
            <span
              className="aurora-topline intro-rise block h-[2px] w-16 rounded-full mt-6"
              style={{ animationDelay: '0.3s' }}
            />
          </header>
        </div>
      </div>

      <div className="w-full max-w-3xl lg:max-w-5xl mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-2">
          {apps.map((app, i) => {
            const kind = app.screen === 'video' ? 'video' : 'poster'
            const [first, ...rest] = app.name.split(' ')
            // A placeholder card still shows what is coming, but it does not
            // pretend to be a door: nothing to press, and no mock of work it
            // cannot do yet.
            const soon = Boolean(app.soon)
            return (
              <button
                key={app.id}
                onClick={() => !soon && switchStep(app.screen || 'select')}
                disabled={soon}
                aria-disabled={soon}
                style={{ '--tint': hexToRgb(app.tint) }}
                data-reveal
                className={`studio-card reveal group relative w-full overflow-hidden rounded-[28px] text-left ${
                  soon ? 'is-soon' : 'glass-glow'
                } ${['reveal-1', 'reveal-2', 'reveal-3', 'reveal-4'][i % 4]}`}
              >
                <div className="relative z-10 flex items-stretch gap-4 p-5 sm:p-8">
                  <div className="flex flex-col justify-center min-w-0 w-[50%] sm:w-[46%]">
                    <p className="text-[10px] font-bold uppercase tracking-[0.1em]" style={{ color: app.tint }}>
                      {app.eyebrow || (kind === 'video' ? 'Video editing' : 'Post design')}
                    </p>
                    <h2 className="text-[30px] sm:text-[42px] font-semibold tracking-tight text-ink leading-[0.95] mt-2">
                      {first}
                      {rest.length > 0 && (
                        <>
                          <br />
                          {rest.join(' ')}
                        </>
                      )}
                    </h2>
                    <p className="text-[13px] sm:text-[15px] text-grey leading-snug mt-2.5">
                      {app.tagline}
                    </p>
                    <span
                      className={`mt-5 w-12 h-12 rounded-full border border-ink/15 flex items-center justify-center text-ink/70 transition-all duration-500 ${
                        soon ? '' : 'group-hover:border-ink/40 group-hover:translate-x-1'
                      }`}
                    >
                      <i className={`fa-solid ${soon ? 'fa-hourglass-half' : 'fa-arrow-right'} text-sm`} />
                    </span>
                  </div>

                  <div className="relative flex-1 min-w-0 max-w-[15rem] ml-auto">
                    {soon ? (
                      <span className="absolute inset-0 flex items-center justify-center">
                        <i
                          className={`fa-solid ${app.icon} text-[54px] opacity-25`}
                          style={{ color: app.tint }}
                        />
                      </span>
                    ) : (
                      <StudioMock kind={kind} tint={app.tint} />
                    )}
                  </div>
                </div>
              </button>
            )
          })}
        </div>

        {brand.suite?.facts?.length > 0 && (
          <ul
            data-reveal
            className="reveal mt-8 pt-6 border-t border-ink/10 grid grid-cols-3 gap-3"
          >
            {brand.suite.facts.map((f) => (
              <li key={f.label} className="flex items-start gap-2.5 text-[12px] text-grey leading-snug">
                <i className={`fa-solid ${f.icon} text-[13px] text-ink/45 mt-0.5`} />
                {f.label}
              </li>
            ))}
          </ul>
        )}

        <footer data-reveal className="reveal mt-9 text-center">
          {brand.requestDesign?.href && (
            <a
              href={brand.requestDesign.href}
              target="_blank"
              rel="noopener noreferrer"
              className={`inline-flex items-center gap-2.5 px-7 py-3.5 text-[13px] font-semibold ${
                brand.ctaStyle === 'rainbow' ? 'btn-rainbow' : 'btn-ink'
              }`}
            >
              <i className="fa-brands fa-whatsapp" />
              {brand.requestDesign.label}
              <i className="fa-solid fa-arrow-right text-[11px]" />
            </a>
          )}
          <Credits className="mt-7" />
        </footer>
      </div>
    </main>
  )
}

function hexToRgb(hex = '#888888') {
  const h = hex.replace('#', '')
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h
  const n = parseInt(full, 16)
  return `${(n >> 16) & 255} ${(n >> 8) & 255} ${n & 255}`
}
