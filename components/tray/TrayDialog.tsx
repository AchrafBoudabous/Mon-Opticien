'use client'

import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { CalendarCheck, Loader2, ShoppingBag, Trash2, X } from 'lucide-react'
import { track } from '@vercel/analytics'
import { useTray } from '@/lib/tray-store'
import { availableDays, formatVisit, slotTime } from '@/lib/visit-slots'
import { whatsappUrl } from '@/lib/site'
import { formatPrice } from '@/lib/utils'
import type { Locale, Translations } from '@/data/translations'
import { buttonClass } from '@/components/ui/button'
import { WhatsAppIcon } from '@/components/ui/icons'

interface TrayDialogProps {
  locale: Locale
  t: Translations['tray']
  onClose: () => void
}

type Status =
  | { kind: 'idle' }
  | { kind: 'submitting' }
  | { kind: 'error'; message: string; fallbackHref?: string }
  | { kind: 'done'; code: string; href: string }

const fieldCls =
  'w-full rounded-xl border border-line bg-paper px-3.5 py-2.5 text-sm text-ink placeholder:text-muted/70 focus:border-ink/40 focus:bg-surface focus:outline-none focus:ring-2 focus:ring-accent/30'
const labelCls = 'mb-1.5 block text-sm font-medium text-ink'

