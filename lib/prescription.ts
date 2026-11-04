// Prescription model, validation and a deterministic, auditable explanation engine.
// The AI (when used) only extracts numbers; every sentence shown to the visitor comes from here.
import type { Locale } from '@/data/translations'

export interface EyeRx {
  sphere: number | null
  cylinder: number | null
  axis: number | null
  add: number | null
}
export interface Rx {
  right: EyeRx
  left: EyeRx
  pd: number | null
}

export const EMPTY_RX: Rx = {
  right: { sphere: null, cylinder: null, axis: null, add: null },
  left: { sphere: null, cylinder: null, axis: null, add: null },
  pd: null,
}

export const RANGES = {
  sphere: { min: -30, max: 30, step: 0.25 },
  cylinder: { min: -10, max: 10, step: 0.25 },
  axis: { min: 0, max: 180, step: 1 },
  add: { min: 0, max: 4, step: 0.25 },
  pd: { min: 40, max: 80, step: 0.5 },
} as const
export type RxField = keyof typeof RANGES

/** Parses "−2,25", "+1.5", "plan" … → number | null | 'invalid'. */
export function parseRxValue(raw: string, field: RxField): number | null | 'invalid' {
  const s = raw.trim().replace(',', '.').replace(/[−–]/g, '-').toLowerCase()
  if (s === '') return null
  if (['plan', 'plano', 'pl', '0'].includes(s) && (field === 'sphere' || field === 'cylinder')) return 0
  if (!/^[+-]?\d{1,3}(\.\d{1,2})?$/.test(s)) return 'invalid'
  return normalizeValue(Number(s), field)
}

/** Rounds to the field's step and range-checks. */
export function normalizeValue(n: number, field: RxField): number | 'invalid' {
  const { min, max, step } = RANGES[field]
  if (!Number.isFinite(n)) return 'invalid'
  const rounded = Math.round(n / step) * step
  if (rounded < min || rounded > max) return 'invalid'
  return field === 'axis' && rounded === 0 ? 180 : Number(rounded.toFixed(2))
}

const sanitize = (v: unknown, field: RxField): number | null => {
  if (typeof v !== 'number') return null
  const r = normalizeValue(v, field)
  return r === 'invalid' ? null : r
}

/** Server-side clean-up of untrusted (AI or client) values: out-of-range → null. */
export function sanitizeRx(input: unknown): Rx {
  const o = (input ?? {}) as Record<string, Record<string, unknown> | unknown>
  const eye = (e: unknown): EyeRx => {
    const x = (e ?? {}) as Record<string, unknown>
    return {
      sphere: sanitize(x.sphere, 'sphere'),
      cylinder: sanitize(x.cylinder, 'cylinder'),
      axis: sanitize(x.axis, 'axis'),
      add: sanitize(x.add, 'add'),
    }
  }
  return { right: eye(o.right), left: eye(o.left), pd: sanitize(o.pd, 'pd') }
}

export const hasValues = (rx: Rx) =>
  [rx.right, rx.left].some((e) => e.sphere !== null || e.cylinder !== null)

export const fmtDiopter = (n: number | null) =>
  n === null ? '—' : n === 0 ? '0.00' : `${n > 0 ? '+' : ''}${n.toFixed(2)}`

// ─── Explanation engine ──────────────────────────────────────────────────────

