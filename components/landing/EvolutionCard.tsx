'use client'

import { motion } from 'framer-motion'

const benefits = [
  '500+ questions ciblées IAE Message',
  'Parcours progressif par niveau de difficulté',
  'Matières clés : logique, culture G, mathématiques, gestion',
  'Format micro-apprentissage pour réviser plus efficacement',
]

export function EvolutionCard() {
  return (
    <motion.article
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.7 }}
      className="relative rounded-[1.6rem] border border-white/15 bg-black/32 p-6 backdrop-blur-xl lg:col-span-2"
    >
      <p className="text-sm uppercase tracking-[0.18em] text-white/65">Méthode</p>
      <h2 className="mt-2 text-3xl font-semibold text-white/95">Préparation structurée, pensée pour progresser</h2>
      <div className="mt-5 space-y-3">
        {benefits.map((item) => (
          <div key={item} className="flex items-start gap-3 rounded-xl border border-white/10 bg-black/25 px-4 py-3">
            <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-white/70" />
            <p className="text-sm text-white/84">{item}</p>
          </div>
        ))}
      </div>
    </motion.article>
  )
}

