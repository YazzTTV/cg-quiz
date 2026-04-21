import Link from 'next/link'
import { BackgroundEffects } from '@/components/landing/BackgroundEffects'
import { PremiumNavbar } from '@/components/landing/PremiumNavbar'

export default function TarifsPage() {
  return (
    <main className="relative min-h-screen overflow-x-hidden px-4 py-6 text-white sm:py-8">
      <BackgroundEffects />
      <div className="relative mx-auto max-w-6xl space-y-10">
        <PremiumNavbar />

        <header className="mx-auto max-w-4xl space-y-4 pt-6 text-center">
          <p className="text-sm uppercase tracking-[0.2em] text-white/70">IAE Trainer</p>
          <h1 className="text-4xl font-semibold sm:text-5xl">Tarifs</h1>
          <p className="mx-auto max-w-2xl text-lg text-white/80">
            Choisissez la formule adaptée à votre préparation pour progresser sereinement jusqu’au test IAE Message.
          </p>
        </header>

        <section className="mx-auto grid max-w-5xl gap-6 md:grid-cols-2">
          <article className="rounded-2xl border border-white/15 bg-black/30 p-7 backdrop-blur">
            <p className="text-sm uppercase tracking-[0.15em] text-white/65">Essentiel</p>
            <h2 className="mt-2 text-3xl font-semibold">Gratuit</h2>
            <p className="mt-1 text-white/70">Pour démarrer et découvrir la méthode.</p>
            <ul className="mt-6 space-y-2 text-white/80">
              <li>• Accès aux micro-tests</li>
              <li>• Suivi de progression de base</li>
              <li>• Accès limité aux tests blancs</li>
            </ul>
            <Link
              href="/review"
              className="premium-btn-glow mt-8 inline-block rounded-full border border-white/30 bg-white/10 px-5 py-2.5 font-semibold hover:bg-white/15"
            >
              Commencer gratuitement
            </Link>
          </article>

          <article className="rounded-2xl border border-white/30 bg-white/10 p-7 backdrop-blur">
            <p className="text-sm uppercase tracking-[0.15em] text-white/70">Premium</p>
            <h2 className="mt-2 text-3xl font-semibold">19€/mois</h2>
            <p className="mt-1 text-white/80">Pour une préparation complète orientée score.</p>
            <ul className="mt-6 space-y-2 text-white/90">
              <li>• Micro-tests illimités</li>
              <li>• Tous les tests blancs</li>
              <li>• Statistiques avancées & score prédit</li>
              <li>• Parcours personnalisé par matière</li>
            </ul>
            <Link
              href="/register"
              className="premium-btn-glow mt-8 inline-block rounded-full border border-white/70 bg-white px-5 py-2.5 font-semibold text-black hover:bg-white/90"
            >
              Passer en Premium
            </Link>
          </article>
        </section>

        <div className="text-center">
          <Link href="/" className="text-white/75 hover:text-white hover:underline">
            Retour à l’accueil
          </Link>
        </div>
      </div>
    </main>
  )
}

