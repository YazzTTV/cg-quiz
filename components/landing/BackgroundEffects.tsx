'use client'

export function BackgroundEffects() {
  return (
    <>
      <div className="fixed inset-0 -z-30 bg-[linear-gradient(155deg,#05070b_0%,#0b0f15_45%,#090d13_100%)]" />
      <div className="fixed inset-0 -z-[24] bg-[radial-gradient(ellipse_at_50%_28%,rgba(255,255,255,.08),transparent_52%),linear-gradient(to_bottom,rgba(6,8,12,.32),rgba(6,8,12,.56))]" />
      <div className="fixed inset-0 -z-20 bg-[linear-gradient(rgba(255,255,255,.018)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.018)_1px,transparent_1px)] bg-[size:110px_110px] opacity-15" />
      <div className="pointer-events-none fixed inset-0 -z-[19] opacity-35 starfield-layer-slow [background-image:radial-gradient(circle,rgba(255,255,255,.9)_1px,transparent_1.2px)] [background-size:30px_30px]" />
      <div className="pointer-events-none fixed inset-0 -z-[18] opacity-22 starfield-layer-reverse [background-image:radial-gradient(circle,rgba(255,255,255,.9)_1px,transparent_1.2px)] [background-size:56px_56px]" />
    </>
  )
}

