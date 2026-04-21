'use client'

import { motion } from 'framer-motion'

const tags = [
  { label: 'Gestion', className: 'left-1 top-22' },
  { label: 'Gestion', className: 'left-16 top-5' },
  { label: 'Gestion', className: 'left-2 top-44' },
  { label: 'Mathématiques', className: 'right-0 top-22' },
  { label: 'Culture G', className: 'right-7 top-44' },
  { label: 'Culture G', className: 'right-8 top-[16.7rem]' },
  { label: 'Logique', className: 'left-11 bottom-12' },
]

export function FloatingGraphVisual() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.8, ease: 'easeOut', delay: 0.15 }}
      className="relative h-full min-h-[360px] w-full overflow-hidden"
    >
      <video
        className="absolute inset-0 h-full w-full object-cover"
        autoPlay
        loop
        muted
        playsInline
        preload="metadata"
        aria-hidden="true"
      >
        <source src="/videos/motion-design.mp4" type="video/mp4" />
      </video>

      <div className="absolute inset-0 bg-[radial-gradient(circle_at_54%_44%,rgba(255,255,255,.16),transparent_56%),linear-gradient(to_bottom,rgba(0,0,0,.08),rgba(0,0,0,.4))]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_72%_48%,transparent_30%,rgba(0,0,0,.3)_72%,rgba(0,0,0,.75)_100%)]" />
      <div className="absolute inset-y-0 left-0 w-28 bg-gradient-to-r from-[#06070a] via-[#06070a]/60 to-transparent" />
      <div className="absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-[#06070a]/70 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 h-24 bg-[radial-gradient(ellipse_at_center,rgba(250,204,21,.2),transparent_72%)]" />
      <div className="absolute inset-x-0 bottom-0 h-20 opacity-65 [background-image:radial-gradient(circle,rgba(255,255,255,.6)_1px,transparent_1.2px)] [background-size:10px_10px]" />

      {tags.map((tag, idx) => (
        <motion.span
          key={`${tag.label}-${idx}`}
          className={`absolute ${tag.className} rounded-full border border-white/30 bg-black/45 px-3 py-1 text-xs text-white/90 backdrop-blur`}
          animate={{ y: [0, -4, 0] }}
          transition={{ duration: 4 + idx, repeat: Infinity, ease: 'easeInOut' }}
        >
          {tag.label}
        </motion.span>
      ))}
    </motion.div>
  )
}

