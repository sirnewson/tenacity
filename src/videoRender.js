/* Rendering a branded clip in the browser.

   The poster path composites one frame; a clip has to composite every frame and
   then encode. Two ways to do that on a phone:

     MediaRecorder  — play the trimmed section, draw each frame onto a canvas
                      with the overlay on top, and record the canvas stream.
                      Works today on Android Chrome, desktop and Safari. It is
                      real time: a 20-second clip takes 20 seconds.
     WebCodecs      — encode frame by frame, faster than real time and truer
                      quality, but needs a muxer and is not on every phone yet.

   This uses MediaRecorder, because "works on the phone in their pocket" beats
   "faster on mine". The quality knob below is the bitrate, which is what
   actually decides how the export looks. */

export const QUALITY = {
  Standard: 6_000_000,
  High: 12_000_000,
  Max: 20_000_000,
}

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

/**
 * Composite a trimmed section of a video with an overlay and encode it.
 *
 * @param {object}   o
 * @param {HTMLVideoElement} o.video     source, already loaded
 * @param {HTMLImageElement} o.overlay   template PNG, or null
 * @param {number}   o.start             seconds
 * @param {number}   o.end               seconds
 * @param {number}   o.width             export width
 * @param {number}   o.height            export height
 * @param {number}   o.bitrate
 * @param {boolean}  o.enhance           the same contrast/saturation lift the poster uses
 * @param {(p:number)=>void} o.onProgress 0..1
 * @returns {Promise<Blob>}
 */
export function renderClip({
  video,
  overlay,
  start,
  end,
  width,
  height,
  bitrate = QUALITY.High,
  enhance = true,
  onProgress = () => {},
}) {
  return new Promise((resolve, reject) => {
    const mime = pickMime()
    if (!mime) {
      reject(new Error('This browser cannot record video.'))
      return
    }

    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d')

    const stream = canvas.captureStream(30)

    // Carry the original audio through if the source has any.
    try {
      const src = video.captureStream ? video.captureStream() : video.mozCaptureStream?.()
      src?.getAudioTracks().forEach((t) => stream.addTrack(t))
    } catch {
      /* no audio track available — the clip renders silent */
    }

    const chunks = []
    const recorder = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: bitrate })
    recorder.ondataavailable = (e) => e.data.size && chunks.push(e.data)
    recorder.onerror = (e) => reject(e.error || new Error('Recording failed'))
    recorder.onstop = () => resolve(new Blob(chunks, { type: mime }))

    const duration = Math.max(0.1, end - start)
    let raf = 0

    const drawFrame = () => {
      // cover-fit the source into the export frame
      const vr = video.videoWidth / video.videoHeight
      const cr = width / height
      let dw = width
      let dh = height
      if (vr > cr) {
        dw = height * vr
      } else {
        dh = width / vr
      }
      ctx.filter = enhance ? 'contrast(1.12) saturate(1.15) brightness(1.03)' : 'none'
      ctx.drawImage(video, (width - dw) / 2, (height - dh) / 2, dw, dh)
      ctx.filter = 'none'
      if (overlay) ctx.drawImage(overlay, 0, 0, width, height)
    }

    const tick = () => {
      drawFrame()
      const done = video.currentTime - start
      onProgress(Math.min(1, Math.max(0, done / duration)))
      if (video.currentTime >= end || video.ended) {
        cancelAnimationFrame(raf)
        video.pause()
        // let the last frame land before closing the file
        setTimeout(() => recorder.state !== 'inactive' && recorder.stop(), 120)
        return
      }
      raf = requestAnimationFrame(tick)
    }

    const begin = () => {
      drawFrame() // a first frame, so the file never opens on black
      recorder.start(250)
      video.play().then(
        () => {
          raf = requestAnimationFrame(tick)
        },
        (err) => reject(err)
      )
    }

    // Seek to the in-point, then start.
    const onSeeked = () => {
      video.removeEventListener('seeked', onSeeked)
      begin()
    }
    video.addEventListener('seeked', onSeeked)
    video.currentTime = start
  })
}
