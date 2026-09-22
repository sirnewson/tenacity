import { useEffect, useMemo, useRef, useState } from 'react'
import StepHeader from './StepHeader'
import { useStudio } from '../StudioContext'
import { brand, videoCards } from '../brand'
import { LAYOUTS, STORY_SIZE, drawStory, layoutById } from '../storyLayouts'
import { LOOKS, QUALITY, filterFor, pickMime } from '../videoRender'

const TABS = [
  { id: 'grid', label: 'Grid', icon: 'fa-table-cells-large' },
  { id: 'style', label: 'Style', icon: 'fa-sliders' },
  { id: 'brand', label: 'Brand', icon: 'fa-layer-group' },
  { id: 'text', label: 'Text', icon: 'fa-font' },
  { id: 'share', label: 'Share', icon: 'fa-share-nodes' },
]

const BACKGROUNDS = ['#FFFFFF', '#000000', '#F5F5F4', '#111827']

/** The story side of the studio: the whole 9:16 frame, filled with a grid of
 *  product shots. A shop's showcase is several things at once, which is the one
 *  thing a single photo cannot do.
 *
 *  Same geometry drives the grid on screen and the 1080×1920 export, and the
 *  same grid can go out as a still or as a short auto-motion clip. */
export default function StoryStudioStep() {
  const s = useStudio()
  const active = s.step === 'story'

  const canvasRef = useRef(null)
  const fileRef = useRef(null)
  const cellFileRef = useRef(null)
  const targetCell = useRef(0)
  const dragFrom = useRef(null)

  const [layoutId, setLayoutId] = useState(LAYOUTS[1].id)
  const [slots, setSlots] = useState([])
  const [tab, setTab] = useState('grid')
  const [gap, setGap] = useState(0.012)
  const [radius, setRadius] = useState(0.02)
  const [background, setBackground] = useState('#FFFFFF')
  const [look, setLook] = useState('None')
  const [templateId, setTemplateId] = useState('')
  const [overlayImg, setOverlayImg] = useState(null)
  const [caption, setCaption] = useState('')
  const [captionY, setCaptionY] = useState(0.9)
  const [picked, setPicked] = useState(null)
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState(null)

  const layout = layoutById(layoutId)
  const template = videoCards.find((c) => c.id === templateId)
  const canMotion = useMemo(() => Boolean(pickMime()), [])
  const filled = slots.filter((x) => x?.img).length

  useEffect(() => {
    if (!template) {
      setOverlayImg(null)
      return
    }
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => setOverlayImg(img)
    img.src = template.bg
  }, [template?.bg]) // eslint-disable-line react-hooks/exhaustive-deps

  // ------------------------------------------------------------------ images
  const loadImage = (file) =>
    new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file)
      const img = new Image()
      img.onload = () => resolve({ img, url, zoom: 1, x: 0, y: 0 })
      img.onerror = reject
      img.src = url
    })

  /** Dropping several at once fills the empty cells in order — the fast path
   *  for "here are six products, lay them out". */
  const addFiles = async (files, startAt = null) => {
    const list = [...files].filter((f) => f.type.startsWith('image/'))
    if (!list.length) return
    const next = [...slots]
    let cursor = startAt
    for (const file of list) {
      if (cursor == null) {
        cursor = layout.cells.findIndex((_, i) => !next[i]?.img)
        if (cursor === -1) cursor = 0
      }
      if (cursor >= layout.cells.length) break
      // eslint-disable-next-line no-await-in-loop
      next[cursor] = await loadImage(file)
      cursor += 1
    }
    setSlots(next)
    setResult(null)
  }

  const clearCell = (i) => {
    const next = [...slots]
    if (next[i]?.url) URL.revokeObjectURL(next[i].url)
    next[i] = null
    setSlots(next)
    setPicked(null)
  }

  const swap = (a, b) => {
    if (a === b) return
    const next = [...slots]
    const tmp = next[a] || null
    next[a] = next[b] || null
    next[b] = tmp
    setSlots(next)
    setPicked(null)
  }

  const tapCell = (i) => {
    if (picked != null) {
      swap(picked, i)
      return
    }
    if (slots[i]?.img) {
      setPicked(i)
      return
    }
    targetCell.current = i
    cellFileRef.current?.click()
  }

  // ---------------------------------------------------------------- painting
  const paint = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const { width, height } = STORY_SIZE
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d')
    drawStory(ctx, {
      layout,
      images: slots,
      width,
      height,
      gap: gap * width,
      radius: radius * width,
      background,
      filter: filterFor(look, false),
    })
    if (overlayImg) ctx.drawImage(overlayImg, 0, 0, width, height)
    if (caption.trim()) {
      const size = Math.round(width * 0.055)
      ctx.save()
      ctx.font = `800 ${size}px Manrope, system-ui, sans-serif`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillStyle = '#ffffff'
      ctx.shadowColor = 'rgba(0,0,0,0.6)'
      ctx.shadowBlur = size * 0.6
      ctx.fillText(caption.trim(), width / 2, height * captionY)
      ctx.restore()
    }
  }

  useEffect(() => {
    if (active) paint()
  }) // every render: the canvas is the preview, so it always reflects state

  // ----------------------------------------------------------------- export
  const exportStill = () =>
    new Promise((resolve) => {
      paint()
      canvasRef.current.toBlob((blob) => resolve(blob), 'image/jpeg', 0.94)
    })

  const save = async () => {
    setBusy(true)
    try {
      const blob = await exportStill()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${brand.slug || 'story'}_${Date.now()}.jpg`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      setTimeout(() => URL.revokeObjectURL(url), 20000)
      setResult({ kind: 'image', size: blob.size })
      s.showMessage('Story saved.', false)
    } catch (err) {
      s.showMessage(err?.message || 'Could not save the story.', true)
    } finally {
      setBusy(false)
    }
  }

  /** The share sheet is the only route that hands a real file to Instagram,
   *  TikTok or WhatsApp from a browser. Where it is missing, the file is saved
   *  and the app is opened, which is the same two taps a person would do. */
  const shareTo = async (app) => {
    setBusy(true)
    try {
      const blob = await exportStill()
      const file = new File([blob], `${brand.slug || 'story'}.jpg`, { type: 'image/jpeg' })
      const text = caption.trim() || brand.share?.text || ''
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], text })
        return
      }
      await save()
      const links = {
        whatsapp: `https://wa.me/?text=${encodeURIComponent(text)}`,
        instagram: 'https://www.instagram.com/',
        facebook: 'https://www.facebook.com/',
        tiktok: 'https://www.tiktok.com/upload',
        x: `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`,
      }
      if (links[app]) window.open(links[app], '_blank', 'noopener')
      s.showMessage('Saved — attach it in the app that just opened.', false)
    } catch (err) {
      if (err?.name !== 'AbortError') s.showMessage(err?.message || 'Could not share.', true)
    } finally {
      setBusy(false)
    }
  }

  /** Auto motion: the same grid, pushed in slowly for five seconds. It is the
   *  cheapest way to make a still stop the scroll, and it reuses the canvas
   *  that is already on screen. */
  const exportMotion = async () => {
    if (!canMotion || busy) return
    setBusy(true)
    try {
      const canvas = document.createElement('canvas')
      canvas.width = STORY_SIZE.width
      canvas.height = STORY_SIZE.height
      const ctx = canvas.getContext('2d')
      const stream = canvas.captureStream(30)
      const mime = pickMime()
      const chunks = []
      const rec = new MediaRecorder(stream, {
        mimeType: mime,
        videoBitsPerSecond: QUALITY.High,
      })
      rec.ondataavailable = (e) => e.data.size && chunks.push(e.data)

      const done = new Promise((resolve) => {
        rec.onstop = () => resolve(new Blob(chunks, { type: mime }))
      })

      const DURATION = 5000
      const started = performance.now()
      rec.start(250)
      await new Promise((resolve) => {
        const frame = (now) => {
          const t = Math.min(1, (now - started) / DURATION)
          drawStory(ctx, {
            layout,
            images: slots,
            width: STORY_SIZE.width,
            height: STORY_SIZE.height,
            gap: gap * STORY_SIZE.width,
            radius: radius * STORY_SIZE.width,
            background,
            filter: filterFor(look, false),
            grow: t,
          })
          if (overlayImg) ctx.drawImage(overlayImg, 0, 0, STORY_SIZE.width, STORY_SIZE.height)
          if (t >= 1) {
            resolve()
            return
          }
          requestAnimationFrame(frame)
        }
        requestAnimationFrame(frame)
      })
      rec.stop()
      const blob = await done

      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${brand.slug || 'story'}_${Date.now()}.${mime.includes('mp4') ? 'mp4' : 'webm'}`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      setTimeout(() => URL.revokeObjectURL(url), 20000)
      s.showMessage('Motion story saved.', false)
    } catch (err) {
      s.showMessage(err?.message || 'Could not render the motion.', true)
    } finally {
      setBusy(false)
    }
  }

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
        <StepHeader title="Story Studio" />

        {/* ---- the frame ---- */}
        <div className="relative mx-auto" style={{ maxWidth: '16rem' }}>
          <canvas
            ref={canvasRef}
            className="w-full rounded-3xl border border-ink/10 bg-panel"
            style={{ aspectRatio: '9 / 16' }}
          />
          {/* the tappable grid, sitting exactly over the canvas */}
          <div className="absolute inset-0">
            {layout.cells.map((c, i) => (
              <button
                key={i}
                onClick={() => tapCell(i)}
                draggable={Boolean(slots[i]?.img)}
                onDragStart={() => {
                  dragFrom.current = i
                }}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault()
                  if (e.dataTransfer?.files?.length) addFiles(e.dataTransfer.files, i)
                  else if (dragFrom.current != null) swap(dragFrom.current, i)
                  dragFrom.current = null
                }}
                className={`absolute transition ${
                  picked === i ? 'ring-2 ring-ink' : 'hover:ring-1 hover:ring-ink/40'
                }`}
                style={{
                  left: `${c[0] * 100}%`,
                  top: `${c[1] * 100}%`,
                  width: `${c[2] * 100}%`,
                  height: `${c[3] * 100}%`,
                  borderRadius: `${radius * 100}%`,
                }}
                aria-label={slots[i]?.img ? `Cell ${i + 1}` : `Add an image to cell ${i + 1}`}
              >
                {!slots[i]?.img && (
                  <span className="w-7 h-7 rounded-full bg-ink/10 text-ink/50 flex items-center justify-center mx-auto">
                    <i className="fa-solid fa-plus text-[11px]" />
                  </span>
                )}
                {picked === i && (
                  <span className="absolute inset-x-0 bottom-1 text-[9px] font-semibold text-ink bg-surface/80 rounded-full mx-1 py-0.5">
                    Tap another to swap
                  </span>
                )}
              </button>
            ))}
          </div>
          {busy && (
            <div className="absolute inset-0 rounded-3xl bg-black/50 flex items-center justify-center">
              <i className="fa-solid fa-spinner fa-spin text-white text-xl" />
            </div>
          )}
        </div>

        <div className="flex items-center justify-center gap-3 mt-3">
          <button
            onClick={() => fileRef.current?.click()}
            className="btn-glass px-5 py-3 text-[12px] font-semibold"
          >
            <i className="fa-solid fa-images mr-1.5 text-[11px]" />
            Add photos
          </button>
          {picked != null && (
            <button
              onClick={() => clearCell(picked)}
              className="btn-glass px-5 py-3 text-[12px] font-semibold"
            >
              <i className="fa-solid fa-trash mr-1.5 text-[11px]" />
              Clear
            </button>
          )}
        </div>
        <p className="text-[11px] text-grey text-center mt-2">
          {filled}/{layout.cells.length} filled · 1080×1920
        </p>

        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => {
            addFiles(e.target.files)
            e.target.value = ''
          }}
        />
        <input
          ref={cellFileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            addFiles(e.target.files, targetCell.current)
            e.target.value = ''
          }}
        />

        {/* ---- the toolbar ---- */}
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
          {tab === 'grid' && (
            <>
              <span className="eyebrow block mb-2">Layout</span>
              <div className="grid grid-cols-4 gap-2">
                {LAYOUTS.map((l) => (
                  <button
                    key={l.id}
                    onClick={() => setLayoutId(l.id)}
                    className={`rounded-xl border p-1.5 transition ${
                      l.id === layoutId ? 'border-ink bg-ink/[0.06]' : 'border-ink/12 hover:border-ink/35'
                    }`}
                    title={l.name}
                  >
                    <span
                      className="relative block w-full rounded-md overflow-hidden bg-ink/5"
                      style={{ aspectRatio: '9 / 16' }}
                    >
                      {l.cells.map((c, i) => (
                        <span
                          key={i}
                          className="absolute bg-ink/35 rounded-[2px]"
                          style={{
                            left: `${c[0] * 100 + 3}%`,
                            top: `${c[1] * 100 + 2}%`,
                            width: `${c[2] * 100 - 6}%`,
                            height: `${c[3] * 100 - 4}%`,
                          }}
                        />
                      ))}
                    </span>
                    <span className="block text-[8.5px] text-grey mt-1 truncate">{l.name}</span>
                  </button>
                ))}
              </div>
              <p className="text-[11px] text-grey leading-relaxed mt-3">
                Tap a tile to fill it, drag one onto another to swap, or drop a folder of photos
                straight in.
              </p>
            </>
          )}

          {tab === 'style' && (
            <>
              <label className="eyebrow block mb-1">Gap</label>
              <input
                type="range"
                min="0"
                max="0.05"
                step="0.002"
                value={gap}
                onChange={(e) => setGap(Number(e.target.value))}
                className="w-full"
              />
              <label className="eyebrow block mt-3 mb-1">Corners</label>
              <input
                type="range"
                min="0"
                max="0.06"
                step="0.002"
                value={radius}
                onChange={(e) => setRadius(Number(e.target.value))}
                className="w-full"
              />
              <span className="eyebrow block mt-4 mb-2">Background</span>
              <div className="flex gap-2">
                {BACKGROUNDS.map((hex) => (
                  <button
                    key={hex}
                    onClick={() => setBackground(hex)}
                    className={`w-9 h-9 rounded-full border-2 transition ${
                      background === hex ? 'border-ink scale-110' : 'border-ink/20'
                    }`}
                    style={{ background: hex }}
                    aria-label={hex}
                  />
                ))}
                <button
                  onClick={() => setBackground(brand.colors[500])}
                  className={`w-9 h-9 rounded-full border-2 transition ${
                    background === brand.colors[500] ? 'border-ink scale-110' : 'border-ink/20'
                  }`}
                  style={{ background: brand.colors[500] }}
                  aria-label="Brand colour"
                />
              </div>
              <span className="eyebrow block mt-4 mb-2">Look</span>
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
            </>
          )}

          {tab === 'brand' && (
            <>
              <span className="eyebrow block mb-2">Overlay</span>
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
                The same 9:16 overlays the Video Studio uses — your frame, logo and contact bar.
              </p>
            </>
          )}

          {tab === 'text' && (
            <>
              <span className="eyebrow block mb-2">Text on the story</span>
              <input
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="New stock. This week."
                maxLength={60}
                className="w-full field rounded-full px-4 py-3 text-[13px] outline-none"
              />
              {caption && (
                <>
                  <label className="eyebrow block mt-3 mb-1">Position</label>
                  <input
                    type="range"
                    min="0.1"
                    max="0.94"
                    step="0.01"
                    value={captionY}
                    onChange={(e) => setCaptionY(Number(e.target.value))}
                    className="w-full"
                  />
                </>
              )}
            </>
          )}

          {tab === 'share' && (
            <>
              <span className="eyebrow block mb-2">Send it</span>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'whatsapp', label: 'WhatsApp', icon: 'fa-whatsapp', brand: true },
                  { id: 'instagram', label: 'Instagram', icon: 'fa-instagram', brand: true },
                  { id: 'facebook', label: 'Facebook', icon: 'fa-facebook', brand: true },
                  { id: 'tiktok', label: 'TikTok', icon: 'fa-tiktok', brand: true },
                ].map((a) => (
                  <button
                    key={a.id}
                    onClick={() => shareTo(a.id)}
                    disabled={!filled || busy}
                    className="btn-glass h-12 text-[12px] font-semibold flex items-center justify-center gap-2 disabled:opacity-40"
                  >
                    <i className={`fa-brands ${a.icon} text-[15px]`} />
                    {a.label}
                  </button>
                ))}
              </div>
              <button
                onClick={exportMotion}
                disabled={!filled || busy || !canMotion}
                className="btn-glass w-full h-12 mt-2 text-[12px] font-semibold flex items-center justify-center gap-2 disabled:opacity-40"
              >
                <i className="fa-solid fa-wand-magic-sparkles text-[12px]" />
                Save as a 5s motion story
              </button>
              <p className="text-[11px] text-grey leading-relaxed mt-3">
                Sharing hands the file to the phone&rsquo;s own share sheet, so it arrives in the
                app as a real photo. On a desktop browser it saves first, then opens the site.
              </p>
            </>
          )}
        </div>

        {/* ---- actions ---- */}
        <div className="flex gap-2.5 mt-4">
          <button
            onClick={save}
            disabled={!filled || busy}
            className={`flex-[2] py-4 font-semibold text-[14px] uppercase tracking-[0.08em] flex items-center justify-center gap-2.5 transition disabled:opacity-40 ${
              brand.ctaStyle === 'rainbow' ? 'btn-rainbow' : 'btn-ink'
            }`}
          >
            <i className="fa-solid fa-download text-sm" />
            Save
          </button>
          <button
            onClick={() => shareTo('whatsapp')}
            disabled={!filled || busy}
            className="btn-glass px-6 py-4 text-ink font-semibold text-[12px] flex items-center gap-2 disabled:opacity-40"
          >
            <i className="fa-solid fa-share-nodes text-xs" />
            Share
          </button>
        </div>

        {result && (
          <p className="text-[11px] text-grey text-center mt-3">
            Saved · {(result.size / 1024 / 1024).toFixed(1)} MB
          </p>
        )}
      </div>
    </main>
  )
}
