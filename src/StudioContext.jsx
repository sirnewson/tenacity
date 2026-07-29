import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react'
import { formats, cardThemes } from './constants'

const StudioContext = createContext(null)
export const useStudio = () => useContext(StudioContext)

export function StudioProvider({ children }) {
  const [step, setStep] = useState('select')
  const [format, setFormat] = useState(null)
  const [mode, setMode] = useState('camera') // 'camera' | 'upload'
  const [autoEnhance, setAutoEnhance] = useState(true)
  const [specsModel, setSpecsModel] = useState('')
  const [specsDetails, setSpecsDetails] = useState('')
  const [specsPrice, setSpecsPrice] = useState('')
  const [hasSpecs, setHasSpecs] = useState(false)
  const [cardTheme, setCardTheme] = useState('dark')
  const [cameraAvailable, setCameraAvailable] = useState(true)
  const [specsModalOpen, setSpecsModalOpen] = useState(false)
  const [captureSize, setCaptureSize] = useState({ w: 0, h: 0 })
  const [zoom, setZoom] = useState(1)
  const [resultReady, setResultReady] = useState(false)
  const [resultTitle, setResultTitle] = useState('PROCESSING...')
  const [alert, setAlert] = useState({ msg: '', isError: true, visible: false })

  // ---- Mutable refs ----
  const streamRef = useRef(null)
  const facingModeRef = useRef('environment')
  const capturedRef = useRef(null)
  const finalRef = useRef(null)
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
  const matrixRafRef = useRef(null)
  const matrixTimerRef = useRef(null)
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
    matrixCanvas: useRef(null),
    overlayImg: useRef(null),
    fillScanline: useRef(null),
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

  const clearMatrix = useCallback(() => {
    cancelAnimationFrame(matrixRafRef.current)
    clearTimeout(matrixTimerRef.current)
    if (refs.matrixCanvas.current) {
      const ctx = refs.matrixCanvas.current.getContext('2d')
      if (ctx) ctx.clearRect(0, 0, refs.matrixCanvas.current.width, refs.matrixCanvas.current.height)
    }
  }, [refs.matrixCanvas])

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

  useEffect(() => {
    const image = new Image()
    image.onload = () => {
      tagOverlayImgRef.current = image
    }
    image.src = '/product-tag-overlay.png'
  }, [])

  // ---------- Step switching ----------
  const switchStep = useCallback(
    (target) => {
      if (target !== 'camera') stopCamera()
      setStep(target)
    },
    [stopCamera]
  )

  const selectFormat = useCallback(
    (id) => {
      const fmt = formats[id]
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
    [preloadOverlay, setupCaptureArea, initCamera]
  )

  const changeFormat = useCallback(
    (id) => {
      const fmt = formats[id]
      if (!fmt || fmt.id === format?.id) return
      setFormat(fmt)
      preloadOverlay(fmt.overlayUrl)
      setTimeout(() => setupCaptureArea(fmt), 0)
    },
    [format?.id, preloadOverlay, setupCaptureArea]
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
      
      const tagCenterX = rawX + (tagW / 2)
      const tagCenterY = rawY + (tagH / 2)
      const screenCenterX = boundsW / 2
      const screenCenterY = boundsH / 2
      const snapThreshold = 16
      
      if (Math.abs(tagCenterX - screenCenterX) < snapThreshold) snapX = screenCenterX - (tagW / 2)
      if (Math.abs(tagCenterY - screenCenterY) < snapThreshold) snapY = screenCenterY - (tagH / 2)

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
      r.startDist =
        Math.hypot(e.clientX - rect.left, e.clientY - rect.top) || 1
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
    [hasSpecs, refs.displayModel, refs.displayDetails, refs.displayPrice, refs.draggableBox, centerCard, showMessage]
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
    startMagicReveal()
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
    startMagicReveal()
  }

  function handleMainAction() {
    if (mode === 'camera') captureFromVideo()
    else captureFromUpload()
  }

  const animateStatusText = useCallback(
    (text, isFinal = false) => {
      const el = refs.statusText.current
      if (!el) return
      el.innerText = text
      el.classList.remove('active')
      el.style.color = isFinal ? '#4ade80' : '#ffffff'
      el.style.opacity = '1'
      setTimeout(() => el.classList.add('active'), 40)
    },
    [refs.statusText]
  )

  // ---------- Merge final poster ----------
  function mergeFinalPoster(enhance = autoEnhance) {
    const canvas = document.createElement('canvas')
    canvas.width = format.width
    canvas.height = format.height
    const ctx = canvas.getContext('2d')
    const baseImg = new Image()
    baseImg.onload = () => {
      ctx.filter = enhance
        ? 'contrast(1.2) saturate(1.2) brightness(1.05)'
        : 'none'
      ctx.drawImage(baseImg, 0, 0, canvas.width, canvas.height)
      ctx.filter = 'none'
      if (!overlayImgObjRef.current) return
      try {
        ctx.drawImage(overlayImgObjRef.current, 0, 0, canvas.width, canvas.height)
        if (hasSpecs && specMetricsRef.current) {
          const sm = specMetricsRef.current
          const th = cardThemes[cardTheme] || cardThemes.dark
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

          const tagOverlay = tagOverlayImgRef.current
          if (!tagOverlay) return

          ctx.save()
          ctx.drawImage(tagOverlay, x, y, cardW, cardH)

          ctx.fillStyle = '#ffffff'
          ctx.textAlign = 'left'
          ctx.textBaseline = 'top'
          
          ctx.shadowColor = 'rgba(0,0,0,0.4)'
          ctx.shadowBlur = 4 * finalScale
          ctx.shadowOffsetY = 2 * finalScale

          ctx.font = `800 ${26 * finalScale}px Manrope, Inter, sans-serif`
          ctx.fillText(model, x + cardW * 0.12, y + cardH * 0.19)
          
          ctx.shadowColor = 'transparent'
          ctx.font = `600 ${11 * finalScale}px Manrope, Inter, sans-serif`
          ctx.fillStyle = 'rgba(255,255,255,0.9)'
          const maxDetailsWidth = cardW * 0.37
          const lines = []
          ;(details || '').split('\n').forEach((paragraph) => {
            let currentLine = ''
            const tokens = paragraph.match(/\S+\s*/g) || ['']
            tokens.forEach((token) => {
              const candidate = currentLine + token
              if (currentLine && ctx.measureText(candidate).width > maxDetailsWidth) {
                lines.push(currentLine.trimEnd())
                currentLine = token
              } else {
                currentLine = candidate
              }

              // Paths and other long unbroken strings need character-level
              // wrapping because canvas does not reproduce CSS word breaks.
              while (ctx.measureText(currentLine).width > maxDetailsWidth) {
                let splitAt = currentLine.length - 1
                while (splitAt > 1 && ctx.measureText(currentLine.slice(0, splitAt)).width > maxDetailsWidth) {
                  splitAt -= 1
                }
                lines.push(currentLine.slice(0, splitAt))
                currentLine = currentLine.slice(splitAt)
              }
            })
            if (currentLine || !paragraph) lines.push(currentLine.trimEnd())
          })
          let textY = y + cardH * 0.43
          lines.slice(0, 4).forEach(line => {
            ctx.fillText(line, x + cardW * 0.12, textY)
            textY += 14 * finalScale
          })

          ctx.fillStyle = '#ffffff'
          ctx.textAlign = 'right'
          ctx.textBaseline = 'middle'
          ctx.shadowColor = 'rgba(0,0,0,0.3)'
          ctx.shadowBlur = 4 * finalScale
          
          ctx.font = `400 ${42 * finalScale}px 'Bebas Neue', sans-serif`
          ctx.fillText(price, x + cardW * 0.88, y + cardH * 0.60)
          
          ctx.font = `800 ${14 * finalScale}px Manrope, Inter, sans-serif`
          ctx.textAlign = 'left'
          ctx.fillText('KSH', x + cardW * 0.58, y + cardH * 0.30)

          ctx.restore()
        }
        finalRef.current = canvas.toDataURL('image/png')
      } catch {
        finalRef.current = capturedRef.current
        showMessage('Security block: downloaded base photo instead.', true)
      }
    }
    baseImg.src = capturedRef.current
  }

  // Toggle enhancement on the already-rendered poster and re-composite.
  function reEnhanceResult() {
    const next = !autoEnhance
    setAutoEnhance(next) // ResultStep re-renders the base image filter
    mergeFinalPoster(next) // regenerate the downloadable PNG
  }

  // ---------- Magic reveal sequence ----------
  function startMagicReveal() {
    // Snapshot spec metrics from the live card before leaving camera view
    if (hasSpecs) {
      const box = refs.draggableBox.current
      const area = refs.captureArea.current
      const cardBg = refs.cardBg.current
      specMetricsRef.current = {
        containerW: area.clientWidth,
        leftOffset: box.offsetLeft,
        topOffset: box.offsetTop,
        cardBgWidth: cardBg.offsetWidth,
        cardBgHeight: cardBg.offsetHeight,
      }
    }

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
  }, [refs, mode, initCamera, setupCaptureArea, clearMatrix])

  // "Take again" — return to the studio for a fresh live capture.
  const retake = useCallback(() => {
    goBackToEdit()
    setTimeout(() => resetToCamera(), 120)
  }, [goBackToEdit, resetToCamera])

  const downloadPoster = useCallback(() => {
    if (!finalRef.current) return
    const link = document.createElement('a')
    link.href = finalRef.current
    link.download = `Phoneplace_Poster_${Date.now()}.png`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }, [])

  const sharePoster = useCallback(async () => {
    if (!finalRef.current) return
    try {
      const res = await fetch(finalRef.current)
      const blob = await res.blob()
      const file = new File([blob], `Phoneplace_Poster_${Date.now()}.png`, { type: 'image/png' })

      if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: 'Phoneplace Creator',
          text: 'Check out my design from Phoneplace Creator!',
          files: [file]
        })
      } else {
        alert('Web Share is not supported on this device. Please use Save Poster instead.')
      }
    } catch (err) {
      console.error('Error sharing poster', err)
    }
  }, [])

  const resetApp = useCallback(() => {
    cancelAnimationFrame(matrixRafRef.current)
    clearTimeout(matrixTimerRef.current)
    revealTimersRef.current.forEach(clearTimeout)
    revealTimersRef.current = []
    clearMatrix()
    const clone = document.getElementById('reveal-specs-clone')
    if (clone) clone.remove()
    capturedRef.current = null
    finalRef.current = null
    setResultReady(false)
    setHasSpecs(false)
    setSpecsModel('')
    stopCamera()
    setStep('select')
  }, [stopCamera, clearMatrix])

  useEffect(() => () => stopCamera(), [stopCamera])

  // Warm the Manrope font so the canvas render has it ready.
  useEffect(() => {
    if (!document.fonts) return
    ;['800 32px Manrope', '800 16px Manrope', '800 28px Manrope', '400 42px Bebas Neue'].forEach((f) => {
      document.fonts.load(f).catch(() => {})
    })
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
    cardTheme,
    setCardTheme,
    cameraAvailable,
    specsModalOpen,
    captureSize,
    zoom,
    resultReady,
    resultTitle,
    alert,
    cardScaleRef: cardStateRef,
    // refs
    refs,
    // actions
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
