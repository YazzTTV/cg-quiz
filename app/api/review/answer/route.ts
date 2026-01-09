import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/app/api/auth/[...nextauth]/route'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const answerSchema = z.object({
  questionId: z.string().uuid(),
  choiceId: z.string().uuid(),
})

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const userId = session.user.id
    const body = await req.json()
    const { questionId, choiceId } = answerSchema.parse(body)

    // Récupérer la question et le choix
    const question = await prisma.question.findUnique({
      where: { id: questionId },
      include: {
        choices: true,
      },
    })

    if (!question) {
      return NextResponse.json({ error: 'Question introuvable' }, { status: 404 })
    }

    const selectedChoice = question.choices.find((c: { id: string }) => c.id === choiceId)
    if (!selectedChoice) {
      return NextResponse.json({ error: 'Choix introuvable' }, { status: 404 })
    }

    const isCorrect = selectedChoice.isCorrect
    const correctChoice = question.choices.find((c: { isCorrect: boolean }) => c.isCorrect)

    // Mettre à jour ou créer UserQuestionState
    const existingState = await prisma.userQuestionState.findUnique({
      where: {
        userId_questionId: {
          userId,
          questionId,
        },
      },
    })

    if (existingState) {
      await prisma.userQuestionState.update({
        where: { id: existingState.id },
        data: {
          timesSeen: { increment: 1 },
          timesCorrect: isCorrect ? { increment: 1 } : undefined,
          lastAnsweredAt: new Date(),
          lastAnswerWasCorrect: isCorrect,
        },
      })
    } else {
      await prisma.userQuestionState.create({
        data: {
          userId,
          questionId,
          timesSeen: 1,
          timesCorrect: isCorrect ? 1 : 0,
          lastAnsweredAt: new Date(),
          lastAnswerWasCorrect: isCorrect,
        },
      })
    }

    return NextResponse.json({
      isCorrect,
      correctChoiceId: correctChoice?.id,
      explanation: question.explanation,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Données invalides', details: error.issues }, { status: 400 })
    }
    console.error('Error in /api/review/answer:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

