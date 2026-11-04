'use client'

import { useRef, useState, type ChangeEvent } from 'react'
import Link from 'next/link'
import { AlertTriangle, ArrowRight, Camera, Eye, Glasses, Keyboard, Loader2, RotateCcw, Sparkles } from 'lucide-react'
import { track } from '@vercel/analytics'
import type { Locale, Translations } from '@/data/translations'
import {
  EMPTY_RX,
  explainRx,
  hasValues,
  parseRxValue,
  rxSummary,
  type Explanation,
  type Rx,
  type RxField,
} from '@/lib/prescription'
import { whatsappUrl } from '@/lib/site'
import { buttonClass } from '@/components/ui/button'
import { WhatsAppIcon } from '@/components/ui/icons'
import { cn } from '@/lib/utils'

interface Props {
  locale: Locale
  t: Translations['prescription']
  aiEnabled: boolean
}

type Step = 'start' | 'review' | 'result'
type EyeKey = 'right' | 'left'
const EYE_FIELDS: Exclude<RxField, 'pd'>[] = ['sphere', 'cylinder', 'axis', 'add']

/** Re-encodes the photo as a ≤1600px JPEG in the browser: smaller upload, EXIF (GPS…) stripped. */
async function prepareImage(file: File): Promise<Blob> {
  const url = URL.createObjectURL(file)
  try {
    const img = new Image()
    img.src = url
    await img.decode()
    const scale = Math.min(1, 1600 / Math.max(img.naturalWidth, img.naturalHeight))
    const canvas = document.createElement('canvas')
    canvas.width = Math.round(img.naturalWidth * scale)
    canvas.height = Math.round(img.naturalHeight * scale)
    canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height)
    const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, 'image/jpeg', 0.88))
    if (!blob) throw new Error('encode')
    return blob
  } finally {
    URL.revokeObjectURL(url)
  }
}

const toText = (rx: Rx) => {
  const v = (n: number | null) => (n === null ? '' : String(n))
  return {
    right: Object.fromEntries(EYE_FIELDS.map((f) => [f, v(rx.right[f])])) as Record<string, string>,
    left: Object.fromEntries(EYE_FIELDS.map((f) => [f, v(rx.left[f])])) as Record<string, string>,
    pd: v(rx.pd),
  }
}

