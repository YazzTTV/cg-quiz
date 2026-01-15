'use client'

import { useState, useEffect } from 'react'

type ScoreEstimateBadgeProps = {
  score: number
  accuracy: number
  durationMinutes: number
  testType: 'blanc' | 'blitz'
  size?: 'default' | 'compact'
}

// Fonction pour déterminer la couleur du score estimé
const getScoreColor = (score: number): string => {
  if (score >= 330) return 'text-green-600 dark:text-green-400'
  if (score >= 200) return 'text-orange-600 dark:text-orange-400'
  if (score >= 100) return 'text-orange-500 dark:text-orange-400'
  return 'text-red-600 dark:text-red-400'
}

// Fonction pour déterminer l'IAE éligible avec message adaptatif
const getEligibleIAE = (score: number): { message: string; style: string; bgColor: string } => {
  if (score >= 360) {
    return {
      message: 'Excellente performance ! Vous êtes éligible pour toutes les meilleures IAE (Sorbonne, HEC, ESSEC) ! 🏆✨',
      style: 'text-green-700 dark:text-green-300 font-bold',
      bgColor: 'bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-700'
    }
  }
  if (score >= 332) {
    return {
      message: 'Félicitations ! Vous êtes éligible pour les meilleures IAE (Sorbonne, etc.) ! 🎓🌟',
      style: 'text-green-600 dark:text-green-400 font-semibold',
      bgColor: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
    }
  }
  if (score >= 320) {
    const needed = 332 - score
    return {
      message: `Très bon niveau ! Plus que ${needed} points pour viser la Sorbonne ! Tu es sur la bonne voie ! 💪🎯`,
      style: 'text-blue-600 dark:text-blue-400 font-medium',
      bgColor: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
    }
  }
  if (score >= 310) {
    const needed = 332 - score
    return {
      message: `Bon travail ! Encore ${needed} points pour être éligible à la Sorbonne ! Continue comme ça ! 💪`,
      style: 'text-blue-600 dark:text-blue-400',
      bgColor: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
    }
  }
  if (score >= 280) {
    const needed = 332 - score
    return {
      message: `${needed} points de plus pour la Sorbonne. Tu progresses bien, continue tes efforts ! 📈`,
      style: 'text-orange-600 dark:text-orange-400',
      bgColor: 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800'
    }
  }
  if (score >= 250) {
    const needed = 332 - score
    return {
      message: `Continue tes révisions ! ${needed} points pour viser la Sorbonne. Tu peux y arriver ! 📚💪`,
      style: 'text-orange-600 dark:text-orange-400',
      bgColor: 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800'
    }
  }
  if (score >= 200) {
    const needed = 332 - score
    return {
      message: `Il te reste ${needed} points pour viser la Sorbonne. Continue à réviser régulièrement ! 📖`,
      style: 'text-gray-600 dark:text-gray-400',
      bgColor: 'bg-gray-50 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600'
    }
  }
  if (score >= 150) {
    const needed = 332 - score
    return {
      message: `${needed} points pour viser les meilleures IAE. Continue à travailler, chaque effort compte ! 🚀`,
      style: 'text-gray-600 dark:text-gray-400',
      bgColor: 'bg-gray-50 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600'
    }
  }
  const needed = 332 - score
  return {
    message: `Début de parcours ! ${needed} points pour viser les meilleures IAE. Commence par réviser régulièrement ! 📚✨`,
    style: 'text-gray-500 dark:text-gray-500',
    bgColor: 'bg-gray-50 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600'
  }
}

