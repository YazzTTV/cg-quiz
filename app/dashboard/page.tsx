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

  return (
    <div className="min-h-screen">
      <Nav />
      <main className="max-w-4xl mx-auto px-4 py-16">
        <h1 className="text-3xl font-bold mb-8">Dashboard</h1>

        {loading ? (
          <div className="text-center py-16">Chargement des statistiques...</div>
        ) : stats ? (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
                <h2 className="text-xl font-semibold mb-4">Questions dues</h2>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Maintenant</span>
                    <span className="font-bold text-red-600">{stats.dueNow}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Aujourd'hui</span>
                    <span className="font-bold">{stats.dueToday}</span>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
                <h2 className="text-xl font-semibold mb-4">Progression</h2>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Vues</span>
                    <span className="font-bold">{stats.totalSeen}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Disponibles</span>
                    <span className="font-bold">{stats.totalAvailable}</span>
                  </div>
                  <div className="mt-4">
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4">
                      <div
                        className="bg-blue-600 h-4 rounded-full transition-all"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                      {progress}% complété
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
                <h2 className="text-xl font-semibold mb-4">Performance</h2>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Réponses correctes</span>
                    <span className="font-bold text-green-600">{stats.totalCorrect}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Taux de réussite</span>
                    <span className="font-bold">
                      {stats.totalAttempts > 0
                        ? Math.min(100, Math.round((stats.totalCorrect / stats.totalAttempts) * 100))
                        : 0}
                      %
                    </span>
                  </div>
                </div>
              </div>

              {stats.statsByTag.length > 0 && (
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
                  <h2 className="text-xl font-semibold mb-4">Par thème</h2>
                  <div className="space-y-2">
                    {stats.statsByTag.map((stat) => (
                      <div key={stat.tagName} className="flex justify-between">
                        <span>{stat.tagName}</span>
                        <span className="font-bold">{stat.count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {leaderboard.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
                <h2 className="text-xl font-semibold mb-4">🏆 Classement</h2>
                <div className="space-y-3">
                  {leaderboard.map((entry, index) => {
                    const isCurrentUser = entry.id === session?.user?.id
                    const displayName = entry.name || entry.email.split('@')[0]
                    const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}.`

                    return (
                      <div
                        key={entry.id}
                        className={`flex items-center justify-between p-3 rounded-lg ${
                          isCurrentUser
                            ? 'bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-500'
                            : 'bg-gray-50 dark:bg-gray-700/50'
                        }`}
                      >
                        <div className="flex items-center gap-3 flex-1">
                          <span className="text-lg font-bold w-8">{medal}</span>
                          <div className="flex-1">
                            <div className="font-semibold">
                              {displayName}
                              {isCurrentUser && (
                                <span className="ml-2 text-xs text-blue-600 dark:text-blue-400">
                                  (Vous)
                                </span>
                              )}
                            </div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">
                              {entry.totalAttempts} tentatives
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-xl font-bold text-green-600">
                            {entry.successRate}%
                          </div>
                          <div className="text-xs text-gray-500">
                            {entry.totalCorrect}/{entry.totalAttempts}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-semibold mb-4">📝 Test Blanc</h2>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Entraînez-vous dans les conditions réelles de l'examen IAE avec un test blanc complet.
                Vous avez 2h25 pour répondre à toutes les questions.
              </p>
              <a
                href="/test-blanc"
                className="inline-block px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 mb-3"
              >
                Commencer un test blanc
              </a>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-semibold mb-4">⚡ Test Blitz</h2>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Mode ultra rapide pour s'entraîner efficacement ! Questions sélectionnées au prorata.
              </p>
              <a
                href="/test-blitz"
                className="inline-block px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
              >
                Commencer un test blitz
              </a>
            </div>

            <div className="text-center space-y-4">
              <a
                href="/review"
                className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Commencer à réviser
              </a>
              
              <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                {!showResetConfirm ? (
                  <button
                    onClick={handleReset}
                    disabled={resetting || stats?.totalSeen === 0}
                    className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {resetting ? 'Réinitialisation...' : 'Réinitialiser toutes les questions'}
                  </button>
                ) : (
                  <div className="space-y-3">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                      Êtes-vous sûr de vouloir réinitialiser toutes vos questions ?<br />
                      Cette action supprimera toutes vos statistiques et vous fera recommencer depuis le début.
                    </p>
                    <div className="flex gap-3 justify-center">
                      <button
                        onClick={handleReset}
                        disabled={resetting}
                        className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                      >
                        {resetting ? 'Réinitialisation...' : 'Oui, réinitialiser'}
                      </button>
                      <button
                        onClick={() => setShowResetConfirm(false)}
                        disabled={resetting}
                        className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50"
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
            <p>Erreur lors du chargement des statistiques.</p>
          </div>
        )}
      </main>
    </div>
  )
}

