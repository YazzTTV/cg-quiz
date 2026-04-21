import Link from 'next/link'
import { BackgroundEffects } from '@/components/landing/BackgroundEffects'
import { PremiumNavbar } from '@/components/landing/PremiumNavbar'

export default function MethodePage() {
  return (
    <main className="relative min-h-screen overflow-x-hidden px-4 py-6 text-white sm:py-8">
      <BackgroundEffects />
      <div className="relative mx-auto max-w-6xl space-y-10">
        <PremiumNavbar />

        <header className="mx-auto max-w-4xl space-y-5 pt-6 text-center">
          <p className="text-sm uppercase tracking-[0.2em] text-white/70">Méthode IAE Trainer</p>
          <h1 className="text-4xl font-semibold leading-tight sm:text-5xl lg:text-6xl">
            Une préparation claire, structurée et orientée score.
          </h1>
          <p className="mx-auto max-w-2xl text-lg text-white/80">
            Notre approche est conçue pour aider les étudiants à progresser efficacement sur chaque matière du test IAE
            Message, avec des sessions courtes et un suivi concret.
          </p>
        </header>

        <section className="mx-auto grid max-w-5xl gap-4 sm:grid-cols-2">
          <article className="rounded-2xl border border-white/15 bg-black/30 p-5 backdrop-blur">
            <h2 className="text-xl font-semibold">1. Diagnostic initial</h2>
            <p className="mt-2 text-white/75">
              Nous identifions vos points forts et vos axes d’amélioration pour prioriser les bons entraînements.
            </p>
          </article>
          <article className="rounded-2xl border border-white/15 bg-black/30 p-5 backdrop-blur">
            <h2 className="text-xl font-semibold">2. Micro-tests ciblés</h2>
            <p className="mt-2 text-white/75">
              Des sessions courtes et régulières pour renforcer les automatismes sur chaque matière.
            </p>
          </article>
          <article className="rounded-2xl border border-white/15 bg-black/30 p-5 backdrop-blur">
            <h2 className="text-xl font-semibold">3. Révisions progressives</h2>
            <p className="mt-2 text-white/75">
              La difficulté évolue avec vos performances pour maintenir un rythme de progression efficace.
            </p>
          </article>
          <article className="rounded-2xl border border-white/15 bg-black/30 p-5 backdrop-blur">
            <h2 className="text-xl font-semibold">4. Validation en test blanc</h2>
            <p className="mt-2 text-white/75">
              Vous mesurez votre niveau en conditions proches de l’examen pour viser un score plus élevé.
            </p>
          </article>
        </section>

        <div className="mx-auto flex max-w-5xl flex-wrap justify-center gap-3 pt-2">
          <Link
            href="/review"
            className="premium-btn-glow rounded-full border border-white/70 bg-white px-6 py-3 font-semibold text-black hover:bg-white/90"
          >
            Commencer les micro-tests
          </Link>
          <Link
            href="/"
            className="premium-btn-glow rounded-full border border-white/30 bg-white/5 px-6 py-3 font-semibold text-white hover:bg-white/10"
          >
            Retour à l’accueil
          </Link>
        </div>
      </div>
    </main>
  )
}

