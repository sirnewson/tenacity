import { useStudio } from '../StudioContext'
import { brand } from '../brand'
import { TAG, detailLineCount, priceScale, titleScale } from '../tagLayout'
import { QR_CORNERS, QR_SIZES } from '../qr'

export default function CameraStep() {
  const s = useStudio()
  const active = s.step === 'camera'
  const { refs, format, mode, hasSpecs, cameraAvailable, captureSize, zoom, tagUrl, allCards } = s

  const isCamera = mode === 'camera'
  // Same fit rule the export uses, so the preview never lies.
  const pScale = priceScale(s.specsPrice)
  const tScale = titleScale(s.specsModel)
  const detailClamp = detailLineCount(s.specsModel)
  // The plate is sized from the capture area, so type must scale with it.
  const plateW = Math.min((captureSize.w || 360) * 0.92, 420)

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
        className="w-full px-4 pb-2 flex justify-center items-center bg-gradient-to-b from-surface to-transparent shrink-0"
        style={{ paddingTop: 'calc(0.9rem + var(--safe-top))' }}
      >
        <div className="flex flex-col items-center gap-1">
          <h2 className="text-xs font-black tracking-[0.3em] uppercase text-ink/80 drop-shadow">
            {format?.name || 'Studio'}
          </h2>
          {brand.demoMode && (
            <p className="text-[10px] text-ink/45 font-bold uppercase tracking-wider">
              {hasSpecs ? 'Step 3 of 4 — place the tag' : 'Step 2 of 4 — frame the photo'}
            </p>
          )}
        </div>
      </div>

      {/* Template carousel — switch overlays without leaving the editor. */}
      <div className="w-full shrink-0 px-3 pb-2 overflow-x-auto no-scrollbar">
        <div className="flex gap-2 w-max mx-auto">
          {allCards.map((card) => {
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
                    : 'border-ink/12 opacity-70 hover:opacity-100'
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
          {brand.allowOverlayUpload && (
            <button
              type="button"
              onClick={s.openOverlayModal}
              title="Upload your own overlay"
              className="h-11 w-16 shrink-0 rounded-lg border border-dashed border-ink/25 text-brand-300 hover:border-brand-500 hover:bg-brand-500/10 transition flex flex-col items-center justify-center gap-0.5"
            >
              <i className="fa-solid fa-cloud-arrow-up text-[11px]" />
              <span className="text-[7px] font-bold uppercase tracking-wide">Overlay</span>
            </button>
          )}
        </div>
      </div>

      {/* Viewfinder */}
      <div
        ref={refs.viewfinderWrapper}
        className="viewfinder-wrapper w-full flex items-center justify-center p-2 relative"
      >
        <div
          ref={refs.captureArea}
          className="relative bg-ink/10 shadow-2xl overflow-hidden rounded-xl border border-ink/5"
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
            <div className="align-guide top-0 bottom-0 left-1/2 w-[1px] -translate-x-1/2" />
            <div className="align-guide left-0 right-0 top-1/2 h-[1px] -translate-y-1/2" />
          </div>

          {/* Ghost overlay preview — kept clearly visible for alignment */}
          <img
            ref={refs.ghostOverlay}
            alt=""
            className="absolute inset-0 w-full h-full object-cover pointer-events-none opacity-80 z-[15]"
          />

          {/* Camera fallback */}
          {isCamera && !cameraAvailable && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-surface z-0">
              <i className="fa-solid fa-camera-slash text-4xl text-white/30 mb-4" />
              <span className="text-white/70 text-sm px-8 text-center font-medium leading-relaxed">
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
              className="card-bg relative aspect-[982/319] bg-contain bg-center bg-no-repeat"
              style={{
                backgroundImage: `url('${tagUrl}')`,
                // Sized off the capture area, not the viewport — a 9:16 frame is
                // narrower than the screen, and a viewport-wide tag would spill
                // outside the exported poster.
                width: `${plateW}px`,
              }}
            >
              {/* Left Side: Title & Details */}
              <div
                className="absolute flex flex-col justify-start overflow-hidden"
                style={{
                  left: `${TAG.textLeft * 100}%`,
                  top: `${TAG.textTop * 100}%`,
                  width: `${TAG.textWidth * 100}%`,
                  height: `${TAG.textHeight * 100}%`,
                }}
              >
                <h4
                  ref={refs.displayModel}
                  className="relative font-black tracking-tight text-white mb-0.5 line-clamp-2 overflow-hidden"
                  style={{
                    fontSize: `${plateW * TAG.titleSize * tScale}px`,
                    lineHeight: 1.02,
                    textShadow: '0 2px 4px rgba(0,0,0,0.5)',
                    fontFamily: 'Manrope, Inter, sans-serif',
                  }}
                >
                  {s.specsModel}
                </h4>
                <p
                  ref={refs.displayDetails}
                  className="text-white/90 whitespace-pre-line break-words overflow-hidden"
                  style={{
                    fontFamily: 'Manrope, Inter, sans-serif',
                    fontSize: `${plateW * TAG.detailSize}px`,
                    lineHeight: `${TAG.detailLine / TAG.detailSize}`,
                    display: '-webkit-box',
                    WebkitBoxOrient: 'vertical',
                    WebkitLineClamp: detailClamp,
                  }}
                >
                  {s.specsDetails}
                </p>
              </div>

              {/* Right Side: Price. Currency sits inline before the number so a
                  long price can never collide with it. */}
              <div
                className="absolute flex items-baseline justify-center gap-1.5"
                style={{
                  left: `${TAG.priceBoxLeft * 100}%`,
                  top: `${TAG.priceBoxTop * 100}%`,
                  width: `${TAG.priceBoxWidth * 100}%`,
                  height: `${TAG.priceBoxHeight * 100}%`,
                }}
              >
                {brand.currency && (
                  <span
                    className="text-white font-bold leading-none pb-1"
                    style={{
                      fontSize: `${plateW * TAG.currencySize * pScale}px`,
                      textShadow: '0 1px 2px rgba(0,0,0,0.35)',
                      fontFamily: 'Manrope, Inter, sans-serif',
                    }}
                  >
                    {brand.currency}
                  </span>
                )}
                <span
                  ref={refs.displayPrice}
                  className="text-white leading-none tracking-tight"
                  style={{
                    fontSize: `${plateW * TAG.priceSize * pScale}px`,
                    textShadow: '0 2px 4px rgba(0,0,0,0.35)',
                    fontFamily: 'Bebas Neue, sans-serif',
                  }}
                >
                  {s.specsPrice}
                </span>
              </div>
            </div>
          </div>

          {/* QR badge — same corner + size the export uses */}
          {s.qr.on && s.qrDataUrl && (() => {
            const spot = QR_CORNERS[s.qr.corner] || QR_CORNERS['bottom-right']
            const short = Math.min(captureSize.w || 0, captureSize.h || 0)
            const box = short * (QR_SIZES[s.qr.size] || QR_SIZES.M)
            return (
              <div
                className="absolute z-30 rounded-[10%] bg-white shadow-lg pointer-events-none flex flex-col items-center"
                style={{
                  left: `${spot.x * 100}%`,
                  top: `${spot.y * 100}%`,
                  transform: `translate(${-spot.ax * 100}%, ${-spot.ay * 100}%)`,
                  padding: box * 0.09,
                }}
              >
                <img src={s.qrDataUrl} alt="" style={{ width: box, height: box }} />
                {s.qr.label && (
                  <span
                    className="font-black text-black leading-none"
                    style={{ fontSize: box * 0.1, paddingTop: box * 0.06, paddingBottom: box * 0.02 }}
                  >
                    {s.qr.label}
                  </span>
                )}
              </div>
            )
          })()}

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
        className="w-full shrink-0 flex flex-col items-center bg-gradient-to-t from-surface via-surface to-transparent pt-3 px-5 rounded-t-3xl relative z-20"
        style={{ paddingBottom: 'calc(1.4rem + var(--safe-bottom))' }}
      >
        {/* Thumb-reach control bar: Back · Flip · Tag */}
        <div className="flex items-center justify-center gap-2.5 mb-3 flex-wrap">
          <button
            onClick={s.resetApp}
            className="h-10 px-4 rounded-full glass-panel flex items-center gap-2 text-ink/80 hover:bg-ink/[0.06] transition active:scale-95"
          >
            <i className="fa-solid fa-arrow-left text-sm" />
            <span className="text-[11px] font-bold uppercase tracking-wider">Back</span>
          </button>

          {isCamera && cameraAvailable && (
            <button
              onClick={s.flipCamera}
              className="h-10 w-10 rounded-full glass-panel flex items-center justify-center text-ink/80 hover:bg-ink/[0.06] transition active:scale-95"
              aria-label="Flip camera"
            >
              <i className="fa-solid fa-camera-rotate text-sm" />
            </button>
          )}

          <button
            onClick={() => {
              s.setBatchMode(!s.batchMode)
              s.showMessage(
                s.batchMode
                  ? 'Batch off — captures go straight to the reveal.'
                  : 'Batch on — every capture stacks up for one export.',
                false
              )
            }}
            className={`h-10 px-4 rounded-full flex items-center gap-2 border transition active:scale-95 ${
              s.batchMode
                ? 'bg-brand-500 border-brand-500 text-panel'
                : 'glass-panel border-ink/15 text-ink'
            }`}
          >
            <i className="fa-solid fa-layer-group text-sm" />
            <span className="text-[11px] font-black uppercase tracking-wider">
              {s.batchMode ? `Batch ${s.batch.length}` : 'Batch'}
            </span>
          </button>

          {brand.qr?.enabled !== false && (
            <button
              onClick={s.openQrModal}
              className={`h-10 px-4 rounded-full flex items-center gap-2 border transition active:scale-95 ${
                s.qr.on
                  ? 'bg-brand-500 border-brand-500 text-panel'
                  : 'glass-panel border-ink/15 text-ink'
              }`}
            >
              <i className="fa-solid fa-qrcode text-sm" />
              <span className="text-[11px] font-black uppercase tracking-wider">
                {s.qr.on ? 'QR On' : 'QR'}
              </span>
            </button>
          )}

          <button
            onClick={s.openSpecsModal}
            className={`h-10 px-4 rounded-full flex items-center gap-2 border transition active:scale-95 ${
              hasSpecs
                ? 'bg-brand-500 border-brand-500 text-panel'
                : 'glass-panel border-ink/15 text-ink'
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

        {s.batchMode && s.batch.length > 0 && (
          <div className="w-full max-w-sm mb-3 flex items-center gap-2">
            <div className="flex-1 flex gap-1.5 overflow-x-auto no-scrollbar">
              {s.batch.map((item, i) => (
                <span
                  key={item.id}
                  className="relative h-12 w-10 shrink-0 rounded-md overflow-hidden border border-ink/15"
                  title={item.product}
                >
                  <img src={item.url} alt="" className="h-full w-full object-cover" />
                  <span className="absolute inset-x-0 bottom-0 bg-black/65 text-white text-[7px] font-black text-center leading-3">
                    {i + 1}
                  </span>
                </span>
              ))}
            </div>
            <button
              onClick={() => s.switchStep('batch')}
              className="shrink-0 h-10 px-3.5 rounded-full bg-brand-500 text-panel flex items-center gap-1.5 active:scale-95 transition"
            >
              <i className="fa-solid fa-layer-group text-[11px]" />
              <span className="text-[10px] font-black uppercase tracking-wider">
                Review {s.batch.length}
              </span>
            </button>
          </div>
        )}

        <p className="text-[11px] text-center text-ink/60 font-medium mb-3 h-4">
          {s.batchMode
            ? 'Capture, edit the tag, capture again — they stack up.'
            : isCamera
            ? hasSpecs
              ? 'Drag the tag to position, then Capture.'
              : 'Align subject in grid and Capture.'
            : hasSpecs
            ? 'Drag tag & photo, then Confirm.'
            : 'Drag & zoom photo, then Confirm.'}
        </p>

        <div className="flex items-center justify-center w-full max-w-sm gap-10">
          <label className="cursor-pointer w-14 h-14 rounded-full glass-panel hover:bg-ink/[0.06] flex items-center justify-center transition-colors shadow-lg shrink-0 active:scale-95">
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
            className="btn-capture w-[88px] h-[88px] rounded-full border-[5px] border-ink flex items-center justify-center relative shadow-[0_8px_24px_-8px_rgb(var(--ink)/0.5)] shrink-0"
            style={{
              opacity: isCamera && !cameraAvailable ? 0.3 : 1,
              pointerEvents: isCamera && !cameraAvailable ? 'none' : 'auto',
            }}
          >
            {isCamera ? (
              <div className="w-[72px] h-[72px] rounded-full bg-ink transition-all hover:scale-95" />
            ) : (
              <i className="fa-solid fa-check text-4xl text-ink" />
            )}
          </button>

          {/* Right slot: reset (upload) or spacer to keep shutter centered */}
          <div className="w-14 h-14 flex items-center justify-center shrink-0">
            {mode === 'upload' && (
              <button
                onClick={s.resetToCamera}
                className="w-14 h-14 rounded-full glass-panel hover:bg-ink/[0.06] flex items-center justify-center transition-colors active:scale-95"
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
