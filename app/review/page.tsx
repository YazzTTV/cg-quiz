'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Nav } from '@/components/Nav'

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
      } else {
        console.error('Aucune question disponible')
      }
    } catch (error) {
      console.error('Erreur lors du chargement de la question:', error)
    } finally {
      setLoading(false)
    }
  }, [session, recentQuestionIds])

  useEffect(() => {
    if (session && status === 'authenticated') {
      loadNextQuestion()
    }
  }, [session, status, loadNextQuestion])

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
      }
    } catch (error) {
      console.error('Erreur lors de la réponse:', error)
    } finally {
      setLoading(false)
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
      </main>
    </div>
  )
}

