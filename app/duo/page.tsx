'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Nav } from '@/components/Nav'
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
  questionType: 'culture' | 'francais' | 'logique' | 'anglais'
  timeLimit: number
  choices: Choice[]
}

type RoomState = {
  code: string
  hostName: string
  guestName: string | null
  status: 'waiting' | 'starting' | 'in_progress' | 'finished'
  currentQuestionIndex: number
  totalQuestions: number
  isHost: boolean
  isGuest: boolean
  hasGuest: boolean
}

export default function DuoPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [roomCode, setRoomCode] = useState<string>('')
  const [roomState, setRoomState] = useState<RoomState | null>(null)
  const [questions, setQuestions] = useState<Question[]>([])
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string | null>>({})
  const [timeRemaining, setTimeRemaining] = useState(0)
  const [isAnswered, setIsAnswered] = useState(false)
  const [showRoomInterface, setShowRoomInterface] = useState(true)
  const [isCreatingRoom, setIsCreatingRoom] = useState(false)
  const [isJoiningRoom, setIsJoiningRoom] = useState(false)
  const [joinCode, setJoinCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [isSyncingGame, setIsSyncingGame] = useState(false)
  const [showReportModal, setShowReportModal] = useState(false)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    }
  }, [status, router])

  // Polling pour vérifier l'état de la salle
  useEffect(() => {
    if (!roomCode) return

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/duo/rooms?code=${roomCode}`)
        if (res.ok) {
          const state = await res.json()
          
          // Synchroniser l'index de la question si l'autre joueur a avancé
          if (!showRoomInterface && state.currentQuestionIndex !== currentQuestionIndex) {
            setCurrentQuestionIndex(state.currentQuestionIndex)
            setIsAnswered(false)
            setTimeRemaining(questions[state.currentQuestionIndex]?.timeLimit || 0)
          }
          
          // Vérifier si les deux joueurs ont répondu et passer automatiquement à la question suivante
          if (!showRoomInterface && questions.length > 0 && currentQuestionIndex < questions.length) {
            const currentQuestion = questions[currentQuestionIndex]
            if (currentQuestion) {
              // Vérifier si les deux joueurs ont répondu (via l'état de la salle)
              // On ne peut pas vérifier directement, donc on va utiliser le polling pour détecter le changement
            }
          }
          
          setRoomState(state)

          // Si les deux joueurs sont présents et que la partie n'a pas encore commencé, démarrer
          if (showRoomInterface && state.hasGuest && state.status === 'waiting') {
            // L'hôte peut démarrer la partie
            if (state.isHost) {
              // Démarrer automatiquement après 2 secondes
              setTimeout(() => {
                startGame()
              }, 2000)
            }
          }

          // Si la partie a démarré, synchroniser l'invité avec les questions
          if (
            showRoomInterface &&
            state.hasGuest &&
            (state.status === 'starting' || state.status === 'in_progress') &&
            questions.length === 0 &&
            !isSyncingGame
          ) {
            setIsSyncingGame(true)
            try {
              const startRes = await fetch('/api/duo/start', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code: roomCode }),
              })
              const startData = await startRes.json()
              if (startRes.ok && startData.questions) {
                setQuestions(startData.questions)
                setCurrentQuestionIndex(state.currentQuestionIndex || 0)
                setAnswers({})
                setIsAnswered(false)
                setShowRoomInterface(false)
                setTimeRemaining(startData.questions[state.currentQuestionIndex || 0]?.timeLimit || 0)
              }
            } catch (error) {
              console.error('Erreur lors de la synchronisation de la partie:', error)
            } finally {
              setIsSyncingGame(false)
            }
          }

          // Si la partie est terminée, rediriger vers les résultats
          if (state.status === 'finished' && !showRoomInterface) {
            router.push(`/duo/results?code=${roomCode}`)
          }
        }
      } catch (error) {
        console.error('Erreur lors de la vérification de la salle:', error)
      }
    }, 1000) // Vérifier toutes les secondes

    return () => clearInterval(interval)
  }, [roomCode, showRoomInterface, currentQuestionIndex, questions, isSyncingGame, router])

  // Timer pour les questions
  useEffect(() => {
    if (!questions.length || currentQuestionIndex >= questions.length) return
    if (roomState?.status !== 'in_progress' && roomState?.status !== 'starting') return

    const currentQuestion = questions[currentQuestionIndex]
    if (!currentQuestion) return

    // Réinitialiser le timer et l'état de réponse quand on change de question
    if (!isAnswered) {
      setTimeRemaining(currentQuestion.timeLimit)
    }

    const interval = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          // Temps écoulé
          if (!isAnswered) {
            handleTimeUp()
          }
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [currentQuestionIndex, questions, roomState?.status])

  useEffect(() => {
    if (showRoomInterface) return
    const currentQuestion = questions[currentQuestionIndex]
    if (!currentQuestion) return
    setTimeRemaining(currentQuestion.timeLimit)
  }, [currentQuestionIndex, questions, showRoomInterface])

  useEffect(() => {
    if (showRoomInterface) return
    const currentQuestion = questions[currentQuestionIndex]
    if (!currentQuestion) return
    setIsAnswered(Object.prototype.hasOwnProperty.call(answers, currentQuestion.id))
  }, [currentQuestionIndex, questions, answers, showRoomInterface])

  const createRoom = async () => {
    setIsCreatingRoom(true)
    try {
      const res = await fetch('/api/duo/rooms', {
        method: 'POST',
      })

      const data = await res.json()

      if (res.ok && data.code) {
        setRoomCode(data.code)
        setShowRoomInterface(true)
        // Vérifier l'état de la salle
        const stateRes = await fetch(`/api/duo/rooms?code=${data.code}`)
        if (stateRes.ok) {
          const state = await stateRes.json()
          setRoomState(state)
        }
      } else {
        alert('Erreur lors de la création de la salle: ' + (data.error || 'Erreur inconnue'))
      }
    } catch (error) {
      console.error('Erreur lors de la création de la salle:', error)
      alert('Erreur lors de la création de la salle')
    } finally {
      setIsCreatingRoom(false)
    }
  }

  const joinRoom = async () => {
    if (!joinCode || joinCode.length !== 4) {
      alert('Veuillez entrer un code à 4 chiffres')
      return
    }

    setIsJoiningRoom(true)
    try {
      const res = await fetch(`/api/duo/rooms?code=${joinCode}`)

      const data = await res.json()

      if (res.ok) {
        setRoomCode(joinCode)
        setRoomState(data)
        setShowRoomInterface(true)
      } else {
        alert('Erreur lors de la connexion: ' + (data.error || 'Salle introuvable'))
      }
    } catch (error) {
      console.error('Erreur lors de la connexion:', error)
      alert('Erreur lors de la connexion')
    } finally {
      setIsJoiningRoom(false)
    }
  }

  const startGame = async () => {
    if (!roomCode) return

    setLoading(true)
    try {
      const res = await fetch('/api/duo/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: roomCode }),
      })

      const data = await res.json()

      if (res.ok && data.questions) {
        setQuestions(data.questions)
        setCurrentQuestionIndex(0)
        setAnswers({})
        setShowRoomInterface(false)
        // Mettre à jour le statut de la salle
        const stateRes = await fetch(`/api/duo/rooms?code=${roomCode}`)
        if (stateRes.ok) {
          const state = await stateRes.json()
          setRoomState(state)
        }
      } else {
        alert('Erreur lors du démarrage: ' + (data.error || 'Erreur inconnue'))
      }
    } catch (error) {
      console.error('Erreur lors du démarrage:', error)
      alert('Erreur lors du démarrage')
    } finally {
      setLoading(false)
    }
  }

  const handleAnswer = async (choiceId: string) => {
    if (!roomCode || isAnswered) return

    const currentQuestion = questions[currentQuestionIndex]
    if (!currentQuestion) return

    setLoading(true)
    try {
      const res = await fetch('/api/duo/answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: roomCode,
          questionId: currentQuestion.id,
          choiceId,
        }),
      })

      const data = await res.json()

      if (res.ok) {
        setAnswers((prev) => ({
          ...prev,
          [currentQuestion.id]: choiceId,
        }))
        setIsAnswered(true)
        // Arrêter le timer
        setTimeRemaining(0)
      }
    } catch (error) {
      console.error('Erreur lors de la réponse:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleNextQuestion = async () => {
    if (!roomCode || !isAnswered) return

    setLoading(true)
    try {
      const res = await fetch('/api/duo/next-question', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: roomCode }),
      })

      const data = await res.json()

      if (res.ok) {
        if (data.isFinished) {
          // Partie terminée, afficher les résultats
          router.push(`/duo/results?code=${roomCode}`)
        } else if (data.canAdvance) {
          // Les deux joueurs ont répondu, on peut avancer
          setCurrentQuestionIndex(data.currentQuestionIndex)
          setIsAnswered(false)
          setTimeRemaining(questions[data.currentQuestionIndex]?.timeLimit || 0)
        } else {
          // Attendre que l'autre joueur réponde
          // La synchronisation se fera via le polling
        }
      }
    } catch (error) {
      console.error('Erreur lors du passage à la question suivante:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleTimeUp = async () => {
    if (isAnswered) return

    // Si aucune réponse n'a été donnée, marquer comme répondu (réponse vide)
    const currentQuestion = questions[currentQuestionIndex]
    if (currentQuestion && !Object.prototype.hasOwnProperty.call(answers, currentQuestion.id)) {
      try {
        await fetch('/api/duo/answer', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            code: roomCode,
            questionId: currentQuestion.id,
            choiceId: null,
          }),
        })
      } catch (error) {
        console.error('Erreur lors de la réponse automatique:', error)
      } finally {
        setAnswers((prev) => ({
          ...prev,
          [currentQuestion.id]: null,
        }))
        setIsAnswered(true)
        // Essayer de passer à la question suivante (sera automatique si les deux joueurs ont répondu)
        setTimeout(() => {
          handleNextQuestion()
        }, 1000)
      }
    }
  }

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

  // Interface de création/rejoindre une salle
  if (showRoomInterface) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Nav />
        <main className="max-w-2xl mx-auto px-4 py-16">
          <h1 className="text-3xl font-bold mb-6">⚔️ Mode Duo</h1>

          {roomCode ? (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-semibold mb-4">Salle {roomCode}</h2>
              {roomState && (
                <div className="space-y-4">
                  <div>
                    <p className="text-gray-600 dark:text-gray-400">
                      <strong>Hôte:</strong> {roomState.hostName}
                    </p>
                    <p className="text-gray-600 dark:text-gray-400">
                      <strong>Invité:</strong> {roomState.guestName || 'En attente...'}
                    </p>
                  </div>

                  {roomState.isHost && (
                    <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                      <p className="text-sm text-gray-700 dark:text-gray-300">
                        Code de la salle: <strong className="text-2xl">{roomCode}</strong>
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                        Partagez ce code avec votre ami pour qu'il rejoigne la salle.
                      </p>
                    </div>
                  )}

                  {!roomState.hasGuest && (
                    <div className="text-center py-4">
                      <p className="text-gray-600 dark:text-gray-400">
                        En attente du deuxième joueur...
                      </p>
                    </div>
                  )}

                  {roomState.hasGuest && roomState.status === 'waiting' && roomState.isHost && (
                    <div className="text-center">
                      <p className="text-green-600 dark:text-green-400 mb-4">
                        Les deux joueurs sont prêts ! La partie va démarrer...
                      </p>
                    </div>
                  )}

                  <button
                    onClick={() => {
                      setRoomCode('')
                      setRoomState(null)
                      setShowRoomInterface(true)
                    }}
                    className="w-full px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                  >
                    Quitter la salle
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
                <h2 className="text-xl font-semibold mb-4">Créer une salle</h2>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Créez une salle et partagez le code avec votre ami.
                </p>
                <button
                  onClick={createRoom}
                  disabled={isCreatingRoom}
                  className="w-full px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50"
                >
                  {isCreatingRoom ? 'Création...' : 'Créer une salle'}
                </button>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
                <h2 className="text-xl font-semibold mb-4">Rejoindre une salle</h2>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Entrez le code à 4 chiffres de la salle pour rejoindre votre ami.
                </p>
                <div className="space-y-4">
                  <input
                    type="text"
                    maxLength={4}
                    value={joinCode}
                    onChange={(e) => setJoinCode(e.target.value.replace(/\D/g, ''))}
                    placeholder="Code (4 chiffres)"
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white text-center text-2xl font-mono"
                  />
                  <button
                    onClick={joinRoom}
                    disabled={isJoiningRoom || joinCode.length !== 4}
                    className="w-full px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50"
                  >
                    {isJoiningRoom ? 'Connexion...' : 'Rejoindre'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    )
  }

  // Interface du jeu
  const currentQuestion = questions[currentQuestionIndex]
  const currentAnswer = currentQuestion ? answers[currentQuestion.id] : null

  if (!currentQuestion) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Nav />
        <main className="max-w-2xl mx-auto px-4 py-16">
          <div className="text-center">Chargement de la question...</div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Nav />
      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Header avec timer et progression */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold">⚔️ Mode Duo</h1>
            <div className="text-right">
              <div className={`text-2xl font-mono font-bold ${timeRemaining < 5 ? 'text-red-600' : 'text-gray-700 dark:text-gray-300'}`}>
                {timeRemaining}s
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Temps restant</div>
            </div>
          </div>
          <div className="mb-2">
            <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-1">
              <span>
                Question {currentQuestionIndex + 1} / {questions.length}
              </span>
              <span>
                {roomState?.hostName} vs {roomState?.guestName}
              </span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div
                className="bg-orange-600 h-2 rounded-full transition-all"
                style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}
              />
            </div>
          </div>
        </div>

        {/* Question */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
          {currentQuestion.comprehensionText && (
            <div className="mb-6 w-full relative">
              <div className="flex items-center gap-2 mb-3">
                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-orange-600 text-white shadow-md">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
                <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">Texte de compréhension</span>
              </div>
              
              <div className="relative w-full bg-gradient-to-br from-orange-50 via-orange-50 to-orange-50 dark:from-gray-800 dark:via-gray-800 dark:to-gray-800 rounded-xl border-l-4 border-orange-500 shadow-sm">
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
                disabled={isAnswered || loading || timeRemaining === 0}
                className={`w-full text-left p-4 rounded-lg border-2 transition-colors ${
                  currentAnswer === choice.id
                    ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20'
                    : 'border-gray-300 dark:border-gray-600 hover:border-orange-300'
                } ${isAnswered || loading || timeRemaining === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {choice.text}
              </button>
            ))}
          </div>

          {isAnswered && (
            <div className="mt-6">
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 mb-4">
                <p className="text-sm text-gray-700 dark:text-gray-300 text-center">
                  En attente que l'autre joueur réponde...
                </p>
              </div>
              <button
                onClick={handleNextQuestion}
                disabled={loading}
                className="w-full px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50"
              >
                {loading ? 'Chargement...' : 'Question suivante (quand les deux joueurs ont répondu)'}
              </button>
            </div>
          )}
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
      </main>
    </div>
  )
}
