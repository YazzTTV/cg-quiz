'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Nav } from '@/components/Nav'

type Question = {
  id: string
  prompt: string
  explanation?: string
  status: string
  choices: Array<{ id: string; text: string; isCorrect: boolean; order: number }>
  tags: Array<{ tag: { name: string } }>
  createdBy?: { email: string; name?: string }
  createdAt: string
}

export default function AdminPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [questions, setQuestions] = useState<Question[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    } else if (session) {
      loadPendingQuestions()
    }
  }, [status, session, router])

  const loadPendingQuestions = async () => {
    try {
      const res = await fetch('/api/admin/questions/pending')
      if (res.status === 403) {
        setError('Accès non autorisé. Vous devez être administrateur.')
        return
      }
      const data = await res.json()
      if (res.ok) {
        setQuestions(data)
      } else {
        setError(data.error || 'Erreur lors du chargement')
      }
    } catch (err) {
      setError('Erreur lors du chargement')
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async (questionId: string) => {
    try {
      const res = await fetch(`/api/admin/questions/${questionId}/approve`, {
        method: 'POST',
      })
      if (res.ok) {
        setQuestions((prev) => prev.filter((q) => q.id !== questionId))
      }
    } catch (err) {
      console.error('Erreur lors de l\'approbation:', err)
    }
  }

  const handleReject = async (questionId: string) => {
    try {
      const res = await fetch(`/api/admin/questions/${questionId}/reject`, {
        method: 'POST',
      })
      if (res.ok) {
        setQuestions((prev) => prev.filter((q) => q.id !== questionId))
      }
    } catch (err) {
      console.error('Erreur lors du rejet:', err)
    }
  }

  if (status === 'loading') {
    return (
      <div className="min-h-screen">
        <Nav />
        <main className="max-w-4xl mx-auto px-4 py-16">
          <div className="text-center">Chargement...</div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <Nav />
      <main className="max-w-4xl mx-auto px-4 py-16">
        <h1 className="text-3xl font-bold mb-8">Administration - Questions en attente</h1>

        {error && (
          <div className="p-4 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 rounded mb-4">
            {error}
          </div>
        )}

        {loading ? (
          <div className="text-center py-16">Chargement...</div>
        ) : questions.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-xl">Aucune question en attente de validation.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {questions.map((question) => (
              <div
                key={question.id}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6"
              >
                <div className="mb-4">
                  <h2 className="text-xl font-semibold mb-2">{question.prompt}</h2>
                  {question.explanation && (
                    <p className="text-gray-600 dark:text-gray-400 mb-2">
                      <strong>Explication:</strong> {question.explanation}
                    </p>
                  )}
                  <p className="text-sm text-gray-500 dark:text-gray-500">
                    Créée par: {question.createdBy?.email || 'Inconnu'} •{' '}
                    {new Date(question.createdAt).toLocaleDateString('fr-FR')}
                  </p>
                  {question.tags.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {question.tags.map((qt) => (
                        <span
                          key={qt.tag.name}
                          className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded text-sm"
                        >
                          {qt.tag.name}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="mb-4">
                  <strong className="block mb-2">Choix:</strong>
                  <div className="space-y-2">
                    {question.choices
                      .sort((a, b) => a.order - b.order)
                      .map((choice) => (
                        <div
                          key={choice.id}
                          className={`p-2 rounded ${
                            choice.isCorrect
                              ? 'bg-green-100 dark:bg-green-900'
                              : 'bg-gray-100 dark:bg-gray-700'
                          }`}
                        >
                          {choice.text} {choice.isCorrect && '✓'}
                        </div>
                      ))}
                  </div>
                </div>

                <div className="flex space-x-3">
                  <button
                    onClick={() => handleApprove(question.id)}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                  >
                    Approuver
                  </button>
                  <button
                    onClick={() => handleReject(question.id)}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                  >
                    Rejeter
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}

