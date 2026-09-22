/* Rendering a branded clip in the browser.

   The poster path composites one frame; a clip has to composite every frame and
   then encode. Two ways to do that on a phone:

     MediaRecorder  — play the section, draw each frame onto a canvas with the
                      overlay on top, and record the canvas stream. Works today
                      on Android Chrome, desktop and Safari. It is real time: a
                      20-second clip takes 20 seconds.
     WebCodecs      — encode frame by frame, faster than real time and truer
                      quality, but needs a muxer and is not on every phone yet.

   This uses MediaRecorder, because "works on the phone in their pocket" beats
   "faster on mine". The quality knob below is the bitrate, which is what
   actually decides how the export looks.

   Because the canvas keeps recording while the source changes underneath it, an
   intro and an outro are just two more segments played into the same canvas —
   no muxing, no second pass. */

export const QUALITY = {
  Standard: 6_000_000,
  High: 12_000_000,
  Max: 20_000_000,
}

/** Social video is vertical. Everything renders 1080×1920 so a clip drops
 *  straight into a reel, a story or a status without a second crop. */
export const VIDEO_SIZE = { width: 1080, height: 1920 }

/** Colour presets. They are canvas filters, so what the preview shows is
 *  literally what gets drawn into the file. */
export const LOOKS = {
  None: '',
  Bright: 'brightness(1.12) contrast(1.06)',
  Warm: 'saturate(1.25) sepia(0.18) contrast(1.05)',
  Cool: 'saturate(1.1) hue-rotate(-12deg) brightness(1.04)',
  Mono: 'grayscale(1) contrast(1.12)',
}

const ENHANCE = 'contrast(1.12) saturate(1.15) brightness(1.03)'

/** The best container this browser will actually give us. MP4 first — it is
 *  the one that plays everywhere a client might open it. */
export function pickMime() {
  const candidates = [
    'video/mp4;codecs=avc1.42E01E,mp4a.40.2',
    'video/mp4;codecs=avc1',
    'video/mp4',
    'video/webm;codecs=vp9,opus',
    'video/webm;codecs=vp8,opus',
    'video/webm',
  ]
  if (typeof MediaRecorder === 'undefined') return null
  return candidates.find((t) => MediaRecorder.isTypeSupported(t)) || null
}

export const extensionFor = (mime = '') => (mime.includes('mp4') ? 'mp4' : 'webm')

/** The filter string for a given look, with the magic-edit lift folded in.
 *  Shared by the live preview and the renderer so the two cannot drift. */
export function filterFor(look = 'None', enhance = true) {
  const parts = [enhance ? ENHANCE : '', LOOKS[look] || ''].filter(Boolean)
  return parts.length ? parts.join(' ') : 'none'
}

/** Cover-fit the source into the export frame, then apply the reframe. `zoom`
 *  is 1 = fill; `x` and `y` are -1..1 across whatever the crop spills over, so
 *  a 16:9 clip can be panned to the part of the shot that matters. */
export function frameRect({ videoW, videoH, width, height, zoom = 1, x = 0, y = 0 }) {
  const vr = (videoW || 16) / (videoH || 9)
  const cr = width / height
  let dw = width
  let dh = height
  if (vr > cr) dw = height * vr
  else dh = width / vr
  dw *= zoom
  dh *= zoom
  const overX = Math.max(0, dw - width)
  const overY = Math.max(0, dh - height)
  return {
    dx: (width - dw) / 2 + (x * overX) / 2,
    dy: (height - dh) / 2 + (y * overY) / 2,
    dw,
    dh,
  }
}

/** Caption burned into the clip. Wraps to two lines, scales with the frame and
 *  carries a shadow so it holds over any footage. */
export function drawCaption(ctx, text, { width, height, size = 0.06, y = 0.86 }) {
  const value = String(text || '').trim()
  if (!value) return
  const fontSize = Math.round(width * size)
  ctx.save()
  ctx.font = `800 ${fontSize}px Manrope, system-ui, sans-serif`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillStyle = '#ffffff'
  ctx.shadowColor = 'rgba(0,0,0,0.65)'
  ctx.shadowBlur = fontSize * 0.5
  ctx.shadowOffsetY = fontSize * 0.08

  const maxWidth = width * 0.86
  const words = value.split(/\s+/)
  const lines = []
  let line = ''
  for (const w of words) {
    const next = line ? `${line} ${w}` : w
    if (ctx.measureText(next).width > maxWidth && line) {
      lines.push(line)
      line = w
    } else {
      line = next
    }
    if (lines.length === 2) break
  }
  if (line && lines.length < 2) lines.push(line)

  const lineHeight = fontSize * 1.15
  const top = height * y - ((lines.length - 1) * lineHeight) / 2
  lines.forEach((l, i) => ctx.fillText(l, width / 2, top + i * lineHeight))
  ctx.restore()
}

/** One shared audio graph for the whole render. Every element is wired into the
 *  same destination and nothing is wired to the speakers, so the export keeps
 *  the sound while the room stays quiet. An element can only ever have one
 *  source node, so they are cached per element. */
const SOURCES = new WeakMap()

