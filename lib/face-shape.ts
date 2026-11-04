import type { FrameShape } from '@/data/products'

export const FACE_SHAPES = ['oval', 'round', 'square', 'heart', 'oblong'] as const
export type FaceShape = (typeof FACE_SHAPES)[number]

export const isFaceShape = (v: unknown): v is FaceShape =>
  typeof v === 'string' && (FACE_SHAPES as readonly string[]).includes(v)

/** Classic optician guidance: contrast the face's dominant lines. */
export const FRAMES_FOR_FACE: Record<FaceShape, FrameShape[]> = {
  oval: ['aviator', 'wayfarer', 'square', 'round', 'cat_eye', 'browline', 'rectangle'],
  round: ['rectangle', 'square', 'wayfarer', 'browline', 'cat_eye'],
  square: ['round', 'aviator', 'cat_eye'],
  heart: ['round', 'aviator', 'rectangle', 'browline'],
  oblong: ['square', 'wayfarer', 'aviator', 'browline'],
}

export const suitsFace = (frame: FrameShape | null | undefined, face: FaceShape) =>
  !!frame && FRAMES_FOR_FACE[face].includes(frame)

interface Point {
  x: number
  y: number
}

// MediaPipe Face Landmarker indices (478-point mesh).
const TOP = 10 // upper forehead, centre
const CHIN = 152
const CHEEK_R = 234
const CHEEK_L = 454
const FOREHEAD_R = 54
const FOREHEAD_L = 284
const JAW_R = 172
const JAW_L = 397

export interface FaceMetrics {
  lengthToWidth: number
  jawToWidth: number
  foreheadToWidth: number
}

/**
 * Measures proportions from normalised landmarks. `aspect` = image width / height, needed
 * because landmark x and y are normalised to different axes.
 */
export function measureFace(landmarks: Point[], aspect: number): FaceMetrics | null {
  if (landmarks.length < 455) return null
  const p = (i: number) => ({ x: landmarks[i].x * aspect, y: landmarks[i].y })
  const d = (a: number, b: number) => Math.hypot(p(a).x - p(b).x, p(a).y - p(b).y)
  const width = d(CHEEK_R, CHEEK_L)
  if (width <= 0) return null
  return {
    lengthToWidth: d(TOP, CHIN) / width,
    jawToWidth: d(JAW_R, JAW_L) / width,
    foreheadToWidth: d(FOREHEAD_R, FOREHEAD_L) / width,
  }
}

/**
 * Heuristic classification. The mesh's top point sits below the hairline, so ratios run
 * smaller than tape-measure ones; thresholds are tuned for the mesh. This is an estimate —
 * the UI always lets the visitor correct it.
 */
export function classifyFace(m: FaceMetrics): FaceShape {
  if (m.lengthToWidth >= 1.45) return 'oblong'
  if (m.foreheadToWidth - m.jawToWidth > 0.12 && m.jawToWidth < 0.78) return 'heart'
  if (m.lengthToWidth < 1.22) return m.jawToWidth >= 0.82 ? 'square' : 'round'
  return m.jawToWidth >= 0.86 ? 'square' : 'oval'
}

/** Majority vote over recent frames, to keep the live result from flickering. */
export function majority(shapes: FaceShape[]): FaceShape | null {
  if (shapes.length === 0) return null
  const counts = new Map<FaceShape, number>()
  for (const s of shapes) counts.set(s, (counts.get(s) ?? 0) + 1)
  return [...counts.entries()].sort((a, b) => b[1] - a[1])[0][0]
}

const STORAGE_KEY = 'mo_face_shape'

export function loadFaceShape(): FaceShape | null {
  try {
    const v = window.localStorage.getItem(STORAGE_KEY)
    return isFaceShape(v) ? v : null
  } catch {
    return null
  }
}

export function saveFaceShape(shape: FaceShape) {
  try {
    window.localStorage.setItem(STORAGE_KEY, shape)
  } catch {
    // ignore (private mode)
  }
}
