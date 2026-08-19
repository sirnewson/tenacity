import { useStudio } from '../StudioContext'
import BrandLogo from './BrandLogo'
import { brand, logoTintClass, LOGO_URL, socials } from '../brand'
import HowToUse from './HowToUse'

export default function SelectStep() {
  const s = useStudio()
  const active = s.step === 'select'
  const { allCards, selectFormat, removeOverlay, openOverlayModal } = s

  return (
    <main
      className={`step-container flex-col justify-start h-full w-full p-4 md:px-8 relative z-10 overflow-y-auto no-scrollbar scroll-smooth ${
        active ? 'flex' : 'hidden'
      }`}
      style={{
        paddingTop: 'calc(1rem + var(--safe-top))',
        paddingBottom: 'calc(4rem + var(--safe-bottom))',
      }}
    >
      <div className="w-full max-w-5xl mx-auto py-4">
        {/* Back to the walkthrough */}
        {(brand.demoMode || brand.suite?.enabled) && (
          <div className="flex justify-start mb-2">
            <button
              onClick={s.goHome}
              className="h-9 px-4 rounded-full glass-panel flex items-center gap-2 text-ink/75 hover:bg-ink/[0.06] transition active:scale-95"
            >
              <i
                className={`fa-solid ${brand.suite?.enabled ? 'fa-grid-2' : 'fa-circle-question'} text-xs`}
              />
              <span className="text-[10px] font-bold uppercase tracking-wider">
                {brand.suite?.enabled ? 'All apps' : 'How it works'}
              </span>
            </button>
          </div>
        )}

        <div className="flex flex-col items-center justify-center mb-8 animate-fade-in delay-200">
          <BrandLogo className="h-12 sm:h-16 mb-4" />
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight drop-shadow-lg text-ink">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-brand-300 to-brand-500">
              {brand.headline}
            </span>{' '}
            {brand.headlineSuffix}
          </h1>
          <p className="text-ink/60 text-sm sm:text-base font-medium mt-2 text-center px-4">
            {brand.subhead}
          </p>
          {(brand.demoMode || brand.suite?.enabled) && (
            <p className="text-[11px] text-ink/45 mt-2 flex items-center gap-1.5">
              <span className="w-4 h-4 rounded-full bg-brand-500 text-panel text-[9px] font-black flex items-center justify-center">
                1
              </span>
              Step 1 of 4 — choose a layout
            </p>
          )}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
          {allCards.map((card) => (
            <div key={card.id} className={`relative animate-fade-in ${card.delay}`}>
              <button
                onClick={() => selectFormat(card.id)}
                className="group relative w-full aspect-[3/4] rounded-2xl glass-panel hover:border-brand-500 transition-all flex flex-col items-center justify-center overflow-hidden shadow-lg hover:shadow-neon"
              >
                <div
                  className="absolute inset-0 bg-cover bg-center opacity-95 group-hover:opacity-100 group-hover:scale-110 transition-all duration-700"
                  style={{ backgroundImage: `url('${card.bg}')` }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-black/10" />
                {card.custom && (
                  <span className="absolute top-2 left-2 z-10 px-2 py-0.5 rounded-full bg-brand-500 text-panel text-[8px] font-black uppercase tracking-wider">
                    Yours
                  </span>
                )}
                <i
                  className={`fa-solid ${card.icon} text-4xl mb-3 ${card.iconColor} relative z-10 group-hover:scale-110 transition-transform drop-shadow-md`}
                />
                <h3 className="text-base sm:text-lg font-bold relative z-10 text-white drop-shadow-md px-2 text-center leading-tight">
                  {card.title}
                </h3>
                <p className="text-[10px] text-white/75 uppercase tracking-wider font-bold mt-1 relative z-10">
                  {card.sub}
                </p>
              </button>
              {card.custom && (
                <button
                  onClick={() => removeOverlay(card.id)}
                  className="absolute -top-2 -right-2 z-20 w-7 h-7 rounded-full bg-panel border border-ink/15 text-ink/70 hover:text-ink hover:border-ink/40 flex items-center justify-center transition active:scale-95 shadow-md"
                  aria-label={`Remove ${card.title}`}
                >
                  <i className="fa-solid fa-xmark text-xs" />
                </button>
              )}
            </div>
          ))}

          {/* Upload-your-own card */}
          {brand.allowOverlayUpload && (
            <button
              onClick={openOverlayModal}
              className="animate-fade-in delay-500 group relative aspect-[3/4] rounded-2xl border-2 border-dashed border-ink/15 hover:border-brand-500 hover:bg-brand-500/5 transition-all flex flex-col items-center justify-center overflow-hidden"
            >
              <i className="fa-solid fa-cloud-arrow-up text-3xl mb-3 text-brand-400 group-hover:scale-110 transition-transform" />
              <h3 className="text-base font-bold text-ink px-3 text-center leading-tight">
                Upload overlay
              </h3>
              <p className="text-[10px] text-ink/45 uppercase tracking-wider font-bold mt-1 px-3 text-center">
                Use your own branding
              </p>
            </button>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="mt-6 mb-2 flex flex-col items-center animate-fade-in delay-500 w-full max-w-md mx-auto">
        {socials.length > 0 && (
          <div className="flex gap-4 justify-center flex-wrap mb-6">
            {socials.map((so) => (
              <a
                key={so.href}
                href={so.href}
                target="_blank"
                rel="noopener noreferrer"
                className={`w-12 h-12 rounded-full glass-panel flex items-center justify-center text-ink/60 hover:text-ink hover:scale-110 transition-all shadow-lg ${so.hover}`}
              >
                <i className={`${so.brand} ${so.icon} text-xl`} />
              </a>
            ))}
          </div>
        )}

        <HowToUse />

        <p className="text-center text-[11px] text-ink/45 font-medium tracking-wide">
          {brand.credits.map((c, i) => (
            <span key={c.href}>
              <a
                href={c.href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-brand-400 hover:text-brand-300 font-semibold transition-colors"
              >
                {c.label}
              </a>
              {i < brand.credits.length - 1 ? ' · ' : ''}
            </span>
          ))}
        </p>
      </div>
    </main>
  )
}
