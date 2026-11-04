// Regenerates the favicon set from public/favicon.svg.
// Usage: node scripts/generate-icons.mjs
import sharp from 'sharp'
import { readFileSync, writeFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const pub = join(dirname(fileURLToPath(import.meta.url)), '..', 'public')
const svg = readFileSync(join(pub, 'favicon.svg'))

// Full-bleed square version (no rounded corners) for platforms that apply their own mask.
const squareSvg = Buffer.from(
  svg.toString().replace('rx="9"', 'rx="0"')
)
// Maskable: artwork scaled into the 80% safe zone on a solid background.
const maskableSvg = Buffer.from(
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40"><rect width="40" height="40" fill="#151412"/><g transform="translate(4 4)">${svg
    .toString()
    .replace(/^<svg[^>]*>/, '')
    .replace('</svg>', '')
    .replace(/<rect[^>]*\/>/, '')}</g></svg>`
)

const png = (input, size) => sharp(input, { density: 512 }).resize(size, size).png().toBuffer()

writeFileSync(join(pub, 'icon-192.png'), await png(svg, 192))
writeFileSync(join(pub, 'icon-512.png'), await png(svg, 512))
writeFileSync(join(pub, 'apple-touch-icon.png'), await png(squareSvg, 180))
writeFileSync(join(pub, 'icon-maskable-512.png'), await png(maskableSvg, 512))

// favicon.ico containing 16, 32 and 48px PNG images.
const sizes = [16, 32, 48]
const images = await Promise.all(sizes.map((s) => png(svg, s)))
const header = Buffer.alloc(6)
header.writeUInt16LE(0, 0)
header.writeUInt16LE(1, 2)
header.writeUInt16LE(images.length, 4)
let offset = 6 + 16 * images.length
const entries = images.map((img, i) => {
  const e = Buffer.alloc(16)
  e.writeUInt8(sizes[i], 0)
  e.writeUInt8(sizes[i], 1)
  e.writeUInt8(0, 2)
  e.writeUInt8(0, 3)
  e.writeUInt16LE(1, 4)
  e.writeUInt16LE(32, 6)
  e.writeUInt32LE(img.length, 8)
  e.writeUInt32LE(offset, 12)
  offset += img.length
  return e
})
writeFileSync(join(pub, 'favicon.ico'), Buffer.concat([header, ...entries, ...images]))

console.log('Icons generated in /public')
