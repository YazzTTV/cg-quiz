'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Nav } from '@/components/Nav'

type LanguageCode = 'fr' | 'en'

const LANGUAGE_OPTIONS: Array<{ value: LanguageCode; label: string }> = [
  { value: 'fr', label: 'Français' },
  { value: 'en', label: 'English' },
]

export default function OptionsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [language, setLanguage] = useState<LanguageCode>('fr')

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    }
  }, [status, router])

  useEffect(() => {
    const saved = localStorage.getItem('appLanguage') as LanguageCode | null
    if (saved === 'fr' || saved === 'en') {
      setLanguage(saved)
      document.documentElement.lang = saved
    }
  }, [])

  const handleLanguageChange = (next: LanguageCode) => {
    setLanguage(next)
    localStorage.setItem('appLanguage', next)
    document.documentElement.lang = next
  }

  const handleCancelSubscription = () => {
    const confirmCancel = window.confirm(
      "Confirmer la résiliation de l'abonnement ? Cette action prendra effet à la fin de la période en cours."
    )
    if (!confirmCancel) return
    window.alert('Demande de résiliation enregistrée. Le branchement backend sera appliqué ensuite.')
  }

  const handleDeleteAccount = () => {
    const confirmationText = window.prompt(
      "Cette action est irréversible. Tapez SUPPRIMER pour confirmer la suppression du compte."
    )
    if (confirmationText !== 'SUPPRIMER') return
    window.alert('Demande de suppression enregistrée. Le branchement backend sera appliqué ensuite.')
  }

  if (status === 'loading' || !session) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-amber-50 text-slate-900">
        <Nav />
        <main className="mx-auto max-w-4xl px-4 py-16">
          <div className="text-center">Chargement...</div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-amber-50 text-slate-900">
      <Nav />
      <main className="relative z-10 mx-auto max-w-4xl px-4 py-12">
        <div className="mb-10" data-tutorial="options-overview">
          <p className="mb-3 inline-flex rounded-md border border-amber-300 bg-amber-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-amber-900">
            Paramètres du compte
          </p>
          <h1 className="mb-2 text-5xl font-bold text-slate-900">Options</h1>
          <p className="max-w-2xl text-lg text-slate-600">
            Gérez vos préférences et la sécurité de votre compte depuis un espace clair et centralisé.
          </p>
          <button
            type="button"
            onClick={() => window.dispatchEvent(new Event('startTutorial'))}
            className="mt-5 rounded-lg border border-amber-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-amber-50"
          >
            Lancer le didacticiel
          </button>
        </div>

        <section className="mb-6 rounded-xl border border-slate-200 bg-white p-7 shadow-[0_12px_26px_rgba(15,23,42,0.08)]">
          <h2 className="mb-1 text-2xl font-semibold text-slate-900">Langue de l'interface</h2>
          <p className="mb-4 text-slate-600">Choisissez la langue principale de l’application.</p>
          <select
            value={language}
            onChange={(e) => handleLanguageChange(e.target.value as LanguageCode)}
            className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition-colors focus:border-amber-400"
          >
            {LANGUAGE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </section>

        <section className="mb-6 rounded-xl border border-slate-200 bg-white p-7 shadow-[0_12px_26px_rgba(15,23,42,0.08)]">
          <h2 className="mb-1 text-2xl font-semibold text-slate-900">Abonnement</h2>
          <p className="mb-4 text-slate-600">
            Vous pouvez résilier votre abonnement à tout moment depuis cet espace.
          </p>
          <button
            type="button"
            onClick={handleCancelSubscription}
            className="rounded-lg border border-amber-200/60 bg-gradient-to-r from-amber-200 via-amber-100 to-yellow-200 px-5 py-3 font-semibold text-slate-900 transition hover:brightness-105"
          >
            Résilier mon abonnement
          </button>
        </section>

        <section className="rounded-xl border border-red-300/60 bg-white p-7 shadow-[0_12px_26px_rgba(15,23,42,0.08)]">
          <h2 className="mb-1 text-2xl font-semibold text-red-700">Zone dangereuse</h2>
          <p className="mb-4 text-slate-600">
            La suppression du compte est définitive et entraîne la perte des données associées.
          </p>
          <button
            type="button"
            onClick={handleDeleteAccount}
            className="rounded-lg border border-red-300/60 bg-red-600 px-5 py-3 font-semibold text-white transition hover:bg-red-500"
          >
            Supprimer mon compte
          </button>
        </section>
      </main>
    </div>
  )
}