function buildAudio(elements) {
  const Ctx = window.AudioContext || window.webkitAudioContext
  if (!Ctx || !elements.length) return null
  try {
    const ac = new Ctx()
    const dest = ac.createMediaStreamDestination()
    elements.forEach((el) => {
      let node = SOURCES.get(el)
      if (!node) {
        node = ac.createMediaElementSource(el)
        SOURCES.set(el, node)
      }
      node.connect(dest)
      el.muted = false // the graph is not connected to the speakers
    })
    if (ac.state === 'suspended') ac.resume()
    return { ac, dest }
  } catch {
    return null // no audio is better than no render
  }
}

/**
 * Composite a sequence of segments into one branded 9:16 clip and encode it.
 *
 * @param {object} o
 * @param {Array}  o.segments  in play order. Each is
 *        { video, start, end, overlay?: boolean, look?, frame?, caption?, captionY? }
 *        — `overlay: false` leaves a logo sting alone, since it is already branded.
 * @param {HTMLImageElement} o.overlay  the template PNG, or null
 * @param {number} o.width  @param {number} o.height  export size
 * @param {number} o.bitrate
 * @param {boolean} o.enhance  the same contrast/saturation lift the poster uses
 * @param {boolean} o.muted    drop all audio
 * @param {(p:number)=>void} o.onProgress 0..1 across the whole sequence
 * @returns {Promise<Blob>}
 */
export function renderClip({
  segments = [],
  overlay,
  width = VIDEO_SIZE.width,
  height = VIDEO_SIZE.height,
  bitrate = QUALITY.High,
  enhance = true,
  muted = false,
  onProgress = () => {},
}) {
  return new Promise((resolve, reject) => {
    const mime = pickMime()
    if (!mime) {
      reject(new Error('This browser cannot record video.'))
      return
    }
    const list = segments.filter((s) => s?.video && s.end > s.start)
    if (!list.length) {
      reject(new Error('Nothing to render.'))
      return
    }

    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d')
    const stream = canvas.captureStream(30)

    const audio = muted ? null : buildAudio(list.map((s) => s.video))
    audio?.dest.stream.getAudioTracks().forEach((t) => stream.addTrack(t))

    const chunks = []
    const recorder = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: bitrate })
    recorder.ondataavailable = (e) => e.data.size && chunks.push(e.data)
    recorder.onerror = (e) => reject(e.error || new Error('Recording failed'))
    recorder.onstop = () => {
      audio?.ac.close().catch(() => {})
      resolve(new Blob(chunks, { type: mime }))
    }

    const lengths = list.map((s) => Math.max(0.1, s.end - s.start))
    const total = lengths.reduce((a, b) => a + b, 0)
    let index = 0
    let elapsed = 0
    let raf = 0

    const drawFrame = (seg) => {
      const v = seg.video
      const { dx, dy, dw, dh } = frameRect({
        videoW: v.videoWidth,
        videoH: v.videoHeight,
        width,
        height,
        ...(seg.frame || {}),
      })
      ctx.fillStyle = '#000000'
      ctx.fillRect(0, 0, width, height) // a letterboxed edge is black, not stale pixels
      ctx.filter = filterFor(seg.look || 'None', seg.enhance ?? enhance)
      ctx.drawImage(v, dx, dy, dw, dh)
      ctx.filter = 'none'
      if (overlay && seg.overlay !== false) ctx.drawImage(overlay, 0, 0, width, height)
      drawCaption(ctx, seg.caption, { width, height, y: seg.captionY ?? 0.86 })
    }

    const finish = () => {
      cancelAnimationFrame(raf)
      list.forEach((s) => s.video.pause())
      // let the last frame land before closing the file
      setTimeout(() => recorder.state !== 'inactive' && recorder.stop(), 150)
    }

    const tick = () => {
      const seg = list[index]
      drawFrame(seg)
      const done = Math.min(lengths[index], Math.max(0, seg.video.currentTime - seg.start))
      onProgress(Math.min(1, (elapsed + done) / total))
      if (seg.video.currentTime >= seg.end || seg.video.ended) {
        seg.video.pause()
        elapsed += lengths[index]
        index += 1
        if (index >= list.length) {
          finish()
          return
        }
        play(list[index])
        return
      }
      raf = requestAnimationFrame(tick)
    }

    const play = (seg) => {
      const onSeeked = () => {
        seg.video.removeEventListener('seeked', onSeeked)
        drawFrame(seg) // so the cut never shows a stale frame
        seg.video.play().then(
          () => {
            raf = requestAnimationFrame(tick)
          },
          (err) => reject(err)
        )
      }
      seg.video.addEventListener('seeked', onSeeked)
      seg.video.currentTime = seg.start
    }

    const first = list[0]
    const begin = () => {
      first.video.removeEventListener('seeked', begin)
      drawFrame(first) // a first frame, so the file never opens on black
      recorder.start(250)
      first.video.play().then(
        () => {
          raf = requestAnimationFrame(tick)
        },
        (err) => reject(err)
      )
    }
    first.video.addEventListener('seeked', begin)
    first.video.currentTime = first.start
  })
}
