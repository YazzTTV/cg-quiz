'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Nav } from '@/components/Nav'

type Result = {
  questionId: string
  prompt: string
  correctChoiceId: string | null
  hostAnswer: string | null
  guestAnswer: string | null
  hostIsCorrect: boolean
  guestIsCorrect: boolean
}

type ResultsData = {
  hostScore: number
  guestScore: number
  hostName: string
  guestName: string
  totalQuestions: number
  results: Result[]
  isHost: boolean
}

function DuoResultsContent() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [results, setResults] = useState<ResultsData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    }
  }, [status, router])

  useEffect(() => {
    const code = searchParams.get('code')
    if (!code) {
      router.push('/duo')
      return
    }

    const fetchResults = async () => {
      try {
        const res = await fetch(`/api/duo/results?code=${code}`)
        if (res.ok) {
          const data = await res.json()
          setResults(data)
        } else {
          alert('Erreur lors du chargement des résultats')
          router.push('/duo')
        }
      } catch (error) {
        console.error('Erreur lors du chargement des résultats:', error)
        alert('Erreur lors du chargement des résultats')
        router.push('/duo')
      } finally {
        setLoading(false)
      }
    }

    fetchResults()
  }, [searchParams, router])

  if (status === 'loading' || loading || !results) {
    return (
      <div className="min-h-screen">
        <Nav />
        <main className="max-w-2xl mx-auto px-4 py-16">
          <div className="text-center">Chargement des résultats...</div>
        </main>
      </div>
    )
  }

  const winner = results.hostScore > results.guestScore 
    ? results.hostName 
    : results.guestScore > results.hostScore 
    ? results.guestName 
    : null

  const isWinner = winner === (results.isHost ? results.hostName : results.guestName)

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Nav />
      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold mb-6 text-center">⚔️ Résultats du Mode Duo</h1>

          {/* Scores */}
          <div className="grid grid-cols-2 gap-6 mb-8">
            <div className={`bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6 ${results.isHost ? 'ring-2 ring-blue-500' : ''}`}>
              <div className="text-center">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  {results.isHost ? '(Vous)' : ''} {results.hostName}
                </p>
                <div className="text-4xl font-bold text-blue-600 dark:text-blue-400">
                  {results.hostScore}
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                  / {results.totalQuestions} questions
                </p>
              </div>
            </div>

            <div className={`bg-orange-50 dark:bg-orange-900/20 rounded-lg p-6 ${!results.isHost ? 'ring-2 ring-orange-500' : ''}`}>
              <div className="text-center">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  {!results.isHost ? '(Vous)' : ''} {results.guestName}
                </p>
                <div className="text-4xl font-bold text-orange-600 dark:text-orange-400">
                  {results.guestScore}
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                  / {results.totalQuestions} questions
                </p>
              </div>
            </div>
          </div>

          {/* Gagnant */}
          {winner && (
            <div className={`text-center mb-8 p-6 rounded-lg ${isWinner ? 'bg-green-100 dark:bg-green-900/20' : 'bg-gray-100 dark:bg-gray-700'}`}>
              <p className="text-2xl font-bold">
                {isWinner ? '🎉 Vous avez gagné !' : `🏆 ${winner} a gagné !`}
              </p>
            </div>
          )}

          {!winner && (
            <div className="text-center mb-8 p-6 rounded-lg bg-yellow-100 dark:bg-yellow-900/20">
              <p className="text-2xl font-bold">🤝 Égalité !</p>
            </div>
          )}

          {/* Détail des réponses */}
          <div className="space-y-4">
            <h2 className="text-2xl font-semibold mb-4">Détail des réponses</h2>
            {results.results.map((result, index) => {
              const hostCorrect = result.hostIsCorrect
              const guestCorrect = result.guestIsCorrect

              return (
                <div
                  key={result.questionId}
                  className="border rounded-lg p-4 bg-gray-50 dark:bg-gray-700"
                >
                  <div className="flex items-start gap-2 mb-2">
                    <span className="font-semibold">Question {index + 1}:</span>
                  </div>
                  <p className="mb-3">{result.prompt}</p>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className={`p-3 rounded ${hostCorrect ? 'bg-green-100 dark:bg-green-900/20' : 'bg-red-100 dark:bg-red-900/20'}`}>
                      <p className="text-sm font-semibold mb-1">{results.hostName}:</p>
                      <p className={hostCorrect ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'}>
                        {hostCorrect ? '✓ Correct' : '✗ Incorrect'}
                      </p>
                    </div>
                    <div className={`p-3 rounded ${guestCorrect ? 'bg-green-100 dark:bg-green-900/20' : 'bg-red-100 dark:bg-red-900/20'}`}>
                      <p className="text-sm font-semibold mb-1">{results.guestName}:</p>
                      <p className={guestCorrect ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'}>
                        {guestCorrect ? '✓ Correct' : '✗ Incorrect'}
                      </p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          <div className="mt-8 flex gap-4">
            <button
              onClick={() => router.push('/duo')}
              className="flex-1 px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
            >
              Nouvelle partie
            </button>
            <button
              onClick={() => router.push('/review')}
              className="flex-1 px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
            >
              Retour aux révisions
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}

export default function DuoResultsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen">
        <Nav />
        <main className="max-w-2xl mx-auto px-4 py-16">
          <div className="text-center">Chargement des résultats...</div>
        </main>
      </div>
    }>
      <DuoResultsContent />
    </Suspense>
  )
}
