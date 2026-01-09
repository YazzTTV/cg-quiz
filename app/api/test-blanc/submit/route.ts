import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/app/api/auth/[...nextauth]/route'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const submitTestSchema = z.object({
  answers: z.array(
    z.object({
      questionId: z.string(),
      choiceId: z.string(),
    })
  ),
  startTime: z.string(),
  endTime: z.string(),
})

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const userId = session.user.id
    const body = await req.json()
    const data = submitTestSchema.parse(body)

    // Récupérer toutes les questions avec leurs bonnes réponses
    const questionIds = data.answers.map((a) => a.questionId)
    const questions = await prisma.question.findMany({
      where: {
        id: { in: questionIds },
      },
      include: {
        choices: true,
      },
    })

    // Calculer les résultats
    let correctCount = 0
    const results = data.answers.map((answer) => {
      const question = questions.find((q) => q.id === answer.questionId)
      if (!question) {
        return {
          questionId: answer.questionId,
          isCorrect: false,
          correctChoiceId: null,
        }
      }

      const selectedChoice = question.choices.find((c) => c.id === answer.choiceId)
      const correctChoice = question.choices.find((c) => c.isCorrect)

      const isCorrect = selectedChoice?.isCorrect || false
      if (isCorrect) {
        correctCount++
      }

      return {
        questionId: answer.questionId,
        isCorrect,
        correctChoiceId: correctChoice?.id || null,
        explanation: question.explanation,
      }
    })

    const totalQuestions = data.answers.length
    // Exclure 20 questions de logique du calcul du score (test sans logique)
    const questionsForScoring = Math.max(0, totalQuestions - 20)
    const score = questionsForScoring > 0 ? Math.round((correctCount / questionsForScoring) * 100) : 0

    // Calculer le temps écoulé
    const startTime = new Date(data.startTime)
    const endTime = new Date(data.endTime)
    const durationMs = endTime.getTime() - startTime.getTime()
    const durationMinutes = Math.round(durationMs / 1000 / 60)

    return NextResponse.json({
      score,
      correctCount,
      totalQuestions,
      results,
      durationMinutes,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Données invalides', details: error.issues }, { status: 400 })
    }
    console.error('Error in /api/test-blanc/submit:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

