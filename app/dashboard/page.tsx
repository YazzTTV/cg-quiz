'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Nav } from '@/components/Nav'

type Stats = {
  dueNow: number
  dueToday: number
  totalSeen: number
  totalAttempts: number
  totalAvailable: number
  totalCorrect: number
  statsByTag: Array<{ tagName: string; count: number }>
}

type LeaderboardEntry = {
  id: string
  email: string
  name: string | null
  successRate: number
  totalAttempts: number
  totalCorrect: number
}

// Fonction pour déterminer la couleur selon le pourcentage de réussite
const getSuccessRateColor = (rate: number): string => {
  if (rate >= 80) return 'text-green-600 dark:text-green-400'
  if (rate >= 50) return 'text-orange-600 dark:text-orange-400'
  if (rate >= 30) return 'text-red-600 dark:text-red-400'
  return 'text-red-700 dark:text-red-500'
}

// Fonction pour déterminer la couleur selon le score estimé
const getScoreColor = (score: number): string => {
  if (score >= 330) return 'text-green-600 dark:text-green-400'
  if (score >= 200) return 'text-orange-600 dark:text-orange-400'
  if (score >= 100) return 'text-red-600 dark:text-red-400'
  return 'text-red-700 dark:text-red-500'
}

// Fonction pour déterminer l'éligibilité IAE
const getIAEEligibility = (score: number): string => {
  if (score >= 332) {
    return "✅ Éligible pour les meilleures IAE (Sorbonne, etc.)"
  } else if (score >= 300) {
    const needed = 332 - score
    return `🎯 ${needed} points de plus pour être éligible à la Sorbonne. Continue !`
  } else if (score >= 250) {
    const needed = 332 - score
    return `📚 ${needed} points de plus pour être éligible à la Sorbonne. Continue tes efforts !`
  } else if (score >= 200) {
    const needed = 332 - score
    return `💪 ${needed} points de plus pour être éligible à la Sorbonne. Tu peux y arriver !`
  } else {
    const needed = 332 - score
    return `🚀 ${needed} points de plus pour être éligible à la Sorbonne. Continue à réviser !`
  }
}

