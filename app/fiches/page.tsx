'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Nav } from '@/components/Nav'

type Choice = {
  id: string
  text: string
  order: number
  isCorrect: boolean
}

type Flashcard = {
  id: string
  questionId: string
  aiContent: string | null
  createdAt: string
  question: {
    id: string
    prompt: string
    explanation: string | null
    comprehensionText: string | null
    choices: Choice[]
  }
}

export default function FichesPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [flashcards, setFlashcards] = useState<Flashcard[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedFlashcard, setSelectedFlashcard] = useState<Flashcard | null>(null)
  const [generatingAI, setGeneratingAI] = useState<string | null>(null)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    }
  }, [status, router])

  useEffect(() => {
    if (session) {
      loadFlashcards()
    }
  }, [session])

  const loadFlashcards = async () => {
    try {
      const res = await fetch('/api/flashcards')
      const data = await res.json()
      if (res.ok) {
        setFlashcards(data.flashcards || [])
      }
    } catch (error) {
      console.error('Erreur lors du chargement des fiches:', error)
    } finally {
      setLoading(false)
    }
  }

  const generateAIContent = async (flashcardId: string) => {
    setGeneratingAI(flashcardId)
    try {
      const res = await fetch('/api/flashcards/generate-ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ flashcardId }),
      })
      const data = await res.json()
      if (res.ok) {
        // Mettre à jour la fiche dans la liste
        setFlashcards(prev =>
          prev.map(f => f.id === flashcardId ? { ...f, aiContent: data.aiContent } : f)
        )
        // Mettre à jour la fiche sélectionnée si c'est celle-ci
        if (selectedFlashcard?.id === flashcardId) {
          setSelectedFlashcard({ ...selectedFlashcard, aiContent: data.aiContent })
        }
      }
    } catch (error) {
      console.error('Erreur lors de la génération du contenu IA:', error)
    } finally {
      setGeneratingAI(null)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Nav />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">Chargement...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Nav />
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold mb-6">Mes Fiches Mémo</h1>

          {flashcards.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 text-center">
              <p className="text-gray-600 dark:text-gray-400">
                Vous n'avez pas encore de fiches mémo. Répondez à des questions et enregistrez-les pour créer vos fiches !
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Liste des fiches */}
              <div className="space-y-4">
                <h2 className="text-xl font-semibold mb-4">Liste des fiches ({flashcards.length})</h2>
                <div className="space-y-2 max-h-[calc(100vh-250px)] overflow-y-auto custom-scrollbar">
                  {flashcards.map((flashcard) => {
                    const correctAnswer = flashcard.question.choices.find(c => c.isCorrect)
                    return (
                      <button
                        key={flashcard.id}
                        onClick={() => setSelectedFlashcard(flashcard)}
                        className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                          selectedFlashcard?.id === flashcard.id
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                            : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 bg-white dark:bg-gray-800'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className="font-medium text-gray-900 dark:text-gray-100 mb-1 line-clamp-2">
                              {flashcard.question.prompt}
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-1">
                              {correctAnswer?.text}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                              {formatDate(flashcard.createdAt)}
                            </p>
                          </div>
                          {flashcard.aiContent && (
                            <span className="ml-2 text-blue-500 text-xs">✨</span>
                          )}
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Détail de la fiche sélectionnée */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
                {selectedFlashcard ? (
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-xl font-semibold">Détail de la fiche</h2>
                      <span className="text-xs text-gray-500">
                        {formatDate(selectedFlashcard.createdAt)}
                      </span>
                    </div>

                    {/* Question */}
                    <div className="mb-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <h3 className="font-semibold mb-2">Question :</h3>
                      <p className="text-gray-700 dark:text-gray-300">
                        {selectedFlashcard.question.prompt}
                      </p>
                    </div>

                    {/* Réponse */}
                    <div className="mb-4 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                      <h3 className="font-semibold mb-2">Réponse correcte :</h3>
                      <p className="text-gray-700 dark:text-gray-300">
                        {selectedFlashcard.question.choices.find(c => c.isCorrect)?.text}
                      </p>
                    </div>

                    {/* Explication si disponible */}
                    {selectedFlashcard.question.explanation && (
                      <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                        <h3 className="font-semibold mb-2">Explication :</h3>
                        <p className="text-gray-700 dark:text-gray-300">
                          {selectedFlashcard.question.explanation}
                        </p>
                      </div>
                    )}

                    {/* Contenu IA généré */}
                    <div className="mt-6">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold">Fiche mémo générée par IA :</h3>
                        {!selectedFlashcard.aiContent && (
                          <button
                            onClick={() => generateAIContent(selectedFlashcard.id)}
                            disabled={generatingAI === selectedFlashcard.id}
                            className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                          >
                            {generatingAI === selectedFlashcard.id ? 'Génération...' : 'Générer'}
                          </button>
                        )}
                      </div>
                      {selectedFlashcard.aiContent ? (
                        <div className="p-4 bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-gray-700 dark:to-gray-800 rounded-lg border border-purple-200 dark:border-purple-800">
                          <div className="prose prose-sm dark:prose-invert max-w-none">
                            <div className="whitespace-pre-wrap text-gray-700 dark:text-gray-300">
                              {selectedFlashcard.aiContent}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg text-center text-gray-500 dark:text-gray-400">
                          Cliquez sur "Générer" pour créer une fiche mémo personnalisée avec des conseils de mémorisation.
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="text-center text-gray-500 dark:text-gray-400 py-12">
                    Sélectionnez une fiche pour voir les détails
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
