import { useStudio } from '../StudioContext'
import { cardThemes, selectCards } from '../constants'

export default function CameraStep() {
  const s = useStudio()
  const active = s.step === 'camera'
  const { refs, format, mode, hasSpecs, cameraAvailable, captureSize, zoom } = s

  const isCamera = mode === 'camera'
  const th = cardThemes[s.cardTheme] || cardThemes.dark

  const resizeHandlers = {
    onPointerDown: s.cardResizeDown,
    onPointerMove: s.cardResizeMove,
    onPointerUp: s.cardResizeUp,
    onPointerCancel: s.cardResizeUp,
  }

  return (
    <main
      className={`step-container flex-col h-full w-full relative z-10 ${
        active ? 'flex' : 'hidden'
      }`}
    >
      {/* Slim top label — corners stripped, everything moved to thumb reach */}
      <div
        className="w-full px-4 pb-2 flex justify-center items-center bg-gradient-to-b from-black/80 to-transparent shrink-0"
        style={{ paddingTop: 'calc(0.9rem + var(--safe-top))' }}
      >
        <h2 className="text-xs font-black tracking-[0.3em] uppercase text-white/90 drop-shadow">
          {format?.name || 'Studio'}
        </h2>
      </div>

      {/* Template carousel — switch overlays without leaving the editor. */}
      <div className="w-full shrink-0 px-3 pb-2 overflow-x-auto no-scrollbar">
        <div className="flex gap-2 w-max mx-auto">
          {selectCards.map((card) => {
            const selected = card.id === format?.id
            return (
              <button
                key={card.id}
                type="button"
                onClick={() => s.changeFormat(card.id)}
                aria-pressed={selected}
                className={`relative h-11 w-16 shrink-0 overflow-hidden rounded-lg border transition ${
                  selected
                    ? 'border-brand-400 ring-2 ring-brand-500/50'
                    : 'border-white/15 opacity-70 hover:opacity-100'
                }`}
                title={`Switch to ${card.title}`}
              >
                <img src={card.bg} alt="" className="h-full w-full object-cover" />
                <span className="absolute inset-x-0 bottom-0 bg-black/60 px-1 py-0.5 text-[7px] font-bold leading-tight text-white truncate">
                  {card.title}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Viewfinder */}
      <div
        ref={refs.viewfinderWrapper}
        className="viewfinder-wrapper w-full flex items-center justify-center p-2 relative"
      >
        <div
          ref={refs.captureArea}
          className="relative bg-dark-900 shadow-2xl overflow-hidden rounded-xl border border-white/5"
          style={{
            width: captureSize.w ? `${captureSize.w}px` : '100%',
            height: captureSize.h ? `${captureSize.h}px` : '100%',
            maxWidth: '28rem',
          }}
        >
          <video
            ref={refs.video}
            className="absolute inset-0 w-full h-full object-cover"
            autoPlay
            playsInline
            muted
            style={{ display: isCamera && cameraAvailable ? 'block' : 'none' }}
          />

          <div
            ref={refs.transformContainer}
            className="absolute inset-0 z-10 touch-none overflow-hidden max-w-full"
            style={{ display: mode === 'upload' ? 'block' : 'none' }}
            onPointerDown={s.photoPointerDown}
            onPointerMove={s.photoPointerMove}
            onPointerUp={s.photoPointerUp}
            onPointerCancel={s.photoPointerUp}
          >
            <img
              ref={refs.uploadPreview}
              alt=""
              className="absolute cursor-move pointer-events-none max-w-none"
              style={{ transformOrigin: 'center' }}
            />
          </div>

          {/* Alignment Guides */}
          <div
            id="alignment-guides"
            className="absolute inset-0 pointer-events-none z-[35] opacity-0 transition-opacity duration-200"
          >
            {/* Center vertical line */}
            <div className="absolute top-0 bottom-0 left-1/2 w-[1px] bg-brand-500/80 -translate-x-1/2 shadow-[0_0_8px_rgba(192,38,211,0.8)]" />
            {/* Center horizontal line */}
            <div className="absolute left-0 right-0 top-1/2 h-[1px] bg-brand-500/80 -translate-y-1/2 shadow-[0_0_8px_rgba(192,38,211,0.8)]" />
          </div>

          {/* Ghost overlay preview — kept clearly visible for alignment */}
          <img
            ref={refs.ghostOverlay}
            alt=""
            className="absolute inset-0 w-full h-full object-cover pointer-events-none opacity-80 z-[15]"
          />

          {/* Camera fallback */}
          {isCamera && !cameraAvailable && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-dark-950 z-0">
              <i className="fa-solid fa-camera-slash text-4xl text-gray-700 mb-4" />
              <span className="text-gray-400 text-sm px-8 text-center font-medium leading-relaxed">
                Camera unavailable or blocked.
                <br />
                Use the <i className="fa-solid fa-image mx-1 text-white" /> icon below
                to upload.
              </span>
            </div>
          )}

          {/* Editable Draggable Specs Card */}
          <div
            ref={refs.draggableBox}
            onPointerDown={s.cardPointerDown}
            onPointerMove={s.cardPointerMove}
            onPointerUp={s.cardPointerUp}
            className="draggable-specs absolute z-40 cursor-move select-none touch-none group hover:shadow-neon rounded-[20px]"
            style={{
              top: '42%',
              left: '10%',
              width: 'max-content',
              transformOrigin: 'top left',
              display: hasSpecs ? 'block' : 'none',
            }}
          >
            {/* Pen edit hint (top-right) */}
            <div className="edit-hint">
              <i className="fa-solid fa-pen" />
            </div>

            {/* Corner resize handles — drag to scale the tag */}
            <div
              {...resizeHandlers}
              className="resize-handle handle-br"
              title="Drag to resize"
            >
              <i className="fa-solid fa-up-right-and-down-left-from-center" />
            </div>
            <div {...resizeHandlers} className="resize-handle handle-bl">
              <i className="fa-solid fa-up-right-and-down-left-from-center" />
            </div>
            <div {...resizeHandlers} className="resize-handle handle-tl">
              <i className="fa-solid fa-up-right-and-down-left-from-center" />
            </div>

            <div
              ref={refs.cardBg}
              className="card-bg relative w-[min(92vw,420px)] aspect-[982/319] bg-contain bg-center bg-no-repeat"
              style={{
                backgroundImage: "url('/product-tag-overlay.png')",
              }}
            >
              {/* Left Side: Product Name & Details */}
              <div 
                className="absolute left-[12%] top-[22%] h-[56%] w-[37%] flex flex-col justify-center"
              >
                <h4
                  ref={refs.displayModel}
                  className="relative -top-1 font-black text-[26px] leading-none tracking-tight text-white mb-1"
                  style={{
                    textShadow: '0 2px 4px rgba(0,0,0,0.5)',
                    fontFamily: 'Manrope, Inter, sans-serif',
                  }}
                >
                  {s.specsModel}
                </h4>
                <p 
                  ref={refs.displayDetails}
                  className="text-[11px] leading-snug text-white/90 whitespace-pre-line break-words"
                  style={{ fontFamily: 'Manrope, Inter, sans-serif' }}
                >
                  {s.specsDetails}
                </p>
              </div>

              {/* Right Side: Price */}
              <div className="absolute left-[55%] top-[20%] h-[60%] w-[38%] flex items-center justify-center relative">
                <span className="absolute left-2 top-1 text-white font-bold text-[14px]" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.35)', fontFamily: 'Manrope, Inter, sans-serif' }}>KSH</span>
                <div>
                  <span 
                    ref={refs.displayPrice}
                    className="relative top-2 text-white text-[42px] leading-none tracking-tight"
                    style={{ textShadow: '0 2px 4px rgba(0,0,0,0.35)', fontFamily: 'Bebas Neue, sans-serif' }}
                  >
                    {s.specsPrice}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Grid + brackets */}
          <div className="camera-grid">
            {Array.from({ length: 9 }).map((_, i) => (
              <div key={i} />
            ))}
          </div>
          <div className="corner-bracket tl" />
          <div className="corner-bracket tr" />
          <div className="corner-bracket bl" />
          <div className="corner-bracket br" />
        </div>
      </div>

      {/* Bottom Controls */}
      <div
        className="w-full shrink-0 flex flex-col items-center bg-gradient-to-t from-dark-950 via-dark-900 to-transparent pt-3 px-5 rounded-t-3xl relative z-20"
        style={{ paddingBottom: 'calc(1.4rem + var(--safe-bottom))' }}
      >
        {/* Thumb-reach control bar: Back · Magic · Flip · Tag */}
        <div className="flex items-center justify-center gap-2.5 mb-3 flex-wrap">
          <button
            onClick={s.resetApp}
            className="h-10 px-4 rounded-full glass-panel flex items-center gap-2 text-white/90 hover:bg-white/10 transition active:scale-95"
          >
            <i className="fa-solid fa-arrow-left text-sm" />
            <span className="text-[11px] font-bold uppercase tracking-wider">Back</span>
          </button>

          {isCamera && cameraAvailable && (
            <button
              onClick={s.flipCamera}
              className="h-10 w-10 rounded-full glass-panel flex items-center justify-center text-white/90 hover:bg-white/10 transition active:scale-95"
              aria-label="Flip camera"
            >
              <i className="fa-solid fa-camera-rotate text-sm" />
            </button>
          )}

          <button
            onClick={s.openSpecsModal}
            className={`h-10 px-4 rounded-full flex items-center gap-2 border transition active:scale-95 ${
              hasSpecs
                ? 'bg-brand-500/25 border-brand-500/50 text-brand-300'
                : 'bg-brand-500/15 border-brand-500/40 text-brand-400'
            }`}
          >
            <i className="fa-solid fa-tags text-sm" />
            <span className="text-[11px] font-black uppercase tracking-wider">
              {hasSpecs ? 'Edit Tag' : 'Tag'}
            </span>
          </button>
        </div>

        {/* Zoom / align controls (upload mode) */}
        {mode === 'upload' && (
          <div className="w-full max-w-sm mb-3 flex flex-col items-center gap-2">
            <div className="flex justify-between w-full text-[11px] text-brand-300 font-bold px-2">
              <i className="fa-solid fa-image text-[10px]" />
              <span className="uppercase tracking-widest">Drag photo to align</span>
              <i className="fa-solid fa-magnifying-glass-plus text-xs" />
            </div>
            <input
              type="range"
              min="0.5"
              max="3"
              step="0.01"
              value={zoom}
              onChange={(e) => s.onZoom(e.target.value)}
              className="w-full"
            />
          </div>
        )}

        <p className="text-[11px] text-center text-gray-400 font-medium mb-3 h-4">
          {isCamera
            ? hasSpecs
              ? 'Drag the tag to position, then Capture.'
              : 'Align subject in grid and Capture.'
            : hasSpecs
            ? 'Drag tag & photo, then Confirm.'
            : 'Drag & zoom photo, then Confirm.'}
        </p>

        <div className="flex items-center justify-center w-full max-w-sm gap-10">
          <label className="cursor-pointer w-14 h-14 rounded-full glass-panel hover:bg-white/10 flex items-center justify-center transition-colors shadow-lg shrink-0 active:scale-95">
            <i className="fa-solid fa-image text-xl" />
            <input
              ref={refs.fileInput}
              type="file"
              className="hidden"
              accept="image/*"
              onChange={(e) => {
                if (e.target.files?.[0]) s.handleFileUpload(e.target.files[0])
              }}
            />
          </label>

          {/* Shutter / Confirm */}
          <button
            onClick={s.handleMainAction}
            className="btn-capture w-[88px] h-[88px] rounded-full border-[5px] border-white flex items-center justify-center relative shadow-[0_0_30px_rgba(255,255,255,0.2)] shrink-0"
            style={{
              opacity: isCamera && !cameraAvailable ? 0.3 : 1,
              pointerEvents: isCamera && !cameraAvailable ? 'none' : 'auto',
            }}
          >
            {isCamera ? (
              <div className="w-[72px] h-[72px] rounded-full bg-white transition-all hover:scale-95" />
            ) : (
              <i className="fa-solid fa-check text-4xl text-white" />
            )}
          </button>

          {/* Right slot: reset (upload) or spacer to keep shutter centered */}
          <div className="w-14 h-14 flex items-center justify-center shrink-0">
            {mode === 'upload' && (
              <button
                onClick={s.resetToCamera}
                className="w-14 h-14 rounded-full glass-panel hover:bg-white/10 flex items-center justify-center transition-colors active:scale-95"
                aria-label="Discard photo"
              >
                <i className="fa-solid fa-xmark text-xl" />
              </button>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}
