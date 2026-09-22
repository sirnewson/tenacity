import { useStudio } from '../StudioContext'
import BrandLogo from './BrandLogo'
import { brand, logoTintClass, LOGO_URL, socials } from '../brand'
import HowToUse from './HowToUse'
import Credits from './Credits'

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
              className="btn-glass h-9 px-4 flex items-center gap-2 text-ink/75"
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

        <div className="mb-7 mt-3 animate-fade-in delay-200">
          <BrandLogo className="h-8 mb-6" />
          {(brand.demoMode || brand.suite?.enabled) && <p className="eyebrow">Step 1 — layout</p>}
          <h1 className="text-[30px] sm:text-4xl font-semibold tracking-tight text-ink mt-1.5 leading-[1.05]">
            {brand.headline} {brand.headlineSuffix}
          </h1>
          <p className="text-grey text-[15px] leading-relaxed mt-2 max-w-md">{brand.subhead}</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
          {allCards.map((card) => (
            <div key={card.id} className={`relative animate-fade-in ${card.delay}`}>
              <button
                onClick={() => selectFormat(card.id)}
                className="group relative w-full aspect-[3/4] rounded-3xl border border-ink/10 hover:-translate-y-[3px] hover:border-ink/30 transition-all duration-500 flex flex-col items-center justify-center overflow-hidden"
              >
                <div
                  className="absolute inset-0 bg-cover bg-center opacity-95 group-hover:opacity-100 group-hover:scale-110 transition-all duration-700"
                  style={{ backgroundImage: `url('${card.bg}')` }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/15 to-transparent" />
                {card.custom && (
                  <span className="absolute top-2 left-2 z-10 px-2 py-0.5 rounded-full bg-white/90 text-black text-[8px] font-bold uppercase tracking-[0.1em]">
                    Yours
                  </span>
                )}
                <i
                  className={`fa-solid ${card.icon} text-3xl mb-3 ${card.iconColor} relative z-10 group-hover:scale-110 transition-transform duration-500 drop-shadow-md`}
                />
                <h3 className="text-[15px] sm:text-base font-semibold tracking-tight relative z-10 text-white drop-shadow-md px-2 text-center leading-tight">
                  {card.title}
                </h3>
                <p className="text-[9px] text-white/70 uppercase tracking-[0.1em] font-bold mt-1 relative z-10">
                  {card.sub}
                </p>
              </button>
              {card.custom && (
                <button
                  onClick={() => removeOverlay(card.id)}
                  className="btn-glass absolute -top-2 -right-2 z-20 w-7 h-7 text-ink/70 flex items-center justify-center"
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
              className="animate-fade-in delay-500 group relative aspect-[3/4] rounded-3xl border border-dashed border-ink/20 hover:border-ink/45 transition-all duration-500 flex flex-col items-center justify-center overflow-hidden"
            >
              <i className="fa-solid fa-cloud-arrow-up text-2xl mb-3 text-ink/40 group-hover:scale-110 transition-transform duration-500" />
              <h3 className="text-[15px] font-semibold tracking-tight text-ink px-3 text-center leading-tight">
                Your overlay
              </h3>
              <p className="text-[9px] text-grey uppercase tracking-[0.1em] font-bold mt-1 px-3 text-center">
                Upload a PNG
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
                className={`btn-glass w-11 h-11 flex items-center justify-center text-ink/60 hover:text-ink ${so.hover}`}
              >
                <i className={`${so.brand} ${so.icon} text-lg`} />
              </a>
            ))}
          </div>
        )}

        <HowToUse />

        <Credits className="text-center" />
      </div>
    </main>
  )
}
