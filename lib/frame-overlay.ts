import type { Category, FrameShape } from '@/data/products'

// Drawn try-on overlays. Geometry contract (also used for uploaded try-on PNGs):
// canvas 900×360, lens centres at (250,180) and (650,180); temple tips at x≈18 and x≈882
// (span 864), which are matched to the wearer’s temples.
export const OVERLAY = { width: 900, height: 360, ipd: 400, span: 864 } as const

const FRAME_COLORS: [RegExp, string][] = [
  [/écaille|ecaille|tortoise|havana/i, '#6B3A1E'],
  [/\bor\b|gold|doré|dore/i, '#C8A04A'],
  [/argent|silver|gunmetal|acier|steel/i, '#A9AEB6'],
  [/transparent|clear|cristal|crystal/i, 'rgba(210,214,220,0.75)'],
  [/blanc|white|ivoire|ivory|nude|beige/i, '#E9E2D6'],
  [/marron|brown|brun/i, '#5A3A22'],
  [/bleu|blue|navy/i, '#1F3A68'],
  [/rouge|red|bordeaux/i, '#7E1D24'],
  [/rose|pink/i, '#D3A1A4'],
  [/vert|green/i, '#2F4A3A'],
  [/noir|black/i, '#141414'],
]

const LENS_COLORS: [RegExp, string][] = [
  [/vert|green/i, '#2E4A3B'],
  [/brun|brown|marron|ambre|amber/i, '#5B3A20'],
  [/gris|grey|gray|fumé|smoke/i, '#3C4044'],
  [/bleu|blue/i, '#22344F'],
  [/rose|pink/i, '#9B5C66'],
  [/noir|black/i, '#151515'],
]

const pick = (table: [RegExp, string][], text: string, fallback: string) =>
  table.find(([re]) => re.test(text))?.[1] ?? fallback

// One lens centred on (0,0); the outer (temple) side is towards −x. The second lens is mirrored.
const LENS: Record<FrameShape, string> = {
  round: 'M -120 0 A 120 120 0 1 0 120 0 A 120 120 0 1 0 -120 0 Z',
  rectangle: 'M -106 -82 H 106 Q 140 -82 140 -48 V 48 Q 140 82 106 82 H -106 Q -140 82 -140 48 V -48 Q -140 -82 -106 -82 Z',
  square: 'M -100 -112 H 100 Q 128 -112 128 -84 V 84 Q 128 112 100 112 H -100 Q -128 112 -128 84 V -84 Q -128 -112 -100 -112 Z',
  aviator: 'M -140 -78 Q -10 -104 122 -80 Q 142 -10 98 62 Q 44 124 -36 112 Q -142 88 -142 -8 Z',
  cat_eye: 'M -152 -104 Q -40 -92 124 -72 Q 140 16 74 82 Q 4 116 -68 86 Q -132 46 -152 -104 Z',
  browline: 'M -78 -84 H 104 Q 136 -84 136 -40 Q 132 46 82 78 Q 20 104 -60 92 Q -136 72 -138 -20 Q -138 -84 -78 -84 Z',
  wayfarer: 'M -148 -96 L 136 -84 Q 132 34 86 78 Q 40 98 -86 88 Q -132 60 -148 -96 Z',
}

interface OverlayInput {
  shape: FrameShape
  frameColor: string
  lensColor: string
  category: Category
}

export function frameOverlaySvg({ shape, frameColor, lensColor, category }: OverlayInput): string {
  const frame = pick(FRAME_COLORS, frameColor, '#141414')
  const isSun = category === 'sunglasses'
  const lens = isSun ? pick(LENS_COLORS, lensColor, '#2B2E31') : '#FFFFFF'
  const gradient = /dégradé|degrade|gradient/i.test(lensColor)
  const thin = shape === 'round' || shape === 'aviator'
  const stroke = thin ? 11 : shape === 'browline' ? 7 : 20
  const lensOpacity = isSun ? 0.78 : 0.07
  const d = LENS[shape]

  const lensGroup = (x: number, mirror: boolean) => `
    <g transform="translate(${x} 180)${mirror ? ' scale(-1 1)' : ''}">
      <path d="${d}" fill="url(#lens)" stroke="${frame}" stroke-width="${stroke}" stroke-linejoin="round"/>
      <path d="${d}" fill="url(#shine)" stroke="none"/>
      ${shape === 'browline' ? `<path d="M -142 -86 Q -40 -104 136 -86" fill="none" stroke="${frame}" stroke-width="30" stroke-linecap="round"/>` : ''}
    </g>`

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${OVERLAY.width} ${OVERLAY.height}" width="${OVERLAY.width}" height="${OVERLAY.height}">
  <defs>
    <linearGradient id="lens" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${lens}" stop-opacity="${lensOpacity}"/>
      <stop offset="1" stop-color="${lens}" stop-opacity="${gradient ? lensOpacity * 0.35 : lensOpacity}"/>
    </linearGradient>
    <linearGradient id="shine" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#fff" stop-opacity="${isSun ? 0.22 : 0.18}"/>
      <stop offset="0.45" stop-color="#fff" stop-opacity="0"/>
    </linearGradient>
  </defs>
  ${lensGroup(250, false)}
  ${lensGroup(650, true)}
  <path d="M 372 168 Q 450 ${shape === 'aviator' ? 150 : 140} 528 168" fill="none" stroke="${frame}" stroke-width="${Math.max(stroke, 12)}" stroke-linecap="round"/>
  ${shape === 'aviator' ? `<path d="M 372 104 L 528 104" fill="none" stroke="${frame}" stroke-width="9" stroke-linecap="round"/>` : ''}
  <path d="M 106 150 L 18 132 M 794 150 L 882 132" fill="none" stroke="${frame}" stroke-width="${Math.max(stroke, 12)}" stroke-linecap="round"/>
</svg>`
}

export const svgDataUrl = (svg: string) => `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
