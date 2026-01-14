'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Nav } from '@/components/Nav'

export default function CreatePage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [prompt, setPrompt] = useState('')
  const [explanation, setExplanation] = useState('')
  const [choices, setChoices] = useState([
    { text: '', isCorrect: false },
    { text: '', isCorrect: false },
    { text: '', isCorrect: false },
    { text: '', isCorrect: false },
  ])
  const [tags, setTags] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  if (status === 'loading') {
    return (
      <div className="min-h-screen">
        <Nav />
        <main className="max-w-2xl mx-auto px-4 py-16">
          <div className="text-center">Chargement...</div>
        </main>
      </div>
    )
  }

  if (status === 'unauthenticated') {
    router.push('/login')
    return null
  }

  const handleCorrectChange = (index: number) => {
    setChoices((prev) =>
      prev.map((choice, i) => ({
        ...choice,
        isCorrect: i === index,
      }))
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess(false)

    // Validation
    if (!prompt.trim()) {
      setError('La question est requise')
      return
    }

    if (choices.some((c) => !c.text.trim())) {
      setError('Tous les choix doivent être remplis')
      return
    }

    if (choices.filter((c) => c.isCorrect).length !== 1) {
      setError('Il doit y avoir exactement 1 choix correct')
      return
    }

    setLoading(true)

    try {
      const res = await fetch('/api/questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          explanation: explanation || undefined,
          choices,
          tags: tags
            ? tags
                .split(',')
                .map((t) => t.trim())
                .filter((t) => t)
            : undefined,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Une erreur est survenue')
        return
      }

      setSuccess(true)
      setPrompt('')
      setExplanation('')
      setChoices([
        { text: '', isCorrect: false },
        { text: '', isCorrect: false },
        { text: '', isCorrect: false },
        { text: '', isCorrect: false },
      ])
      setTags('')

      setTimeout(() => setSuccess(false), 5000)
    } catch (err) {
      setError('Une erreur est survenue')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen">
      <Nav />
      <main className="max-w-2xl mx-auto px-4 py-16">
        <h1 className="text-3xl font-bold mb-8">Créer une question</h1>

        {success && (
          <div className="p-4 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 rounded mb-4">
            Question soumise à validation. Elle sera disponible après approbation par un administrateur.
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="p-4 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 rounded">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="prompt" className="block text-sm font-medium mb-2">
              Question *
            </label>
            <textarea
              id="prompt"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              required
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800"
            />
          </div>

          <div>
            <label htmlFor="explanation" className="block text-sm font-medium mb-2">
              Explication (optionnel)
            </label>
            <textarea
              id="explanation"
              value={explanation}
              onChange={(e) => setExplanation(e.target.value)}
              rows={2}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Choix (4 choix, 1 correct) *</label>
            <div className="space-y-3">
              {choices.map((choice, index) => (
                <div key={index} className="flex items-center space-x-3">
                  <input
                    type="radio"
                    name="correct"
                    checked={choice.isCorrect}
                    onChange={() => handleCorrectChange(index)}
                    className="w-4 h-4"
                  />
                  <input
                    type="text"
                    value={choice.text}
                    onChange={(e) =>
                      setChoices((prev) =>
                        prev.map((c, i) => (i === index ? { ...c, text: e.target.value } : c))
                      )
                    }
                    required
                    placeholder={`Choix ${index + 1}`}
                    className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800"
                  />
                </div>
              ))}
            </div>
          </div>

          <div>
            <label htmlFor="tags" className="block text-sm font-medium mb-2">
              Tags (séparés par des virgules, optionnel)
            </label>
            <input
              id="tags"
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="Histoire, UE, Institutions..."
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Envoi...' : 'Soumettre la question'}
          </button>
        </form>
      </main>
    </div>
  )
}

