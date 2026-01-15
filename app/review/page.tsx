'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Nav } from '@/components/Nav'
import ScoreEstimateBadge from '@/components/ScoreEstimateBadge'

type Choice = {
  id: string
  text: string
  order: number
}

type Question = {
  id: string
  prompt: string
  explanation?: string
  choices: Choice[]
}

type UserState = {
  timesSeen: number
  timesCorrect: number
}

export default function ReviewPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [question, setQuestion] = useState<Question | null>(null)
  const [userState, setUserState] = useState<UserState | null>(null)
  const [selectedChoiceId, setSelectedChoiceId] = useState<string | null>(null)
  const [isAnswered, setIsAnswered] = useState(false)
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null)
  const [correctChoiceId, setCorrectChoiceId] = useState<string | null>(null)
  const [explanation, setExplanation] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [showReviewOptions, setShowReviewOptions] = useState(true)
  const [isFlashcardSaved, setIsFlashcardSaved] = useState(false)
  const [savingFlashcard, setSavingFlashcard] = useState(false)
  const [estimatedScore, setEstimatedScore] = useState<{ score: number; accuracy: number } | null>(null)
  const [recentQuestionIds, setRecentQuestionIds] = useState<string[]>(() => {
    // Charger depuis localStorage au démarrage
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('recentQuestionIds')
      if (saved) {
        try {
          const parsed = JSON.parse(saved)
          // Nettoyer les IDs de plus de 1 heure (garder seulement les récents)
          const oneHourAgo = Date.now() - 60 * 60 * 1000
          const filtered = parsed.filter((item: { id: string; timestamp: number }) => {
            return item.timestamp > oneHourAgo
          })
          return filtered.map((item: { id: string }) => item.id)
        } catch {
          return []
        }
      }
    }
    return []
  })

  // Sauvegarder dans localStorage quand recentQuestionIds change
  useEffect(() => {
    if (typeof window !== 'undefined' && recentQuestionIds.length > 0) {
      const withTimestamps = recentQuestionIds.map((id) => ({
        id,
        timestamp: Date.now(),
      }))
      localStorage.setItem('recentQuestionIds', JSON.stringify(withTimestamps))
    }
  }, [recentQuestionIds])

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    }
  }, [status, router])

  const loadNextQuestion = useCallback(async () => {
    if (!session) return

    setLoading(true)
    try {
      const excludeParam = recentQuestionIds.length > 0 ? `?exclude=${recentQuestionIds.join(',')}` : ''
      const res = await fetch(`/api/review/next${excludeParam}`)
      const data = await res.json()

      if (res.ok && data.question) {
        setQuestion(data.question)
        setUserState(data.userState)
        setSelectedChoiceId(null)
        setIsAnswered(false)
        setIsCorrect(null)
        setCorrectChoiceId(null)
        setExplanation(null)
        setIsFlashcardSaved(false)
      } else {
        console.error('Aucune question disponible')
      }
    } catch (error) {
      console.error('Erreur lors du chargement de la question:', error)
    } finally {
      setLoading(false)
    }
  }, [session, recentQuestionIds])

  // Charger le score estimé au démarrage
  useEffect(() => {
    if (session && status === 'authenticated') {
      loadEstimatedScore()
    }
  }, [session, status])

  const loadEstimatedScore = async () => {
    try {
      const res = await fetch('/api/dashboard/stats')
      const data = await res.json()
      if (res.ok && data) {
        // Calculer le score estimé exactement comme dans le dashboard
        const totalAttempts = data.totalAttempts || 0
        const totalCorrect = data.totalCorrect || 0
        const successRate = totalAttempts > 0
          ? Math.min(100, Math.round((totalCorrect / totalAttempts) * 100))
          : 0
        const estimatedScoreValue = Math.round((successRate / 100) * 400)
        
        setEstimatedScore({
          score: estimatedScoreValue,
          accuracy: successRate,
        })
      }
    } catch (error) {
      console.error('Erreur lors du chargement du score estimé:', error)
    }
  }

  // Ne pas charger automatiquement la question - l'utilisateur doit cliquer sur "Spaced Review"
  // useEffect(() => {
  //   if (session && status === 'authenticated') {
  //     loadNextQuestion()
  //   }
  // }, [session, status, loadNextQuestion])

  const handleAnswer = async (choiceId: string) => {
    if (!question || isAnswered) return

    setSelectedChoiceId(choiceId)
    setLoading(true)

    try {
      const res = await fetch('/api/review/answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questionId: question.id,
          choiceId,
        }),
      })

      const data = await res.json()

      if (res.ok) {
        setIsAnswered(true)
        setIsCorrect(data.isCorrect)
        setCorrectChoiceId(data.correctChoiceId)
        setExplanation(data.explanation)
        // Déclencher la mise à jour du win streak
        window.dispatchEvent(new Event('winStreakUpdated'))
        // Mettre à jour le score estimé après avoir répondu
        loadEstimatedScore()
      }
    } catch (error) {
      console.error('Erreur lors de la réponse:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSaveFlashcard = async () => {
    if (!question) return

    setSavingFlashcard(true)
    try {
      const res = await fetch('/api/flashcards/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questionId: question.id,
        }),
      })

      const data = await res.json()

      if (res.ok) {
        setIsFlashcardSaved(true)
        // La fiche a été créée ou existait déjà - dans les deux cas, on la marque comme sauvegardée
      } else {
        console.error('Erreur lors de la sauvegarde:', data.error)
        alert('Erreur lors de la sauvegarde de la fiche: ' + (data.error || 'Erreur inconnue'))
      }
    } catch (error) {
      console.error('Erreur lors de la sauvegarde de la fiche:', error)
      alert('Erreur lors de la sauvegarde de la fiche')
    } finally {
      setSavingFlashcard(false)
    }
  }

  const handleSchedule = async (rating: 'AGAIN' | 'HARD' | 'GOOD' | 'EASY') => {
    if (!question) return

    setLoading(true)
    try {
      const res = await fetch('/api/review/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questionId: question.id,
          rating,
        }),
      })

      if (res.ok) {
        // Ajouter à la liste des questions récentes (max 20)
        setRecentQuestionIds((prev) => {
          // Retirer l'ID s'il existe déjà pour éviter les doublons
          const filtered = prev.filter((id) => id !== question.id)
          const updated = [question.id, ...filtered].slice(0, 20)
          return updated
        })
        loadNextQuestion()
      }
    } catch (error) {
      console.error('Erreur lors de la planification:', error)
    } finally {
      setLoading(false)
    }
  }

  // Navigation clavier
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (loading) return

      if (!isAnswered && question) {
        // 1-4 pour répondre
        if (e.key >= '1' && e.key <= '4') {
          const index = parseInt(e.key) - 1
          if (question.choices[index]) {
            handleAnswer(question.choices[index].id)
          }
        }
      } else if (isAnswered) {
        // A/H/G/E pour scheduler
        if (e.key === 'a' || e.key === 'A') handleSchedule('AGAIN')
        if (e.key === 'h' || e.key === 'H') handleSchedule('HARD')
        if (e.key === 'g' || e.key === 'G') handleSchedule('GOOD')
        if (e.key === 'e' || e.key === 'E') handleSchedule('EASY')
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [isAnswered, question, loading])

  if (status === 'loading' || !session) {
    return (
      <div className="min-h-screen">
        <Nav />
        <main className="max-w-2xl mx-auto px-4 py-16">
          <div className="text-center">Chargement...</div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <Nav />
      <main className="max-w-2xl mx-auto px-4 py-16">
        {/* Section Révisées - Affichée seulement si showReviewOptions est true */}
        {showReviewOptions && (
          <div className="space-y-6 mb-6">
            <h1 className="text-3xl font-bold mb-6">Révisées</h1>
            {estimatedScore && (
              <div className="mb-4">
                <ScoreEstimateBadge
                  score={estimatedScore.score}
                  accuracy={estimatedScore.accuracy}
                  durationMinutes={0}
                  testType="blanc"
                  size="compact"
                />
              </div>
            )}
            
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-semibold mb-4">📚 Révisions espacées</h2>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Réviser vos questions avec le système de révisions espacées (SRS).
              </p>
              <button
                onClick={() => {
                  setShowReviewOptions(false)
                  loadNextQuestion()
                }}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Commencer à réviser
              </button>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-semibold mb-4">📝 Test Blanc</h2>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Entraînez-vous dans les conditions réelles de l'examen IAE avec un test blanc complet.
                Vous avez 3 heures pour répondre à toutes les questions.
              </p>
              <a
                href="/test-blanc"
                className="inline-block px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
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
          </div>
        )}

        {!showReviewOptions && (
          <>
            <div className="mb-4">
              <button
                onClick={() => setShowReviewOptions(true)}
                className="px-4 py-2 text-sm bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600"
              >
                ← Retour aux options
              </button>
            </div>

            {loading && !question && (
              <div className="text-center py-16">Chargement de la question...</div>
            )}

            {question && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
              <div className="mb-4 text-sm text-gray-600 dark:text-gray-400">
                Vu {userState?.timesSeen || 0} fois • Correct {userState?.timesCorrect || 0} fois
              </div>
              <h2 className="text-2xl font-bold mb-6">{question.prompt}</h2>

              <div className="space-y-3">
                {question.choices.map((choice, index) => {
                  const isSelected = selectedChoiceId === choice.id
                  const isCorrectChoice = correctChoiceId === choice.id
                  let bgColor = 'bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600'

                  if (isAnswered) {
                    if (isCorrectChoice) {
                      bgColor = 'bg-green-200 dark:bg-green-800'
                    } else if (isSelected && !isCorrect) {
                      bgColor = 'bg-red-200 dark:bg-red-800'
                    }
                  }

                  return (
                    <button
                      key={choice.id}
                      onClick={() => !isAnswered && handleAnswer(choice.id)}
                      disabled={isAnswered || loading}
                      className={`w-full text-left p-4 rounded-lg border-2 transition-colors ${bgColor} ${
                        !isAnswered ? 'cursor-pointer' : 'cursor-default'
                      } ${loading ? 'opacity-50' : ''}`}
                    >
                      <span className="font-semibold mr-2">{index + 1}.</span>
                      {choice.text}
                    </button>
                  )
                })}
              </div>

              {isAnswered && (
                <div className="mt-6 space-y-4">
                  <div
                    className={`p-4 rounded-lg ${
                      isCorrect
                        ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
                        : 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'
                    }`}
                  >
                    <strong>{isCorrect ? '✓ Correct !' : '✗ Incorrect'}</strong>
                  </div>

                  {explanation && (
                    <div className="p-4 bg-blue-50 dark:bg-blue-900 rounded-lg">
                      <strong className="block mb-2">Explication :</strong>
                      <p>{explanation}</p>
                    </div>
                  )}

                  {/* Bouton pour sauvegarder la fiche */}
                  <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <strong className="block mb-1">💾 Enregistrer dans les fiches mémo</strong>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {isFlashcardSaved 
                            ? 'Fiche enregistrée ! Consultez-la dans la section Fiches.'
                            : 'Créez une fiche mémo pour réviser cette question plus tard'}
                        </p>
                        {isFlashcardSaved && (
                          <a
                            href="/fiches"
                            className="inline-block mt-2 text-sm text-purple-600 dark:text-purple-400 hover:underline"
                          >
                            → Voir mes fiches
                          </a>
                        )}
                      </div>
                      <button
                        onClick={handleSaveFlashcard}
                        disabled={isFlashcardSaved || savingFlashcard}
                        className={`px-4 py-2 rounded-lg font-medium transition-colors ml-4 ${
                          isFlashcardSaved
                            ? 'bg-green-500 text-white cursor-default'
                            : 'bg-purple-600 text-white hover:bg-purple-700'
                        } disabled:opacity-50`}
                      >
                        {savingFlashcard
                          ? 'Enregistrement...'
                          : isFlashcardSaved
                          ? '✓ Enregistré'
                          : 'Enregistrer'}
                      </button>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                      Quand souhaitez-vous revoir cette question ?
                    </p>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={() => handleSchedule('AGAIN')}
                        disabled={loading}
                        className="px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                      >
                        À revoir ({'<3m'}) <span className="text-xs">[A]</span>
                      </button>
                      <button
                        onClick={() => handleSchedule('HARD')}
                        disabled={loading}
                        className="px-4 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50"
                      >
                        Difficile ({'<15m'}) <span className="text-xs">[H]</span>
                      </button>
                      <button
                        onClick={() => handleSchedule('GOOD')}
                        disabled={loading}
                        className="px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                      >
                        Correct (1j) <span className="text-xs">[G]</span>
                      </button>
                      <button
                        onClick={() => handleSchedule('EASY')}
                        disabled={loading}
                        className="px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                      >
                        Facile (3j) <span className="text-xs">[E]</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

            {!question && !loading && (
              <div className="text-center py-16">
                <p className="text-xl mb-4">Aucune question disponible pour le moment.</p>
                <button
                  onClick={loadNextQuestion}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Réessayer
                </button>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  )
}
