'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function LogoutButton() {
  const router = useRouter()
  const [pending, setPending] = useState(false)

  async function handleLogout() {
    setPending(true)
    await fetch('/api/admin/auth', { method: 'DELETE' }).catch(() => null)
    router.replace('/admin/login')
    router.refresh()
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      disabled={pending}
      className="text-sm text-muted transition-colors hover:text-ink disabled:opacity-50"
    >
      {pending ? 'Déconnexion…' : 'Déconnexion'}
    </button>
  )
}
