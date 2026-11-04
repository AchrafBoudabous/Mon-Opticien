'use client'

import { useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { LogoMark } from '@/components/ui/icons'
import { buttonClass } from '@/components/ui/button'

export default function LoginPage() {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/admin/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })
      if (res.ok) {
        router.replace('/admin')
        router.refresh()
        return
      }
      const data = await res.json().catch(() => ({}))
      setError(data.error ?? 'Mot de passe incorrect.')
    } catch {
      setError('Connexion impossible. Vérifiez votre réseau.')
    }
    setLoading(false)
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm rounded-3xl border border-line bg-surface p-8 shadow-soft">
        <div className="mb-8 text-center">
          <LogoMark size={44} className="mx-auto" />
          <h1 className="mt-4 font-serif text-3xl text-ink">Mon Opticien</h1>
          <p className="mt-1 text-sm text-muted">Administration</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-ink">
              Mot de passe
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border border-line bg-paper px-4 py-2.5 text-sm focus:border-ink/40 focus:outline-none focus:ring-2 focus:ring-accent/30"
              autoFocus
              required
            />
          </div>

          {error && (
            <p role="alert" className="text-sm text-red-700">
              {error}
            </p>
          )}

          <button type="submit" disabled={loading} className={buttonClass({ className: 'w-full' })}>
            {loading && <Loader2 size={16} className="animate-spin" aria-hidden="true" />}
            {loading ? 'Connexion…' : 'Se connecter'}
          </button>
        </form>
      </div>
    </main>
  )
}
