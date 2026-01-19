import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/app/api/auth/[...nextauth]/route'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const userId = session.user.id
    const code = req.nextUrl.searchParams.get('code')

    if (!code) {
      return NextResponse.json({ error: 'Code de salle requis' }, { status: 400 })
    }

    const room = await prisma.duoRoom.findUnique({ where: { code } })
    if (!room) {
      return NextResponse.json({ error: 'Salle introuvable' }, { status: 404 })
    }

    // Vérifier que l'utilisateur est dans la salle
    if (room.hostId !== userId && room.guestId !== userId) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
    }

    // Récupérer les détails des réponses
    const results = []
    const questions = (room.questions as unknown as any[]) || []
    const hostAnswers = (room.hostAnswers as Record<string, string>) || {}
    const guestAnswers = (room.guestAnswers as Record<string, string>) || {}

    if (questions.length > 0) {
      for (const question of questions) {
        const correctChoice = await prisma.choice.findFirst({
          where: {
            questionId: question.id,
            isCorrect: true,
          },
        })

        const hostAnswer = hostAnswers[question.id]
        const guestAnswer = guestAnswers[question.id]

        results.push({
          questionId: question.id,
          prompt: question.prompt,
          correctChoiceId: correctChoice?.id || null,
          hostAnswer,
          guestAnswer,
          hostIsCorrect: hostAnswer === correctChoice?.id,
          guestIsCorrect: guestAnswer === correctChoice?.id,
        })
      }
    }

    return NextResponse.json({
      hostScore: room.hostScore,
      guestScore: room.guestScore,
      hostName: room.hostName,
      guestName: room.guestName,
      totalQuestions: questions.length,
      results,
      isHost: room.hostId === userId,
    })
  } catch (error) {
    console.error('Error in /api/duo/results:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