export default function PrescriptionClient({ locale, t, aiEnabled }: Props) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [step, setStep] = useState<Step>('start')
  const [consent, setConsent] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [lowConfidence, setLowConfidence] = useState(false)
  const [values, setValues] = useState(toText(EMPTY_RX))
  const [rx, setRx] = useState<Rx>(EMPTY_RX)
  const [result, setResult] = useState<Explanation | null>(null)

  async function onFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setError('')
    setBusy(true)
    try {
      let blob: Blob
      try {
        blob = await prepareImage(file)
      } catch {
        setError(t.error_file)
        return
      }
      const form = new FormData()
      form.append('file', blob, 'prescription.jpg')
      form.append('consent', 'yes')
      const res = await fetch('/api/prescription/extract', { method: 'POST', body: form })
      const data = await res.json().catch(() => ({}))
      if (res.ok && data.rx) {
        track('prescription_extract', { confidence: data.confidence })
        setValues(toText(data.rx))
        setLowConfidence(data.confidence === 'low')
        setStep('review')
        return
      }
      setError(
        res.status === 429 ? t.error_rate
        : data.error === 'not_prescription' ? t.not_prescription
        : data.error === 'file' ? t.error_file
        : data.error === 'disabled' ? t.ai_off
        : t.error_generic
      )
    } catch {
      setError(t.error_generic)
    } finally {
      setBusy(false)
    }
  }

  // Parse every field; returns null if any is invalid.
  const parsed = (() => {
    const out: Rx = { right: { ...EMPTY_RX.right }, left: { ...EMPTY_RX.left }, pd: null }
    const invalid = new Set<string>()
    for (const eye of ['right', 'left'] as const) {
      for (const f of EYE_FIELDS) {
        const r = parseRxValue(values[eye][f], f)
        if (r === 'invalid') invalid.add(`${eye}.${f}`)
        else out[eye][f] = r
      }
    }
    const pd = parseRxValue(values.pd, 'pd')
    if (pd === 'invalid') invalid.add('pd')
    else out.pd = pd
    return { rx: out, invalid }
  })()

  function explain() {
    if (parsed.invalid.size > 0) return
    if (!hasValues(parsed.rx)) return setError(t.empty)
    setError('')
    setRx(parsed.rx)
    setResult(explainRx(parsed.rx, locale))
    setStep('result')
    track('prescription_explained')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function reset() {
    setStep('start')
    setValues(toText(EMPTY_RX))
    setResult(null)
    setError('')
    setLowConfidence(false)
  }

  const inputCls = (bad: boolean) =>
    cn(
      'h-11 w-full rounded-xl border bg-paper px-3 text-center text-sm tabular-nums text-ink focus:bg-surface focus:outline-none focus:ring-2 focus:ring-accent/30',
      bad ? 'border-red-400' : 'border-line focus:border-ink/40'
    )

  if (step === 'start') {
    return (
      <div className="grid gap-5 lg:grid-cols-[1.3fr_1fr]">
        <section aria-labelledby="rx-upload" className="rounded-3xl border border-line bg-surface p-6 sm:p-8">
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-accent-soft text-accent-strong">
            <Camera size={20} aria-hidden="true" />
          </span>
          <h2 id="rx-upload" className="mt-5 font-serif text-3xl">{t.upload_title}</h2>
          {aiEnabled ? (
            <>
              <p className="mt-2 text-sm text-muted">{t.upload_text}</p>
              <label className="mt-6 flex cursor-pointer items-start gap-3 rounded-2xl bg-paper p-4 text-sm text-ink-soft">
                <input
                  type="checkbox"
                  checked={consent}
                  onChange={(e) => setConsent(e.target.checked)}
                  className="mt-0.5 h-4 w-4 shrink-0 accent-ink"
                />
                <span>{t.consent}</span>
              </label>
              <button
                type="button"
                disabled={!consent || busy}
                onClick={() => fileRef.current?.click()}
                className={buttonClass({ variant: 'primary', size: 'lg', className: 'mt-5 w-full sm:w-auto' })}
              >
                {busy ? <Loader2 size={18} className="animate-spin" aria-hidden="true" /> : <Sparkles size={17} aria-hidden="true" />}
                {busy ? t.analyzing : t.choose_photo}
              </button>
              <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" capture="environment" onChange={onFile} className="hidden" />
            </>
          ) : (
            <p className="mt-3 rounded-2xl bg-paper p-4 text-sm text-ink-soft">{t.ai_off}</p>
          )}
          {error && (
            <p role="alert" className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-800">
              {error}
            </p>
          )}
        </section>

        <section aria-labelledby="rx-manual" className="flex flex-col rounded-3xl border border-line bg-paper p-6 sm:p-8">
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-sand text-ink">
            <Keyboard size={20} aria-hidden="true" />
          </span>
          <h2 id="rx-manual" className="mt-5 font-serif text-3xl">{t.manual}</h2>
          <p className="mt-2 flex-1 text-sm text-muted">{t.review_text}</p>
          <button
            type="button"
            onClick={() => {
              setError('')
              setStep('review')
            }}
            className={buttonClass({ variant: 'secondary', size: 'lg', className: 'mt-6 w-full sm:w-auto' })}
          >
            {t.manual}
            <ArrowRight size={16} aria-hidden="true" />
          </button>
        </section>
      </div>
    )
  }

  if (step === 'review') {
    return (
      <section aria-labelledby="rx-review" className="rounded-3xl border border-line bg-surface p-6 sm:p-8">
        <h2 id="rx-review" className="font-serif text-3xl">{t.review_title}</h2>
        <p className="mt-2 text-sm text-muted">{t.review_text}</p>
        {lowConfidence && (
          <p className="mt-4 flex items-start gap-2 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900">
            <AlertTriangle size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
            {t.low_confidence}
          </p>
        )}

        <div className="mt-6 overflow-x-auto">
          <table className="w-full min-w-[520px] border-separate border-spacing-2 text-sm">
            <thead>
              <tr>
                <th scope="col" className="sr-only">{t.right_eye}</th>
                {EYE_FIELDS.map((f) => (
                  <th key={f} scope="col" className="text-xs font-medium uppercase tracking-[0.12em] text-muted">
                    {t[f]}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(['right', 'left'] as EyeKey[]).map((eye) => (
                <tr key={eye}>
                  <th scope="row" className="whitespace-nowrap pr-2 text-left font-medium text-ink">
                    {eye === 'right' ? t.right_eye : t.left_eye}
                  </th>
                  {EYE_FIELDS.map((f) => {
                    const bad = parsed.invalid.has(`${eye}.${f}`)
                    return (
                      <td key={f}>
                        <input
                          aria-label={`${eye === 'right' ? t.right_eye : t.left_eye} — ${t[f]}`}
                          aria-invalid={bad}
                          inputMode="decimal"
                          maxLength={7}
                          placeholder={f === 'axis' ? '0–180' : f === 'add' ? '+0.00' : '±0.00'}
                          value={values[eye][f]}
                          onChange={(e) => setValues({ ...values, [eye]: { ...values[eye], [f]: e.target.value } })}
                          className={inputCls(bad)}
                        />
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-4 max-w-[220px]">
          <label htmlFor="rx-pd" className="mb-1.5 block text-xs font-medium uppercase tracking-[0.12em] text-muted">
            {t.pd}
          </label>
          <input
            id="rx-pd"
            inputMode="decimal"
            maxLength={5}
            placeholder="63"
            value={values.pd}
            onChange={(e) => setValues({ ...values, pd: e.target.value })}
            aria-invalid={parsed.invalid.has('pd')}
            className={inputCls(parsed.invalid.has('pd'))}
          />
        </div>

        {error && (
          <p role="alert" className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-800">
            {error}
          </p>
        )}

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={explain}
            disabled={parsed.invalid.size > 0}
            className={buttonClass({ variant: 'primary', size: 'lg' })}
          >
            <Sparkles size={17} aria-hidden="true" />
            {t.explain}
          </button>
          <button type="button" onClick={reset} className={buttonClass({ variant: 'ghost', size: 'lg' })}>
            <RotateCcw size={16} aria-hidden="true" />
            {t.start_over}
          </button>
        </div>
      </section>
    )
  }

  // result
  return (
    <div className="space-y-6" aria-live="polite">
      <section aria-labelledby="rx-result">
        <h2 id="rx-result" className="font-serif text-display-md">{t.result_title}</h2>
        <div className="mt-6 grid gap-5 md:grid-cols-2">
          {result?.eyes.map((e) => (
            <article key={e.eye} className="rounded-3xl border border-line bg-surface p-6">
              <h3 className="flex items-center gap-2 text-sm font-medium uppercase tracking-[0.14em] text-accent">
                <Eye size={16} aria-hidden="true" />
                {e.title}
              </h3>
              <ul className="mt-4 space-y-3 text-[15px] leading-relaxed text-ink">
                {e.lines.map((l) => (
                  <li key={l}>{l}</li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>

      <div className="grid gap-5 md:grid-cols-2">
        <section aria-labelledby="rx-lenses" className="rounded-3xl bg-ink p-6 text-white">
          <h3 id="rx-lenses" className="flex items-center gap-2 font-serif text-2xl">
            <Sparkles size={18} className="text-accent-soft" aria-hidden="true" />
            {t.lenses_title}
          </h3>
          <ul className="mt-4 space-y-3 text-sm leading-relaxed text-white/80">
            {result?.lenses.map((l) => <li key={l}>{l}</li>)}
          </ul>
        </section>
        <section aria-labelledby="rx-frames" className="rounded-3xl border border-line bg-surface p-6">
          <h3 id="rx-frames" className="flex items-center gap-2 font-serif text-2xl">
            <Glasses size={18} className="text-accent" aria-hidden="true" />
            {t.frames_title}
          </h3>
          <ul className="mt-4 space-y-3 text-sm leading-relaxed text-ink-soft">
            {result?.frames.map((l) => <li key={l}>{l}</li>)}
          </ul>
          <Link
            href={`/${locale}/products?category=eyeglasses`}
            className={buttonClass({ variant: 'secondary', size: 'md', className: 'mt-5' })}
          >
            {t.see_frames}
            <ArrowRight size={15} aria-hidden="true" />
          </Link>
        </section>
      </div>

      <section className="rounded-3xl border border-line bg-paper p-6 sm:p-8">
        <h3 className="font-serif text-2xl">{t.cta_title}</h3>
        <div className="mt-5 flex flex-col gap-3 sm:flex-row">
          <a
            href={whatsappUrl(`${t.wa_intro}\n\n${rxSummary(rx, locale)}`)}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => track('whatsapp_click', { placement: 'prescription' })}
            className={buttonClass({ variant: 'whatsapp', size: 'lg' })}
          >
            <WhatsAppIcon size={18} />
            {t.cta_whatsapp}
          </a>
          <button type="button" onClick={() => setStep('review')} className={buttonClass({ variant: 'secondary', size: 'lg' })}>
            {t.review_title}
          </button>
          <button type="button" onClick={reset} className={buttonClass({ variant: 'ghost', size: 'lg' })}>
            <RotateCcw size={16} aria-hidden="true" />
            {t.start_over}
          </button>
        </div>
      </section>
    </div>
  )
}