const COPY = {
  fr: {
    plano: 'Aucune correction de loin sur cet œil.',
    myopia: (lvl: string, v: string) => `Myopie ${lvl} (${v}) : la vision de loin est floue, la vision de près reste nette.`,
    hyperopia: (lvl: string, v: string) => `Hypermétropie ${lvl} (${v}) : l’œil force pour voir net, surtout de près ; fatigue visuelle possible.`,
    astig: (lvl: string, v: string, axis: string) => `Astigmatisme ${lvl} (${v}, axe ${axis}) : la vision peut être déformée ou dédoublée, de loin comme de près.`,
    astigNoAxis: 'Un cylindre est indiqué sans axe : vérifiez l’ordonnance, l’axe est indispensable.',
    presbyopia: (v: string) => `Presbytie (addition ${v}) : une correction supplémentaire pour lire et voir de près.`,
    levels: { mild: 'légère', moderate: 'modérée', high: 'forte' }, // myopie, hypermétropie (f.)
    levelsM: { mild: 'léger', moderate: 'modéré', high: 'fort' }, // astigmatisme (m.)
    index: (idx: string, why: string) => `Verres d’indice ${idx} — ${why}`,
    idx: {
      '1.5': 'standard, parfaits pour une correction légère.',
      '1.6': 'amincis, plus fins et plus légers pour votre correction.',
      '1.67': 'très amincis, recommandés pour une correction forte.',
      '1.74': 'ultra-fins, pour limiter l’épaisseur d’une correction très forte.',
    } as Record<string, string>,
    progressive: 'Verres progressifs : vision nette de loin à près dans une seule paire (ou verres de lecture si vous ne corrigez que la vision de près).',
    antireflect: 'Traitement antireflet conseillé : moins de reflets, plus de confort, notamment de nuit et sur écran.',
    toric: 'En lentilles : votre astigmatisme demande des lentilles toriques.',
    clConversion: 'En lentilles : la puissance diffère légèrement de celle des lunettes au-delà de ±4 ; l’adaptation se fait avec l’opticien.',
    aniso: 'Écart important entre les deux yeux : l’adaptation des verres mérite une attention particulière de l’opticien.',
    framesHighMinus: 'Préférez des montures pas trop grandes et cerclées (acétate) : elles masquent l’épaisseur du bord des verres. Évitez les montures percées.',
    framesHighPlus: 'Des montures plutôt petites et arrondies limitent l’épaisseur et le poids des verres.',
    framesProgressive: 'Pour des verres progressifs, choisissez une monture d’au moins 30 mm de hauteur.',
    framesAny: 'Votre correction est compatible avec pratiquement toutes les formes de montures.',
    eye: { right: 'Œil droit', left: 'Œil gauche' },
  },
  en: {
    plano: 'No distance correction for this eye.',
    myopia: (lvl: string, v: string) => `${lvl} short-sightedness (${v}): distance vision is blurry, near vision stays sharp.`,
    hyperopia: (lvl: string, v: string) => `${lvl} long-sightedness (${v}): the eye strains to focus, especially up close; eye fatigue is common.`,
    astig: (lvl: string, v: string, axis: string) => `${lvl} astigmatism (${v}, axis ${axis}): vision can look stretched or doubled, both far and near.`,
    astigNoAxis: 'A cylinder is given without an axis: check the prescription, the axis is required.',
    presbyopia: (v: string) => `Presbyopia (addition ${v}): extra power for reading and close-up work.`,
    levels: { mild: 'Mild', moderate: 'Moderate', high: 'Strong' },
    levelsM: { mild: 'Mild', moderate: 'Moderate', high: 'Strong' },
    index: (idx: string, why: string) => `${idx}-index lenses — ${why}`,
    idx: {
      '1.5': 'standard, ideal for a light correction.',
      '1.6': 'thinned, thinner and lighter for your correction.',
      '1.67': 'extra-thin, recommended for a strong correction.',
      '1.74': 'ultra-thin, to minimise the thickness of a very strong correction.',
    } as Record<string, string>,
    progressive: 'Progressive lenses: sharp vision from far to near in one pair (or reading glasses if you only correct near vision).',
    antireflect: 'Anti-reflective coating recommended: fewer reflections and more comfort, especially at night and on screens.',
    toric: 'For contact lenses: your astigmatism calls for toric lenses.',
    clConversion: 'For contact lenses: beyond ±4 the power differs slightly from glasses; your optician will fit them.',
    aniso: 'Large difference between the two eyes: your optician should take particular care fitting the lenses.',
    framesHighMinus: 'Choose moderately sized, full-rim (acetate) frames: they hide the lens edge thickness. Avoid rimless frames.',
    framesHighPlus: 'Smaller, rounder frames keep the lenses thinner and lighter.',
    framesProgressive: 'For progressive lenses, choose a frame at least 30 mm tall.',
    framesAny: 'Your prescription works with practically every frame shape.',
    eye: { right: 'Right eye', left: 'Left eye' },
  },
}

