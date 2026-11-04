'use client'

import { useState, type FormEvent } from 'react'
import { CheckCircle2, Loader2 } from 'lucide-react'
import { track } from '@vercel/analytics'
import type { Translations } from '@/data/translations'
import { WhatsAppIcon } from '@/components/ui/icons'
import { buttonClass } from '@/components/ui/button'
import { whatsappUrl } from '@/lib/site'

const inputCls =
  'w-full rounded-xl border border-line bg-paper px-4 py-3 text-sm text-ink placeholder:text-muted/70 transition-colors hover:border-ink/25 focus:border-ink/40 focus:bg-surface focus:outline-none focus:ring-2 focus:ring-accent/30'
const labelCls = 'mb-1.5 block text-sm font-medium text-ink'

/**
 * The previous form faked a submission (setTimeout) and silently discarded messages.
 * This version composes the message and hands it to WhatsApp — the shop's real inbox —
 * so nothing is lost and no personal data is stored by the site.
 */
export default function ContactForm({ t }: { t: Translations['contact'] }) {
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [status, setStatus] = useState<'idle' | 'opening' | 'done'>('idle')
  const [href, setHref] = useState('')

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!name.trim() || !message.trim()) {
      setError(t.error_required)
      return
    }
    setError('')
    setStatus('opening')

    const text = [
      t.whatsapp_intro,
      '',
      message.trim(),
      '',
      `${t.whatsapp_name} : ${name.trim()}`,
      phone.trim() ? `${t.whatsapp_phone} : ${phone.trim()}` : '',
    ]
      .filter((line, i, arr) => line !== '' || arr[i - 1] !== '')
      .join('\n')
      .trim()

    const url = whatsappUrl(text)
    setHref(url)
    track('contact_form_submit')
    window.open(url, '_blank', 'noopener,noreferrer')
    setStatus('done')
  }

  if (status === 'done') {
    return (
      <div className="rounded-3xl border border-line bg-surface p-8 text-center shadow-soft" role="status">
        <CheckCircle2 size={44} className="mx-auto text-whatsapp" aria-hidden="true" />
        <h2 className="mt-4 font-serif text-3xl text-ink">{t.success_title}</h2>
        <p className="mx-auto mt-2 max-w-sm text-sm text-muted">{t.success_message}</p>
        <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
          <a href={href} target="_blank" rel="noopener noreferrer" className={buttonClass({ variant: 'whatsapp' })}>
            <WhatsAppIcon size={16} />
            {t.success_retry}
          </a>
          <button
            type="button"
            onClick={() => {
              setStatus('idle')
              setName('')
              setPhone('')
              setMessage('')
            }}
            className={buttonClass({ variant: 'secondary' })}
          >
            {t.new_message}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-3xl border border-line bg-surface p-6 shadow-soft sm:p-8">
      <h2 className="font-serif text-3xl text-ink">{t.form_title}</h2>
      <p className="mt-2 text-sm text-muted">{t.form_hint}</p>

      <form onSubmit={handleSubmit} noValidate className="mt-8 space-y-5">
        <div>
          <label htmlFor="cf-name" className={labelCls}>
            {t.name_label} <span className="text-accent" aria-hidden="true">*</span>
          </label>
          <input
            id="cf-name"
            name="name"
            type="text"
            autoComplete="name"
            required
            maxLength={120}
            placeholder={t.name_placeholder}
            value={name}
            onChange={(e) => setName(e.target.value)}
            aria-invalid={!!error && !name.trim()}
            className={inputCls}
          />
        </div>

        <div>
          <label htmlFor="cf-phone" className={labelCls}>{t.phone_label}</label>
          <input
            id="cf-phone"
            name="phone"
            type="tel"
            autoComplete="tel"
            inputMode="tel"
            maxLength={30}
            placeholder={t.phone_placeholder}
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className={inputCls}
          />
        </div>

        <div>
          <label htmlFor="cf-message" className={labelCls}>
            {t.message_label} <span className="text-accent" aria-hidden="true">*</span>
          </label>
          <textarea
            id="cf-message"
            name="message"
            required
            rows={5}
            maxLength={1500}
            placeholder={t.message_placeholder}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            aria-invalid={!!error && !message.trim()}
            className={`${inputCls} resize-y`}
          />
        </div>

        {error && (
          <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={status === 'opening'}
          className={buttonClass({ variant: 'whatsapp', size: 'lg', className: 'w-full' })}
        >
          {status === 'opening' ? (
            <Loader2 size={18} className="animate-spin" aria-hidden="true" />
          ) : (
            <WhatsAppIcon size={18} />
          )}
          {status === 'opening' ? t.submitting : t.submit}
        </button>
      </form>
    </div>
  )
}
