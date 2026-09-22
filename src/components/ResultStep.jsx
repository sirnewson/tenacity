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
        <h2 className="eyebrow text-center">
          {resultTitle}
        </h2>

        {/* Reveal area (spins 360° in 3D on final render) */}
        <div
          ref={refs.revealArea}
          className="relative mx-auto magic-sweep-container rounded-2xl shrink-0 ring-1 ring-ink/10"
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
            className="absolute inset-0 w-full h-full object-cover rounded-2xl"
            style={{
              filter: autoEnhance
                ? 'contrast(1.2) saturate(1.2) brightness(1.05)'
                : 'none',
            }}
          />

          {/* Overlay template (revealed coming out of the flip) */}
          <img ref={refs.overlayImg} alt="" className="overlay-reveal rounded-2xl" />

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
            className={`h-11 px-5 flex items-center gap-2 transition active:scale-95 ${
              autoEnhance ? 'btn-ink' : 'btn-glass text-ink/60'
            }`}
          >
            <i
              className={`text-sm ${
                autoEnhance ? 'fa-solid fa-wand-magic-sparkles' : 'fa-solid fa-leaf'
              }`}
            />
            <span className="text-[11px] font-semibold uppercase tracking-[0.1em]">
              Magic {autoEnhance ? 'on' : 'off'}
            </span>
          </button>
          <CaptionModal />
          </div>

          <div className="flex items-center gap-3 w-full max-w-sm mx-auto">
            <button
              onClick={s.downloadPoster}
              className={`btn-download-glow font-semibold text-[15px] uppercase tracking-[0.08em] py-4 px-6 flex items-center gap-2.5 flex-1 justify-center ${
                brand.ctaStyle === 'rainbow' ? 'btn-rainbow' : 'btn-ink'
              }`}
            >
              <i className="fa-solid fa-download text-sm" />
              Save
            </button>
            <button
              onClick={s.sharePoster}
              className="btn-glass font-semibold text-[15px] uppercase tracking-[0.08em] py-4 px-6 flex items-center gap-2.5 flex-1 justify-center"
            >
              <i className="fa-solid fa-share-nodes text-sm" />
              Share
            </button>
          </div>

          {/* Retake · Edit · Home */}
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={s.retake}
              className="btn-glass h-11 px-5 flex items-center gap-2 text-ink/80"
            >
              <i className="fa-solid fa-camera-rotate text-sm" />
              <span className="text-[11px] font-semibold uppercase tracking-[0.1em]">Retake</span>
            </button>
            <button
              onClick={s.goBackToEdit}
              className="btn-glass h-11 px-5 flex items-center gap-2 text-ink/80"
            >
              <i className="fa-solid fa-sliders text-sm" />
              <span className="text-[11px] font-semibold uppercase tracking-[0.1em]">Edit</span>
            </button>
            <button
              onClick={s.resetApp}
              className="btn-glass h-11 px-5 flex items-center gap-2 text-ink/80"
            >
              <i className="fa-solid fa-house text-sm" />
              <span className="text-[11px] font-semibold uppercase tracking-[0.1em]">Home</span>
            </button>
          </div>
        </div>
      </div>
    </main>
  )
}
