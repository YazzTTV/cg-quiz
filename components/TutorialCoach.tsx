'use client'

import { useEffect, useMemo, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'

type TutorialStep = {
  id: string
  route: string
  selector: string
  title: string
  description: string
  waitForEvent?: string
  waitingLabel?: string
}

const TUTORIAL_COMPLETED_KEY = 'tutorialCompletedV1'
const TUTORIAL_STATE_KEY = 'tutorialStateV1'

const tutorialSteps: TutorialStep[] = [
  {
    id: 'review-indicators',
    route: '/review',
    selector: '[data-tutorial="review-indicators"]',
    title: 'Indicateurs de progression',
    description:
      'Voici le Score estimé (qui évolue selon tes réponses) et l’indicateur Objectif prochain pour rester motivé.',
  },
  {
    id: 'review-modes',
    route: '/review',
    selector: '[data-tutorial="review-modes"]',
    title: 'Modes de révision',
    description:
      'Tu retrouves ici les Révisions espacées, Test Blanc, Test Blitz, Mode Survie et Mode Duo.',
  },
  {
    id: 'review-start-srs',
    route: '/review',
    selector: '[data-tutorial="review-start-srs"]',
    title: 'Lancer les révisions espacées',
    description: 'Démarre ce mode pour répondre à une question de démonstration.',
    waitForEvent: 'tutorial:srs-started',
    waitingLabel: 'Clique sur "Commencer à réviser"',
  },
  {
    id: 'review-answer',
    route: '/review',
    selector: '[data-tutorial="review-answer-choices"]',
    title: 'Répondre à une question',
    description: 'Sélectionne une réponse pour voir la correction et débloquer les actions suivantes.',
    waitForEvent: 'tutorial:answer-submitted',
    waitingLabel: 'Clique sur une réponse',
  },
  {
    id: 'review-save-flashcard',
    route: '/review',
    selector: '[data-tutorial="review-save-flashcard"]',
    title: 'Enregistrer une fiche mémo',
    description: 'Clique sur Enregistrer pour ajouter la question dans tes fiches.',
    waitForEvent: 'tutorial:flashcard-saved',
    waitingLabel: 'Clique sur "Enregistrer"',
  },
  {
    id: 'review-back',
    route: '/review',
    selector: '[data-tutorial="review-back-options"]',
    title: 'Quitter le mode',
    description: 'Utilise ce bouton pour revenir aux options de révision.',
    waitForEvent: 'tutorial:review-back',
    waitingLabel: 'Clique sur "Retour aux options"',
  },
  {
    id: 'fiches-overview',
    route: '/fiches',
    selector: '[data-tutorial="fiches-overview"]',
    title: 'Partie Fiches',
    description:
      'Ici, tu retrouves tes fiches mémo, les réponses correctes et les contenus IA pour mémoriser plus vite.',
  },
  {
    id: 'dashboard-indicators',
    route: '/dashboard',
    selector: '[data-tutorial="dashboard-indicators"]',
    title: 'Partie Dashboard',
    description:
      'Le dashboard affiche tes indicateurs clés : progression, précision, score estimé et classement.',
  },
  {
    id: 'create-participation',
    route: '/create',
    selector: '[data-tutorial="create-form"]',
    title: 'Partie Créer',
    description:
      'Tu peux proposer une question. Elle sera soumise à validation admin avant publication.',
  },
  {
    id: 'options-overview',
    route: '/options',
    selector: '[data-tutorial="options-overview"]',
    title: 'Partie Options',
    description:
      'Ici tu gères la langue, l’abonnement, et les actions sensibles de ton compte.',
  },
]

export function TutorialCoach() {
  const { data: session } = useSession()
  const router = useRouter()
  const pathname = usePathname()
  const [isActive, setIsActive] = useState(() => {
    if (typeof window === 'undefined') return false
    try {
      const saved = JSON.parse(localStorage.getItem(TUTORIAL_STATE_KEY) || 'null') as { active?: boolean } | null
      return Boolean(saved?.active)
    } catch {
      return false
    }
  })
  const [stepIndex, setStepIndex] = useState(() => {
    if (typeof window === 'undefined') return 0
    try {
      const saved = JSON.parse(localStorage.getItem(TUTORIAL_STATE_KEY) || 'null') as { stepIndex?: number } | null
      return typeof saved?.stepIndex === 'number' ? saved.stepIndex : 0
    } catch {
      return 0
    }
  })
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null)
  const [hasCompleted, setHasCompleted] = useState(() => {
    if (typeof window === 'undefined') return false
    return localStorage.getItem(TUTORIAL_COMPLETED_KEY) === '1'
  })

  const currentStep = tutorialSteps[stepIndex]
  const canGoPrev = stepIndex > 0
  const isLastStep = stepIndex === tutorialSteps.length - 1

  const shouldAutoStart = useMemo(() => {
    if (!session) return false
    if (isActive) return false
    if (pathname === '/' || pathname === '/login' || pathname === '/register') return false
    if (typeof window === 'undefined') return false
    return !hasCompleted
  }, [session, pathname, hasCompleted, isActive])

  const persistTutorialState = (active: boolean, nextStepIndex: number) => {
    if (typeof window === 'undefined') return
    localStorage.setItem(TUTORIAL_STATE_KEY, JSON.stringify({ active, stepIndex: nextStepIndex }))
  }

  useEffect(() => {
    if (!shouldAutoStart || isActive) return
    setIsActive(true)
    setStepIndex(0)
    persistTutorialState(true, 0)
  }, [shouldAutoStart, isActive])

  useEffect(() => {
    const handleStartTutorial = () => {
      setHasCompleted(false)
      setIsActive(true)
      setStepIndex(0)
      persistTutorialState(true, 0)
      localStorage.removeItem(TUTORIAL_COMPLETED_KEY)
    }
    window.addEventListener('startTutorial', handleStartTutorial)
    return () => window.removeEventListener('startTutorial', handleStartTutorial)
  }, [])

  useEffect(() => {
    if (!isActive || !currentStep?.waitForEvent) return

    const handleActionDone = () => {
      setStepIndex((prev) => {
        const next = Math.min(prev + 1, tutorialSteps.length - 1)
        persistTutorialState(true, next)
        return next
      })
    }

    window.addEventListener(currentStep.waitForEvent, handleActionDone)
    return () => window.removeEventListener(currentStep.waitForEvent!, handleActionDone)
  }, [isActive, currentStep])

  useEffect(() => {
    if (!isActive || !currentStep) return
    if (pathname !== currentStep.route) {
      router.push(currentStep.route)
    }
  }, [isActive, currentStep, pathname, router])

  useEffect(() => {
    if (!isActive || !currentStep || pathname !== currentStep.route) {
      setTargetRect(null)
      return
    }

    let hasScrolledToTarget = false

    const updateRect = () => {
      const el = document.querySelector(currentStep.selector)
      if (!el) {
        setTargetRect(null)
        return
      }
      if (!hasScrolledToTarget) {
        ;(el as HTMLElement).scrollIntoView({ behavior: 'smooth', block: 'center' })
        hasScrolledToTarget = true
      }
      setTargetRect(el.getBoundingClientRect())
    }

    updateRect()
    const timers = [120, 280, 520, 900, 1400, 2200].map((delay) => window.setTimeout(updateRect, delay))
    const interval = window.setInterval(updateRect, 120)
    const stopInterval = window.setTimeout(() => window.clearInterval(interval), 4000)
    const observer = new MutationObserver(updateRect)
    observer.observe(document.body, { childList: true, subtree: true })
    window.addEventListener('resize', updateRect)
    window.addEventListener('scroll', updateRect, { passive: true })
    return () => {
      timers.forEach((timer) => window.clearTimeout(timer))
      window.clearInterval(interval)
      window.clearTimeout(stopInterval)
      observer.disconnect()
      window.removeEventListener('resize', updateRect)
      window.removeEventListener('scroll', updateRect)
    }
  }, [isActive, currentStep, pathname])

  const closeTutorial = () => {
    setIsActive(false)
    setTargetRect(null)
    setHasCompleted(true)
    localStorage.setItem(TUTORIAL_COMPLETED_KEY, '1')
    localStorage.removeItem(TUTORIAL_STATE_KEY)
  }

  const goNext = () => {
    if (isLastStep) {
      closeTutorial()
      return
    }
    setStepIndex((prev) => {
      const next = Math.min(prev + 1, tutorialSteps.length - 1)
      persistTutorialState(true, next)
      return next
    })
  }

  const goPrev = () => {
    setStepIndex((prev) => {
      const next = Math.max(prev - 1, 0)
      persistTutorialState(true, next)
      return next
    })
  }

  if (!isActive || !currentStep) return null

  return (
    <>
      {targetRect ? (
        <>
          <div className="pointer-events-none fixed left-0 top-0 z-[1200] w-full bg-black/45" style={{ height: `${Math.max(0, targetRect.top - 8)}px` }} />
          <div className="pointer-events-none fixed left-0 z-[1200] bg-black/45" style={{ top: `${Math.max(0, targetRect.top - 8)}px`, width: `${Math.max(0, targetRect.left - 8)}px`, height: `${targetRect.height + 16}px` }} />
          <div className="pointer-events-none fixed right-0 z-[1200] bg-black/45" style={{ top: `${Math.max(0, targetRect.top - 8)}px`, left: `${targetRect.left + targetRect.width + 8}px`, height: `${targetRect.height + 16}px` }} />
          <div className="pointer-events-none fixed bottom-0 left-0 z-[1200] w-full bg-black/45" style={{ top: `${targetRect.top + targetRect.height + 8}px` }} />
        </>
      ) : (
        <div className="pointer-events-none fixed inset-0 z-[1200] bg-black/45" />
      )}
      {targetRect && (
        <div
          className="pointer-events-none fixed z-[1201] rounded-xl border-2 border-amber-300 shadow-[0_0_18px_rgba(212,175,55,0.8)]"
          style={{
            top: `${Math.max(6, targetRect.top - 8)}px`,
            left: `${Math.max(6, targetRect.left - 8)}px`,
            width: `${targetRect.width + 16}px`,
            height: `${targetRect.height + 16}px`,
          }}
        />
      )}
      <div className="fixed bottom-6 right-6 z-[1202] w-[420px] rounded-xl border border-amber-200/45 bg-slate-950/95 p-5 text-slate-100 shadow-2xl backdrop-blur">
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-amber-100/80">
          Didacticiel ({stepIndex + 1}/{tutorialSteps.length})
        </p>
        <h3 className="mb-2 text-xl font-semibold text-amber-100">{currentStep.title}</h3>
        <p className="mb-5 text-sm text-slate-200/85">{currentStep.description}</p>
        <div className="flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={goPrev}
            disabled={!canGoPrev}
            className="rounded-md border border-amber-200/35 bg-slate-900/60 px-3 py-2 text-sm text-amber-100 disabled:opacity-40"
          >
            Précédent
          </button>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={closeTutorial}
              className="rounded-md border border-slate-600 px-3 py-2 text-sm text-slate-200 hover:bg-slate-800/70"
            >
              Quitter
            </button>
            <button
              type="button"
              onClick={goNext}
              disabled={Boolean(currentStep.waitForEvent)}
              className="rounded-md border border-amber-200/55 bg-gradient-to-r from-amber-200 via-amber-100 to-yellow-200 px-3 py-2 text-sm font-semibold text-slate-900"
            >
              {currentStep.waitingLabel || (isLastStep ? 'Terminer' : 'Suivant')}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
