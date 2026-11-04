'use client'

import { useCallback, useEffect, useRef, useState, type ChangeEvent } from 'react'
import Link from 'next/link'
import { Camera, Download, ImageUp, Loader2, ScanFace, X } from 'lucide-react'
import { track } from '@vercel/analytics'
import type { FaceLandmarker, NormalizedLandmark } from '@mediapipe/tasks-vision'
import type { Category, FrameShape } from '@/data/products'
import type { Locale, Translations } from '@/data/translations'
import { buttonClass } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import {
  classifyFace,
  FACE_SHAPES,
  FRAMES_FOR_FACE,
  loadFaceShape,
  majority,
  measureFace,
  saveFaceShape,
  type FaceShape,
} from '@/lib/face-shape'
import { frameOverlaySvg, OVERLAY, svgDataUrl } from '@/lib/frame-overlay'

export interface TryOnProduct {
  name: string
  shape: FrameShape
  frameColor: string
  lensColor: string
  category: Category
  tryonImage?: string | null
}

interface TryOnStudioProps {
  locale: Locale
  t: Translations['tryon']
  product?: TryOnProduct | null
  onClose: () => void
}

type Phase = 'intro' | 'loading' | 'live' | 'photo' | 'error'
type ErrorKey = 'error_permission' | 'error_camera' | 'error_unsupported' | 'error_load'

// Self-hosted (scripts/copy-mediapipe.mjs): no third-party requests, CSP stays 'self'.
const WASM_PATH = '/vendor/mediapipe/wasm'
const MODEL_PATH = '/models/face_landmarker.task'
const SAMPLE_WINDOW = 45

