'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'

export default function WinStreak() {
  const { data: session } = useSession()
  const [winStreak, setWinStreak] = useState<number>(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (session) {
      loadWinStreak()
      
      // Écouter les événements de mise à jour du win streak
      const handleWinStreakUpdate = () => {
        loadWinStreak()
      }
      
      window.addEventListener('winStreakUpdated', handleWinStreakUpdate)
      
      // Recharger le win streak toutes les minutes pour vérifier les mises à jour
      const interval = setInterval(() => {
        loadWinStreak()
      }, 60000) // 1 minute

      return () => {
        clearInterval(interval)
        window.removeEventListener('winStreakUpdated', handleWinStreakUpdate)
      }
    } else {
      setLoading(false)
    }
  }, [session])

  const loadWinStreak = async () => {
    try {
      const res = await fetch('/api/win-streak')
      const data = await res.json()
      if (res.ok) {
        setWinStreak(data.winStreak || 0)
      } else {
        console.error('Erreur API win-streak:', data.error)
      }
    } catch (error) {
      console.error('Erreur lors du chargement du win streak:', error)
    } finally {
      setLoading(false)
    }
  }

  // Ne pas afficher si pas de session
  if (!session) {
    return null
  }

  // Afficher un placeholder pendant le chargement
  if (loading) {
    return (
      <div className="fixed bottom-4 right-28 z-50">
        <div className="flex items-center gap-2 bg-gray-200 dark:bg-gray-700 rounded-full px-3 py-2 animate-pulse">
          <span className="text-xl">🔥</span>
          <span className="text-lg font-bold text-gray-400">-</span>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed bottom-4 right-28 z-50" style={{ zIndex: 50 }}>
      <div className="flex items-center gap-2 bg-white dark:bg-gray-800 rounded-full shadow-xl border-2 border-orange-400 dark:border-orange-600 px-4 py-2.5 hover:scale-110 transition-transform cursor-default">
        <span className="text-2xl animate-pulse">🔥</span>
        <span className={`text-xl font-bold ${winStreak > 0 ? 'text-orange-600 dark:text-orange-400' : 'text-gray-400 dark:text-gray-500'}`}>
          {winStreak}
        </span>
      </div>
    </div>
  )
}
