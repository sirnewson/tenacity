import { useEffect, useMemo, useRef, useState } from 'react'
import StepHeader from './StepHeader'
import { useStudio } from '../StudioContext'
import { brand, motionClips, videoCards } from '../brand'
import { listClips, release, removeClip, saveClip } from '../motionBank'
import {
  LOOKS,
  QUALITY,
  VIDEO_SIZE,
  extensionFor,
  filterFor,
  pickMime,
  renderClip,
} from '../videoRender'

const fmt = (s = 0) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v))

const TABS = [
  { id: 'trim', label: 'Trim', icon: 'fa-scissors' },
  { id: 'frame', label: 'Frame', icon: 'fa-crop-simple' },
  { id: 'look', label: 'Look', icon: 'fa-sliders' },
  { id: 'text', label: 'Text', icon: 'fa-font' },
  { id: 'brand', label: 'Brand', icon: 'fa-layer-group' },
  { id: 'clips', label: 'Clips', icon: 'fa-clapperboard' },
  { id: 'export', label: 'Export', icon: 'fa-gear' },
]

/** The clip side of the studio. Everything renders 9:16 — the shape a reel, a
 *  story and a status all want — so the work is choosing what survives that
 *  crop, and the tools follow: trim, reframe, look, caption, brand, stings.
 *
 *  One panel is open at a time. A phone screen cannot hold seven stacked cards
 *  and still show the thing being edited, and the preview is the point. */
