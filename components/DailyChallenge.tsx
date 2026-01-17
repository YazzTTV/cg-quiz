'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'

type Choice = {
  id: string
  text: string
  order: number
  isCorrect?: boolean
}

type Challenge = {
  id: string
  dayNumber: number
  prompt: string
  explanation: string | null
  choices: Choice[]
}

type UserAnswer = {
  selectedChoiceId: string
  isCorrect: boolean
  answeredAt: string
}

type DailyChallengeData = {
  challenge: Challenge
  userAnswer: UserAnswer | null
}

export default function DailyChallenge() {
  const { data: session } = useSession()
  const [challengeData, setChallengeData] = useState<DailyChallengeData | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedChoiceId, setSelectedChoiceId] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [showResult, setShowResult] = useState(false)
  const [result, setResult] = useState<{ isCorrect: boolean; explanation: string | null; correctChoice: Choice | undefined } | null>(null)
  const [currentDay, setCurrentDay] = useState<number | null>(null)

  // Fonction pour calculer le numéro du jour actuel (jour du mois : 1-31)
  const getCurrentDayNumber = (): number => {
    return new Date().getDate() // Retourne le jour du mois (1-31)
  }

  // Charger le défi
  const loadChallenge = async (dayNumber?: number) => {
    if (!session) return

    setLoading(true)
    try {
      const day = dayNumber ?? getCurrentDayNumber()
      console.log('Chargement du défi pour le jour:', day)
      const res = await fetch(`/api/daily-challenge?day=${day}`)
      const data = await res.json()

      if (res.ok) {
        console.log('Défi chargé avec succès:', data)
        setChallengeData(data)
        setCurrentDay(day)
        if (data.userAnswer) {
          setShowResult(true)
          setSelectedChoiceId(data.userAnswer.selectedChoiceId)
          // Charger les détails de la réponse correcte
          const challenge = data.challenge
          const correctChoice = challenge.choices.find((c: Choice) => c.isCorrect)
          setResult({
            isCorrect: data.userAnswer.isCorrect,
            explanation: challenge.explanation,
            correctChoice,
          })
        } else {
          setShowResult(false)
          setSelectedChoiceId(null)
          setResult(null)
        }
      } else {
        console.error('Erreur lors du chargement du défi:', data)
        // Afficher un message d'erreur plus informatif
        setChallengeData(null)
      }
    } catch (error) {
      console.error('Erreur lors du chargement du défi:', error)
      setChallengeData(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (session) {
      loadChallenge()
    }
  }, [session])

  const handleChoiceSelect = (choiceId: string) => {
    if (!showResult && challengeData && !challengeData.userAnswer) {
      setSelectedChoiceId(choiceId)
    }
  }

  const handleSubmit = async () => {
    if (!challengeData || !selectedChoiceId || submitting) return

    setSubmitting(true)
    try {
      const res = await fetch('/api/daily-challenge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          challengeId: challengeData.challenge.id,
          choiceId: selectedChoiceId,
        }),
      })

      const data = await res.json()

      if (res.ok) {
        setResult(data)
        setShowResult(true)
        // Recharger le défi pour mettre à jour l'état
        await loadChallenge(currentDay ?? undefined)
      } else {
        console.error('Erreur lors de la soumission:', data.error)
        alert('Erreur: ' + (data.error || 'Erreur inconnue'))
      }
    } catch (error) {
      console.error('Erreur lors de la soumission:', error)
      alert('Erreur lors de la soumission de la réponse')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDayChange = (dayOffset: number) => {
    if (currentDay !== null) {
      const newDay = currentDay + dayOffset
      const today = getCurrentDayNumber()
      
      // Ne pas permettre d'aller au-delà du jour actuel
      if (newDay >= 1 && newDay <= 31 && newDay <= today) {
        loadChallenge(newDay)
      }
    }
  }

  if (!session) {
    return null
  }

  if (loading) {
    return (
      <div className="w-64 flex-shrink-0">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 sticky top-4 border-2 border-gray-200 dark:border-gray-700">
          <div className="text-center py-4">
            <div className="text-gray-600 dark:text-gray-400">Chargement du défi...</div>
          </div>
        </div>
      </div>
    )
  }

  if (!challengeData) {
    const today = getCurrentDayNumber()
    const canGoBack = currentDay !== null && currentDay > 1
    const canGoForward = currentDay !== null && currentDay < today && currentDay < 31
    
    return (
      <div className="w-64 flex-shrink-0">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 sticky top-4 border-2 border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-sm font-bold text-gray-600 dark:text-gray-400">Défi du jour</h3>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleDayChange(-1)}
                disabled={!canGoBack}
                className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 rounded hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                title="Jour précédent"
              >
                ←
              </button>
              <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 min-w-[2rem] text-center">
                Jour {currentDay ?? today}
              </span>
              <button
                onClick={() => handleDayChange(1)}
                disabled={!canGoForward}
                className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 rounded hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                title={currentDay !== null && currentDay >= today ? "Jour futur non disponible" : "Jour suivant"}
              >
                →
              </button>
            </div>
          </div>
          <div className="text-center py-4">
            <div className="text-xs text-gray-600 dark:text-gray-400">Aucun défi disponible pour ce jour</div>
            {currentDay !== null && currentDay > today && (
              <div className="text-xs text-red-500 dark:text-red-400 mt-2">🔒 Jour futur non disponible</div>
            )}
          </div>
        </div>
      </div>
    )
  }

  const { challenge } = challengeData
  const today = getCurrentDayNumber()
  const isToday = currentDay === today
  const canGoBack = currentDay !== null && currentDay > 1
  const canGoForward = currentDay !== null && currentDay < today && currentDay < 31

  return (
    <div className="w-64 flex-shrink-0">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 sticky top-4 border-2 border-blue-200 dark:border-blue-800">
        {/* En-tête avec navigation */}
        <div className="flex items-center justify-between mb-3 pb-2 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-sm font-bold text-blue-600 dark:text-blue-400">
            Défi du jour
          </h3>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleDayChange(-1)}
              disabled={!canGoBack}
              className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 rounded hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              title="Jour précédent"
            >
              ←
            </button>
            <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 min-w-[2rem] text-center">
              Jour {currentDay}
              {isToday && <span className="ml-1 text-blue-500">●</span>}
            </span>
            <button
              onClick={() => handleDayChange(1)}
              disabled={!canGoForward}
              className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 rounded hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              title={currentDay !== null && currentDay >= today ? "Jour futur non disponible" : "Jour suivant"}
            >
              →
            </button>
          </div>
        </div>

        {/* Question */}
        <div className="mb-3">
          <p className="text-sm text-gray-800 dark:text-gray-200 leading-relaxed">
            {challenge.prompt}
          </p>
        </div>

        {/* Choix de réponse */}
        <div className="space-y-2 mb-3">
          {challenge.choices.map((choice) => {
            const isSelected = selectedChoiceId === choice.id
            const isCorrect = choice.isCorrect === true
            const isWrong = showResult && isSelected && !isCorrect
            const showCorrect = showResult && isCorrect

            return (
              <button
                key={choice.id}
                onClick={() => handleChoiceSelect(choice.id)}
                disabled={showResult || submitting}
                className={`
                  w-full text-left p-2 rounded-lg text-xs transition-all
                  ${showResult
                    ? showCorrect
                      ? 'bg-green-100 dark:bg-green-900 border-2 border-green-500 dark:border-green-600'
                      : isWrong
                      ? 'bg-red-100 dark:bg-red-900 border-2 border-red-500 dark:border-red-600'
                      : 'bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600'
                    : isSelected
                    ? 'bg-blue-100 dark:bg-blue-900 border-2 border-blue-500 dark:border-blue-600'
                    : 'bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600'
                  }
                  ${showResult ? 'cursor-default' : 'cursor-pointer'}
                `}
              >
                <div className="flex items-center gap-2">
                  {showCorrect && <span className="text-green-600 dark:text-green-400">✓</span>}
                  {isWrong && <span className="text-red-600 dark:text-red-400">✗</span>}
                  <span className={`
                    ${showResult && (showCorrect || isWrong) ? 'font-semibold' : ''}
                  `}>
                    {choice.text}
                  </span>
                </div>
              </button>
            )
          })}
        </div>

        {/* Bouton de soumission */}
        {!showResult && !challengeData.userAnswer && (
          <button
            onClick={handleSubmit}
            disabled={!selectedChoiceId || submitting}
            className="w-full py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium transition-colors"
          >
            {submitting ? 'Envoi...' : 'Valider'}
          </button>
        )}

        {/* Résultat */}
        {showResult && result && (
          <div className={`
            mt-3 p-3 rounded-lg border-2
            ${result.isCorrect
              ? 'bg-green-50 dark:bg-green-900/30 border-green-500 dark:border-green-600'
              : 'bg-red-50 dark:bg-red-900/30 border-red-500 dark:border-red-600'
            }
          `}>
            <div className={`
              text-sm font-semibold mb-2
              ${result.isCorrect
                ? 'text-green-700 dark:text-green-400'
                : 'text-red-700 dark:text-red-400'
              }
            `}>
              {result.isCorrect ? '✓ Correct !' : '✗ Incorrect'}
            </div>
            {result.explanation && (
              <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed">
                {result.explanation}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
