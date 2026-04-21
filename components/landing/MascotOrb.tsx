'use client'

import { motion } from 'framer-motion'

export function MascotOrb() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.5 }}
      transition={{ duration: 0.6 }}
      className="mx-auto mt-8 flex w-fit items-end gap-1"
    >
      <div className="relative h-16 w-16 rounded-full border border-white/30 bg-gradient-to-br from-white/85 via-slate-200/55 to-slate-700/25 shadow-[0_0_28px_rgba(255,255,255,.28)]">
        <span className="absolute left-4 top-6 h-2.5 w-2.5 rounded-full bg-black/70" />
        <span className="absolute right-4 top-6 h-2.5 w-2.5 rounded-full bg-black/70" />
        <span className="absolute left-1/2 top-10 h-1.5 w-5 -translate-x-1/2 rounded-full bg-black/55" />
      </div>
      <motion.div
        className="mb-10 h-3 w-3 rounded-full bg-white/75"
        animate={{ y: [0, -7, 0] }}
        transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="mb-6 h-2.5 w-2.5 rounded-full bg-white/70"
        animate={{ y: [0, -5, 0] }}
        transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
      />
    </motion.div>
  )
}

