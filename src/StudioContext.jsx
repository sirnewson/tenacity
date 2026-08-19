import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react'
import {
  brand,
  defaultTagStyle,
  describeAspect,
  formats,
  selectCards,
  tagStyles,
} from './brand'
import { TAG, detailLineCount, priceScale, titleScale } from './tagLayout'
import { QR_CORNERS, QR_SIZES, makeQr } from './qr'
import JSZip from 'jszip'
import { pickSaveStrategy } from './platform'

const StudioContext = createContext(null)
export const useStudio = () => useContext(StudioContext)

/** Break text to fit `maxWidth` using the context's current font. Canvas has no
 *  word wrap, so the export has to reproduce what CSS does in the live card —
 *  including character-level breaks for unbroken strings. */
function wrapText(ctx, text, maxWidth, maxLines = Infinity) {
  const lines = []
  ;(text || '').split('\n').forEach((paragraph) => {
    let line = ''
    const tokens = paragraph.match(/\S+\s*/g) || ['']
    tokens.forEach((token) => {
      const candidate = line + token
      if (line && ctx.measureText(candidate).width > maxWidth) {
        lines.push(line.trimEnd())
        line = token
      } else {
        line = candidate
      }
      while (ctx.measureText(line).width > maxWidth) {
        let cut = line.length - 1
        while (cut > 1 && ctx.measureText(line.slice(0, cut)).width > maxWidth) cut -= 1
        lines.push(line.slice(0, cut))
        line = line.slice(cut)
      }
    })
    if (line || !paragraph) lines.push(line.trimEnd())
  })
  return lines.slice(0, maxLines)
}

/** Load an image and resolve once it is actually decodable. Resolves to null
 *  instead of rejecting so a missing asset can never strand the save button. */
function loadImage(src) {
  return new Promise((resolve) => {
    if (!src) return resolve(null)
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = () => resolve(null)
    img.src = src
  })
}

