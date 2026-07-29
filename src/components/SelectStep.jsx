import { useStudio } from '../StudioContext'
import { LOGO_URL, selectCards, socials } from '../constants'

export default function SelectStep() {
  const { step, selectFormat } = useStudio()
  const active = step === 'select'

  return (
    <main
      className={`step-container flex-col justify-start h-full w-full p-4 md:px-8 relative z-10 overflow-y-auto no-scrollbar scroll-smooth ${
        active ? 'flex' : 'hidden'
      }`}
      style={{
        paddingTop: 'calc(1rem + var(--safe-top))',
        paddingBottom: 'calc(6rem + var(--safe-bottom))',
      }}
    >
      <div className="w-full max-w-5xl mx-auto py-6 mt-2">
        <div className="flex flex-col items-center justify-center mb-10 animate-fade-in delay-300">
          <img
            src={LOGO_URL}
            alt="Phoneplace Logo"
            className="h-14 sm:h-20 mb-4 brightness-0 invert drop-shadow-[0_0_15px_rgba(255,255,255,0.2)] object-contain"
          />
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight drop-shadow-lg text-white">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-brand-300 to-brand-600">
              Creator
            </span>{' '}
            Studio
          </h1>
          <p className="text-gray-400 text-sm sm:text-base font-medium mt-2 text-center px-4">
            Select a premium template to launch the studio.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
          {selectCards.map((card) => (
            <button
              key={card.id}
              onClick={() => selectFormat(card.id)}
              className={`animate-fade-in ${card.delay} group relative aspect-[3/4] rounded-2xl glass-panel hover:border-brand-500 transition-all flex flex-col items-center justify-center overflow-hidden shadow-lg hover:shadow-neon`}
            >
              <div
                className="absolute inset-0 bg-cover bg-center opacity-95 group-hover:opacity-100 group-hover:scale-110 transition-all duration-700"
                style={{ backgroundImage: `url('${card.bg}')` }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-black/10" />
              <i
                className={`fa-solid ${card.icon} text-4xl mb-3 ${card.iconColor} relative z-10 group-hover:scale-110 transition-transform drop-shadow-md`}
              />
              <h3 className="text-lg font-bold relative z-10 text-white drop-shadow-md">
                {card.title}
              </h3>
              <p className="text-[10px] text-brand-300 uppercase tracking-wider font-bold mt-1 relative z-10">
                {card.sub}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* Socials Footer */}
      <div className="mt-8 mb-6 flex flex-col items-center animate-fade-in delay-500 w-full max-w-md mx-auto">
        <h4 className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mb-5 flex items-center gap-3">
          <span className="w-8 h-px bg-gray-700" />
          VISIT
          <span className="w-8 h-px bg-gray-700" />
        </h4>
        <div className="flex gap-4 justify-center flex-wrap">
          {socials.map((s) => (
            <a
              key={s.href}
              href={s.href}
              target={s.href.startsWith('http') ? '_blank' : undefined}
              rel="noopener noreferrer"
              className={`w-12 h-12 rounded-full glass-panel flex items-center justify-center text-gray-400 hover:text-white hover:scale-110 transition-all shadow-lg ${s.hover}`}
            >
              <i className={`${s.brand} ${s.icon} text-xl`} />
            </a>
          ))}
        </div>

        {/* Request Design Link */}
        <div className="mt-8 flex justify-center">
          <a
            href="https://wa.me/254702480771?text=I'm%20from%20the%20phoneplace%20creator%20tool..i%20have%20a%20request"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-6 py-2.5 rounded-full border border-brand-500/30 bg-brand-500/10 text-brand-400 hover:bg-brand-500 hover:text-white transition-all text-xs font-bold tracking-widest uppercase shadow-[0_0_15px_rgba(34,197,94,0.15)] hover:shadow-[0_0_20px_rgba(34,197,94,0.4)]"
          >
            <i className="fa-brands fa-whatsapp text-lg" />
            Request Design
          </a>
        </div>

        <div className="mt-12 text-center text-xs text-gray-300 font-medium tracking-wide flex flex-col gap-1.5">
          <p>
            Created by{' '}
            <a
              href="https://sirnewson.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-brand-400 hover:text-brand-300 font-semibold transition-colors"
            >
              Sir Newson
            </a>
            . Built at{' '}
            <a
              href="https://yxm.digital"
              target="_blank"
              rel="noopener noreferrer"
              className="text-brand-400 hover:text-brand-300 font-semibold transition-colors"
            >
              YXM.digital
            </a>
            .
          </p>
        </div>
      </div>
    </main>
  )
}
