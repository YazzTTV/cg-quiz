'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Nav } from '@/components/Nav'
import ScoreEstimateBadge from '@/components/ScoreEstimateBadge'
import { formatComprehensionText } from '@/lib/formatComprehensionText'
import ReportQuestionModal from '@/components/ReportQuestionModal'

type Choice = {
  id: string
  text: string
  order: number
}

type Question = {
  id: string
  prompt: string
  comprehensionText?: string | null
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

export default function TestBlancPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [questions, setQuestions] = useState<Question[]>([])
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [startTime, setStartTime] = useState<Date | null>(null)
  const [timeRemaining, setTimeRemaining] = useState(3 * 60 * 60) // 3h en secondes
  const [isTestStarted, setIsTestStarted] = useState(false)
  const [isTestFinished, setIsTestFinished] = useState(false)
  const [results, setResults] = useState<TestResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [showConfirmFinish, setShowConfirmFinish] = useState(false)
  const [selectedTest, setSelectedTest] = useState<number | null>(null)
  const [availableTests, setAvailableTests] = useState<number[]>([])
  const [showReportModal, setShowReportModal] = useState(false)
  const [isPaused, setIsPaused] = useState(false)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    }
  }, [status, router])

  // Charger les tests disponibles
  useEffect(() => {
    const loadAvailableTests = async () => {
      try {
        const res = await fetch('/api/test-blanc/list')
        if (res.ok) {
          const data = await res.json()
          setAvailableTests(data.tests || [])
        }
      } catch (error) {
        console.error('Erreur lors du chargement des tests:', error)
      }
    }
    loadAvailableTests()
  }, [])

  // Charger l'état depuis localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('testBlancState')
      if (saved) {
        try {
          const parsed = JSON.parse(saved)
          const savedStartTime = new Date(parsed.startTime)
          const now = new Date()
          const elapsed = Math.floor((now.getTime() - savedStartTime.getTime()) / 1000)
          const remaining = 3 * 60 * 60 - elapsed

          if (remaining > 0 && parsed.questions && parsed.questions.length > 0) {
            setQuestions(parsed.questions)
            setAnswers(parsed.answers || {})
            setCurrentQuestionIndex(parsed.currentQuestionIndex || 0)
            setStartTime(savedStartTime)
            setTimeRemaining(remaining)
            setIsTestStarted(true)
            setIsPaused(parsed.isPaused || false)
          } else {
            // Le test a expiré ou n'est plus valide
            localStorage.removeItem('testBlancState')
          }
        } catch {
          // Ignorer les erreurs de parsing
        }
      }
    }
  }, [])

  // Timer
  useEffect(() => {
    if (!isTestStarted || isTestFinished || timeRemaining <= 0 || isPaused) return

    const interval = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          handleFinishTest()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [isTestStarted, isTestFinished, timeRemaining, isPaused])

  // Sauvegarder l'état dans localStorage
  useEffect(() => {
    if (isTestStarted && questions.length > 0 && startTime) {
      const state = {
        questions,
        answers,
        currentQuestionIndex,
        startTime: startTime.toISOString(),
        isPaused,
      }
      localStorage.setItem('testBlancState', JSON.stringify(state))
    }
  }, [questions, answers, currentQuestionIndex, startTime, isTestStarted, isPaused])

  const startTest = async () => {
    if (!selectedTest) {
      alert('Veuillez sélectionner un test')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/test-blanc/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ testNumber: selectedTest }),
      })

      const data = await res.json()

      if (res.ok && data.questions) {
        setQuestions(data.questions)
        setStartTime(new Date())
        setIsTestStarted(true)
        setTimeRemaining(3 * 60 * 60)
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
    if (isTestFinished || isPaused) return
    const currentQuestion = questions[currentQuestionIndex]
    if (!currentQuestion) return

    setAnswers((prev) => ({
      ...prev,
      [currentQuestion.id]: choiceId,
    }))
  }

  const handleNext = () => {
    if (isPaused) return
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1)
    }
  }

  const handlePrevious = () => {
    if (isPaused) return
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex((prev) => prev - 1)
    }
  }

  const handleFinishTest = async () => {
    if (!startTime) return

    setLoading(true)
    try {
      const answersArray = Object.entries(answers).map(([questionId, choiceId]) => ({
        questionId,
        choiceId,
      }))

      const res = await fetch('/api/test-blanc/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          answers: answersArray,
          startTime: startTime.toISOString(),
          endTime: new Date().toISOString(),
        }),
      })

      const data = await res.json()

      if (res.ok) {
        setResults(data)
        setIsTestFinished(true)
        localStorage.removeItem('testBlancState')
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
            <h1 className="text-3xl font-bold mb-6">Test Blanc IAE</h1>
            <div className="space-y-4 mb-6">
              <p className="text-lg">
                <strong>Durée :</strong> 3 heures
              </p>
              <p className="text-gray-600 dark:text-gray-400">
                Sélectionnez le test blanc que vous souhaitez passer. Chaque test contient 170 questions
                réparties en Culture générale (1-50), Français (51-100), Logique (101-120) et Anglais (121-170).
              </p>
            </div>
            
            <div className="space-y-3 mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Choisir un test :
              </label>
              {availableTests.length > 0 ? (
                <div className="space-y-2">
                  {availableTests.map((testNum) => (
                    <button
                      key={testNum}
                      onClick={() => setSelectedTest(testNum)}
                      className={`w-full text-left px-4 py-3 rounded-lg border-2 transition-colors ${
                        selectedTest === testNum
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                          : 'border-gray-300 dark:border-gray-600 hover:border-blue-300'
                      }`}
                    >
                      <div className="font-semibold">Test Blanc {testNum}</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        170 questions - 3h
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 dark:text-gray-400">Chargement des tests disponibles...</p>
              )}
            </div>

            <button
              onClick={startTest}
              disabled={loading || !selectedTest}
              className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Chargement...' : 'Commencer le test'}
            </button>
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
            <h1 className="text-3xl font-bold mb-6">Résultats du Test Blanc</h1>
            <div className="space-y-6">
              {/* Badge d'estimation avec animation */}
              {results.scoreSur400 !== undefined && (
                <ScoreEstimateBadge
                  score={results.scoreSur400}
                  accuracy={results.score}
                  durationMinutes={results.durationMinutes}
                  testType="blanc"
                />
              )}

              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6">
                <div className="text-center">
                  <div className="text-5xl font-bold text-blue-600 dark:text-blue-400 mb-2">
                    {results.score}%
                  </div>
                  {results.scoreSur400 !== undefined && (
                    <div className="text-2xl font-semibold text-blue-700 dark:text-blue-300 mb-2">
                      {results.scoreSur400} / 400 points
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
                className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
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
        <div className="flex gap-6">
          {/* Sommaire à gauche */}
          <div className="w-56 flex-shrink-0 -ml-2">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-3 sticky top-4">
              <h3 className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Sommaire
              </h3>
              <div className="grid grid-cols-5 gap-1.5 max-h-[calc(100vh-200px)] overflow-y-auto custom-scrollbar">
                {questions.map((question, index) => {
                  const isAnswered = answers[question.id] !== undefined
                  const isCurrent = index === currentQuestionIndex
                  
                  return (
                    <button
                      key={question.id}
                      onClick={() => !isPaused && setCurrentQuestionIndex(index)}
                      disabled={isPaused}
                      className={`
                        w-8 h-8 rounded-lg text-xs font-medium transition-all
                        ${isPaused ? 'opacity-50 cursor-not-allowed' : ''}
                        ${isCurrent 
                          ? 'bg-blue-600 text-white shadow-lg scale-110' 
                          : isAnswered
                          ? 'bg-blue-500 text-white hover:bg-blue-600'
                          : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                        }
                      `}
                      title={isPaused ? 'Test en pause' : `Question ${index + 1}`}
                    >
                      {index + 1}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
          
          {/* Contenu principal */}
          <div className="flex-1 max-w-4xl">
          {/* Header avec timer et progression */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-2xl font-bold">Test Blanc IAE</h1>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setIsPaused(!isPaused)}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    isPaused
                      ? 'bg-green-600 hover:bg-green-700 text-white'
                      : 'bg-yellow-500 hover:bg-yellow-600 text-white'
                  }`}
                >
                  {isPaused ? '▶ Reprendre' : '⏸ Pause'}
                </button>
                <div className="text-right">
                  <div className={`text-2xl font-mono font-bold ${timeRemaining < 600 ? 'text-red-600' : 'text-gray-700 dark:text-gray-300'} ${isPaused ? 'opacity-50' : ''}`}>
                    {formatTime(timeRemaining)}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {isPaused ? '⏸ En pause' : 'Temps restant'}
                  </div>
                </div>
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
                  className="bg-blue-600 h-2 rounded-full transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          </div>

          {/* Question */}
          {currentQuestion && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
              {currentQuestion.comprehensionText && (
                <div className="mb-6 w-full relative">
                  {/* Badge moderne */}
                  <div className="flex items-center gap-2 mb-3">
                    <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-md">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                      </svg>
                    </div>
                    <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">Texte de compréhension</span>
                  </div>
                  
                  {/* Zone de texte moderne */}
                  <div className="relative w-full bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-800 dark:via-gray-800 dark:to-gray-800 rounded-xl border-l-4 border-blue-500 shadow-sm">
                    <div className="py-5 px-[10px] max-h-72 overflow-y-auto custom-scrollbar">
                      <div className="w-full text-[15px] leading-relaxed text-gray-800 dark:text-gray-200 whitespace-pre-wrap break-words font-sans text-left">
                        {formatComprehensionText(currentQuestion.comprehensionText)}
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Bouton pour signaler la question - visible dès l'affichage */}
              <div className="mb-4 flex justify-end">
                <button
                  onClick={() => setShowReportModal(true)}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium text-sm"
                >
                  🚨 Signaler la question
                </button>
              </div>

              <h2 className="text-xl font-semibold mb-4">{currentQuestion.prompt}</h2>
              <div className="space-y-3">
                {currentQuestion.choices.map((choice) => (
                  <button
                    key={choice.id}
                    onClick={() => handleAnswer(choice.id)}
                    disabled={isPaused}
                    className={`w-full text-left p-4 rounded-lg border-2 transition-colors ${
                      isPaused ? 'opacity-50 cursor-not-allowed' : ''
                    } ${
                      currentAnswer === choice.id
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-300 dark:border-gray-600 hover:border-blue-300'
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
                disabled={currentQuestionIndex === 0 || isPaused}
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
                    disabled={currentQuestionIndex === questions.length - 1 || isPaused}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Suivant
                  </button>
              </div>
            </div>
          </div>
          </div>
        </div>

        {/* Modal de signalement */}
        {currentQuestion && (
          <ReportQuestionModal
            questionId={currentQuestion.id}
            isOpen={showReportModal}
            onClose={() => setShowReportModal(false)}
            onReported={() => {
              setShowReportModal(false)
            }}
          />
        )}
      </div>
    </div>
  )
}
