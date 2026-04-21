'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'

type GuestLoginButtonProps = {
  className?: string
  buttonClassName?: string
}

export function GuestLoginButton({ className = '', buttonClassName = '' }: GuestLoginButtonProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleGuestLogin = async () => {
    setError('')
    setLoading(true)

    try {
      const result = await signIn('guest', { redirect: false })
      if (result?.error) {
        setError("Impossible de se connecter en invité pour l'instant")
        return
      }
      router.push('/review')
    } catch {
      setError("Impossible de se connecter en invité pour l'instant")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={className}>
      <button
        type="button"
        onClick={handleGuestLogin}
        disabled={loading}
        className={`px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-60 ${buttonClassName}`}
      >
        {loading ? 'Connexion invité...' : "Se connecter en tant qu'invité"}
      </button>
      {error && <p className="mt-2 text-sm text-red-600 dark:text-red-400">{error}</p>}
    </div>
  )
}