export default function ScoreEstimateBadge({
  score,
  accuracy,
  durationMinutes,
  testType,
  size = 'default',
}: ScoreEstimateBadgeProps) {
  const [isAnimating, setIsAnimating] = useState(true)
  const [displayScore, setDisplayScore] = useState(0)
  const isCompact = size === 'compact'

  useEffect(() => {
    // Animation du score qui monte progressivement
    const duration = 1500 // 1.5 secondes
    const steps = 60
    const increment = score / steps
    let current = 0
    let step = 0

    const timer = setInterval(() => {
      step++
      current = Math.min(score, increment * step)
      setDisplayScore(Math.round(current))

      if (step >= steps) {
        clearInterval(timer)
        setIsAnimating(false)
      }
    }, duration / steps)

    return () => clearInterval(timer)
  }, [score])

  const scoreColor = getScoreColor(score)
  const eligibleInfo = getEligibleIAE(score)
  const badgeEmoji = score >= 330 ? '🏆' : score >= 200 ? '🎯' : score >= 100 ? '📚' : '💪'

  const nextGoal = (() => {
    if (score < 332) return { target: 332, label: 'la Sorbonne' }
    if (score < 360) return { target: 360, label: 'les meilleures IAE' }
    return { target: null, label: '' }
  })()

  const containerSpacing = isCompact ? 'p-2 mb-3' : 'p-6 mb-6'
  const badgeMargin = isCompact ? 'mb-2' : 'mb-4'
  const labelSize = isCompact ? 'text-[11px]' : 'text-sm'
  const emojiSize = isCompact ? 'text-2xl' : 'text-6xl'
  const emojiScale = isCompact ? 'scale-110 rotate-6' : 'scale-125 rotate-12'
  const scoreSize = isCompact ? 'text-2xl' : 'text-6xl'
  const denominatorSize = isCompact ? 'text-sm' : 'text-2xl'
  const statSize = isCompact ? 'text-[11px]' : 'text-sm'
  const statGap = isCompact ? 'gap-2' : 'gap-4'
  const statPadding = isCompact ? 'px-2 py-0.5' : 'px-3 py-1'
  const messagePadding = isCompact ? 'p-2' : 'p-4'
  const messageClamp = isCompact ? 'line-clamp-2' : ''
  const animationClass = isAnimating && !isCompact ? 'scale-105 shadow-2xl' : 'scale-100 shadow-lg'
  const showParticles = isAnimating && !isCompact

  if (isCompact) {
    return (
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className={`rounded-lg border-2 ${eligibleInfo.bgColor} p-3 flex flex-col items-center justify-center text-center min-h-[110px]`}>
          <div className="text-[11px] text-gray-600 dark:text-gray-400">Score estimé</div>
          <div className={`text-2xl font-bold ${scoreColor}`}>{displayScore}</div>
          <div className="text-xs text-gray-500 dark:text-gray-400">/ 400</div>
          <div className="mt-1 text-[11px] text-gray-600 dark:text-gray-400">Précision {accuracy}%</div>
        </div>
        <div className="rounded-lg border-2 bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700 p-3 flex flex-col items-center justify-center text-center min-h-[110px]">
          <div className="text-[11px] uppercase tracking-wide text-gray-500 dark:text-gray-400">Objectif prochain</div>
          {nextGoal.target ? (
            <>
              <div className="text-lg font-semibold text-gray-800 dark:text-gray-100">
                Objectif {nextGoal.target}
              </div>
              <div className="text-[11px] text-gray-600 dark:text-gray-400">pour {nextGoal.label}</div>
            </>
          ) : (
            <div className="text-sm font-semibold text-green-700 dark:text-green-300">Objectif atteint</div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className={`relative overflow-hidden rounded-xl border-2 transition-all duration-500 ${containerSpacing} ${eligibleInfo.bgColor} ${animationClass}`}>
      {/* Animation de particules */}
      {showParticles && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 rounded-full animate-ping"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                backgroundColor: score >= 330 ? '#10b981' : score >= 200 ? '#f59e0b' : '#ef4444',
                animationDelay: `${Math.random() * 0.5}s`,
                animationDuration: `${1 + Math.random()}s`,
              }}
            />
          ))}
        </div>
      )}

      <div className="relative z-10">
        {/* Badge avec emoji */}
        <div className={`flex items-center justify-center ${badgeMargin}`}>
          <div className={`${emojiSize} transform transition-all duration-500 ${
            isAnimating && !isCompact ? emojiScale : 'scale-100 rotate-0'
          }`}>
            {badgeEmoji}
          </div>
        </div>

        {/* Score estimé avec animation */}
        <div className={`text-center ${badgeMargin}`}>
          <div className={`${labelSize} text-gray-600 dark:text-gray-400 mb-2`}>
            Score estimé sur 400
          </div>
          <div className={`${scoreSize} font-bold ${scoreColor} transition-all duration-300 ${
            isAnimating && !isCompact ? 'scale-110' : 'scale-100'
          }`}>
            {displayScore}
          </div>
          <div className={`${denominatorSize} text-gray-500 dark:text-gray-400 mt-1`}>
            / 400
          </div>
        </div>

        {/* Statistiques */}
        <div className={`flex justify-center ${statGap} ${badgeMargin} ${statSize}`}>
          <div className={`${statPadding} bg-white/50 dark:bg-gray-800/50 rounded-lg`}>
            <span className="text-gray-600 dark:text-gray-400">Précision: </span>
            <span className="font-semibold">{accuracy}%</span>
          </div>
          <div className={`${statPadding} bg-white/50 dark:bg-gray-800/50 rounded-lg`}>
            <span className="text-gray-600 dark:text-gray-400">Durée: </span>
            <span className="font-semibold">{durationMinutes} min</span>
          </div>
        </div>

        {/* Message d'éligibilité */}
        <div className={`mt-4 ${messagePadding} rounded-lg border ${eligibleInfo.bgColor}`}>
          <p className={`${statSize} ${messageClamp} text-center ${eligibleInfo.style}`}>
            {eligibleInfo.message}
          </p>
        </div>
      </div>
    </div>
  )
}
