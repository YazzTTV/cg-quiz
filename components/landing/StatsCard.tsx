'use client'

import { motion } from 'framer-motion'

export function StatsCard() {
  return (
    <motion.article
      initial={{ opacity: 0, y: 26 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.75, delay: 0.1 }}
      className="rounded-[1.6rem] border border-white/15 bg-black/32 p-6 backdrop-blur-xl"
    >
      <div className="mb-3 flex items-center gap-3">
        <p className="text-sm uppercase tracking-[0.18em] text-white/70">Indicateurs</p>
        <div className="h-px flex-1 bg-white/20" />
      </div>
      <div className="mt-4 grid grid-cols-2 gap-4">
        <div>
          <p className="text-4xl font-semibold text-white">1200+</p>
          <p className="text-sm text-white/72">Notions clés travaillées</p>
        </div>
        <div>
          <p className="text-4xl font-semibold text-white">310+</p>
          <p className="text-sm text-white/72">Score prédit visé</p>
        </div>
      </div>
      <p className="mt-4 text-sm leading-relaxed text-white/76">
        Suivez votre progression en continu avec une estimation claire de performance et des objectifs réalistes pour
        monter en score.
      </p>
    </motion.article>
  )
}

