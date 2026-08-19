import { useEffect, useMemo, useRef, useState } from 'react'
import StepHeader from './StepHeader'
import { useStudio } from '../StudioContext'
import { brand, formats, selectCards } from '../brand'
import { QUALITY, extensionFor, pickMime, renderClip } from '../videoRender'

const fmt = (s = 0) => {
  const m = Math.floor(s / 60)
  const r = Math.floor(s % 60)
  return `${m}:${String(r).padStart(2, '0')}`
}

/** The clip version of Poster Studio: bring in a video, trim it, and the same
 *  branding that goes on a poster goes on every frame. */
export default function VideoStudioStep() {
  const s = useStudio()
  const active = s.step === 'video'
  const videoRef = useRef(null)
  const overlayImgRef = useRef(null)
  const [src, setSrc] = useState('')
  const [duration, setDuration] = useState(0)
  const [range, setRange] = useState([0, 0])
  const [templateId, setTemplateId] = useState(brand.templates?.[0]?.id)
  const [quality, setQuality] = useState('High')
  const [enhance, setEnhance] = useState(true)
  const [busy, setBusy] = useState(false)
  const [progress, setProgress] = useState(0)
  const [result, setResult] = useState(null)

  const template = formats[templateId]
  const supported = useMemo(() => Boolean(pickMime()), [])

  // keep a decoded copy of the overlay for the canvas
  useEffect(() => {
    if (!template) return
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      overlayImgRef.current = img
    }
    img.src = template.overlayUrl
  }, [template?.overlayUrl]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => () => src && URL.revokeObjectURL(src), [src])

  const pick = (file) => {
    if (!file) return
    if (!file.type.startsWith('video/')) {
      s.showMessage('That is not a video file.', true)
      return
    }
    setResult(null)
    setSrc((old) => {
      if (old) URL.revokeObjectURL(old)
      return URL.createObjectURL(file)
    })
  }

  const onLoaded = () => {
    const v = videoRef.current
    if (!v) return
    const d = v.duration && isFinite(v.duration) ? v.duration : 0
    setDuration(d)
    setRange([0, Math.min(d, 30)]) // 30s covers a story; trim from there
    v.currentTime = 0
  }

  const clamp = (i, value) => {
    const next = [...range]
    next[i] = Number(value)
    if (next[0] > next[1] - 0.5) {
      if (i === 0) next[0] = Math.max(0, next[1] - 0.5)
      else next[1] = Math.min(duration, next[0] + 0.5)
    }
    setRange(next)
    if (videoRef.current) videoRef.current.currentTime = next[i]
  }

  const render = async () => {
    if (!videoRef.current || busy) return
    setBusy(true)
    setProgress(0)
    setResult(null)
    try {
      const blob = await renderClip({
        video: videoRef.current,
        overlay: overlayImgRef.current,
        start: range[0],
        end: range[1],
        width: template.width,
        height: template.height,
        bitrate: QUALITY[quality],
        enhance,
        onProgress: setProgress,
      })
      setResult({ url: URL.createObjectURL(blob), size: blob.size, type: blob.type })
      s.showMessage('Clip rendered.', false)
    } catch (err) {
      console.error(err)
      s.showMessage(err?.message || 'Could not render the clip.', true)
    } finally {
      setBusy(false)
      if (videoRef.current) videoRef.current.pause()
    }
  }

  const save = () => {
    if (!result) return
    const a = document.createElement('a')
    a.href = result.url
    a.download = `${brand.slug || 'clip'}_${Date.now()}.${extensionFor(result.type)}`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }

  const clipLength = Math.max(0, range[1] - range[0])

  return (
    <main
      className={`step-container flex-col h-full w-full relative z-20 app-bg overflow-y-auto no-scrollbar ${
        active ? 'flex' : 'hidden'
      }`}
      style={{
        paddingTop: 'calc(1rem + var(--safe-top))',
        paddingBottom: 'calc(2rem + var(--safe-bottom))',
      }}
    >
      <div className="w-full max-w-2xl mx-auto px-4">
        <StepHeader title="Video Studio" />

        {!supported && (
          <div className="glass-panel rounded-2xl p-4 mb-4 border border-amber-500/30">
            <p className="text-[12.5px] text-ink/70 leading-relaxed">
              This browser cannot record video. Chrome on Android or a desktop browser can — the
              rest of the studio still works here.
            </p>
          </div>
        )}

        {/* source */}
        {!src ? (
          <label className="block rounded-2xl border-2 border-dashed border-ink/15 hover:border-brand-500/60 p-10 text-center cursor-pointer transition">
            <input
              type="file"
              accept="video/*"
              className="hidden"
              onChange={(e) => pick(e.target.files?.[0])}
            />
            <i className="fa-solid fa-film text-3xl text-brand-400" />
            <p className="text-sm font-bold text-ink mt-3">Choose a video</p>
            <p className="text-[11.5px] text-ink/50 mt-1">
              Shoot it on the phone, trim it here, and the branding goes on every frame.
            </p>
          </label>
        ) : (
          <>
            <div
              className="relative rounded-2xl overflow-hidden bg-black mx-auto"
              style={{ aspectRatio: `${template?.width} / ${template?.height}`, maxWidth: '22rem' }}
            >
              <video
                ref={videoRef}
                src={src}
                onLoadedMetadata={onLoaded}
                playsInline
                muted
                className="absolute inset-0 w-full h-full object-cover"
              />
              {template && (
                <img
                  src={template.overlayUrl}
                  alt=""
                  className="absolute inset-0 w-full h-full object-cover pointer-events-none"
                />
              )}
              {busy && (
                <div className="absolute inset-0 bg-black/55 flex flex-col items-center justify-center">
                  <span className="text-white text-[11px] font-black uppercase tracking-[0.25em]">
                    Rendering
                  </span>
                  <span className="text-white/70 text-[11px] mt-1">
                    {Math.round(progress * 100)}%
                  </span>
                  <div className="w-40 h-1.5 rounded-full bg-white/20 mt-3 overflow-hidden">
                    <div
                      className="h-full bg-white transition-all"
                      style={{ width: `${Math.max(3, progress * 100)}%` }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* trim */}
            <div className="glass-panel rounded-2xl p-4 mt-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-ink/50">
                  Trim
                </span>
                <span className="text-[11px] font-bold text-ink/70">
                  {fmt(range[0])} – {fmt(range[1])} · {clipLength.toFixed(1)}s
                </span>
              </div>
              <label className="block text-[10px] text-ink/45 font-bold mb-1">Start</label>
              <input
                type="range"
                min="0"
                max={duration || 0}
                step="0.1"
                value={range[0]}
                onChange={(e) => clamp(0, e.target.value)}
                className="w-full"
              />
              <label className="block text-[10px] text-ink/45 font-bold mt-3 mb-1">End</label>
              <input
                type="range"
                min="0"
                max={duration || 0}
                step="0.1"
                value={range[1]}
                onChange={(e) => clamp(1, e.target.value)}
                className="w-full"
              />
            </div>

            {/* template */}
            <div className="mt-4">
              <span className="text-[10px] font-black uppercase tracking-widest text-ink/50 block mb-2">
                Template
              </span>
              <div className="flex gap-2 overflow-x-auto no-scrollbar">
                {selectCards.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setTemplateId(c.id)}
                    className={`relative h-14 w-11 shrink-0 rounded-lg overflow-hidden border transition ${
                      c.id === templateId
                        ? 'border-brand-500 ring-2 ring-brand-500/40'
                        : 'border-ink/12 opacity-70 hover:opacity-100'
                    }`}
                    title={c.title}
                  >
                    <img src={c.bg} alt="" className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            </div>

            {/* quality */}
            <div className="glass-panel rounded-2xl p-4 mt-4">
              <span className="text-[10px] font-black uppercase tracking-widest text-ink/50 block mb-2">
                Quality
              </span>
              <div className="flex gap-1.5">
                {Object.keys(QUALITY).map((q) => (
                  <button
                    key={q}
                    onClick={() => setQuality(q)}
                    className={`flex-1 h-10 rounded-lg border text-[11px] font-bold transition ${
                      quality === q
                        ? 'border-brand-500 bg-brand-500/15 text-ink'
                        : 'border-ink/10 text-ink/50 hover:border-ink/30'
                    }`}
                  >
                    {q}
                  </button>
                ))}
              </div>
              <button
                onClick={() => setEnhance((v) => !v)}
                className={`w-full mt-3 h-10 rounded-lg border text-[11px] font-bold transition ${
                  enhance
                    ? 'border-brand-500 bg-brand-500/15 text-ink'
                    : 'border-ink/10 text-ink/50'
                }`}
              >
                <i className="fa-solid fa-wand-magic-sparkles mr-1.5 text-[10px]" />
                Magic edit {enhance ? 'on' : 'off'}
              </button>
              <p className="text-[11px] text-ink/45 leading-relaxed mt-3">
                Rendering plays the clip through once, so a {clipLength.toFixed(0)}s cut takes about
                {' '}
                {clipLength.toFixed(0)}s. Keep the phone awake while it runs.
              </p>
            </div>

            {/* actions */}
            <div className="flex gap-2.5 mt-4">
              <button
                onClick={render}
                disabled={busy || !supported || clipLength < 0.5}
                className={`flex-[2] py-4 rounded-full font-black text-[14px] tracking-wide flex items-center justify-center gap-2 transition disabled:opacity-40 ${
                  brand.ctaStyle === 'rainbow'
                    ? 'btn-rainbow'
                    : 'bg-gradient-to-r from-brand-500 to-brand-600 text-panel border-2 border-brand-300 active:scale-95'
                }`}
              >
                <i className={`fa-solid ${busy ? 'fa-spinner fa-spin' : 'fa-clapperboard'}`} />
                {busy ? `${Math.round(progress * 100)}%` : 'Render clip'}
              </button>
              <label className="px-5 py-4 rounded-full glass-panel border border-ink/15 text-ink font-bold text-[12px] flex items-center cursor-pointer">
                <i className="fa-solid fa-rotate-left mr-1.5 text-xs" />
                Change
                <input
                  type="file"
                  accept="video/*"
                  className="hidden"
                  onChange={(e) => pick(e.target.files?.[0])}
                />
              </label>
            </div>

            {result && (
              <div className="glass-panel rounded-2xl p-4 mt-4">
                <video
                  src={result.url}
                  controls
                  playsInline
                  className="w-full rounded-xl bg-black"
                />
                <div className="flex items-center gap-3 mt-3">
                  <span className="text-[11px] text-ink/55 font-bold">
                    {(result.size / 1024 / 1024).toFixed(1)} MB ·{' '}
                    {extensionFor(result.type).toUpperCase()}
                  </span>
                  <button
                    onClick={save}
                    className="ml-auto px-5 py-3 rounded-full bg-brand-500 text-panel font-black text-[12px] uppercase tracking-wider active:scale-95 transition"
                  >
                    <i className="fa-solid fa-download mr-1.5" />
                    Save
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </main>
  )
}