export default function TryOnStudio({ locale, t, product, onClose }: TryOnStudioProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const landmarkerRef = useRef<FaceLandmarker | null>(null)
  const modeRef = useRef<'VIDEO' | 'IMAGE' | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const rafRef = useRef<number | null>(null)
  const overlayRef = useRef<HTMLImageElement | null>(null)
  const smoothRef = useRef<{ x: number; y: number; width: number; angle: number } | null>(null)
  const samplesRef = useRef<FaceShape[]>([])
  const missesRef = useRef(0)
  const frameRef = useRef(0)

  const [phase, setPhase] = useState<Phase>('intro')
  const [error, setError] = useState<ErrorKey | null>(null)
  const [noFace, setNoFace] = useState(false)
  const [detected, setDetected] = useState<FaceShape | null>(null)
  const [picked, setPicked] = useState<FaceShape | null>(null)
  const shape = picked ?? detected

  // Open as a native modal (focus trap, Escape, inert background).
  useEffect(() => {
    const dialog = dialogRef.current
    if (dialog && !dialog.open) dialog.showModal()
    setDetected(loadFaceShape()) // start from the last result; a new detection replaces it
  }, [])

  useEffect(() => {
    if (shape) saveFaceShape(shape)
  }, [shape])

  // Prepare the frame overlay image once.
  useEffect(() => {
    if (!product) return
    const img = new Image()
    img.decoding = 'async'
    if (product.tryonImage) {
      img.crossOrigin = 'anonymous' // keeps the canvas untainted so snapshots work
      img.src = product.tryonImage
    } else {
      img.src = svgDataUrl(
        frameOverlaySvg({
          shape: product.shape,
          frameColor: product.frameColor,
          lensColor: product.lensColor,
          category: product.category,
        })
      )
    }
    overlayRef.current = img
  }, [product])

  const stopCamera = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    rafRef.current = null
    streamRef.current?.getTracks().forEach((track) => track.stop())
    streamRef.current = null
  }, [])

  // Full cleanup when the studio unmounts: camera off, model released.
  useEffect(
    () => () => {
      stopCamera()
      landmarkerRef.current?.close()
      landmarkerRef.current = null
    },
    [stopCamera]
  )

  async function getLandmarker(mode: 'VIDEO' | 'IMAGE'): Promise<FaceLandmarker> {
    if (!landmarkerRef.current) {
      const vision = await import('@mediapipe/tasks-vision')
      const fileset = await vision.FilesetResolver.forVisionTasks(WASM_PATH)
      const create = (delegate: 'GPU' | 'CPU') =>
        vision.FaceLandmarker.createFromOptions(fileset, {
          baseOptions: { modelAssetPath: MODEL_PATH, delegate },
          runningMode: mode,
          numFaces: 1,
        })
      landmarkerRef.current = await create('GPU').catch(() => create('CPU'))
      modeRef.current = mode
    } else if (modeRef.current !== mode) {
      await landmarkerRef.current.setOptions({ runningMode: mode })
      modeRef.current = mode
    }
    return landmarkerRef.current
  }

  /** Draws the source frame, the glasses overlay and updates the face-shape estimate. */
  function render(
    source: CanvasImageSource,
    w: number,
    h: number,
    landmarks: NormalizedLandmark[] | undefined,
    live: boolean
  ) {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w
      canvas.height = h
    }
    ctx.setTransform(1, 0, 0, 1, 0, 0)
    ctx.clearRect(0, 0, w, h)
    if (live) ctx.setTransform(-1, 0, 0, 1, w, 0) // selfie mirror
    ctx.drawImage(source, 0, 0, w, h)

    if (landmarks && landmarks.length >= 455) {
      const a = landmarks[468] ?? landmarks[33] // iris centres (fallback: outer eye corners)
      const b = landmarks[473] ?? landmarks[263]
      const ax = a.x * w, ay = a.y * h, bx = b.x * w, by = b.y * h
      // Frame width follows the temples (127 ↔ 356), like a real fitting; the pupil distance
      // alone under-sizes frames as soon as the head turns slightly.
      const tl = landmarks[127], tr = landmarks[356]
      const temples = Math.hypot((tr.x - tl.x) * w, (tr.y - tl.y) * h)
      const target = {
        x: (ax + bx) / 2,
        y: (ay + by) / 2,
        width: Math.max(temples * 1.02, Math.hypot(bx - ax, by - ay) * 2.2),
        angle: Math.atan2(by - ay, bx - ax),
      }
      // Exponential smoothing removes jitter in live mode.
      const prev = smoothRef.current
      const k = live && prev ? 0.45 : 1
      const s = prev
        ? {
            x: prev.x + (target.x - prev.x) * k,
            y: prev.y + (target.y - prev.y) * k,
            width: prev.width + (target.width - prev.width) * k,
            angle: prev.angle + (target.angle - prev.angle) * k,
          }
        : target
      smoothRef.current = s

      const img = overlayRef.current
      if (product && img?.complete && img.naturalWidth > 0) {
        const ow = s.width * (OVERLAY.width / OVERLAY.span)
        const oh = ow * (OVERLAY.height / OVERLAY.width)
        ctx.save()
        ctx.translate(s.x, s.y)
        ctx.rotate(s.angle)
        ctx.drawImage(img, -ow / 2, -oh / 2, ow, oh)
        ctx.restore()
      }

      const metrics = measureFace(landmarks, w / h)
      if (metrics) {
        const samples = samplesRef.current
        samples.push(classifyFace(metrics))
        if (samples.length > SAMPLE_WINDOW) samples.shift()
      }
    }
    ctx.setTransform(1, 0, 0, 1, 0, 0)
  }

  async function startCamera() {
    setError(null)
    if (!navigator.mediaDevices?.getUserMedia) {
      setError('error_unsupported')
      return setPhase('error')
    }
    setPhase('loading')
    let stream: MediaStream
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 960 } },
        audio: false,
      })
    } catch (err) {
      const name = (err as DOMException)?.name
      setError(name === 'NotAllowedError' || name === 'SecurityError' ? 'error_permission' : 'error_camera')
      return setPhase('error')
    }
    streamRef.current = stream
    const video = videoRef.current!
    video.srcObject = stream
    try {
      await video.play()
      const landmarker = await getLandmarker('VIDEO')
      samplesRef.current = []
      smoothRef.current = null
      setPhase('live')
      track('tryon_open', { mode: 'camera', product: product ? 'yes' : 'no' })

      const loop = () => {
        if (!streamRef.current) return
        if (video.readyState >= 2 && video.videoWidth > 0) {
          const result = landmarker.detectForVideo(video, performance.now())
          const face = result.faceLandmarks[0]
          render(video, video.videoWidth, video.videoHeight, face, true)
          missesRef.current = face ? 0 : missesRef.current + 1
          if (++frameRef.current % 15 === 0) {
            setNoFace(missesRef.current > 30)
            if (samplesRef.current.length >= 20) setDetected(majority(samplesRef.current))
          }
        }
        rafRef.current = requestAnimationFrame(loop)
      }
      loop()
    } catch {
      stopCamera()
      setError('error_load')
      setPhase('error')
    }
  }

  async function onPhoto(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file || !file.type.startsWith('image/')) return
    stopCamera()
    setError(null)
    setPhase('loading')
    const url = URL.createObjectURL(file) // local only — the photo never leaves the device
    try {
      const img = new Image()
      img.src = url
      await img.decode()
      // Downscale very large photos so detection stays fast.
      const scale = Math.min(1, 1600 / Math.max(img.naturalWidth, img.naturalHeight))
      const w = Math.round(img.naturalWidth * scale)
      const h = Math.round(img.naturalHeight * scale)
      const bitmap = await createImageBitmap(img, { resizeWidth: w, resizeHeight: h })
      const landmarker = await getLandmarker('IMAGE')
      const face = landmarker.detect(bitmap).faceLandmarks[0]
      samplesRef.current = []
      smoothRef.current = null
      setPhase('photo')
      // Canvas is mounted for every phase, so it can be drawn right away.
      render(bitmap, w, h, face, false)
      bitmap.close()
      setNoFace(!face)
      setDetected(face ? majority(samplesRef.current) : null)
      track('tryon_open', { mode: 'photo', product: product ? 'yes' : 'no' })
    } catch {
      setError('error_load')
      setPhase('error')
    } finally {
      URL.revokeObjectURL(url)
    }
  }

  function snapshot() {
    const canvas = canvasRef.current
    if (!canvas) return
    try {
      canvas.toBlob((blob) => {
        if (!blob) return
        const a = document.createElement('a')
        a.href = URL.createObjectURL(blob)
        a.download = 'mon-opticien-essai.png'
        a.click()
        setTimeout(() => URL.revokeObjectURL(a.href), 1000)
      }, 'image/png')
    } catch {
      // Tainted canvas (cross-origin overlay without CORS): snapshot unavailable.
    }
  }

  const showStage = phase === 'live' || phase === 'photo'

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="tryon-title"
      onClose={onClose}
      className="m-auto h-dvh max-h-none w-full max-w-none overflow-y-auto bg-paper p-0 text-ink shadow-lift backdrop:bg-ink/50 backdrop:backdrop-blur-sm sm:h-auto sm:max-h-[94dvh] sm:max-w-4xl sm:rounded-3xl"
    >
      <header className="sticky top-0 z-10 flex items-center justify-between gap-4 border-b border-line bg-paper/95 px-5 py-4 backdrop-blur sm:px-7">
        <div className="min-w-0">
          <h2 id="tryon-title" className="font-serif text-2xl sm:text-3xl">
            {product ? t.title : t.finder_title}
          </h2>
          {product && <p className="truncate text-sm text-muted">{product.name}</p>}
        </div>
        <button
          type="button"
          onClick={() => dialogRef.current?.close()}
          aria-label={t.close}
          className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full hover:bg-sand"
        >
          <X size={20} aria-hidden="true" />
        </button>
      </header>

      <div className="grid gap-6 p-5 sm:p-7 md:grid-cols-[1.4fr_1fr]">
        {/* Stage */}
        <div>
          <div className="relative flex aspect-[4/3] items-center justify-center overflow-hidden rounded-2xl bg-ink">
            <video ref={videoRef} playsInline muted className="hidden" />
            <canvas
              ref={canvasRef}
              role="img"
              aria-label={t.preview_alt}
              className={cn('h-full w-full object-contain', !showStage && 'hidden')}
            />

            {phase === 'intro' && (
              <div className="flex flex-col items-center gap-4 p-6 text-center text-white">
                <ScanFace size={44} className="text-accent-soft" aria-hidden="true" />
                <p className="max-w-sm text-sm text-white/80">{t.intro}</p>
              </div>
            )}
            {phase === 'loading' && (
              <div className="flex flex-col items-center gap-3 text-white" role="status">
                <Loader2 size={30} className="animate-spin" aria-hidden="true" />
                <p className="text-sm text-white/80">{t.loading}</p>
              </div>
            )}
            {phase === 'error' && error && (
              <p role="alert" className="max-w-sm p-6 text-center text-sm text-white">
                {t[error]}
              </p>
            )}
            {showStage && noFace && (
              <p
                role="status"
                className="absolute inset-x-4 bottom-4 rounded-xl bg-ink/80 px-4 py-2.5 text-center text-sm text-white backdrop-blur"
              >
                {t.no_face}
              </p>
            )}
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {phase !== 'live' && (
              <button type="button" onClick={startCamera} className={buttonClass({ variant: 'primary' })}>
                <Camera size={16} aria-hidden="true" />
                {phase === 'error' ? t.retry : t.use_camera}
              </button>
            )}
            <button type="button" onClick={() => fileRef.current?.click()} className={buttonClass({ variant: 'secondary' })}>
              <ImageUp size={16} aria-hidden="true" />
              {t.use_photo}
            </button>
            {showStage && product && (
              <button type="button" onClick={snapshot} className={buttonClass({ variant: 'ghost' })}>
                <Download size={16} aria-hidden="true" />
                {t.snapshot}
              </button>
            )}
            <input ref={fileRef} type="file" accept="image/*" onChange={onPhoto} className="hidden" />
          </div>
          {product && <p className="mt-3 text-xs text-muted">{t.disclaimer}</p>}
        </div>

        {/* Face shape */}
        <aside aria-live="polite" className="rounded-2xl border border-line bg-surface p-5">
          {shape ? (
            <>
              <p className="text-sm text-muted">{t.face_result}</p>
              <p className="mt-1 font-serif text-4xl">{t.faces[shape]}</p>
              <p className="mt-3 text-sm leading-relaxed text-ink-soft">{t.face_tips[shape]}</p>
              <p className="mt-5 text-xs font-medium uppercase tracking-[0.14em] text-muted">{t.suits_you}</p>
              <ul className="mt-2 flex flex-wrap gap-1.5">
                {FRAMES_FOR_FACE[shape].map((f) => (
                  <li key={f} className="rounded-full bg-accent-soft px-2.5 py-1 text-xs text-accent-strong">
                    {t.shapes[f]}
                  </li>
                ))}
              </ul>
              <Link
                href={`/${locale}/products?face=${shape}`}
                onClick={() => track('tryon_face_shape', { shape })}
                className={buttonClass({ variant: 'primary', size: 'md', className: 'mt-5 w-full' })}
              >
                {t.see_frames}
              </Link>
              <p className="mt-3 text-xs text-muted">{t.face_estimate}</p>
            </>
          ) : (
            <p className="text-sm text-muted">{t.intro}</p>
          )}

          <fieldset className="mt-6 border-t border-line pt-4">
            <legend className="sr-only">{t.face_pick}</legend>
            <p className="mb-2 text-xs text-muted" aria-hidden="true">{t.face_pick}</p>
            <div className="flex flex-wrap gap-1.5">
              {FACE_SHAPES.map((f) => (
                <button
                  key={f}
                  type="button"
                  aria-pressed={shape === f}
                  onClick={() => setPicked(f)}
                  className={cn(
                    'rounded-full px-3 py-1.5 text-xs transition-colors',
                    shape === f ? 'bg-ink text-white' : 'border border-line bg-paper text-ink-soft hover:border-ink/30'
                  )}
                >
                  {t.faces[f]}
                </button>
              ))}
            </div>
          </fieldset>
        </aside>
      </div>
    </dialog>
  )
}