export default function VideoStudioStep() {
  const s = useStudio()
  const active = s.step === 'video'

  const videoRef = useRef(null)
  const stripVideoRef = useRef(null)
  const introRef = useRef(null)
  const outroRef = useRef(null)
  const overlayImgRef = useRef(null)
  const camRef = useRef(null)
  const recRef = useRef(null)
  const dragRef = useRef(null)
  const playRaf = useRef(0)
  const recTimer = useRef(0)

  const [src, setSrc] = useState('')
  const [sourceBlob, setSourceBlob] = useState(null)
  const [recording, setRecording] = useState(false)
  const [recSeconds, setRecSeconds] = useState(0)
  const [camOn, setCamOn] = useState(false)

  const [duration, setDuration] = useState(0)
  const [range, setRange] = useState([0, 0])
  const [ratio, setRatio] = useState(16 / 9)
  const [strip, setStrip] = useState([])

  const [tab, setTab] = useState('trim')
  const [templateId, setTemplateId] = useState(videoCards[0]?.id || '')
  const [look, setLook] = useState('None')
  const [enhance, setEnhance] = useState(true)
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [caption, setCaption] = useState('')
  const [captionY, setCaptionY] = useState(0.86)
  const [muted, setMuted] = useState(false)
  const [quality, setQuality] = useState('High')

  const [saved, setSaved] = useState([])
  const [introId, setIntroId] = useState('')
  const [outroId, setOutroId] = useState('')

  const [playing, setPlaying] = useState(false)
  const [busy, setBusy] = useState(false)
  const [progress, setProgress] = useState(0)
  const [result, setResult] = useState(null)

  const template = videoCards.find((c) => c.id === templateId)
  const supported = useMemo(() => Boolean(pickMime()), [])
  const exportRatio = VIDEO_SIZE.width / VIDEO_SIZE.height
  const bank = useMemo(() => [...motionClips, ...saved], [saved])
  const intro = bank.find((c) => c.id === introId)
  const outro = bank.find((c) => c.id === outroId)

  // How far the source spills past the 9:16 frame, as a fraction of it. Drives
  // both the preview transform and how far a drag is allowed to travel.
  const overX = Math.max(0, Math.max(1, ratio / exportRatio) * zoom - 1)
  const overY = Math.max(0, Math.max(1, exportRatio / ratio) * zoom - 1)

  useEffect(() => {
    if (!template) {
      overlayImgRef.current = null
      return
    }
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      overlayImgRef.current = img
    }
    img.src = template.bg
  }, [template?.bg]) // eslint-disable-line react-hooks/exhaustive-deps

  // the device's own clips, loaded once the studio is opened
  useEffect(() => {
    if (!active) return undefined
    let stale = []
    listClips().then((rows) => {
      stale = rows
      setSaved(rows)
    })
    return () => release(stale)
  }, [active])

  useEffect(() => () => src && URL.revokeObjectURL(src), [src])
  useEffect(
    () => () => {
      cancelAnimationFrame(playRaf.current)
      clearInterval(recTimer.current)
      stopCamera()
    },
    [] // eslint-disable-line react-hooks/exhaustive-deps
  )

  // leaving the studio should not leave the camera light on
  useEffect(() => {
    if (!active) stopCamera()
  }, [active]) // eslint-disable-line react-hooks/exhaustive-deps

  // ---------------------------------------------------------------- sourcing
  const useBlob = (blob, name = 'clip') => {
    setResult(null)
    setStrip([])
    setZoom(1)
    setPan({ x: 0, y: 0 })
    setSourceBlob(Object.assign(blob, { label: name }))
    setSrc((old) => {
      if (old) URL.revokeObjectURL(old)
      return URL.createObjectURL(blob)
    })
  }

  const pick = (file) => {
    if (!file) return
    if (!file.type.startsWith('video/')) {
      s.showMessage('That is not a video file.', true)
      return
    }
    stopCamera()
    useBlob(file, file.name.replace(/\.[^.]+$/, ''))
  }

  function stopCamera() {
    const stream = camRef.current
    if (stream) {
      stream.getTracks().forEach((t) => t.stop())
      camRef.current = null
    }
    setCamOn(false)
  }

  const startCamera = async () => {
    if (!supported) return
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1080 },
          height: { ideal: 1920 },
        },
        audio: true,
      })
      camRef.current = stream
      setCamOn(true)
      const v = videoRef.current
      if (v) {
        v.srcObject = stream
        v.muted = true
        await v.play().catch(() => {})
      }
    } catch {
      s.showMessage('Camera blocked. Allow it, or upload a clip instead.', true)
    }
  }

  const toggleRecord = () => {
    if (recording) {
      recRef.current?.stop()
      return
    }
    const stream = camRef.current
    if (!stream) return
    const mime = pickMime()
    const chunks = []
    const rec = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined)
    rec.ondataavailable = (e) => e.data.size && chunks.push(e.data)
    rec.onstop = () => {
      clearInterval(recTimer.current)
      setRecording(false)
      const blob = new Blob(chunks, { type: mime || 'video/webm' })
      const v = videoRef.current
      if (v) v.srcObject = null
      stopCamera()
      useBlob(blob, 'Recorded clip')
    }
    recRef.current = rec
    rec.start(250)
    setRecording(true)
    setRecSeconds(0)
    recTimer.current = setInterval(() => setRecSeconds((n) => n + 1), 1000)
  }

  const onLoaded = () => {
    const v = videoRef.current
    if (!v || v.srcObject) return
    const d = v.duration && isFinite(v.duration) ? v.duration : 0
    setDuration(d)
    setRange([0, Math.min(d, 30)]) // 30s covers a story; trim from there
    setRatio(v.videoWidth / v.videoHeight || 16 / 9)
    v.currentTime = 0
    buildStrip(d)
  }

  /** Eight stills across the clip, so the trim is something you can see. Runs
   *  on a second element, so scrubbing never disturbs the preview. */
  const buildStrip = async (d) => {
    const v = stripVideoRef.current
    if (!v || !d) return
    const canvas = document.createElement('canvas')
    canvas.width = 72
    canvas.height = 128
    const ctx = canvas.getContext('2d')
    const shots = []
    for (let i = 0; i < 8; i += 1) {
      const at = (d * (i + 0.5)) / 8
      try {
        // eslint-disable-next-line no-await-in-loop
        await new Promise((res, rej) => {
          const done = () => {
            v.removeEventListener('seeked', done)
            res()
          }
          v.addEventListener('seeked', done)
          setTimeout(rej, 2500)
          v.currentTime = at
        })
        const vr = v.videoWidth / v.videoHeight
        const cr = canvas.width / canvas.height
        let dw = canvas.width
        let dh = canvas.height
        if (vr > cr) dw = canvas.height * vr
        else dh = canvas.width / vr
        ctx.drawImage(v, (canvas.width - dw) / 2, (canvas.height - dh) / 2, dw, dh)
        shots.push(canvas.toDataURL('image/jpeg', 0.6))
        setStrip([...shots])
      } catch {
        break // a source that will not seek still trims fine, just without stills
      }
    }
  }

  const setEdge = (i, value) => {
    const next = [...range]
    next[i] = Number(value)
    if (next[0] > next[1] - 0.5) {
      if (i === 0) next[0] = Math.max(0, next[1] - 0.5)
      else next[1] = Math.min(duration, next[0] + 0.5)
    }
    setRange(next)
    if (videoRef.current) videoRef.current.currentTime = next[i]
  }

  // ---------------------------------------------------------------- playback
  const togglePlay = () => {
    const v = videoRef.current
    if (!v || v.srcObject) return
    if (playing) {
      v.pause()
      cancelAnimationFrame(playRaf.current)
      setPlaying(false)
      return
    }
    v.currentTime = range[0]
    v.muted = true // the preview is silent; the export keeps the audio
    v.play().then(
      () => {
        setPlaying(true)
        const watch = () => {
          const el = videoRef.current
          if (!el) return
          if (el.currentTime >= range[1]) {
            el.pause()
            el.currentTime = range[0]
            setPlaying(false)
            return
          }
          playRaf.current = requestAnimationFrame(watch)
        }
        playRaf.current = requestAnimationFrame(watch)
      },
      () => {}
    )
  }

  // ------------------------------------------------------------ drag to move
  const onPointerDown = (e) => {
    if (camOn || (overX === 0 && overY === 0)) return
    e.currentTarget.setPointerCapture?.(e.pointerId)
    const box = e.currentTarget.getBoundingClientRect()
    dragRef.current = { x: e.clientX, y: e.clientY, pan: { ...pan }, w: box.width, h: box.height }
  }
  const onPointerMove = (e) => {
    const d = dragRef.current
    if (!d) return
    const nx = overX ? d.pan.x + ((e.clientX - d.x) / (d.w * overX)) * 2 : 0
    const ny = overY ? d.pan.y + ((e.clientY - d.y) / (d.h * overY)) * 2 : 0
    setPan({ x: clamp(nx, -1, 1), y: clamp(ny, -1, 1) })
  }
  const onPointerUp = () => {
    dragRef.current = null
  }

  // ------------------------------------------------------------------- bank
  const saveToBank = async (role) => {
    if (!sourceBlob) return
    await saveClip({ name: sourceBlob.label || 'Saved clip', blob: sourceBlob, role })
    const rows = await listClips()
    setSaved(rows)
    s.showMessage('Saved to the clip bank.', false)
  }

  const forget = async (id) => {
    await removeClip(id)
    const rows = await listClips()
    setSaved(rows)
    if (introId === id) setIntroId('')
    if (outroId === id) setOutroId('')
  }

  // ----------------------------------------------------------------- render
  const render = async () => {
    if (!videoRef.current || busy) return
    cancelAnimationFrame(playRaf.current)
    setPlaying(false)
    setBusy(true)
    setProgress(0)
    setResult(null)
    try {
      const segments = []
      if (intro && introRef.current) {
        segments.push({
          video: introRef.current,
          start: 0,
          end: introRef.current.duration || 5,
          overlay: false, // a sting is already branded
          enhance: false,
        })
      }
      segments.push({
        video: videoRef.current,
        start: range[0],
        end: range[1],
        look,
        frame: { zoom, x: pan.x, y: pan.y },
        caption,
        captionY,
      })
      if (outro && outroRef.current) {
        segments.push({
          video: outroRef.current,
          start: 0,
          end: outroRef.current.duration || 5,
          overlay: false,
          enhance: false,
        })
      }

      const blob = await renderClip({
        segments,
        overlay: overlayImgRef.current,
        ...VIDEO_SIZE,
        bitrate: QUALITY[quality],
        enhance,
        muted,
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
  const stingLength = (intro ? introRef.current?.duration || 5 : 0) + (outro ? outroRef.current?.duration || 5 : 0)
  const totalLength = clipLength + stingLength
  const selLeft = duration ? (range[0] / duration) * 100 : 0
  const selWidth = duration ? (clipLength / duration) * 100 : 100
  const editing = Boolean(src) && !camOn

  return (
    <main
      className={`step-container flex-col h-full w-full relative z-20 app-bg overflow-y-auto no-scrollbar ${
        active ? 'flex' : 'hidden'
      }`}
      style={{
        paddingTop: 'calc(1rem + var(--safe-top))',
        paddingBottom: 'calc(6rem + var(--safe-bottom))',
      }}
    >
      <div className="w-full max-w-2xl mx-auto px-4">
        <StepHeader title="Video Studio" />

        {!supported && (
          <div className="glass-panel rounded-2xl p-4 mb-4">
            <p className="text-[12.5px] text-grey leading-relaxed">
              This browser can&rsquo;t record video. Chrome on Android or a desktop browser can.
            </p>
          </div>
        )}

        {/* ---- the frame: camera, or the clip being cut ---- */}
        <div
          className="relative rounded-3xl overflow-hidden bg-black mx-auto touch-none select-none border border-ink/10"
          style={{ aspectRatio: '9 / 16', maxWidth: '16rem' }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
        >
          <video
            ref={videoRef}
            src={src || undefined}
            onLoadedMetadata={onLoaded}
            playsInline
            muted
            className="absolute inset-0 w-full h-full object-cover"
            style={{
              filter: camOn ? 'none' : filterFor(look, enhance),
              transform: camOn
                ? undefined
                : `translate(${(pan.x * overX * 100) / 2}%, ${
                    (pan.y * overY * 100) / 2
                  }%) scale(${zoom})`,
            }}
          />

          {!src && !camOn && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-white/45">
              <i className="fa-solid fa-film text-2xl" />
              <span className="text-[11px] font-semibold">9:16</span>
            </div>
          )}

          {template && editing && (
            <img
              src={template.bg}
              alt=""
              className="absolute inset-0 w-full h-full object-cover pointer-events-none"
            />
          )}

          {caption && editing && (
            <span
              className="absolute inset-x-0 px-5 text-center text-white font-semibold leading-tight pointer-events-none"
              style={{
                top: `${captionY * 100}%`,
                transform: 'translateY(-50%)',
                fontSize: 'clamp(13px, 4.6vw, 19px)',
                textShadow: '0 2px 14px rgba(0,0,0,0.75)',
              }}
            >
              {caption}
            </span>
          )}

          {camOn && (
            <>
              <span className="absolute top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-black/55 backdrop-blur text-white text-[11px] font-semibold flex items-center gap-2">
                <span
                  className={`w-2 h-2 rounded-full ${
                    recording ? 'bg-red-500 animate-pulse' : 'bg-white/60'
                  }`}
                />
                {recording ? fmt(recSeconds) : 'Ready'}
              </span>
              <button
                onClick={toggleRecord}
                className="absolute bottom-4 left-1/2 -translate-x-1/2 w-16 h-16 rounded-full border-[3px] border-white/85 flex items-center justify-center active:scale-95 transition"
                aria-label={recording ? 'Stop recording' : 'Start recording'}
              >
                <span
                  className={`bg-red-500 transition-all duration-300 ${
                    recording ? 'w-6 h-6 rounded-md' : 'w-12 h-12 rounded-full'
                  }`}
                />
              </button>
              <button
                onClick={stopCamera}
                className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/45 backdrop-blur text-white flex items-center justify-center"
                aria-label="Close the camera"
              >
                <i className="fa-solid fa-xmark text-xs" />
              </button>
            </>
          )}

          {editing && !busy && (
            <button
              onClick={togglePlay}
              className="absolute bottom-3 left-1/2 -translate-x-1/2 w-11 h-11 rounded-full bg-black/45 backdrop-blur text-white flex items-center justify-center active:scale-95 transition"
              aria-label={playing ? 'Pause' : 'Play the trimmed section'}
            >
              <i className={`fa-solid ${playing ? 'fa-pause' : 'fa-play'} text-[13px]`} />
            </button>
          )}

          {busy && (
            <div className="absolute inset-0 bg-black/55 flex flex-col items-center justify-center">
              <span className="text-white text-[10px] font-semibold uppercase tracking-[0.1em]">
                Rendering
              </span>
              <span className="text-white/70 text-[11px] mt-1">{Math.round(progress * 100)}%</span>
              <div className="w-36 h-1.5 rounded-full bg-white/20 mt-3 overflow-hidden">
                <div
                  className="h-full bg-white transition-all"
                  style={{ width: `${Math.max(3, progress * 100)}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* ---- where the clip comes from ---- */}
        {!editing ? (
          <div className="flex gap-2.5 mt-4 max-w-sm mx-auto">
            <button
              onClick={camOn ? stopCamera : startCamera}
              disabled={!supported}
              className={`flex-1 py-4 font-semibold text-[13px] flex items-center justify-center gap-2 disabled:opacity-40 ${
                camOn ? 'btn-glass' : 'btn-ink'
              }`}
            >
              <i className="fa-solid fa-video text-xs" />
              {camOn ? 'Close camera' : 'Record'}
            </button>
            <label className="btn-glass flex-1 py-4 text-ink font-semibold text-[13px] flex items-center justify-center gap-2 cursor-pointer">
              <i className="fa-solid fa-arrow-up-from-bracket text-xs" />
              Upload
              <input
                type="file"
                accept="video/*"
                className="hidden"
                onChange={(e) => pick(e.target.files?.[0])}
              />
            </label>
          </div>
        ) : (
          <p className="text-[11px] text-grey text-center mt-2">
            {overX || overY ? 'Drag the clip to reframe · ' : ''}1080×1920 ·{' '}
            {totalLength.toFixed(0)}s out
          </p>
        )}

        {/* ---- the toolbar ---- */}
        {editing && (
          <>
            <div className="flex gap-1.5 overflow-x-auto no-scrollbar mt-5 pb-1">
              {TABS.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={`shrink-0 h-10 px-4 rounded-full border text-[11px] font-semibold transition flex items-center gap-2 ${
                    tab === t.id
                      ? 'border-ink bg-ink text-surface'
                      : 'border-ink/12 text-grey hover:border-ink/35'
                  }`}
                >
                  <i className={`fa-solid ${t.icon} text-[11px]`} />
                  {t.label}
                </button>
              ))}
            </div>

            <div className="glass-panel rounded-2xl p-4 mt-3">
              {tab === 'trim' && (
                <>
                  <div className="flex items-center justify-between mb-2.5">
                    <span className="eyebrow">Trim</span>
                    <span className="text-[11px] font-semibold text-ink/70">
                      {fmt(range[0])} – {fmt(range[1])} · {clipLength.toFixed(1)}s
                    </span>
                  </div>
                  <div className="relative h-16 rounded-xl overflow-hidden border border-ink/10 bg-ink/5 flex">
                    {(strip.length ? strip : Array.from({ length: 8 })).map((shot, i) => (
                      <span key={i} className="flex-1 h-full border-r border-black/20 last:border-0">
                        {shot && <img src={shot} alt="" className="w-full h-full object-cover" />}
                      </span>
                    ))}
                    <span
                      className="absolute inset-y-0 border-x-2 border-ink bg-ink/10 pointer-events-none"
                      style={{ left: `${selLeft}%`, width: `${selWidth}%` }}
                    />
                  </div>
                  <label className="eyebrow block mt-3 mb-1">Start</label>
                  <input
                    type="range"
                    min="0"
                    max={duration || 0}
                    step="0.1"
                    value={range[0]}
                    onChange={(e) => setEdge(0, e.target.value)}
                    className="w-full"
                  />
                  <label className="eyebrow block mt-3 mb-1">End</label>
                  <input
                    type="range"
                    min="0"
                    max={duration || 0}
                    step="0.1"
                    value={range[1]}
                    onChange={(e) => setEdge(1, e.target.value)}
                    className="w-full"
                  />
                </>
              )}

              {tab === 'frame' && (
                <>
                  <div className="flex items-center justify-between mb-2">
                    <span className="eyebrow">Zoom</span>
                    <button
                      onClick={() => {
                        setZoom(1)
                        setPan({ x: 0, y: 0 })
                      }}
                      className="text-[11px] font-semibold text-grey hover:text-ink transition"
                    >
                      Reset
                    </button>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="2.5"
                    step="0.01"
                    value={zoom}
                    onChange={(e) => setZoom(Number(e.target.value))}
                    className="w-full"
                  />
                  <p className="text-[11px] text-grey leading-relaxed mt-3">
                    A wide clip loses its edges in 9:16. Drag the preview to choose which part
                    survives.
                  </p>
                </>
              )}

              {tab === 'look' && (
                <>
                  <span className="eyebrow block mb-2">Look</span>
                  <div className="flex gap-1.5 flex-wrap">
                    {Object.keys(LOOKS).map((k) => (
                      <button
                        key={k}
                        onClick={() => setLook(k)}
                        className={`px-3.5 h-9 rounded-full border text-[11px] font-semibold transition ${
                          look === k
                            ? 'border-ink bg-ink text-surface'
                            : 'border-ink/12 text-grey hover:border-ink/35'
                        }`}
                      >
                        {k}
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={() => setEnhance((v) => !v)}
                    className={`w-full mt-3 h-11 rounded-full border text-[11px] font-semibold transition ${
                      enhance ? 'border-ink bg-ink text-surface' : 'border-ink/12 text-grey'
                    }`}
                  >
                    <i className="fa-solid fa-wand-magic-sparkles mr-1.5 text-[10px]" />
                    Magic edit {enhance ? 'on' : 'off'}
                  </button>
                </>
              )}

              {tab === 'text' && (
                <>
                  <span className="eyebrow block mb-2">Text on the clip</span>
                  <input
                    value={caption}
                    onChange={(e) => setCaption(e.target.value)}
                    placeholder="Say it in a few words"
                    maxLength={70}
                    className="w-full field rounded-full px-4 py-3 text-[13px] outline-none"
                  />
                  {caption && (
                    <>
                      <label className="eyebrow block mt-3 mb-1">Position</label>
                      <input
                        type="range"
                        min="0.12"
                        max="0.92"
                        step="0.01"
                        value={captionY}
                        onChange={(e) => setCaptionY(Number(e.target.value))}
                        className="w-full"
                      />
                    </>
                  )}
                </>
              )}

              {tab === 'brand' && (
                <>
                  <span className="eyebrow block mb-2">Template</span>
                  <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                    <button
                      onClick={() => setTemplateId('')}
                      className={`shrink-0 w-14 h-24 rounded-xl border text-[10px] font-semibold flex items-center justify-center transition ${
                        templateId === ''
                          ? 'border-ink bg-ink text-surface'
                          : 'border-ink/12 text-grey hover:border-ink/35'
                      }`}
                    >
                      None
                    </button>
                    {videoCards.map((c) => (
                      <button
                        key={c.id}
                        onClick={() => setTemplateId(c.id)}
                        className={`relative shrink-0 w-14 h-24 rounded-xl overflow-hidden border transition ${
                          c.id === templateId
                            ? 'border-ink ring-2 ring-ink/25'
                            : 'border-ink/12 opacity-75 hover:opacity-100'
                        }`}
                        title={c.title}
                      >
                        <img src={c.bg} alt="" className="h-full w-full object-cover" />
                      </button>
                    ))}
                  </div>
                  <p className="text-[11px] text-grey mt-2">
                    {template ? template.title : 'No overlay — the footage stands alone.'}
                  </p>
                </>
              )}

              {tab === 'clips' && (
                <>
                  <div className="flex items-center justify-between mb-2">
                    <span className="eyebrow">Intro &amp; outro</span>
                    <button
                      onClick={() => saveToBank('both')}
                      className="text-[11px] font-semibold text-grey hover:text-ink transition"
                    >
                      <i className="fa-solid fa-bookmark mr-1 text-[10px]" />
                      Save this clip
                    </button>
                  </div>
                  {bank.length === 0 ? (
                    <p className="text-[12px] text-grey leading-relaxed">
                      Nothing in the bank yet. Record or upload a logo sting, save it here, and it is
                      one tap away on every clip after this.
                    </p>
                  ) : (
                    <div className="flex flex-col gap-2">
                      {bank.map((c) => (
                        <div
                          key={c.id}
                          className="flex items-center gap-3 rounded-xl border border-ink/10 p-2"
                        >
                          <span className="w-9 h-14 rounded-lg overflow-hidden bg-ink/10 shrink-0">
                            {c.posterUrl ? (
                              <img
                                src={c.posterUrl}
                                alt=""
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <span className="w-full h-full flex items-center justify-center">
                                <i className="fa-solid fa-clapperboard text-[11px] text-ink/40" />
                              </span>
                            )}
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block text-[13px] font-semibold text-ink truncate">
                              {c.name}
                            </span>
                            <span className="block text-[11px] text-grey truncate">
                              {c.sub || c.role}
                            </span>
                          </span>
                          <span className="flex gap-1.5 shrink-0">
                            {c.role !== 'outro' && (
                              <button
                                onClick={() => setIntroId(introId === c.id ? '' : c.id)}
                                className={`h-8 px-3 rounded-full border text-[10px] font-semibold transition ${
                                  introId === c.id
                                    ? 'border-ink bg-ink text-surface'
                                    : 'border-ink/12 text-grey'
                                }`}
                              >
                                Intro
                              </button>
                            )}
                            {c.role !== 'intro' && (
                              <button
                                onClick={() => setOutroId(outroId === c.id ? '' : c.id)}
                                className={`h-8 px-3 rounded-full border text-[10px] font-semibold transition ${
                                  outroId === c.id
                                    ? 'border-ink bg-ink text-surface'
                                    : 'border-ink/12 text-grey'
                                }`}
                              >
                                Outro
                              </button>
                            )}
                            {c.saved && (
                              <button
                                onClick={() => forget(c.id)}
                                className="h-8 w-8 rounded-full text-grey hover:text-ink transition"
                                aria-label={`Remove ${c.name}`}
                              >
                                <i className="fa-solid fa-trash text-[10px]" />
                              </button>
                            )}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}

              {tab === 'export' && (
                <>
                  <div className="flex items-center justify-between">
                    <span className="eyebrow">Sound</span>
                    <button
                      onClick={() => setMuted((v) => !v)}
                      className={`h-9 px-4 rounded-full border text-[11px] font-semibold transition ${
                        muted ? 'border-ink/12 text-grey' : 'border-ink bg-ink text-surface'
                      }`}
                    >
                      <i
                        className={`fa-solid ${
                          muted ? 'fa-volume-xmark' : 'fa-volume-high'
                        } mr-1.5 text-[10px]`}
                      />
                      {muted ? 'Muted' : 'Keep audio'}
                    </button>
                  </div>
                  <span className="eyebrow block mt-4 mb-2">Quality</span>
                  <div className="flex gap-1.5">
                    {Object.keys(QUALITY).map((q) => (
                      <button
                        key={q}
                        onClick={() => setQuality(q)}
                        className={`flex-1 h-11 rounded-full border text-[11px] font-semibold transition ${
                          quality === q
                            ? 'border-ink bg-ink text-surface'
                            : 'border-ink/12 text-grey hover:border-ink/35'
                        }`}
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                  <p className="text-[11px] text-grey leading-relaxed mt-3">
                    Renders in real time — about {totalLength.toFixed(0)}s with the stings. Keep the
                    screen on.
                  </p>
                </>
              )}
            </div>

            {/* ---- actions ---- */}
            <div className="flex gap-2.5 mt-4">
              <button
                onClick={render}
                disabled={busy || !supported || clipLength < 0.5}
                className={`flex-[2] py-4 font-semibold text-[14px] uppercase tracking-[0.08em] flex items-center justify-center gap-2.5 transition disabled:opacity-40 ${
                  brand.ctaStyle === 'rainbow' ? 'btn-rainbow' : 'btn-ink'
                }`}
              >
                <i className={`fa-solid ${busy ? 'fa-spinner fa-spin' : 'fa-clapperboard'}`} />
                {busy ? `${Math.round(progress * 100)}%` : 'Render'}
              </button>
              <label className="btn-glass px-5 py-4 text-ink font-semibold text-[12px] flex items-center cursor-pointer">
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
                <video src={result.url} controls playsInline className="w-full rounded-xl bg-black" />
                <div className="flex items-center gap-3 mt-3">
                  <span className="text-[11px] text-grey font-semibold">
                    {(result.size / 1024 / 1024).toFixed(1)} MB ·{' '}
                    {extensionFor(result.type).toUpperCase()} · 1080×1920
                  </span>
                  <button
                    onClick={save}
                    className="btn-ink ml-auto px-5 py-3 font-semibold text-[12px] uppercase tracking-[0.08em]"
                  >
                    <i className="fa-solid fa-download mr-1.5" />
                    Save
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        {/* off-screen: the filmstrip cutter and the two stings, kept mounted so
            the renderer can play them straight into the same canvas */}
        <video
          ref={stripVideoRef}
          src={src || undefined}
          muted
          playsInline
          preload="auto"
          className="hidden"
        />
        {intro && (
          <video ref={introRef} src={intro.url} playsInline preload="auto" className="hidden" />
        )}
        {outro && (
          <video ref={outroRef} src={outro.url} playsInline preload="auto" className="hidden" />
        )}
      </div>
    </main>
  )
}
