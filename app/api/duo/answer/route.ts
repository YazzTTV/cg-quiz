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
    const { code, questionId, choiceId } = body

    if (!code || !questionId) {
      return NextResponse.json({ error: 'Données manquantes' }, { status: 400 })
    }

    const room = await prisma.duoRoom.findUnique({ where: { code } })
    if (!room) {
      return NextResponse.json({ error: 'Salle introuvable' }, { status: 404 })
    }

    // Vérifier que l'utilisateur est dans la salle
    if (room.hostId !== userId && room.guestId !== userId) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
    }

    // Vérifier que la partie est en cours
    if (room.status !== 'in_progress' && room.status !== 'starting') {
      return NextResponse.json({ error: 'Partie non en cours' }, { status: 400 })
    }

    // Vérifier que la question existe
    const questions = (room.questions as unknown as any[]) || []
    const question = questions.find((q: any) => q.id === questionId)
    if (!question) {
      return NextResponse.json({ error: 'Question introuvable' }, { status: 404 })
    }

    // Récupérer la bonne réponse depuis la base de données
    const correctChoice = await prisma.choice.findFirst({
      where: {
        questionId,
        isCorrect: true,
      },
    })

    if (!correctChoice) {
      return NextResponse.json({ error: 'Réponse correcte introuvable' }, { status: 404 })
    }

    const selectedChoiceId = typeof choiceId === 'string' ? choiceId : null
    const isCorrect = selectedChoiceId === correctChoice.id

    // Enregistrer la réponse
    const hostAnswers = (room.hostAnswers as Record<string, string>) || {}
    const guestAnswers = (room.guestAnswers as Record<string, string>) || {}
    let hostScore = room.hostScore
    let guestScore = room.guestScore

    if (room.hostId === userId) {
      hostAnswers[questionId] = selectedChoiceId
      if (isCorrect) {
        hostScore += 1
      }
    } else {
      guestAnswers[questionId] = selectedChoiceId
      if (isCorrect) {
        guestScore += 1
      }
    }

    await prisma.duoRoom.update({
      where: { code },
      data: {
        hostAnswers,
        guestAnswers,
        hostScore,
        guestScore,
      },
    })

    return NextResponse.json({
      isCorrect,
      correctChoiceId: correctChoice.id,
    })
  } catch (error) {
    console.error('Error in /api/duo/answer:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
