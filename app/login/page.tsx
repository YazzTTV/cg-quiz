'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      })

      if (result?.error) {
        setError('Email ou mot de passe incorrect')
      } else {
        router.push('/review')
      }
    } catch (err) {
      setError('Une erreur est survenue')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #0a1929 0%, #1e3a5f 50%, #2c5282 100%)',
        color: '#f8f9fa',
        fontFamily: "'Crimson Text', Georgia, serif",
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23d4af37' fill-opacity='0.03'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")",
          opacity: 0.14,
          pointerEvents: 'none',
        }}
      />

      <nav
        style={{
          position: 'fixed',
          top: '24px',
          right: '24px',
          zIndex: 1000,
          display: 'flex',
          gap: '10px',
          background: 'rgba(212, 175, 55, 0.08)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(212, 175, 55, 0.2)',
          borderRadius: '10px',
          padding: '10px',
          fontSize: '16px',
          lineHeight: 1,
        }}
      >
        <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', minHeight: '40px', padding: '10px 16px', borderRadius: '6px', color: '#f8f9fa', textDecoration: 'none', fontWeight: 700 }}>
          Accueil
        </Link>
        <Link href="/tarifs" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', minHeight: '40px', padding: '10px 16px', borderRadius: '6px', color: 'rgba(248, 249, 250, 0.75)', textDecoration: 'none', fontWeight: 700 }}>
          Tarif
        </Link>
        <Link href="/login" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', minHeight: '40px', padding: '10px 16px', borderRadius: '6px', background: 'rgba(212, 175, 55, 0.18)', color: '#f4e4c1', textDecoration: 'none', fontWeight: 700 }}>
          Connexion
        </Link>
      </nav>

      <main className="relative z-10 mx-auto max-w-md px-4 py-28">
        <section
          style={{
            background: 'rgba(212, 175, 55, 0.08)',
            border: '1px solid rgba(212, 175, 55, 0.25)',
            backdropFilter: 'blur(20px)',
            borderRadius: '10px',
            padding: '34px 28px',
            boxShadow: '0 18px 46px rgba(0, 0, 0, 0.28)',
          }}
        >
          <h1 className="mb-2 text-center text-4xl font-bold">Connexion</h1>
          <p className="mb-8 text-center text-lg" style={{ color: 'rgba(248, 249, 250, 0.78)' }}>
            Reprenez votre préparation IAE exactement là où vous en étiez.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div
                style={{
                  padding: '12px 14px',
                  borderRadius: '8px',
                  background: 'rgba(153, 27, 27, 0.26)',
                  border: '1px solid rgba(248, 113, 113, 0.45)',
                  color: '#fecaca',
                }}
              >
                {error}
              </div>
            )}
            <div>
              <label htmlFor="email" className="mb-2 block text-sm font-semibold" style={{ color: 'rgba(248, 249, 250, 0.85)' }}>
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full rounded-lg px-4 py-3 outline-none"
                style={{
                  border: '1px solid rgba(212, 175, 55, 0.35)',
                  background: 'rgba(10, 25, 41, 0.55)',
                  color: '#f8f9fa',
                }}
              />
            </div>
            <div>
              <label htmlFor="password" className="mb-2 block text-sm font-semibold" style={{ color: 'rgba(248, 249, 250, 0.85)' }}>
                Mot de passe
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full rounded-lg px-4 py-3 outline-none"
                style={{
                  border: '1px solid rgba(212, 175, 55, 0.35)',
                  background: 'rgba(10, 25, 41, 0.55)',
                  color: '#f8f9fa',
                }}
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg px-4 py-3 font-bold disabled:opacity-50"
              style={{
                background: 'linear-gradient(135deg, #d4af37 0%, #f4e4c1 50%, #c9a961 100%)',
                color: '#10233f',
              }}
            >
              {loading ? 'Connexion...' : 'Se connecter'}
            </button>
          </form>
          <p className="mt-5 text-center text-sm" style={{ color: 'rgba(248, 249, 250, 0.75)' }}>
            Pas encore de compte ?{' '}
            <Link href="/register" style={{ color: '#f4e4c1', textDecoration: 'underline' }}>
              S'inscrire
            </Link>
          </p>
        </section>
      </main>
    </div>
  )
}

