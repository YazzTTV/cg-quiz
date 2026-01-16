import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/app/api/auth/[...nextauth]/route'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const reportSchema = z.object({
  questionId: z.string().uuid(),
  reason: z.string().min(1, 'La justification est requise'),
})

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const userId = session.user.id
    const body = await req.json()
    const { questionId, reason } = reportSchema.parse(body)

    // Vérifier que la question existe
    const question = await prisma.question.findUnique({
      where: { id: questionId },
    })

    if (!question) {
      return NextResponse.json({ error: 'Question introuvable' }, { status: 404 })
    }

    // Vérifier si l'utilisateur a déjà signalé cette question
    const existingReport = await prisma.report.findFirst({
      where: {
        userId,
        questionId,
      },
    })

    if (existingReport) {
      return NextResponse.json({ error: 'Vous avez déjà signalé cette question' }, { status: 400 })
    }

    // Créer le signalement
    await prisma.report.create({
      data: {
        userId,
        questionId,
        reason,
      },
    })

    // Suspendre la question pour cet utilisateur (la masquer de ses révisions)
    await prisma.userQuestionState.upsert({
      where: {
        userId_questionId: {
          userId,
          questionId,
        },
      },
      create: {
        userId,
        questionId,
        suspended: true,
      },
      update: {
        suspended: true,
      },
    })

    return NextResponse.json({ success: true, message: 'Question signalée et masquée' })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Données invalides', details: error.issues }, { status: 400 })
    }
    console.error('Error in /api/questions/report:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