export default function DashboardPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [stats, setStats] = useState<Stats | null>(null)
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [resetting, setResetting] = useState(false)
  const [showResetConfirm, setShowResetConfirm] = useState(false)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    }
  }, [status, router])

  useEffect(() => {
    if (session) {
      loadStats()
      loadLeaderboard()
    }
  }, [session])

  const loadStats = async () => {
    try {
      const res = await fetch('/api/dashboard/stats')
      const data = await res.json()
      if (res.ok) {
        setStats(data)
      }
    } catch (error) {
      console.error('Erreur lors du chargement des stats:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadLeaderboard = async () => {
    try {
      const res = await fetch('/api/dashboard/leaderboard')
      const data = await res.json()
      if (res.ok) {
        setLeaderboard(data)
      }
    } catch (error) {
      console.error('Erreur lors du chargement du leaderboard:', error)
    }
  }

  const handleReset = async () => {
    if (!showResetConfirm) {
      setShowResetConfirm(true)
      return
    }

    setResetting(true)
    try {
      const res = await fetch('/api/dashboard/reset', {
        method: 'POST',
      })
      const data = await res.json()

      if (res.ok) {
        // Recharger les stats et le leaderboard
        await loadStats()
        await loadLeaderboard()
        setShowResetConfirm(false)
        alert('Toutes vos questions ont été réinitialisées. Vous pouvez recommencer à apprendre depuis le début !')
      } else {
        alert('Erreur lors de la réinitialisation: ' + (data.error || 'Erreur inconnue'))
      }
    } catch (error) {
      console.error('Erreur lors de la réinitialisation:', error)
      alert('Erreur lors de la réinitialisation')
    } finally {
      setResetting(false)
    }
  }

  if (status === 'loading' || !session) {
    return (
      <div className="min-h-screen">
        <Nav />
        <main className="max-w-4xl mx-auto px-4 py-16">
          <div className="text-center">Chargement...</div>
        </main>
      </div>
    )
  }

  const progress = stats
    ? Math.round((stats.totalSeen / stats.totalAvailable) * 100)
    : 0

  // Fonction pour déterminer la couleur du pourcentage
  const getPercentageColor = (percentage: number): string => {
    if (percentage >= 80) return 'text-green-600 dark:text-green-400'
    if (percentage >= 50) return 'text-orange-600 dark:text-orange-400'
    if (percentage >= 30) return 'text-orange-500 dark:text-orange-400'
    return 'text-red-600 dark:text-red-400'
  }

  // Fonction pour déterminer la couleur du score estimé
  const getScoreColor = (score: number): string => {
    if (score >= 330) return 'text-green-600 dark:text-green-400'
    if (score >= 200) return 'text-orange-600 dark:text-orange-400'
    if (score >= 100) return 'text-orange-500 dark:text-orange-400'
    return 'text-red-600 dark:text-red-400'
  }

  // Fonction pour déterminer l'IAE éligible avec message adaptatif
  const getEligibleIAE = (score: number): { iae: string; message: string; style: string; bgColor: string } => {
    if (score >= 360) {
      return {
        iae: 'Sorbonne',
        message: 'Excellente performance ! Vous êtes éligible pour toutes les meilleures IAE (Sorbonne, HEC, ESSEC) ! 🏆✨',
        style: 'text-green-700 dark:text-green-300 font-bold',
        bgColor: 'bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-700'
      }
    }
    if (score >= 332) {
      return {
        iae: 'Sorbonne',
        message: 'Félicitations ! Vous êtes éligible pour les meilleures IAE (Sorbonne, etc.) ! 🎓🌟',
        style: 'text-green-600 dark:text-green-400 font-semibold',
        bgColor: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
      }
    }
    if (score >= 320) {
      const needed = 332 - score
      return {
        iae: 'IAE de niveau élevé',
        message: `Très bon niveau ! Plus que ${needed} points pour viser la Sorbonne ! Tu es sur la bonne voie ! 💪🎯`,
        style: 'text-blue-600 dark:text-blue-400 font-medium',
        bgColor: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
      }
    }
    if (score >= 310) {
      const needed = 332 - score
      return {
        iae: 'IAE de niveau moyen-élevé',
        message: `Bon travail ! Encore ${needed} points pour être éligible à la Sorbonne ! Continue comme ça ! 💪`,
        style: 'text-blue-600 dark:text-blue-400',
        bgColor: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
      }
    }
    if (score >= 280) {
      const needed = 332 - score
      return {
        iae: 'IAE de niveau moyen',
        message: `${needed} points de plus pour la Sorbonne. Tu progresses bien, continue tes efforts ! 📈`,
        style: 'text-orange-600 dark:text-orange-400',
        bgColor: 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800'
      }
    }
    if (score >= 250) {
      const needed = 332 - score
      return {
        iae: 'IAE de niveau moyen',
        message: `Continue tes révisions ! ${needed} points pour viser la Sorbonne. Tu peux y arriver ! 📚💪`,
        style: 'text-orange-600 dark:text-orange-400',
        bgColor: 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800'
      }
    }
    if (score >= 200) {
      const needed = 332 - score
      return {
        iae: 'IAE de niveau moyen',
        message: `Il te reste ${needed} points pour viser la Sorbonne. Continue à réviser régulièrement ! 📖`,
        style: 'text-gray-600 dark:text-gray-400',
        bgColor: 'bg-gray-50 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600'
      }
    }
    if (score >= 150) {
      const needed = 332 - score
      return {
        iae: 'IAE de niveau moyen',
        message: `${needed} points pour viser les meilleures IAE. Continue à travailler, chaque effort compte ! 🚀`,
        style: 'text-gray-600 dark:text-gray-400',
        bgColor: 'bg-gray-50 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600'
      }
    }
    const needed = 332 - score
    return {
      iae: 'IAE de niveau moyen',
      message: `Début de parcours ! ${needed} points pour viser les meilleures IAE. Commence par réviser régulièrement ! 📚✨`,
      style: 'text-gray-500 dark:text-gray-500',
      bgColor: 'bg-gray-50 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600'
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Nav />
      <div className="container mx-auto px-4 py-8">
          <main className="mx-auto max-w-4xl" data-tutorial="dashboard-indicators">
        <h1 className="text-4xl font-bold mb-8 text-gray-800 dark:text-gray-200">Dashboard</h1>

        {loading ? (
          <div className="text-center py-16">
            <div className="inline-block p-6 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-md">
              <div className="text-gray-600 dark:text-gray-400 font-semibold">Chargement des statistiques...</div>
            </div>
          </div>
        ) : stats ? (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 p-5 hover:shadow-lg transition-shadow">
                    <h2 className="text-lg font-semibold mb-3 text-gray-800 dark:text-gray-200">Questions dues</h2>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center p-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Maintenant</span>
                        <span className="font-bold text-xl text-red-600 dark:text-red-400">{stats.dueNow}</span>
                  </div>
                      <div className="flex justify-between items-center p-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Aujourd'hui</span>
                        <span className="font-bold text-xl text-gray-800 dark:text-gray-200">{stats.dueToday}</span>
                  </div>
                </div>
              </div>

                  <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 p-5 hover:shadow-lg transition-shadow">
                    <h2 className="text-lg font-semibold mb-3 text-gray-800 dark:text-gray-200">Progression</h2>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center p-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Vues</span>
                        <span className="font-bold text-xl text-gray-800 dark:text-gray-200">{stats.totalSeen}</span>
                  </div>
                      <div className="flex justify-between items-center p-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg mb-3">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Disponibles</span>
                        <span className="font-bold text-xl text-gray-800 dark:text-gray-200">{stats.totalAvailable}</span>
                  </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 shadow-inner">
                      <div
                          className="bg-blue-500 dark:bg-blue-400 h-3 rounded-full transition-all shadow-sm"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                      <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mt-1 text-center">
                      {progress}% complété
                    </p>
                  </div>
                  </div>

                  <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 p-5 hover:shadow-lg transition-shadow">
                    <h2 className="text-lg font-semibold mb-3 text-gray-800 dark:text-gray-200">Score estimé</h2>
                    <div className="space-y-3">
                      {(() => {
                        const successRate = stats.totalAttempts > 0
                        ? Math.min(100, Math.round((stats.totalCorrect / stats.totalAttempts) * 100))
                          : 0
                        const estimatedScore = Math.round((successRate / 100) * 400)
                        const scoreColor = getScoreColor(estimatedScore)
                        const eligibleInfo = getEligibleIAE(estimatedScore)
                        return (
                          <>
                            <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Sur 400</span>
                              <span className={`font-bold text-3xl ${scoreColor}`}>{estimatedScore}</span>
                            </div>
                            <div className="flex justify-between text-xs mb-2">
                              <span className="px-2 py-1 bg-gray-50 dark:bg-gray-700/50 text-gray-600 dark:text-gray-400 rounded">
                                {stats.totalAttempts} réponses
                              </span>
                              <span className={`px-2 py-1 bg-gray-50 dark:bg-gray-700/50 rounded ${getPercentageColor(successRate)}`}>
                                {successRate}% réussite
                    </span>
                  </div>
                            <div className={`pt-3 mt-2 border-t border-gray-200 dark:border-gray-700 p-2 rounded-lg border ${eligibleInfo.bgColor}`}>
                              <p className={`text-xs ${eligibleInfo.style}`}>
                                {eligibleInfo.message}
                              </p>
                </div>
                          </>
                        )
                      })()}
                      </div>
                  </div>
            </div>

            {leaderboard.length > 0 && (
                  <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 p-6">
                    <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-200 flex items-center gap-2">
                      <span>🏆</span>
                      <span>Classement</span>
                    </h2>
                    <div className="space-y-2">
                  {leaderboard.map((entry, index) => {
                    const isCurrentUser = entry.id === session?.user?.id
                    const displayName = entry.name || entry.email.split('@')[0]
                    const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}.`
                        const percentageColor = getPercentageColor(entry.successRate)

                    return (
                      <div
                        key={entry.id}
                            className={`flex items-center justify-between p-4 rounded-lg border transition-all ${
                          isCurrentUser
                                ? 'bg-gray-50 dark:bg-gray-700/50 border-blue-400 dark:border-blue-600 shadow-md'
                                : 'bg-gray-50 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                        }`}
                      >
                            <div className="flex items-center gap-4 flex-1">
                              <span className="text-xl font-bold w-10 text-center">{medal}</span>
                          <div className="flex-1">
                                <div className="font-semibold text-gray-800 dark:text-gray-200">
                              {displayName}
                              {isCurrentUser && (
                                    <span className="ml-2 text-xs px-2 py-0.5 bg-blue-500 text-white rounded-full">
                                      Vous
                                </span>
                              )}
                            </div>
                                <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                              {entry.totalAttempts} tentatives
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                              <div className={`text-2xl font-bold ${percentageColor}`}>
                            {entry.successRate}%
                          </div>
                              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            {entry.totalCorrect}/{entry.totalAttempts}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            <div className="text-center space-y-4">
              <div className="pt-6 border-t border-gray-200 dark:border-gray-700">
                {!showResetConfirm ? (
                  <button
                    onClick={handleReset}
                    disabled={resetting || stats?.totalSeen === 0}
                    className="px-8 py-3 bg-red-500 text-white rounded-xl hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed font-semibold shadow-md hover:shadow-lg transition-all"
                  >
                    {resetting ? 'Réinitialisation...' : 'Réinitialiser toutes les questions'}
                  </button>
                ) : (
                  <div className="space-y-4 bg-white dark:bg-gray-800 rounded-xl border border-red-200 dark:border-red-800 p-6 max-w-md mx-auto">
                    <p className="text-sm text-gray-700 dark:text-gray-300 font-medium">
                      Êtes-vous sûr de vouloir réinitialiser toutes vos questions ?<br />
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                      Cette action supprimera toutes vos statistiques et vous fera recommencer depuis le début.
                      </span>
                    </p>
                    <div className="flex gap-3 justify-center">
                      <button
                        onClick={handleReset}
                        disabled={resetting}
                        className="px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50 font-semibold transition-all"
                      >
                        {resetting ? 'Réinitialisation...' : 'Oui, réinitialiser'}
                      </button>
                      <button
                        onClick={() => setShowResetConfirm(false)}
                        disabled={resetting}
                        className="px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 disabled:opacity-50 font-semibold transition-all"
                      >
                        Annuler
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="inline-block p-6 bg-white dark:bg-gray-800 rounded-xl border border-red-200 dark:border-red-800 shadow-md">
              <p className="text-red-600 dark:text-red-400 font-semibold">Erreur lors du chargement des statistiques.</p>
            </div>
          </div>
        )}
          </main>
      </div>
    </div>
  )
}

