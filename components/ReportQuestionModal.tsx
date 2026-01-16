'use client'

import { useState } from 'react'

interface ReportQuestionModalProps {
  questionId: string
  isOpen: boolean
  onClose: () => void
  onReported: () => void
}

export default function ReportQuestionModal({
  questionId,
  isOpen,
  onClose,
  onReported,
}: ReportQuestionModalProps) {
  const [reportReason, setReportReason] = useState('')
  const [reporting, setReporting] = useState(false)

  if (!isOpen) return null

  const handleReport = async () => {
    if (!reportReason.trim()) {
      alert('Veuillez entrer une justification')
      return
    }

    setReporting(true)
    try {
      const res = await fetch('/api/questions/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questionId,
          reason: reportReason.trim(),
        }),
      })

      const data = await res.json()

      if (res.ok) {
        alert('Question signalée et masquée avec succès')
        setReportReason('')
        onClose()
        onReported()
      } else {
        alert('Erreur lors du signalement: ' + (data.error || 'Erreur inconnue'))
      }
    } catch (error) {
      console.error('Erreur lors du signalement:', error)
      alert('Erreur lors du signalement')
    } finally {
      setReporting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
        <h2 className="text-2xl font-bold mb-4">🚨 Signaler la question</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          Veuillez expliquer pourquoi vous souhaitez signaler cette question. 
          Elle sera masquée et retirée de tous vos modes de révision.
        </p>
        <textarea
          value={reportReason}
          onChange={(e) => setReportReason(e.target.value)}
          placeholder="Entrez votre justification..."
          className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white mb-4 min-h-[120px]"
          rows={4}
        />
        <div className="flex gap-3">
          <button
            onClick={() => {
              onClose()
              setReportReason('')
            }}
            className="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600"
          >
            Annuler
          </button>
          <button
            onClick={handleReport}
            disabled={reporting || !reportReason.trim()}
            className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
          >
            {reporting ? 'Signalement...' : 'Signaler'}
          </button>
        </div>
      </div>
    </div>
  )
}
