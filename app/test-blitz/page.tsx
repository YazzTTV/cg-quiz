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
  comprehensionText?: string | null
  isLogique?: boolean
  choices: Choice[]
}

type TestResult = {
  score: number
  scoreSur400?: number
  pointsObtenus?: number
  totalPoints?: number
  correctCount: number
  totalQuestions: number
  results: Array<{
    questionId: string
    isCorrect: boolean
    correctChoiceId: string | null
    explanation?: string | null
  }>
  durationMinutes: number
}

export default function TestBlitzPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [questions, setQuestions] = useState<Question[]>([])
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [startTime, setStartTime] = useState<Date | null>(null)
  const [timeRemaining, setTimeRemaining] = useState(0)
  const [duration, setDuration] = useState<30 | 60 | null>(null)
  const [isTestStarted, setIsTestStarted] = useState(false)
  const [isTestFinished, setIsTestFinished] = useState(false)
  const [results, setResults] = useState<TestResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [showConfirmFinish, setShowConfirmFinish] = useState(false)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    }
  }, [status, router])

  // Charger l'état depuis localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('testBlitzState')
      if (saved) {
        try {
          const parsed = JSON.parse(saved)
          const savedStartTime = new Date(parsed.startTime)
          const now = new Date()
          const elapsed = Math.floor((now.getTime() - savedStartTime.getTime()) / 1000)
          const savedDuration = parsed.duration || 30 * 60
          const remaining = savedDuration - elapsed

          if (remaining > 0 && parsed.questions && parsed.questions.length > 0) {
            setQuestions(parsed.questions)
            setAnswers(parsed.answers || {})
            setCurrentQuestionIndex(parsed.currentQuestionIndex || 0)
            setStartTime(savedStartTime)
            setTimeRemaining(remaining)
            setDuration(parsed.duration === 30 * 60 ? 30 : 60)
            setIsTestStarted(true)
          } else {
            localStorage.removeItem('testBlitzState')
          }
        } catch {
          // Ignorer les erreurs de parsing
        }
      }
    }
  }, [])

  const handleFinishTest = useCallback(async () => {
    if (!startTime) return

    setLoading(true)
    try {
      const answersArray = Object.entries(answers).map(([questionId, choiceId]) => ({
        questionId,
        choiceId,
      }))

      // Créer un map questionTypes pour identifier les questions de logique
      const questionTypes: Record<string, boolean> = {}
      questions.forEach((q) => {
        if (q.isLogique !== undefined) {
          questionTypes[q.id] = q.isLogique
        }
      })

      const res = await fetch('/api/test-blitz/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          answers: answersArray,
          questionTypes,
          startTime: startTime.toISOString(),
          endTime: new Date().toISOString(),
        }),
      })

      const data = await res.json()

      if (res.ok) {
        setResults(data)
        setIsTestFinished(true)
        localStorage.removeItem('testBlitzState')
        // Déclencher la mise à jour du win streak
        window.dispatchEvent(new Event('winStreakUpdated'))
      } else {
        alert('Erreur lors de la soumission: ' + (data.error || 'Erreur inconnue'))
      }
    } catch (error) {
      console.error('Erreur lors de la soumission:', error)
      alert('Erreur lors de la soumission')
    } finally {
      setLoading(false)
      setShowConfirmFinish(false)
    }
  }, [startTime, answers, questions])

  // Timer
  useEffect(() => {
    if (!isTestStarted || isTestFinished || timeRemaining <= 0) return

    const interval = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          // Terminer automatiquement le test
          handleFinishTest()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [isTestStarted, isTestFinished, timeRemaining, handleFinishTest])

  // Sauvegarder l'état dans localStorage
  useEffect(() => {
    if (isTestStarted && questions.length > 0 && startTime && duration) {
      const state = {
        questions,
        answers,
        currentQuestionIndex,
        startTime: startTime.toISOString(),
        duration: duration * 60,
      }
      localStorage.setItem('testBlitzState', JSON.stringify(state))
    }
  }, [questions, answers, currentQuestionIndex, startTime, isTestStarted, duration])

  const startTest = async (selectedDuration: 30 | 60) => {
    setLoading(true)
    try {
      const res = await fetch('/api/test-blitz/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ duration: selectedDuration }),
      })

      const data = await res.json()

      if (res.ok && data.questions) {
        setQuestions(data.questions)
        setStartTime(new Date())
        setIsTestStarted(true)
        setTimeRemaining(data.duration)
        setDuration(selectedDuration)
        setAnswers({})
        setCurrentQuestionIndex(0)
      } else {
        alert('Erreur lors du démarrage du test: ' + (data.error || 'Erreur inconnue'))
      }
    } catch (error) {
      console.error('Erreur lors du démarrage du test:', error)
      alert('Erreur lors du démarrage du test')
    } finally {
      setLoading(false)
    }
  }

  const handleAnswer = (choiceId: string) => {
    if (isTestFinished) return
    const currentQuestion = questions[currentQuestionIndex]
    if (!currentQuestion) return

    setAnswers((prev) => ({
      ...prev,
      [currentQuestion.id]: choiceId,
    }))
  }

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1)
    }
  }

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex((prev) => prev - 1)
    }
  }

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const currentQuestion = questions[currentQuestionIndex]
  const currentAnswer = currentQuestion ? answers[currentQuestion.id] : null
  const answeredCount = Object.keys(answers).length
  const progress = questions.length > 0 ? (answeredCount / questions.length) * 100 : 0

  if (!isTestStarted && !isTestFinished) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Nav />
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
            <h1 className="text-3xl font-bold mb-6">⚡ Test Blitz IAE</h1>
            <div className="space-y-4 mb-6">
              <p className="text-lg text-gray-700 dark:text-gray-300">
                Mode ultra rapide pour s'entraîner efficacement !
              </p>
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  <strong>Test normal :</strong> 170 questions en 3h (Culture, Français, Logique, Anglais)<br />
                  <strong>Mode Blitz :</strong> Questions sélectionnées au prorata pour une durée réduite<br />
                  <strong>30 min :</strong> 8 questions par partie (32 total) • <strong>1h :</strong> 15 questions par partie (60 total)
                </p>
              </div>
            </div>
            <div className="space-y-4">
              <button
                onClick={() => startTest(30)}
                disabled={loading}
                className="w-full px-6 py-4 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-lg font-semibold"
              >
                {loading ? 'Chargement...' : '⚡ 30 minutes (32 questions)'}
              </button>
              <button
                onClick={() => startTest(60)}
                disabled={loading}
                className="w-full px-6 py-4 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-lg font-semibold"
              >
                {loading ? 'Chargement...' : '⚡ 1 heure (60 questions)'}
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (isTestFinished && results) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Nav />
               <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
            <h1 className="text-3xl font-bold mb-6">Résultats du Test Blitz</h1>
            <div className="space-y-6">
              {/* Badge d'estimation avec animation */}
              {(() => {
                // Calculer le score estimé sur 400 pour le test blitz
                // Basé sur la précision, on estime le score sur un test complet de 170 questions
                const estimatedScore = results.scoreSur400 !== undefined 
                  ? results.scoreSur400 
                  : Math.round((results.score / 100) * 400)
                return (
                  <ScoreEstimateBadge
                    score={estimatedScore}
                    accuracy={results.score}
                    durationMinutes={results.durationMinutes}
                    testType="blitz"
                  />
                )
              })()}

              <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-6">
                <div className="text-center">
                  <div className="text-5xl font-bold text-purple-600 dark:text-purple-400 mb-2">
                    {results.score}%
                  </div>
                  {results.scoreSur400 !== undefined && (
                    <div className="text-2xl font-semibold text-purple-700 dark:text-purple-300 mb-2">
                      {results.scoreSur400} / {results.totalPoints || 400} points
                    </div>
                  )}
                  <div className="text-xl text-gray-700 dark:text-gray-300">
                    {results.correctCount} / {results.totalQuestions} réponses correctes
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                    Durée : {results.durationMinutes} minutes
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h2 className="text-2xl font-semibold">Détail des réponses</h2>
                {questions.map((question, index) => {
                  const result = results.results.find((r) => r.questionId === question.id)
                  const userAnswer = answers[question.id]
                  const isCorrect = result?.isCorrect || false

                  return (
                    <div
                      key={question.id}
                      className={`border rounded-lg p-4 ${
                        isCorrect
                          ? 'bg-green-50 dark:bg-green-900/20 border-green-300'
                          : 'bg-red-50 dark:bg-red-900/20 border-red-300'
                      }`}
                    >
                      <div className="flex items-start gap-2 mb-2">
                        <span className="font-semibold">Question {index + 1}:</span>
                        <span className={isCorrect ? 'text-green-600' : 'text-red-600'}>
                          {isCorrect ? '✓ Correct' : '✗ Incorrect'}
                        </span>
                      </div>
                      <p className="mb-3">{question.prompt}</p>
                      <div className="space-y-2">
                        {question.choices.map((choice) => {
                          const isUserAnswer = choice.id === userAnswer
                          const isCorrectAnswer = choice.id === result?.correctChoiceId

                          return (
                            <div
                              key={choice.id}
                              className={`p-2 rounded ${
                                isCorrectAnswer
                                  ? 'bg-green-200 dark:bg-green-800 font-semibold'
                                  : isUserAnswer && !isCorrect
                                  ? 'bg-red-200 dark:bg-red-800'
                                  : 'bg-gray-100 dark:bg-gray-700'
                              }`}
                            >
                              {choice.text}
                              {isUserAnswer && <span className="ml-2 text-xs">(Votre réponse)</span>}
                              {isCorrectAnswer && !isUserAnswer && (
                                <span className="ml-2 text-xs">(Bonne réponse)</span>
                              )}
                            </div>
                          )
                        })}
                      </div>
                      {result?.explanation && (
                        <div className="mt-3 p-2 bg-blue-50 dark:bg-blue-900/20 rounded">
                          <strong>Explication :</strong> {result.explanation}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>

              <button
                onClick={() => router.push('/dashboard')}
                className="w-full px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
              >
                Retour au dashboard
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Nav />
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header avec timer et progression */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-2xl font-bold">⚡ Test Blitz IAE</h1>
              <div className="text-right">
                <div className={`text-2xl font-mono font-bold ${timeRemaining < 300 ? 'text-red-600' : 'text-gray-700 dark:text-gray-300'}`}>
                  {formatTime(timeRemaining)}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Temps restant</div>
              </div>
            </div>
            <div className="mb-2">
              <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-1">
                <span>
                  Question {currentQuestionIndex + 1} / {questions.length}
                </span>
                <span>{answeredCount} réponses données</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className="bg-purple-600 h-2 rounded-full transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          </div>

          {/* Question */}
          {currentQuestion && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
              {currentQuestion.comprehensionText && (
                <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
                  <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Texte de compréhension :
                  </h3>
                  <div className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap leading-relaxed">
                    {currentQuestion.comprehensionText}
                  </div>
                </div>
              )}
              <h2 className="text-xl font-semibold mb-4">{currentQuestion.prompt}</h2>
              <div className="space-y-3">
                {currentQuestion.choices.map((choice) => (
                  <button
                    key={choice.id}
                    onClick={() => handleAnswer(choice.id)}
                    className={`w-full text-left p-4 rounded-lg border-2 transition-colors ${
                      currentAnswer === choice.id
                        ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                        : 'border-gray-300 dark:border-gray-600 hover:border-purple-300'
                    }`}
                  >
                    {choice.text}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <div className="flex justify-between">
              <button
                onClick={handlePrevious}
                disabled={currentQuestionIndex === 0}
                className="px-6 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Précédent
              </button>
              <div className="flex gap-2">
                {!showConfirmFinish ? (
                  <button
                    onClick={() => setShowConfirmFinish(true)}
                    className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                  >
                    Terminer le test
                  </button>
                ) : (
                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowConfirmFinish(false)}
                      className="px-6 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600"
                    >
                      Annuler
                    </button>
                    <button
                      onClick={handleFinishTest}
                      disabled={loading}
                      className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                    >
                      {loading ? 'Soumission...' : 'Confirmer'}
                    </button>
                  </div>
                )}
                <button
                  onClick={handleNext}
                  disabled={currentQuestionIndex === questions.length - 1}
                  className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Suivant
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