export default function TrayDialog({ locale, t, onClose }: TrayDialogProps) {
  const ref = useRef<HTMLDialogElement>(null)
  const tray = useTray()
  const days = useMemo(() => availableDays(), [])
  const [day, setDay] = useState(days[0]?.date ?? '')
  const [slot, setSlot] = useState(days[0]?.slots[0] ?? '')
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [note, setNote] = useState('')
  const [website, setWebsite] = useState('') // honeypot
  const [status, setStatus] = useState<Status>({ kind: 'idle' })

  // Native modal dialog: focus trap, Escape and inert background come for free.
  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (!dialog.open) dialog.showModal()
    const onCancel = () => onClose()
    dialog.addEventListener('close', onCancel)
    return () => dialog.removeEventListener('close', onCancel)
  }, [onClose])

  const slots = days.find((d) => d.date === day)?.slots ?? []
  const dayLabel = (date: string) => {
    const label = new Intl.DateTimeFormat(locale === 'fr' ? 'fr-FR' : 'en-GB', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      timeZone: 'UTC',
    }).format(new Date(`${date}T12:00:00Z`))
    return label.charAt(0).toUpperCase() + label.slice(1) // "Mercredi 4 novembre", not "Mercredi 4 Novembre"
  }

  function buildMessage(code: string | null) {
    const lines = [
      t.wa_intro,
      ...tray.items.map((i) => `• ${i.brand} — ${locale === 'fr' ? i.name_fr : i.name_en} (${formatPrice(i.price)} TND)`),
      '',
      `${t.wa_visit} : ${formatVisit(slot, locale)}`,
      ...(code ? [`${t.wa_ref} : ${code}`] : []),
      `${t.wa_name} : ${name.trim()}`,
      ...(note.trim() ? [`${t.wa_note} : ${note.trim()}`] : []),
    ]
    return lines.join('\n')
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    if (name.trim().length < 2) return setStatus({ kind: 'error', message: t.error_name })
    setStatus({ kind: 'submitting' })

    try {
      const res = await fetch('/api/reservations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          phone: phone.trim() || undefined,
          note: note.trim() || undefined,
          visitAt: slot,
          productIds: tray.items.map((i) => i.id),
          locale,
          website: website || undefined,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (res.ok && typeof data.code === 'string') {
        const href = whatsappUrl(buildMessage(data.code))
        track('tray_booked', { items: tray.items.length })
        tray.clear()
        return setStatus({ kind: 'done', code: data.code, href })
      }
      const message = data.error === 'slot' ? t.error_slot : res.status === 429 ? t.error_rate : t.error_generic
      setStatus({ kind: 'error', message, fallbackHref: data.error === 'slot' ? undefined : whatsappUrl(buildMessage(null)) })
    } catch {
      setStatus({ kind: 'error', message: t.error_generic, fallbackHref: whatsappUrl(buildMessage(null)) })
    }
  }

  return (
    <dialog
      ref={ref}
      aria-labelledby="tray-title"
      onClick={(e) => e.target === ref.current && ref.current?.close()} // click on backdrop
      className="m-0 ml-auto h-dvh max-h-none w-full max-w-md overflow-hidden bg-paper p-0 text-ink shadow-lift backdrop:bg-ink/40 backdrop:backdrop-blur-sm sm:rounded-l-3xl"
    >
      <div className="flex h-full flex-col">
        <header className="flex items-start justify-between gap-4 border-b border-line px-6 py-5">
          <div>
            <h2 id="tray-title" className="font-serif text-3xl">{t.title}</h2>
            <p className="mt-1 text-sm text-muted">{t.subtitle}</p>
          </div>
          <button
            type="button"
            onClick={() => ref.current?.close()}
            aria-label={t.close}
            className="-mr-2 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full hover:bg-sand"
          >
            <X size={20} aria-hidden="true" />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto px-6 py-6">
          {status.kind === 'done' ? (
            <div className="flex flex-col items-center py-10 text-center" role="status">
              <span className="flex h-14 w-14 items-center justify-center rounded-full bg-whatsapp/10 text-whatsapp">
                <CalendarCheck size={26} aria-hidden="true" />
              </span>
              <h3 className="mt-5 font-serif text-3xl">{t.success_title}</h3>
              <p className="mt-2 max-w-xs text-sm text-muted">{t.success_text.replace('{code}', status.code)}</p>
              <p className="mt-4 rounded-full bg-sand px-4 py-1.5 font-mono text-sm tracking-wider">{status.code}</p>
              <a
                href={status.href}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => track('whatsapp_click', { placement: 'tray_confirm' })}
                className={buttonClass({ variant: 'whatsapp', size: 'lg', className: 'mt-8 w-full' })}
              >
                <WhatsAppIcon size={18} />
                {t.success_whatsapp}
              </a>
              <button type="button" onClick={() => ref.current?.close()} className={buttonClass({ variant: 'ghost', className: 'mt-2' })}>
                {t.done}
              </button>
            </div>
          ) : tray.items.length === 0 ? (
            <div className="flex flex-col items-center py-12 text-center">
              <ShoppingBag size={36} className="text-muted" aria-hidden="true" />
              <h3 className="mt-4 font-serif text-2xl">{t.empty_title}</h3>
              <p className="mt-2 max-w-xs text-sm text-muted">{t.empty_text}</p>
              <Link
                href={`/${locale}/products`}
                onClick={() => ref.current?.close()}
                className={buttonClass({ variant: 'primary', className: 'mt-6' })}
              >
                {t.browse}
              </Link>
            </div>
          ) : (
            <form id="tray-form" onSubmit={onSubmit} noValidate className="space-y-7">
              <section aria-labelledby="tray-items">
                <h3 id="tray-items" className="mb-3 text-xs font-medium uppercase tracking-[0.14em] text-muted">
                  {t.step_items} · {tray.items.length}/5
                </h3>
                <ul className="divide-y divide-line rounded-2xl border border-line bg-surface">
                  {tray.items.map((item) => {
                    const itemName = locale === 'fr' ? item.name_fr : item.name_en
                    return (
                      <li key={item.id} className="flex items-center gap-3 p-3">
                        <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-sand">
                          <Image src={item.image} alt={`${itemName} — ${item.brand}`} fill className="object-cover" sizes="56px" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-[11px] uppercase tracking-[0.12em] text-accent">{item.brand}</p>
                          <Link
                            href={`/${locale}/products/${item.slug}`}
                            onClick={() => ref.current?.close()}
                            className="block truncate text-sm font-medium hover:underline"
                          >
                            {itemName}
                          </Link>
                          <p className="text-xs tabular-nums text-muted">{formatPrice(item.price)} TND</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => tray.remove(item.id)}
                          aria-label={`${t.remove} ${itemName}`}
                          className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-muted hover:bg-sand hover:text-ink"
                        >
                          <Trash2 size={16} aria-hidden="true" />
                        </button>
                      </li>
                    )
                  })}
                </ul>
              </section>

              <fieldset>
                <legend className="mb-3 text-xs font-medium uppercase tracking-[0.14em] text-muted">{t.step_when}</legend>
                {days.length === 0 ? (
                  <p className="text-sm text-muted">{t.no_slots}</p>
                ) : (
                  <div className="grid grid-cols-[1.6fr_1fr] gap-3">
                    <div>
                      <label htmlFor="tray-day" className={labelCls}>{t.day_label}</label>
                      <select
                        id="tray-day"
                        value={day}
                        onChange={(e) => {
                          setDay(e.target.value)
                          setSlot(days.find((d) => d.date === e.target.value)?.slots[0] ?? '')
                        }}
                        className={fieldCls}
                      >
                        {days.map((d) => (
                          <option key={d.date} value={d.date}>{dayLabel(d.date)}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label htmlFor="tray-time" className={labelCls}>{t.time_label}</label>
                      <select id="tray-time" value={slot} onChange={(e) => setSlot(e.target.value)} className={fieldCls}>
                        {slots.map((s) => (
                          <option key={s} value={s}>{slotTime(s)}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}
              </fieldset>

              <div className="space-y-4">
                <div>
                  <label htmlFor="tray-name" className={labelCls}>{t.name_label}</label>
                  <input
                    id="tray-name"
                    autoComplete="name"
                    required
                    minLength={2}
                    maxLength={80}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={t.name_placeholder}
                    className={fieldCls}
                  />
                </div>
                <div>
                  <label htmlFor="tray-phone" className={labelCls}>{t.phone_label}</label>
                  <input
                    id="tray-phone"
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel"
                    maxLength={30}
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/[^+\d\s().-]/g, ''))}
                    placeholder="+216 XX XXX XXX"
                    className={fieldCls}
                  />
                </div>
                <div>
                  <label htmlFor="tray-note" className={labelCls}>{t.note_label}</label>
                  <textarea
                    id="tray-note"
                    rows={2}
                    maxLength={300}
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder={t.note_placeholder}
                    className={`${fieldCls} resize-none`}
                  />
                </div>
                {/* Honeypot — invisible to people and screen readers. */}
                <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
                  <label htmlFor="tray-website">Website</label>
                  <input id="tray-website" tabIndex={-1} autoComplete="off" value={website} onChange={(e) => setWebsite(e.target.value)} />
                </div>
              </div>

              {status.kind === 'error' && (
                <div role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-800">
                  <p>{status.message}</p>
                  {status.fallbackHref && (
                    <a
                      href={status.fallbackHref}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 inline-flex items-center gap-1.5 font-medium underline underline-offset-4"
                    >
                      <WhatsAppIcon size={14} />
                      {t.send_anyway}
                    </a>
                  )}
                </div>
              )}
            </form>
          )}
        </div>

        {status.kind !== 'done' && tray.items.length > 0 && (
          <footer className="border-t border-line bg-surface px-6 py-4">
            <button
              type="submit"
              form="tray-form"
              disabled={status.kind === 'submitting' || !slot}
              className={buttonClass({ variant: 'primary', size: 'lg', className: 'w-full' })}
            >
              {status.kind === 'submitting' ? (
                <Loader2 size={18} className="animate-spin" aria-hidden="true" />
              ) : (
                <CalendarCheck size={18} aria-hidden="true" />
              )}
              {status.kind === 'submitting' ? t.submitting : t.submit}
            </button>
            <p className="mt-2.5 text-center text-[11px] leading-snug text-muted">
              {t.privacy_note}{' '}
              <Link href={`/${locale}/privacy`} onClick={() => ref.current?.close()} className="underline underline-offset-2">
                {t.privacy_link}
              </Link>
            </p>
          </footer>
        )}
      </div>
    </dialog>
  )
}
