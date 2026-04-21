'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'

const navItems = [
  { label: 'Accueil', href: '/' },
  { label: 'Méthode', href: '/methode' },
  { label: 'Tarifs', href: '/tarifs' },
]

export function PremiumNavbar() {
  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-1 py-2"
    >
      <p className="text-sm font-semibold tracking-[0.2em] text-white/90 sm:text-base">IAE TRAINER</p>
      <nav className="hidden items-center gap-6 rounded-full border border-white/20 bg-black/35 px-7 py-2.5 backdrop-blur-xl md:flex">
        {navItems.map((item) => (
          <Link key={item.label} href={item.href} className="text-sm text-white/75 transition hover:text-white">
            {item.label}
          </Link>
        ))}
      </nav>
      <Link
        href="/register"
        className="premium-btn-glow rounded-full border border-white/40 bg-white px-5 py-2 text-sm font-semibold text-black transition hover:bg-white/90"
      >
        Get Started
      </Link>
    </motion.header>
  )
}

