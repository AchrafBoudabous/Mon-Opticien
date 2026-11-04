// Self-hosts the MediaPipe runtime for the virtual try-on (runs before `dev` and `build`).
// - copies the WASM loader + binary from node_modules → public/vendor/mediapipe/wasm (git-ignored)
// - downloads the face landmarker model once → public/models/face_landmarker.task (committed)
// Self-hosting keeps visitors' requests on our origin (privacy) and lets the CSP stay 'self'.
import { copyFile, mkdir, stat, writeFile } from 'fs/promises'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const src = join(root, 'node_modules', '@mediapipe', 'tasks-vision', 'wasm')
const dest = join(root, 'public', 'vendor', 'mediapipe', 'wasm')
const modelPath = join(root, 'public', 'models', 'face_landmarker.task')
const MODEL_URL =
  'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task'

const exists = (p) => stat(p).then((s) => s.size > 0, () => false)

await mkdir(dest, { recursive: true })
for (const file of ['vision_wasm_internal.js', 'vision_wasm_internal.wasm']) {
  await copyFile(join(src, file), join(dest, file))
}

if (!(await exists(modelPath))) {
  console.log('Downloading face landmarker model…')
  const res = await fetch(MODEL_URL)
  if (!res.ok) throw new Error(`Model download failed: HTTP ${res.status}`)
  await mkdir(dirname(modelPath), { recursive: true })
  await writeFile(modelPath, Buffer.from(await res.arrayBuffer()))
}

console.log('MediaPipe assets ready.')