type Level = 'mild' | 'moderate' | 'high'
const level = (abs: number, mild: number, moderate: number): Level =>
  abs <= mild ? 'mild' : abs <= moderate ? 'moderate' : 'high'

export interface Explanation {
  eyes: { eye: 'right' | 'left'; title: string; lines: string[] }[]
  lenses: string[]
  frames: string[]
}

export function explainRx(rx: Rx, locale: Locale): Explanation {
  const c = COPY[locale]
  const eyes = (['right', 'left'] as const)
    .map((side) => {
      const e = rx[side]
      if (e.sphere === null && e.cylinder === null && e.add === null) return null
      const sph = e.sphere ?? 0
      const cyl = e.cylinder ?? 0
      const lines: string[] = []
      if (sph < 0) lines.push(c.myopia(c.levels[level(-sph, 3, 6)], fmtDiopter(sph)))
      else if (sph > 0) lines.push(c.hyperopia(c.levels[level(sph, 2, 5)], fmtDiopter(sph)))
      if (Math.abs(cyl) >= 0.25) {
        lines.push(
          e.axis === null
            ? c.astigNoAxis
            : c.astig(c.levelsM[level(Math.abs(cyl), 0.75, 2)], fmtDiopter(cyl), `${e.axis}°`)
        )
      }
      if (sph === 0 && Math.abs(cyl) < 0.25) lines.push(c.plano)
      if (e.add && e.add > 0) lines.push(c.presbyopia(fmtDiopter(e.add)))
      return { eye: side, title: c.eye[side], lines }
    })
    .filter((x): x is NonNullable<typeof x> => x !== null)

  // Strongest meridian across both eyes (sph and sph+cyl, sign-convention agnostic).
  const powers = [rx.right, rx.left].flatMap((e) => {
    const sph = e.sphere ?? 0
    return [sph, sph + (e.cylinder ?? 0)]
  })
  const maxAbs = Math.max(0, ...powers.map(Math.abs))
  const minPower = Math.min(0, ...powers)
  const maxPower = Math.max(0, ...powers)
  const hasAdd = [rx.right, rx.left].some((e) => (e.add ?? 0) > 0)
  const maxCyl = Math.max(0, ...[rx.right, rx.left].map((e) => Math.abs(e.cylinder ?? 0)))
  const sphR = rx.right.sphere
  const sphL = rx.left.sphere

  const idx = maxAbs <= 2 ? '1.5' : maxAbs <= 4 ? '1.6' : maxAbs <= 6 ? '1.67' : '1.74'
  const lenses = [c.index(idx, c.idx[idx])]
  if (hasAdd) lenses.push(c.progressive)
  lenses.push(c.antireflect)
  if (maxCyl >= 0.75) lenses.push(c.toric)
  if (maxAbs > 4) lenses.push(c.clConversion)
  if (sphR !== null && sphL !== null && Math.abs(sphR - sphL) >= 2) lenses.push(c.aniso)

  const frames: string[] = []
  if (minPower <= -4) frames.push(c.framesHighMinus)
  if (maxPower >= 3) frames.push(c.framesHighPlus)
  if (hasAdd) frames.push(c.framesProgressive)
  if (frames.length === 0) frames.push(c.framesAny)

  return { eyes, lenses, frames }
}

/** Compact text for the optician (WhatsApp). */
export function rxSummary(rx: Rx, locale: Locale): string {
  const eye = (label: string, e: EyeRx) =>
    `${label} : SPH ${fmtDiopter(e.sphere)} · CYL ${fmtDiopter(e.cylinder)}${e.axis !== null ? ` · ${locale === 'fr' ? 'AXE' : 'AXIS'} ${e.axis}°` : ''}${e.add ? ` · ADD ${fmtDiopter(e.add)}` : ''}`
  return [
    eye(locale === 'fr' ? 'OD' : 'OD (R)', rx.right),
    eye(locale === 'fr' ? 'OG' : 'OS (L)', rx.left),
    ...(rx.pd ? [`${locale === 'fr' ? 'EP' : 'PD'} : ${rx.pd} mm`] : []),
  ].join('\n')
}