export function StudioProvider({ children }) {
  // Suite builds open on the app hub; otherwise the walkthrough or the picker.
  const [step, setStep] = useState(
    brand.suite?.enabled ? 'hub' : brand.demoMode ? 'home' : 'select'
  )
  const [activeApp, setActiveApp] = useState(null)
  // Settings mutates the shared brand object; this forces the tree to re-read it.
  const [brandVersion, setBrandVersion] = useState(0)
  // Overlays the visitor uploaded during this session (never persisted).
  const [customTemplates, setCustomTemplates] = useState([])
  const [overlayModalOpen, setOverlayModalOpen] = useState(false)
  // Scannable badge burned into the poster — WhatsApp order, till, or a link.
  const [qr, setQr] = useState({
    on: false,
    value: '',
    label: brand.qr?.caption || 'SCAN ME',
    corner: 'bottom-right',
    size: 'M',
  })
  const [qrModalOpen, setQrModalOpen] = useState(false)
  // Batch: shoot a run of products, review them together, export in one file.
  const [batchMode, setBatchMode] = useState(false)
  const [batch, setBatch] = useState([])
  const [batchBusy, setBatchBusy] = useState(false)

  const qrImgRef = useRef(null)
  const [format, setFormat] = useState(null)
  const [mode, setMode] = useState('camera') // 'camera' | 'upload'
  const [autoEnhance, setAutoEnhance] = useState(true)
  const [specsModel, setSpecsModel] = useState('')
  const [specsDetails, setSpecsDetails] = useState('')
  const [specsPrice, setSpecsPrice] = useState('')
  const [hasSpecs, setHasSpecs] = useState(false)
  const [tagStyle, setTagStyle] = useState(defaultTagStyle)
  const [cameraAvailable, setCameraAvailable] = useState(true)
  const [specsModalOpen, setSpecsModalOpen] = useState(false)
  const [captureSize, setCaptureSize] = useState({ w: 0, h: 0 })
  const [zoom, setZoom] = useState(1)
  const [resultReady, setResultReady] = useState(false)
  const [resultTitle, setResultTitle] = useState('PROCESSING...')
  const [alert, setAlert] = useState({ msg: '', isError: true, visible: false })

  const tagUrl = (tagStyles[tagStyle] || Object.values(tagStyles)[0]).url

  // ---- Mutable refs ----
  const streamRef = useRef(null)
  const facingModeRef = useRef('environment')
  const capturedRef = useRef(null)
  const finalRef = useRef(null)
  const mergeJobRef = useRef(null)
  const overlayImgObjRef = useRef(null)
  const tagOverlayImgRef = useRef(null)
  const transformRef = useRef({
    scale: 1,
    x: 0,
    y: 0,
    isDragging: false,
    startX: 0,
    startY: 0,
    baseW: 0,
    baseH: 0,
  })
  const cardStateRef = useRef({ scale: 1 })
  const specMetricsRef = useRef(null)
  const revealTimersRef = useRef([])
  const alertTimerRef = useRef(null)

  // ---- DOM refs ----
  const refs = {
    video: useRef(null),
    captureArea: useRef(null),
    viewfinderWrapper: useRef(null),
    transformContainer: useRef(null),
    uploadPreview: useRef(null),
    ghostOverlay: useRef(null),
    draggableBox: useRef(null),
    cardBg: useRef(null),
    displayModel: useRef(null),
    displayDetails: useRef(null),
    displayPrice: useRef(null),
    revealArea: useRef(null),
    baseImage: useRef(null),
    overlayImg: useRef(null),
    statusText: useRef(null),
    particles: useRef(null),
    fileInput: useRef(null),
  }

  // ---------- Alerts ----------
  const showMessage = useCallback((msg, isError = true) => {
    clearTimeout(alertTimerRef.current)
    setAlert({ msg, isError, visible: true })
    alertTimerRef.current = setTimeout(() => {
      setAlert((a) => ({ ...a, visible: false }))
    }, 3000)
  }, [])

  // ---------- Camera ----------
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop())
      streamRef.current = null
    }
    if (refs.video.current) refs.video.current.srcObject = null
  }, [refs.video])

  const setupStream = useCallback(() => {
    const v = refs.video.current
    if (!v) return
    v.srcObject = streamRef.current
    v.style.display = 'block'
    setCameraAvailable(true)
    setMode('camera')
  }, [refs.video])

  const initCamera = useCallback(async () => {
    stopCamera()
    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraAvailable(false)
      return
    }
    try {
      streamRef.current = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: facingModeRef.current },
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false,
      })
      setupStream()
    } catch {
      try {
        streamRef.current = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false,
        })
        setupStream()
      } catch {
        setCameraAvailable(false)
      }
    }
  }, [stopCamera, setupStream])

  const flipCamera = useCallback(() => {
    facingModeRef.current =
      facingModeRef.current === 'user' ? 'environment' : 'user'
    initCamera()
  }, [initCamera])

  // ---------- Capture area sizing ----------
  // The frame must EXACTLY match the overlay aspect (4:5 / 9:16). We fit
  // inside both the wrapper AND the 28rem (448px) cap, then derive height
  // from the final width so nothing gets letterboxed or cropped.
  const setupCaptureArea = useCallback(
    (fmt = format) => {
      if (!fmt) return
      const wrapper = refs.viewfinderWrapper.current
      if (!wrapper) return
      const MAX_W = 448 // 28rem
      const maxWidth = Math.min(wrapper.clientWidth - 16, MAX_W)
      const maxHeight = wrapper.clientHeight - 16
      let w = maxWidth
      let h = w / fmt.aspectRatio
      if (h > maxHeight) {
        h = maxHeight
        w = h * fmt.aspectRatio
      }
      setCaptureSize({ w: Math.round(w), h: Math.round(h) })
    },
    [format, refs.viewfinderWrapper]
  )

  useEffect(() => {
    if (step !== 'camera') return
    const id = setTimeout(() => setupCaptureArea(), 60)
    const onResize = () => setupCaptureArea()
    window.addEventListener('resize', onResize)
    return () => {
      clearTimeout(id)
      window.removeEventListener('resize', onResize)
    }
  }, [step, setupCaptureArea])

  // ---------- Overlay preload ----------
  const preloadOverlay = useCallback(
    (url) => {
      const img = new Image()
      img.crossOrigin = 'anonymous'
      img.onload = () => {
        overlayImgObjRef.current = img
        if (refs.overlayImg.current) refs.overlayImg.current.src = url
        if (refs.ghostOverlay.current) refs.ghostOverlay.current.src = url
      }
      img.src = url
    },
    [refs.overlayImg, refs.ghostOverlay]
  )

  const qrDataUrl = qr.on ? makeQr(qr.value) : null

  // Keep a decoded copy for the canvas export.
  useEffect(() => {
    if (!qrDataUrl) {
      qrImgRef.current = null
      return
    }
    const img = new Image()
    img.onload = () => {
      qrImgRef.current = img
    }
    img.src = qrDataUrl
  }, [qrDataUrl])

  // Keep the canvas copy of the price plate in sync with the chosen style.
  useEffect(() => {
    const image = new Image()
    image.onload = () => {
      tagOverlayImgRef.current = image
    }
    image.src = tagUrl
  }, [tagUrl])

  // ---------- Templates (built-in + uploaded) ----------
  // Uploaded overlays are first-class templates: they export at their own
  // pixel size, so any aspect a designer hands over just works.
  const allFormats = { ...formats, ...Object.fromEntries(customTemplates.map((t) => [t.id, t])) }
  const allCards = [...selectCards, ...customTemplates.map((t) => t.card)]

  // Where the upload modal was opened from decides where a new overlay lands.
  const overlayModalFromRef = useRef('select')
  const openOverlayModal = useCallback(() => {
    overlayModalFromRef.current = step
    setOverlayModalOpen(true)
  }, [step])
  const closeOverlayModal = useCallback(() => setOverlayModalOpen(false), [])

  /** Turn an uploaded image file into a session template. */
  const addOverlay = useCallback(
    (file) =>
      new Promise((resolve) => {
        if (!file) return resolve(null)
        if (!file.type.startsWith('image/')) {
          showMessage('That is not an image file.', true)
          return resolve(null)
        }
        const reader = new FileReader()
        reader.onerror = () => {
          showMessage('Could not read that file.', true)
          resolve(null)
        }
        reader.onload = (ev) => {
          const dataUrl = ev.target.result
          const img = new Image()
          img.onerror = () => {
            showMessage('Could not open that image.', true)
            resolve(null)
          }
          img.onload = () => {
            const { naturalWidth: w, naturalHeight: h } = img
            if (w < 500 || h < 500) {
              showMessage(`Too small (${w}×${h}). Use at least 1080px wide.`, true)
              return resolve(null)
            }
            const name = file.name.replace(/\.[^.]+$/, '').slice(0, 22) || 'My overlay'
            const id = `custom-${Date.now()}`
            const template = {
              id,
              name,
              overlayUrl: dataUrl,
              width: w,
              height: h,
              aspectRatio: w / h,
              custom: true,
              card: {
                id,
                icon: 'fa-cloud-arrow-up',
                iconColor: 'text-brand-300',
                title: name,
                sub: describeAspect(w, h),
                bg: dataUrl,
                delay: 'delay-100',
                custom: true,
              },
            }
            setCustomTemplates((list) => [...list, template])
            setOverlayModalOpen(false)
            if (file.type !== 'image/png') {
              showMessage('Added — but a JPG has no transparency, so it will hide the photo.', true)
            } else {
              showMessage(`Added "${name}" (${w}×${h}). Tap it to start.`, false)
            }
            resolve(template)
          }
          img.src = dataUrl
        }
        reader.readAsDataURL(file)
      }),
    [showMessage]
  )

  const removeOverlay = useCallback((id) => {
    setCustomTemplates((list) => list.filter((t) => t.id !== id))
  }, [])

  // ---------- Step switching ----------
  const switchStep = useCallback(
    (target) => {
      if (target !== 'camera') stopCamera()
      setStep(target)
    },
    [stopCamera]
  )

  const goHome = useCallback(() => {
    stopCamera()
    setStep(brand.suite?.enabled ? 'hub' : 'home')
  }, [stopCamera])

  // ---------- Bundled apps ----------
  const reloadBrand = useCallback(() => setBrandVersion((v) => v + 1), [])

  const openApp = useCallback(
    (id) => {
      stopCamera()
      setActiveApp(id)
      setStep('app')
    },
    [stopCamera]
  )
  const closeApp = useCallback(() => {
    setActiveApp(null)
    setStep('hub')
  }, [])

  // Accepts an id or a format object — a freshly uploaded overlay is passed
  // directly, since it is not in `allFormats` until the next render.
  const resolveFormat = (idOrFmt) =>
    typeof idOrFmt === 'string' ? allFormats[idOrFmt] : idOrFmt

  const selectFormat = useCallback(
    (idOrFmt) => {
      const fmt = resolveFormat(idOrFmt)
      if (!fmt) return
      setFormat(fmt)
      preloadOverlay(fmt.overlayUrl)
      setStep('camera')
      resetToCameraState()
      setTimeout(() => {
        setupCaptureArea(fmt)
        initCamera()
      }, 80)
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [allFormats, preloadOverlay, setupCaptureArea, initCamera]
  )

  const changeFormat = useCallback(
    (idOrFmt) => {
      const fmt = resolveFormat(idOrFmt)
      if (!fmt || fmt.id === format?.id) return
      setFormat(fmt)
      preloadOverlay(fmt.overlayUrl)
      setTimeout(() => setupCaptureArea(fmt), 0)
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [allFormats, format?.id, preloadOverlay, setupCaptureArea]
  )

  /** Upload an overlay and put it to work: swap it in if we are already in the
   *  editor, otherwise open the studio with it selected. */
  const addOverlayAndUse = useCallback(
    async (file) => {
      const template = await addOverlay(file)
      if (!template) return null
      if (overlayModalFromRef.current === 'camera') changeFormat(template)
      else selectFormat(template)
      return template
    },
    [addOverlay, changeFormat, selectFormat]
  )

  // ---------- Enhance toggle ----------
  const toggleEnhance = useCallback(() => setAutoEnhance((v) => !v), [])

  // ---------- Upload handling ----------
  const applyUpload = useCallback(
    (dataUrl) => {
      const previewImg = refs.uploadPreview.current
      const area = refs.captureArea.current
      if (!previewImg || !area) return
      previewImg.onload = () => {
        const cw = area.clientWidth
        const ch = area.clientHeight
        const iw = previewImg.naturalWidth
        const ih = previewImg.naturalHeight
        const ratio = Math.max(cw / iw, ch / ih)
        const t = transformRef.current
        t.baseW = iw * ratio
        t.baseH = ih * ratio
        previewImg.style.width = `${t.baseW}px`
        previewImg.style.height = `${t.baseH}px`
        previewImg.style.left = `${(cw - t.baseW) / 2}px`
        previewImg.style.top = `${(ch - t.baseH) / 2}px`
        t.scale = 1
        t.x = 0
        t.y = 0
        setZoom(1)
        previewImg.style.transform = `translate(0px, 0px) scale(1)`
        setMode('upload')
        setCameraAvailable(true)
      }
      previewImg.src = dataUrl
      stopCamera()
    },
    [refs.uploadPreview, refs.captureArea, stopCamera]
  )

  const handleFileUpload = useCallback(
    (file) => {
      const reader = new FileReader()
      reader.onload = (ev) => applyUpload(ev.target.result)
      reader.readAsDataURL(file)
    },
    [applyUpload]
  )

  const updateTransform = useCallback(() => {
    const t = transformRef.current
    const el = refs.uploadPreview.current
    if (el) el.style.transform = `translate(${t.x}px, ${t.y}px) scale(${t.scale})`
  }, [refs.uploadPreview])

  const onZoom = useCallback(
    (value) => {
      transformRef.current.scale = parseFloat(value)
      setZoom(parseFloat(value))
      updateTransform()
    },
    [updateTransform]
  )

  // Photo drag handlers (upload mode)
  const photoPointerDown = useCallback(
    (e) => {
      if (mode !== 'upload') return
      const t = transformRef.current
      t.isDragging = true
      t.startX = e.clientX - t.x
      t.startY = e.clientY - t.y
      refs.transformContainer.current?.setPointerCapture(e.pointerId)
    },
    [mode, refs.transformContainer]
  )
  const photoPointerMove = useCallback(
    (e) => {
      const t = transformRef.current
      if (!t.isDragging) return
      t.x = e.clientX - t.startX
      t.y = e.clientY - t.startY
      updateTransform()
    },
    [updateTransform]
  )
  const photoPointerUp = useCallback(() => {
    transformRef.current.isDragging = false
  }, [])

  // ---------- Draggable specs card ----------
  const dragCardRef = useRef({
    dragging: false,
    startX: 0,
    startY: 0,
    elemX: 0,
    elemY: 0,
    distance: 0,
  })

  const cardPointerDown = useCallback((e) => {
    const box = e.currentTarget
    const d = dragCardRef.current
    d.dragging = true
    d.distance = 0
    d.startX = e.clientX
    d.startY = e.clientY
    // Use raw element position if it hasn't been set by snapping yet
    d.elemX = parseFloat(box.style.left) || box.offsetLeft
    d.elemY = parseFloat(box.style.top) || box.offsetTop

    const guides = document.getElementById('alignment-guides')
    if (guides) guides.style.opacity = '1'

    box.setPointerCapture(e.pointerId)
    e.stopPropagation()
  }, [])

  const cardPointerMove = useCallback(
    (e) => {
      const d = dragCardRef.current
      if (!d.dragging) return
      const box = refs.draggableBox.current
      const area = refs.captureArea.current
      if (!box || !area) return
      const dx = e.clientX - d.startX
      const dy = e.clientY - d.startY
      d.distance += Math.abs(dx) + Math.abs(dy)

      let rawX = d.elemX + dx
      let rawY = d.elemY + dy

      const boundsW = area.clientWidth
      const boundsH = area.clientHeight
      const scale = cardStateRef.current.scale || 1
      const tagW = box.offsetWidth * scale
      const tagH = box.offsetHeight * scale

      let snapX = rawX
      let snapY = rawY

      const tagCenterX = rawX + tagW / 2
      const tagCenterY = rawY + tagH / 2
      const screenCenterX = boundsW / 2
      const screenCenterY = boundsH / 2
      const snapThreshold = 16

      if (Math.abs(tagCenterX - screenCenterX) < snapThreshold) snapX = screenCenterX - tagW / 2
      if (Math.abs(tagCenterY - screenCenterY) < snapThreshold) snapY = screenCenterY - tagH / 2

      snapX = Math.max(-50, Math.min(snapX, boundsW - 100))
      snapY = Math.max(0, Math.min(snapY, boundsH - 50))

      box.style.left = `${snapX}px`
      box.style.top = `${snapY}px`

      d.startX = e.clientX
      d.startY = e.clientY
      d.elemX = rawX
      d.elemY = rawY

      e.stopPropagation()
    },
    [refs.draggableBox, refs.captureArea]
  )

  const cardPointerUp = useCallback(() => {
    const d = dragCardRef.current
    d.dragging = false

    const guides = document.getElementById('alignment-guides')
    if (guides) guides.style.opacity = '0'

    if (d.distance < 10) setSpecsModalOpen(true)
  }, [])

  // ---- Corner resize handles (scale the card, top-left anchored) ----
  const resizeRef = useRef({ active: false, originX: 0, originY: 0, startDist: 0, startScale: 1 })

  const cardResizeDown = useCallback(
    (e) => {
      const box = refs.draggableBox.current
      if (!box) return
      const rect = box.getBoundingClientRect() // transform-origin is top-left
      const r = resizeRef.current
      r.active = true
      r.originX = rect.left
      r.originY = rect.top
      r.startDist = Math.hypot(e.clientX - rect.left, e.clientY - rect.top) || 1
      r.startScale = cardStateRef.current.scale || 1
      e.currentTarget.setPointerCapture(e.pointerId)
      e.stopPropagation()
      e.preventDefault()
    },
    [refs.draggableBox]
  )

  const cardResizeMove = useCallback(
    (e) => {
      const r = resizeRef.current
      if (!r.active) return
      const box = refs.draggableBox.current
      if (!box) return
      const dist = Math.hypot(e.clientX - r.originX, e.clientY - r.originY)
      let scale = r.startScale * (dist / r.startDist)
      scale = Math.max(0.4, Math.min(2, scale))
      cardStateRef.current.scale = scale
      box.style.transform = `scale(${scale})`
      e.stopPropagation()
    },
    [refs.draggableBox]
  )

  const cardResizeUp = useCallback((e) => {
    resizeRef.current.active = false
    e.stopPropagation()
  }, [])

  // Center the card in the capture area (default placement, above middle)
  const centerCard = useCallback(() => {
    const box = refs.draggableBox.current
    const area = refs.captureArea.current
    if (!box || !area) return
    // Ensure measurable
    box.style.left = '0px'
    box.style.top = '0px'
    requestAnimationFrame(() => {
      const bw = box.offsetWidth
      const bh = box.offsetHeight
      const cw = area.clientWidth
      const ch = area.clientHeight
      const left = Math.max(8, (cw - bw) / 2)
      const top = Math.max(8, ch * 0.42 - bh / 2)
      box.style.left = `${left}px`
      box.style.top = `${top}px`
    })
  }, [refs.draggableBox, refs.captureArea])

  // ---------- Specs modal ----------
  const openSpecsModal = useCallback(() => setSpecsModalOpen(true), [])
  const closeSpecsModal = useCallback(() => setSpecsModalOpen(false), [])

  const applySpecs = useCallback(
    (model, details, price, scale) => {
      const m = (model || '').trim()
      if (!m) {
        setSpecsModel('')
        setSpecsDetails('')
        setSpecsPrice('')
        setHasSpecs(false)
        setSpecsModalOpen(false)
        return
      }
      cardStateRef.current.scale = parseFloat(scale) || 1
      setSpecsModel(m)
      setSpecsDetails(details || '')
      setSpecsPrice(price || '')
      if (refs.displayModel.current) refs.displayModel.current.innerText = m
      if (refs.displayDetails.current) refs.displayDetails.current.innerText = details || ''
      if (refs.displayPrice.current) refs.displayPrice.current.innerText = price || ''
      const box = refs.draggableBox.current
      if (box) box.style.transform = `scale(${cardStateRef.current.scale})`
      const wasHidden = !hasSpecs
      setHasSpecs(true)
      setSpecsModalOpen(false)
      // center on first placement
      setTimeout(() => {
        if (wasHidden) centerCard()
      }, 30)
      showMessage('Tag added! Drag it to position, or tap it to edit.', false)
    },
    [
      hasSpecs,
      refs.displayModel,
      refs.displayDetails,
      refs.displayPrice,
      refs.draggableBox,
      centerCard,
      showMessage,
    ]
  )

  const clearSpecs = useCallback(() => {
    setSpecsModel('')
    setSpecsDetails('')
    setSpecsPrice('')
    cardStateRef.current.scale = 1
    setHasSpecs(false)
    setSpecsModalOpen(false)
  }, [])

  // ---------- Reset ----------
  function resetToCameraState() {
    setMode('camera')
    transformRef.current = {
      scale: 1,
      x: 0,
      y: 0,
      isDragging: false,
      startX: 0,
      startY: 0,
      baseW: 0,
      baseH: 0,
    }
    setZoom(1)
  }

  const resetToCamera = useCallback(() => {
    if (refs.fileInput.current) refs.fileInput.current.value = ''
    if (refs.uploadPreview.current) refs.uploadPreview.current.src = ''
    resetToCameraState()
    setCameraAvailable(true)
    initCamera()
  }, [initCamera, refs.fileInput, refs.uploadPreview])

  // ---------- Capture ----------
  // Plain functions (recreated each render) so they always read fresh
  // state such as autoEnhance / hasSpecs — the reveal chain must not
  // close over stale values.
  function captureFromVideo() {
    const video = refs.video.current
    const canvas = document.createElement('canvas')
    canvas.width = format.width
    canvas.height = format.height
    const ctx = canvas.getContext('2d')
    const videoRatio = video.videoWidth / video.videoHeight
    const targetRatio = canvas.width / canvas.height
    let drawW = canvas.width
    let drawH = canvas.height
    let offsetX = 0
    let offsetY = 0
    if (videoRatio > targetRatio) {
      drawW = canvas.height * videoRatio
      offsetX = (canvas.width - drawW) / 2
    } else {
      drawH = canvas.width / videoRatio
      offsetY = (canvas.height - drawH) / 2
    }
    if (facingModeRef.current === 'user') {
      ctx.translate(canvas.width, 0)
      ctx.scale(-1, 1)
    }
    ctx.drawImage(video, offsetX, offsetY, drawW, drawH)
    ctx.setTransform(1, 0, 0, 1, 0, 0)
    capturedRef.current = canvas.toDataURL('image/jpeg', 0.9)
    finishCapture()
  }

  function captureFromUpload() {
    const img = refs.uploadPreview.current
    const area = refs.captureArea.current
    const canvas = document.createElement('canvas')
    canvas.width = format.width
    canvas.height = format.height
    const ctx = canvas.getContext('2d')
    const cw = area.clientWidth
    const t = transformRef.current
    const renderScale = canvas.width / cw
    const drawW = t.baseW * t.scale * renderScale
    const drawH = t.baseH * t.scale * renderScale
    const baseOffsetX = (cw - t.baseW) / 2
    const baseOffsetY = (area.clientHeight - t.baseH) / 2
    const scaledOffsetX = (t.baseW - t.baseW * t.scale) / 2
    const scaledOffsetY = (t.baseH - t.baseH * t.scale) / 2
    const finalX = (baseOffsetX + t.x + scaledOffsetX) * renderScale
    const finalY = (baseOffsetY + t.y + scaledOffsetY) * renderScale
    ctx.drawImage(img, finalX, finalY, drawW, drawH)
    capturedRef.current = canvas.toDataURL('image/jpeg', 0.9)
    finishCapture()
  }

  /** Batch capture: render silently, add to the tray, stay on the viewfinder
   *  with the tag exactly where it is — the next product is usually the same
   *  shot with a different name and price. */
  async function captureForBatch() {
    snapshotSpecMetrics()
    setBatchBusy(true)
    try {
      const url = await mergeFinalPoster()
      if (!url) {
        showMessage('Could not render that one — try again.', true)
        return
      }
      const item = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        url,
        product: specsModel,
        details: specsDetails,
        price: specsPrice,
        template: format?.name || '',
      }
      setBatch((b) => {
        showMessage(`Added — ${b.length + 1} in the batch.`, false)
        return [...b, item]
      })
    } finally {
      setBatchBusy(false)
    }
  }

  // Where a capture goes once the photo is in capturedRef.
  function finishCapture() {
    if (batchMode) captureForBatch()
    else startMagicReveal()
  }

  function handleMainAction() {
    if (mode === 'camera') captureFromVideo()
    else captureFromUpload()
  }

  const animateStatusText = useCallback(
    (text) => {
      const el = refs.statusText.current
      if (!el) return
      el.innerText = text
      el.classList.remove('active')
      el.style.opacity = '1'
      setTimeout(() => el.classList.add('active'), 40)
    },
    [refs.statusText]
  )

  // ---------- Merge final poster ----------
  // Returns a promise so Save/Share can await an in-flight render instead of
  // silently doing nothing. Every exit path settles `finalRef`.
  function mergeFinalPoster(enhance = autoEnhance) {
    const job = (async () => {
      const canvas = document.createElement('canvas')
      canvas.width = format.width
      canvas.height = format.height
      const ctx = canvas.getContext('2d')

      // Re-fetch anything that hasn't finished preloading yet, so a slow
      // network can't leave us without an overlay or tag plate.
      const [baseImg, overlayImg, tagOverlay] = await Promise.all([
        loadImage(capturedRef.current),
        overlayImgObjRef.current || loadImage(format.overlayUrl),
        hasSpecs ? tagOverlayImgRef.current || loadImage(tagUrl) : null,
      ])
      if (!overlayImgObjRef.current && overlayImg) overlayImgObjRef.current = overlayImg
      if (hasSpecs && !tagOverlayImgRef.current && tagOverlay) tagOverlayImgRef.current = tagOverlay

      if (!baseImg) {
        finalRef.current = capturedRef.current
        return finalRef.current
      }

      ctx.filter = enhance
        ? 'contrast(1.2) saturate(1.2) brightness(1.05)'
        : 'none'
      ctx.drawImage(baseImg, 0, 0, canvas.width, canvas.height)
      ctx.filter = 'none'
      try {
        if (overlayImg) ctx.drawImage(overlayImg, 0, 0, canvas.width, canvas.height)
        if (hasSpecs && tagOverlay && specMetricsRef.current) {
          const sm = specMetricsRef.current
          const baseUiScale = canvas.width / sm.containerW
          const finalScale = baseUiScale * cardStateRef.current.scale
          const x = sm.leftOffset * baseUiScale
          const y = sm.topOffset * baseUiScale
          const model = refs.displayModel.current?.innerText || specsModel
          const details = refs.displayDetails.current?.innerText || specsDetails
          const price = refs.displayPrice.current?.innerText || specsPrice

          // Use the MEASURED live-card box so the render matches the preview
          // 1:1 (no re-scaling of the tag).
          const cardW = sm.cardBgWidth * finalScale
          const cardH = sm.cardBgHeight * finalScale

          ctx.save()
          ctx.drawImage(tagOverlay, x, y, cardW, cardH)

          ctx.fillStyle = '#ffffff'
          ctx.textAlign = 'left'
          ctx.textBaseline = 'top'

          ctx.shadowColor = 'rgba(0,0,0,0.4)'
          ctx.shadowBlur = 4 * finalScale
          ctx.shadowOffsetY = 2 * finalScale

          // The live card wraps the title inside a 37%-wide column, so the
          // export has to as well — otherwise a long name runs under the price.
          const textLeft = x + cardW * TAG.textLeft
          const textWidth = cardW * TAG.textWidth
          const titleSize = cardW * TAG.titleSize * titleScale(model)
          ctx.font = `800 ${titleSize}px Manrope, Inter, sans-serif`
          const titleLineHeight = titleSize * 1.02
          const titleLines = wrapText(ctx, model, textWidth, TAG.titleLines)
          let titleY = y + cardH * TAG.titleTop
          titleLines.forEach((line) => {
            ctx.fillText(line, textLeft, titleY)
            titleY += titleLineHeight
          })

          ctx.shadowColor = 'transparent'
          ctx.font = `600 ${cardW * TAG.detailSize}px Manrope, Inter, sans-serif`
          ctx.fillStyle = 'rgba(255,255,255,0.9)'
          const lines = wrapText(ctx, details, textWidth, detailLineCount(model))
          // Sit below the title, but never above its usual line.
          let textY = Math.max(y + cardH * TAG.detailTop, titleY + 3 * finalScale)
          lines.forEach((line) => {
            ctx.fillText(line, textLeft, textY)
            textY += cardW * TAG.detailLine
          })

          // Price, right-aligned, with the currency set inline just before it —
          // mirrors the live card so a long price never overlaps the label.
          ctx.fillStyle = '#ffffff'
          ctx.textAlign = 'right'
          ctx.textBaseline = 'middle'
          ctx.shadowColor = 'rgba(0,0,0,0.3)'
          ctx.shadowBlur = 4 * finalScale

          const priceRight = x + cardW * TAG.priceRight
          const priceY = y + cardH * TAG.priceMid
          const available = priceRight - (x + cardW * TAG.panelLeft)

          // Start from the shared length rule, then shrink until the currency
          // and the number genuinely fit inside the panel.
          let fit = priceScale(price)
          let priceW = 0
          let currencyW = 0
          for (let i = 0; i < 14; i += 1) {
            ctx.font = `400 ${cardW * TAG.priceSize * fit}px 'Bebas Neue', sans-serif`
            priceW = ctx.measureText(price).width
            currencyW = 0
            if (brand.currency) {
              ctx.font = `800 ${cardW * TAG.currencySize * fit}px Manrope, Inter, sans-serif`
              currencyW = ctx.measureText(brand.currency).width + cardW * TAG.currencyGap
            }
            if (priceW + currencyW <= available) break
            fit *= 0.92
          }

          ctx.font = `400 ${cardW * TAG.priceSize * fit}px 'Bebas Neue', sans-serif`
          ctx.fillText(price, priceRight, priceY)

          if (brand.currency) {
            ctx.font = `800 ${cardW * TAG.currencySize * fit}px Manrope, Inter, sans-serif`
            ctx.fillText(brand.currency, priceRight - priceW - cardW * TAG.currencyGap, priceY + 2 * finalScale)
          }

          ctx.restore()
        }
        // ---- QR badge ----
        if (qr.on && qrDataUrl) {
          const qrImg = qrImgRef.current || (await loadImage(qrDataUrl))
          if (qrImg) {
            const spot = QR_CORNERS[qr.corner] || QR_CORNERS['bottom-right']
            const short = Math.min(canvas.width, canvas.height)
            const box = short * (QR_SIZES[qr.size] || QR_SIZES.M)
            const pad = box * 0.09
            const labelH = qr.label ? box * 0.2 : 0
            const cardW = box + pad * 2
            const cardH = box + pad * 2 + labelH
            const cx = canvas.width * spot.x - cardW * spot.ax
            const cy = canvas.height * spot.y - cardH * spot.ay

            ctx.save()
            ctx.shadowColor = 'rgba(0,0,0,0.35)'
            ctx.shadowBlur = box * 0.12
            ctx.shadowOffsetY = box * 0.03
            ctx.fillStyle = '#ffffff'
            const r = box * 0.1
            ctx.beginPath()
            ctx.roundRect(cx, cy, cardW, cardH, r)
            ctx.fill()
            ctx.shadowColor = 'transparent'
            ctx.drawImage(qrImg, cx + pad, cy + pad, box, box)
            if (qr.label) {
              ctx.fillStyle = '#0a0a0a'
              ctx.textAlign = 'center'
              ctx.textBaseline = 'middle'
              ctx.font = `800 ${labelH * 0.5}px Manrope, Inter, sans-serif`
              ctx.fillText(qr.label, cx + cardW / 2, cy + pad + box + labelH * 0.55, box)
            }
            ctx.restore()
          }
        }

        finalRef.current = canvas.toDataURL('image/png')
      } catch {
        // Canvas was tainted (or ran out of memory) — fall back to the photo.
        finalRef.current = capturedRef.current
        showMessage('Could not merge the template — saved the photo instead.', true)
      }
      return finalRef.current
    })()

    mergeJobRef.current = job
    return job
  }

  /** The poster to hand to Save/Share, waiting on any in-flight render. */
  async function getPoster() {
    if (mergeJobRef.current) {
      try {
        await mergeJobRef.current
      } catch {
        /* falls through to whatever finalRef holds */
      }
    }
    return finalRef.current
  }

  // Toggle enhancement on the already-rendered poster and re-composite.
  function reEnhanceResult() {
    const next = !autoEnhance
    setAutoEnhance(next) // ResultStep re-renders the base image filter
    mergeFinalPoster(next) // regenerate the downloadable PNG
  }

  // ---------- Magic reveal sequence ----------
  // Measure the live tag before we leave the camera view. Both the reveal and
  // a batch capture need it, and it has to be read while the card is on screen.
  function snapshotSpecMetrics() {
    if (!hasSpecs) {
      specMetricsRef.current = null
      return
    }
    const box = refs.draggableBox.current
    const area = refs.captureArea.current
    const cardBg = refs.cardBg.current
    if (!box || !area || !cardBg) return
    specMetricsRef.current = {
      containerW: area.clientWidth,
      leftOffset: box.offsetLeft,
      topOffset: box.offsetTop,
      cardBgWidth: cardBg.offsetWidth,
      cardBgHeight: cardBg.offsetHeight,
    }
  }

  function startMagicReveal() {
    snapshotSpecMetrics()

    // Drop the previous poster so Save can never hand back a stale render.
    finalRef.current = null
    mergeJobRef.current = null

    // Set the base image up-front so it's present from the first frame
    // (no pop-in / rescale as the reveal step appears).
    if (refs.baseImage.current) refs.baseImage.current.src = capturedRef.current

    setStep('result')
    setResultReady(false)
    setResultTitle('PROCESSING...')

    // Remove any prior clone
    const oldClone = document.getElementById('reveal-specs-clone')
    if (oldClone) oldClone.remove()

    // Cancel any pending timers from a previous reveal
    revealTimersRef.current.forEach(clearTimeout)
    revealTimersRef.current = []

    const t1 = setTimeout(() => {
      // Reset flip/overlay state
      const ra = refs.revealArea.current
      ra?.classList.remove('reveal-flip')
      const overlay = refs.overlayImg.current
      overlay?.classList.remove('animate')
      if (overlay) {
        overlay.style.opacity = ''
        overlay.style.clipPath = ''
        overlay.style.webkitClipPath = ''
      }
      if (refs.particles.current) refs.particles.current.innerHTML = ''

      // Build specs clone if needed (hidden until it flips into view)
      if (hasSpecs) {
        const src = refs.draggableBox.current
        const area = refs.captureArea.current
        const clone = src.cloneNode(true)
        clone.id = 'reveal-specs-clone'
        clone.querySelector('.edit-hint')?.remove()
        clone.querySelectorAll('.resize-handle').forEach((h) => h.remove())
        const rect = area.getBoundingClientRect()
        const textRect = src.getBoundingClientRect()
        clone.style.left = `${((textRect.left - rect.left) / rect.width) * 100}%`
        clone.style.top = `${((textRect.top - rect.top) / rect.height) * 100}%`
        clone.style.pointerEvents = 'none'
        clone.style.zIndex = '35'
        clone.style.opacity = '0'
        clone.style.transition = 'opacity 0.3s ease-out'
        refs.revealArea.current.appendChild(clone)
      }

      // Reveal = a single 360° 3D flip of the whole preview
      animateStatusText('RENDERING...')
      if (ra) {
        void ra.offsetWidth
        ra.classList.add('reveal-flip')
      }

      // Mid-flip (edge-on): swap in the finished poster so it flips back
      // showing the composited overlay + tag.
      const tMid = setTimeout(() => {
        setResultTitle('FINALIZING...')
        const ov = refs.overlayImg.current
        if (ov) {
          ov.style.opacity = ''
          ov.style.clipPath = ''
          ov.style.webkitClipPath = ''
          ov.classList.add('animate')
        }
        const clone = document.getElementById('reveal-specs-clone')
        if (clone) clone.style.opacity = '1'
        mergeFinalPoster()
      }, 620)
      revealTimersRef.current.push(tMid)

      // Flip finishes -> download button glows
      const tEnd = setTimeout(() => {
        const st = refs.statusText.current
        if (st) st.style.opacity = '0'
        setResultTitle('POSTER READY')
        setResultReady(true)
      }, 1650)
      revealTimersRef.current.push(tEnd)
    }, 400)
    revealTimersRef.current.push(t1)
  }

  // ---------- Result navigation ----------
  const goBackToEdit = useCallback(() => {
    revealTimersRef.current.forEach(clearTimeout)
    revealTimersRef.current = []
    refs.revealArea.current?.classList.remove('reveal-flip')
    const overlay = refs.overlayImg.current
    overlay?.classList.remove('animate')
    if (overlay) {
      overlay.style.opacity = ''
      overlay.style.clipPath = ''
      overlay.style.webkitClipPath = ''
    }
    if (refs.particles.current) refs.particles.current.innerHTML = ''
    if (refs.statusText.current) {
      refs.statusText.current.style.opacity = '1'
      refs.statusText.current.classList.remove('active')
    }
    const clone = document.getElementById('reveal-specs-clone')
    if (clone) clone.remove()
    setResultReady(false)
    setResultTitle('PROCESSING...')
    setStep('camera')
    setTimeout(() => {
      setupCaptureArea()
      if (mode === 'camera') initCamera()
    }, 80)
  }, [refs, mode, initCamera, setupCaptureArea])

  // "Take again" — return to the studio for a fresh live capture.
  const retake = useCallback(() => {
    goBackToEdit()
    setTimeout(() => resetToCamera(), 120)
  }, [goBackToEdit, resetToCamera])

  const posterFileName = () =>
    `${brand.slug.replace(/[^a-z0-9]+/gi, '_')}_poster_${Date.now()}.png`

  const posterBlob = async () => {
    const url = await getPoster()
    if (!url) return null
    const res = await fetch(url)
    return res.blob()
  }

  const downloadPoster = useCallback(async () => {
    try {
      const blob = await posterBlob()
      if (!blob) {
        showMessage('Still rendering - give it a second and tap Save again.', true)
        return
      }
      const name = posterFileName()
      const file = new File([blob], name, { type: blob.type || 'image/png' })

      // <a download> is a no-op on iOS Safari and is blocked outright in the
      // social in-app browsers this tool is usually opened from, so those get
      // the share sheet ("Save Image") instead. Nothing detects the failure
      // after the fact - the click just silently does nothing.
      const strategy = pickSaveStrategy({
        ua: navigator.userAgent,
        touchPoints: navigator.maxTouchPoints,
        canShareFiles: !!navigator.canShare?.({ files: [file] }),
      })

      if (strategy === 'share') {
        try {
          await navigator.share({ files: [file] })
          return
        } catch (err) {
          if (err?.name === 'AbortError') return // sheet dismissed
        }
      }

      const objectUrl = URL.createObjectURL(blob)

      if (strategy !== 'download') {
        // No reliable download here; show it full size to be long-pressed.
        window.open(objectUrl, '_blank')
        showMessage(
          window.isSecureContext
            ? 'Press and hold the image to save it.'
            : 'Serve this over HTTPS to save directly - for now, press and hold the image.',
          !window.isSecureContext
        )
        setTimeout(() => URL.revokeObjectURL(objectUrl), 60000)
        return
      }

      // Object URL rather than the raw data: URL - mobile browsers refuse to
      // download multi-megabyte data URIs, silently doing nothing.
      const link = document.createElement('a')
      link.href = objectUrl
      link.download = name
      link.rel = 'noopener'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      setTimeout(() => URL.revokeObjectURL(objectUrl), 30000)
      showMessage('Poster saved to your downloads.', false)
    } catch (err) {
      console.error('Error saving poster', err)
      showMessage('Save failed - try Share instead.', true)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showMessage])

  const sharePoster = useCallback(async () => {
    try {
      const blob = await posterBlob()
      if (!blob) {
        showMessage('Still rendering — give it a second and tap Share again.', true)
        return
      }
      const file = new File([blob], posterFileName(), { type: 'image/png' })

      if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: brand.share.title,
          text: brand.share.text,
          files: [file],
        })
      } else {
        showMessage('Sharing is not supported here — use Save instead.', true)
      }
    } catch (err) {
      // A cancelled share sheet lands here too; that is not worth a message.
      if (err?.name !== 'AbortError') {
        console.error('Error sharing poster', err)
        showMessage('Could not open the share sheet.', true)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showMessage])

  // ---------- Batch actions ----------
  const removeFromBatch = useCallback((id) => {
    setBatch((b) => b.filter((i) => i.id !== id))
  }, [])

  const clearBatch = useCallback(() => setBatch([]), [])

  const batchFileName = (item, i) => {
    const name = (item.product || 'poster')
      .replace(/[^a-z0-9]+/gi, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 28)
      .toLowerCase()
    return `${String(i + 1).padStart(2, '0')}-${name || 'poster'}.png`
  }

  /** One zip beats ten download prompts — and it survives a phone browser
   *  that blocks repeated downloads. */
  const saveBatch = useCallback(async () => {
    if (!batch.length || batchBusy) return
    setBatchBusy(true)
    try {
      const zip = new JSZip()
      const folder = zip.folder(brand.slug || 'posters')
      batch.forEach((item, i) => {
        folder.file(batchFileName(item, i), item.url.split(',')[1], { base64: true })
      })
      const blob = await zip.generateAsync({ type: 'blob' })
      const objectUrl = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = objectUrl
      link.download = `${brand.slug || 'posters'}_batch_${batch.length}_${Date.now()}.zip`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      setTimeout(() => URL.revokeObjectURL(objectUrl), 30000)
      showMessage(`${batch.length} posters saved as a zip.`, false)
    } catch (err) {
      console.error('Batch save failed', err)
      showMessage('Could not build the zip — save them one by one.', true)
    } finally {
      setBatchBusy(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [batch, batchBusy, showMessage])

  /** Save a single poster out of the batch. */
  const saveBatchItem = useCallback(
    async (item, i) => {
      try {
        const blob = await (await fetch(item.url)).blob()
        const objectUrl = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = objectUrl
        link.download = `${brand.slug || 'poster'}-${batchFileName(item, i)}`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        setTimeout(() => URL.revokeObjectURL(objectUrl), 30000)
      } catch {
        showMessage('Could not save that one.', true)
      }
    },
    [showMessage]
  )

  const resetApp = useCallback(() => {
    revealTimersRef.current.forEach(clearTimeout)
    revealTimersRef.current = []
    const clone = document.getElementById('reveal-specs-clone')
    if (clone) clone.remove()
    capturedRef.current = null
    finalRef.current = null
    mergeJobRef.current = null
    setResultReady(false)
    setHasSpecs(false)
    setSpecsModel('')
    stopCamera()
    setStep('select')
  }, [stopCamera])

  useEffect(() => () => stopCamera(), [stopCamera])

  // Warm the display fonts so the canvas render has them ready.
  useEffect(() => {
    if (!document.fonts) return
    ;['800 32px Manrope', '800 16px Manrope', '800 28px Manrope', '400 46px Bebas Neue'].forEach(
      (f) => {
        document.fonts.load(f).catch(() => {})
      }
    )
  }, [])

  const value = {
    // state
    step,
    format,
    mode,
    autoEnhance,
    hasSpecs,
    specsModel,
    specsDetails,
    specsPrice,
    tagStyle,
    setTagStyle,
    tagUrl,
    cameraAvailable,
    specsModalOpen,
    captureSize,
    zoom,
    resultReady,
    resultTitle,
    alert,
    cardScaleRef: cardStateRef,
    // templates
    allCards,
    customTemplates,
    overlayModalOpen,
    activeApp,
    brandVersion,
    reloadBrand,
    openApp,
    closeApp,
    batchMode,
    setBatchMode,
    batch,
    batchBusy,
    removeFromBatch,
    clearBatch,
    saveBatch,
    saveBatchItem,
    qr,
    setQr,
    qrDataUrl,
    qrModalOpen,
    openQrModal: () => setQrModalOpen(true),
    closeQrModal: () => setQrModalOpen(false),
    // refs
    refs,
    // actions
    addOverlay,
    addOverlayAndUse,
    removeOverlay,
    openOverlayModal,
    closeOverlayModal,
    goHome,
    selectFormat,
    changeFormat,
    switchStep,
    toggleEnhance,
    flipCamera,
    handleFileUpload,
    onZoom,
    photoPointerDown,
    photoPointerMove,
    photoPointerUp,
    cardPointerDown,
    cardPointerMove,
    cardPointerUp,
    cardResizeDown,
    cardResizeMove,
    cardResizeUp,
    openSpecsModal,
    closeSpecsModal,
    applySpecs,
    clearSpecs,
    resetToCamera,
    handleMainAction,
    goBackToEdit,
    retake,
    reEnhanceResult,
    downloadPoster,
    sharePoster,
    resetApp,
    showMessage,
  }

  return <StudioContext.Provider value={value}>{children}</StudioContext.Provider>
}
