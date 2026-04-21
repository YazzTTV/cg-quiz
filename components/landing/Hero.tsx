'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'

export function Hero() {
  return (
    <section className="relative mt-14 flex min-h-[64vh] items-center justify-center py-10 sm:mt-16 sm:min-h-[68vh]">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,.1),transparent_60%)]" />
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.75 }}
        className="relative z-10 mx-auto max-w-4xl space-y-8 text-center"
      >
        <p className="text-sm uppercase tracking-[0.22em] text-white/72">// Préparation IAE Message</p>
        <h1 className="text-5xl font-semibold leading-[1.08] tracking-[-0.01em] text-white sm:text-6xl lg:text-[4.6rem] [font-family:Inter,ui-sans-serif,system-ui,sans-serif]">
          Maîtrisez le Test IAE.
          <br />
          Faites Évoluer Votre Score.
        </h1>
        <p className="mx-auto max-w-2xl text-lg leading-relaxed text-white/80">
          Une méthode structurée pour progresser efficacement sur toutes les épreuves du test IAE Message.
        </p>
        <div className="flex flex-wrap justify-center gap-3 pt-1">
          <Link
            href="/review"
            className="premium-btn-glow rounded-full border border-white/70 bg-white px-6 py-3 font-semibold text-black transition hover:bg-white/90"
          >
            Commencer les micro-tests
          </Link>
          <Link
            href="/review"
            className="premium-btn-glow rounded-full border border-white/30 bg-white/5 px-6 py-3 font-semibold text-white backdrop-blur transition hover:bg-white/12"
          >
            Découvrir la méthode
          </Link>
        </div>
        <p className="pt-2 text-sm text-white/62">Conçu pour maximiser votre score au test IAE Message.</p>
      </motion.div>
    </section>
  )
}

