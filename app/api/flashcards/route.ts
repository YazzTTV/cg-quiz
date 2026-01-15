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

    // Récupérer toutes les fiches de l'utilisateur
    const flashcards = await prisma.flashcard.findMany({
      where: { userId },
      include: {
        question: {
          include: {
            choices: {
              orderBy: { order: 'asc' },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ flashcards })
  } catch (error) {
    console.error('Error in /api/flashcards:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
