import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/app/api/auth/[...nextauth]/route'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const userId = session.user.id
    const body = await req.json()
    const { code } = body

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

    // Vérifier que les deux joueurs ont répondu à la question actuelle
    const questions = (room.questions as unknown as any[]) || []
    const currentQuestion = questions[room.currentQuestionIndex]
    if (!currentQuestion) {
      return NextResponse.json({ error: 'Question introuvable' }, { status: 404 })
    }

    const hostAnswers = (room.hostAnswers as Record<string, string>) || {}
    const guestAnswers = (room.guestAnswers as Record<string, string>) || {}
    const hostAnswered = hostAnswers[currentQuestion.id] !== undefined
    const guestAnswered = guestAnswers[currentQuestion.id] !== undefined

    // Si les deux joueurs ont répondu, passer à la question suivante
    if (hostAnswered && guestAnswered) {
      const nextIndex = room.currentQuestionIndex + 1

      if (nextIndex >= ((room.questions as any[])?.length || 0)) {
        // Partie terminée
        await prisma.duoRoom.update({
          where: { code },
          data: {
            status: 'finished',
            currentQuestionIndex: nextIndex,
          },
        })
      } else {
        // Question suivante
        await prisma.duoRoom.update({
          where: { code },
          data: {
            currentQuestionIndex: nextIndex,
            status: 'in_progress',
          },
        })
      }

      return NextResponse.json({
        currentQuestionIndex: nextIndex,
        isFinished: nextIndex >= ((room.questions as any[])?.length || 0),
        canAdvance: true,
      })
    } else {
      // Les deux joueurs n'ont pas encore répondu
      return NextResponse.json({
        currentQuestionIndex: room.currentQuestionIndex,
        isFinished: false,
        canAdvance: false,
        waitingForPlayers: true,
      })
    }
  } catch (error) {
    console.error('Error in /api/duo/next-question:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
