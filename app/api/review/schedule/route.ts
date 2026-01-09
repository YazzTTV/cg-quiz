import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/app/api/auth/[...nextauth]/route'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const scheduleSchema = z.object({
  questionId: z.string().uuid(),
  rating: z.enum(['AGAIN', 'HARD', 'GOOD', 'EASY']),
})

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const userId = session.user.id
    const body = await req.json()
    const { questionId, rating } = scheduleSchema.parse(body)

    // Calculer nextReviewAt selon les règles fixes
    const now = new Date()
    let nextReviewAt: Date

    switch (rating) {
      case 'AGAIN':
        nextReviewAt = new Date(now.getTime() + 3 * 60 * 1000) // 3 minutes
        break
      case 'HARD':
        nextReviewAt = new Date(now.getTime() + 15 * 60 * 1000) // 15 minutes
        break
      case 'GOOD':
        nextReviewAt = new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000) // 1 jour
        break
      case 'EASY':
        nextReviewAt = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000) // 3 jours
        break
    }

    // Mettre à jour UserQuestionState
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
        data: { nextReviewAt },
      })
    } else {
      await prisma.userQuestionState.create({
        data: {
          userId,
          questionId,
          nextReviewAt,
        },
      })
    }

    return NextResponse.json({ nextReviewAt })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Données invalides', details: error.issues }, { status: 400 })
    }
    console.error('Error in /api/review/schedule:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

