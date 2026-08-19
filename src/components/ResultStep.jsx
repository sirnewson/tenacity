import { useStudio } from '../StudioContext'
import { brand } from '../brand'
import CaptionModal from './CaptionModal'

export default function ResultStep() {
  const s = useStudio()
  const active = s.step === 'result'
  const { refs, captureSize, autoEnhance, resultReady, resultTitle } = s

  return (
    <main
      className={`step-container h-full w-full relative app-bg overflow-y-auto overflow-x-hidden no-scrollbar z-20 ${
        active ? 'block' : 'hidden'
      }`}
    >
      <div
        className="min-h-full w-full flex flex-col items-center justify-center gap-6 px-4"
        style={{
          paddingTop: 'calc(3.2rem + var(--safe-top))',
          paddingBottom: 'calc(2rem + var(--safe-bottom))',
        }}
      >
        {/* Status title */}
        <h2 className="text-xs font-black tracking-[0.3em] uppercase text-ink drop-shadow-md text-center">
          {resultTitle}
        </h2>

        {/* Reveal area (spins 360° in 3D on final render) */}
        <div
          ref={refs.revealArea}
          className="relative mx-auto shadow-[0_24px_60px_-30px_rgb(var(--ink)/0.55)] magic-sweep-container rounded-xl shrink-0"
          style={{
            width: captureSize.w ? `${captureSize.w}px` : '100%',
            height: captureSize.h ? `${captureSize.h}px` : 'auto',
            aspectRatio: captureSize.w ? undefined : '4 / 5',
            maxWidth: '28rem',
          }}
        >
          <img
            ref={refs.baseImage}
            alt=""
            className="absolute inset-0 w-full h-full object-cover rounded-xl"
            style={{
              filter: autoEnhance
                ? 'contrast(1.2) saturate(1.2) brightness(1.05)'
                : 'none',
            }}
          />

          {/* Overlay template (revealed coming out of the flip) */}
          <img ref={refs.overlayImg} alt="" className="overlay-reveal rounded-xl" />

          {/* Particles */}
          <div
            ref={refs.particles}
            className="absolute inset-0 z-[25] pointer-events-none overflow-visible"
          />

          {/* Status text */}
          <div ref={refs.statusText} className="magic-text" />
        </div>

        {/* Bottom action stack */}
        <div
          className={`w-full flex flex-col items-center gap-4 transition-opacity duration-700 ${
            resultReady
              ? 'opacity-100 pointer-events-auto'
              : 'opacity-0 pointer-events-none'
          }`}
        >
          {/* Enhance + caption */}
          <div className="flex items-center gap-3 flex-wrap justify-center">
          <button
            onClick={s.reEnhanceResult}
            className={`h-11 px-5 rounded-full flex items-center gap-2 border transition active:scale-95 ${
              autoEnhance
                ? 'bg-brand-500 border-brand-500 text-panel'
                : 'glass-panel border-ink/15 text-ink/60'
            }`}
          >
            <i
              className={`text-sm ${
                autoEnhance ? 'fa-solid fa-wand-magic-sparkles' : 'fa-solid fa-leaf'
              }`}
            />
            <span className="text-[11px] font-black uppercase tracking-wider">
              {autoEnhance ? 'Magic: ON' : 'Magic: OFF'}
            </span>
          </button>
          <CaptionModal />
          </div>

          <div className="flex items-center gap-3 w-full max-w-sm mx-auto">
            <button
              onClick={s.downloadPoster}
              className={`btn-download-glow font-black text-lg py-4 px-6 rounded-full flex items-center gap-2 flex-1 justify-center ${
                brand.ctaStyle === 'rainbow'
                  ? 'btn-rainbow'
                  : 'bg-gradient-to-r from-brand-500 to-brand-600 hover:from-brand-400 hover:to-brand-500 text-panel border-2 border-brand-300 active:scale-95 shadow-xl'
              }`}
            >
              <i className="fa-solid fa-download text-lg drop-shadow" />
              SAVE
            </button>
            <button
              onClick={s.sharePoster}
              className="glass-panel text-ink hover:bg-ink/[0.06] font-black text-lg py-4 px-6 rounded-full flex items-center gap-2 border border-ink/15 active:scale-95 transition-all flex-1 justify-center"
            >
              <i className="fa-solid fa-share-nodes text-lg" />
              SHARE
            </button>
          </div>

          {/* Retake · Edit · Home */}
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={s.retake}
              className="h-11 px-5 rounded-full glass-panel flex items-center gap-2 text-ink/80 hover:bg-ink/[0.06] transition active:scale-95"
            >
              <i className="fa-solid fa-camera-rotate text-sm" />
              <span className="text-[11px] font-bold uppercase tracking-wider">Retake</span>
            </button>
            <button
              onClick={s.goBackToEdit}
              className="h-11 px-5 rounded-full glass-panel flex items-center gap-2 text-ink/80 hover:bg-ink/[0.06] transition active:scale-95"
            >
              <i className="fa-solid fa-sliders text-sm" />
              <span className="text-[11px] font-bold uppercase tracking-wider">Edit</span>
            </button>
            <button
              onClick={s.resetApp}
              className="h-11 px-5 rounded-full glass-panel flex items-center gap-2 text-ink/80 hover:bg-ink/[0.06] transition active:scale-95"
            >
              <i className="fa-solid fa-house text-sm" />
              <span className="text-[11px] font-bold uppercase tracking-wider">Home</span>
            </button>
          </div>
        </div>
      </div>
    </main>
  )
}
