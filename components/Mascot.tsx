'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'

type MascotData = {
  mascot: 'owl' | 'lion' | 'monkey' | 'dolphin' | 'bear'
  rank: number
  statsByTag: Array<{ tagName: string; count: number }>
}

const MASCOT_EMOJIS: Record<string, string> = {
  owl: '🦉',
  lion: '🦁',
  monkey: '🐵',
  dolphin: '🐬',
  bear: '🐻',
}

const getAccessory = (rank: number): string => {
  if (rank === 1) return '👑' // Couronne pour le rang 1
  if (rank <= 3) return '🏅' // Médaille pour le rang 2-3
  if (rank <= 10) return '🎩' // Chapeau pour le rang 4-10
  if (rank <= 50) return '🪄' // Baguette magique pour le rang 11-50
  return '' // Pas d'accessoire au-delà du rang 50
}

// Liste de 10 recommandations différentes
const RECOMMENDATIONS = [
  "C'est l'heure de faire un test blanc ! 📝",
  "Continue à réviser pour améliorer ton score ! 💪",
  "N'oublie pas de réviser tes questions en attente ! 📚",
  "Entraîne-toi sur les questions que tu as manquées ! 🎯",
  "Fais un test blitz pour tester tes connaissances ! ⚡",
  "Révise régulièrement pour maintenir ton niveau ! 📖",
  "Consulte tes statistiques pour voir ta progression ! 📊",
  "Pense à varier les matières dans tes révisions ! 🌍",
  "Continue comme ça, tu progresses bien ! 🚀",
  "N'hésite pas à créer tes propres questions ! ✨",
]

const getSuggestion = (statsByTag: Array<{ tagName: string; count: number }>, recommendationIndex: number): string => {
  // Retourner une recommandation de la liste en fonction de l'index
  return RECOMMENDATIONS[recommendationIndex % RECOMMENDATIONS.length]
}

export default function Mascot() {
  const { data: session } = useSession()
  const [mascotData, setMascotData] = useState<MascotData | null>(null)
  const [showTooltip, setShowTooltip] = useState(false)
  const [loading, setLoading] = useState(true)
  const [recommendationIndex, setRecommendationIndex] = useState(0)

  useEffect(() => {
    if (session) {
      loadMascotData()
    } else {
      setLoading(false)
    }
  }, [session])

  const loadMascotData = async () => {
    try {
      const res = await fetch('/api/mascot')
      const data = await res.json()
      if (res.ok) {
        setMascotData(data)
      } else {
        console.error('Erreur API mascot:', data.error)
      }
    } catch (error) {
      console.error('Erreur lors du chargement de la mascotte:', error)
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
      <div className="fixed bottom-4 right-4 z-50">
        <div className="w-20 h-20 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse flex items-center justify-center text-4xl">
          🦉
        </div>
      </div>
    )
  }

  const handleMascotClick = () => {
    // Changer la recommandation à chaque clic
    setRecommendationIndex((prev) => (prev + 1) % RECOMMENDATIONS.length)
    setShowTooltip(!showTooltip)
  }

  // Si pas de données après chargement, afficher quand même une mascotte par défaut
  if (!mascotData) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <button
          onClick={handleMascotClick}
          className="relative w-20 h-20 bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900 dark:to-purple-900 rounded-full shadow-xl border-4 border-blue-300 dark:border-blue-700 flex items-center justify-center text-5xl hover:scale-110 transition-transform cursor-pointer"
          aria-label="Mascotte"
        >
          🦉
        </button>
      </div>
    )
  }

  const accessory = getAccessory(mascotData.rank)
  const suggestion = getSuggestion(mascotData.statsByTag, recommendationIndex)
  const mascotEmoji = MASCOT_EMOJIS[mascotData.mascot] || '🦉'

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className="relative">
        {/* Bulle de dialogue */}
        {showTooltip && (
          <div className="absolute bottom-full right-0 mb-2 w-72 p-4 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border-2 border-gray-200 dark:border-gray-700 animate-fadeIn">
            <div className="text-sm text-gray-700 dark:text-gray-300">
              <div className="font-bold mb-2 text-lg flex items-center gap-2">
                <span>{mascotEmoji}</span>
                <span>Rang {mascotData.rank}</span>
                {accessory && <span className="text-2xl">{accessory}</span>}
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-900 p-2 rounded-lg">
                💡 {suggestion}
              </div>
            </div>
            {/* Flèche pointant vers la mascotte */}
            <div className="absolute bottom-0 right-6 transform translate-y-1/2 rotate-45 w-3 h-3 bg-white dark:bg-gray-800 border-r-2 border-b-2 border-gray-200 dark:border-gray-700"></div>
          </div>
        )}

        {/* Mascotte */}
        <button
          onClick={handleMascotClick}
          className="relative w-20 h-20 bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900 dark:to-purple-900 rounded-full shadow-xl border-4 border-blue-300 dark:border-blue-700 flex items-center justify-center text-5xl hover:scale-110 active:scale-95 transition-all duration-200 cursor-pointer group"
          aria-label="Mascotte"
        >
          <span className="relative transform group-hover:rotate-12 transition-transform duration-200">
            {mascotEmoji}
            {accessory && (
              <span className="absolute -top-3 -right-3 text-3xl animate-bounce">
                {accessory}
              </span>
            )}
          </span>
          {/* Indicateur de notification */}
          {!showTooltip && (
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse"></span>
          )}
        </button>
      </div>
    </div>
  )
}
