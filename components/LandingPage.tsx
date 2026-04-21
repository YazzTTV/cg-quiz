'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { GuestLoginButton } from '@/components/GuestLoginButton'
import { BackgroundEffects } from '@/components/landing/BackgroundEffects'
import { PremiumNavbar } from '@/components/landing/PremiumNavbar'
import { Hero } from '@/components/landing/Hero'
import { EvolutionCard } from '@/components/landing/EvolutionCard'
import { StatsCard } from '@/components/landing/StatsCard'

export default function LandingPage() {
  return (
    <main className="relative overflow-x-hidden text-white">
      <BackgroundEffects />
      <section className="relative min-h-screen px-4 pb-10 pt-6 sm:pb-14">
        <div className="mx-auto max-w-6xl">
          <PremiumNavbar />
          <Hero />

          <div className="mt-7 grid gap-4 lg:grid-cols-3">
            <EvolutionCard />
            <StatsCard />
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.5 }}
            transition={{ duration: 0.7 }}
            className="mt-7 flex flex-wrap items-center gap-3"
          >
            <Link href="/login" className="premium-btn-glow rounded-full border border-white/25 bg-white/10 px-5 py-2 font-semibold backdrop-blur hover:bg-white/20">
              Se connecter
            </Link>
            <GuestLoginButton className="inline-block" buttonClassName="premium-btn-glow rounded-full border border-white/20 bg-emerald-500/90 px-5 py-2 font-semibold hover:bg-emerald-500" />
            <Link href="/test-blitz" className="premium-btn-glow rounded-full border border-white/25 bg-white/10 px-5 py-2 font-semibold backdrop-blur hover:bg-white/20">
              Mode Blitz
            </Link>
          </motion.div>
        </div>
      </section>

      <section className="relative mx-auto max-w-6xl px-4 py-20">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.35 }}
          transition={{ duration: 0.7 }}
          className="mb-12 text-center"
        >
          <h2 className="text-3xl font-bold">Pourquoi IAE Trainer</h2>
          <p className="mt-2 text-white/70">
            Une plateforme de préparation moderne, simple à prendre en main et orientée résultat.
          </p>
        </motion.div>
        <div className="grid gap-6 md:grid-cols-3">
          <motion.article
            initial={{ opacity: 0, y: 22 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.65 }}
            className="rounded-2xl border border-white/12 bg-black/30 p-6 backdrop-blur"
          >
            <h3 className="text-xl font-bold">Révision intelligente</h3>
            <p className="mt-2 text-white/75">
              Planification progressive pour mémoriser durablement les notions du test.
            </p>
            <Link href="/review" className="mt-5 inline-block font-semibold text-white hover:underline">
              Commencer →
            </Link>
          </motion.article>
          <motion.article
            initial={{ opacity: 0, y: 22 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.65, delay: 0.08 }}
            className="rounded-2xl border border-white/12 bg-black/30 p-6 backdrop-blur"
          >
            <h3 className="text-xl font-bold">Test blanc</h3>
            <p className="mt-2 text-white/75">
              Simulation réaliste pour mesurer votre niveau avant le jour J.
            </p>
            <Link href="/test-blanc" className="mt-5 inline-block font-semibold text-white hover:underline">
              Lancer un test →
            </Link>
          </motion.article>
          <motion.article
            initial={{ opacity: 0, y: 22 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.65, delay: 0.16 }}
            className="rounded-2xl border border-white/12 bg-black/30 p-6 backdrop-blur"
          >
            <h3 className="text-xl font-bold">Progression</h3>
            <p className="mt-2 text-white/75">
              Dashboard clair avec score estimé et axes d’amélioration concrets.
            </p>
            <Link href="/dashboard" className="mt-5 inline-block font-semibold text-white hover:underline">
              Voir mes stats →
            </Link>
          </motion.article>
        </div>
      </section>

      <motion.section
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.35 }}
        transition={{ duration: 0.7 }}
        className="relative px-4 py-16 text-center"
      >
        <h2 className="text-3xl font-bold">Pret a faire evoluer ton score ?</h2>
        <p className="mx-auto mt-3 max-w-2xl text-white/70">
          Cree ton compte, lance tes premieres sessions, puis laisse la plateforme t'emmener vers un meilleur score.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link href="/register" className="premium-btn-glow rounded-full bg-white px-6 py-3 font-semibold text-black hover:bg-white/90">
            Get Started
          </Link>
          <Link href="/duo" className="premium-btn-glow rounded-full border border-white/30 px-6 py-3 font-semibold hover:bg-white/10">
            Essayer le mode duo
          </Link>
        </div>
      </motion.section>
    </main>
  )
}

