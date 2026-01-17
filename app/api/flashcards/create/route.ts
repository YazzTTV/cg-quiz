import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/app/api/auth/[...nextauth]/route'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const createFlashcardSchema = z.object({
  questionId: z.string().uuid(),
})

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const userId = session.user.id
    const body = await req.json()
    const { questionId } = createFlashcardSchema.parse(body)

    // Vérifier si la fiche existe déjà
    const existingFlashcard = await prisma.flashcard.findUnique({
      where: {
        userId_questionId: {
          userId,
          questionId,
        },
      },
    })

    if (existingFlashcard) {
      return NextResponse.json({ 
        flashcard: existingFlashcard,
        message: 'Fiche déjà existante',
        created: false
      }, { status: 200 })
    }

    // Récupérer la question avec ses choix
    const question = await prisma.question.findUnique({
      where: { id: questionId },
      include: {
        choices: {
          orderBy: { order: 'asc' },
        },
      },
    })

    if (!question) {
      return NextResponse.json({ error: 'Question introuvable' }, { status: 404 })
    }

    // Créer la fiche (sans contenu IA pour l'instant)
    const flashcard = await prisma.flashcard.create({
      data: {
        userId,
        questionId,
      },
      include: {
        question: {
          include: {
            choices: {
              orderBy: { order: 'asc' },
            },
          },
        },
      },
    })

    return NextResponse.json({ 
      flashcard,
      created: true,
      message: 'Fiche créée avec succès'
    }, { status: 200 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Données invalides', details: error.issues }, { status: 400 })
    }
    console.error('Error in /api/flashcards/create:', error)
    const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue'
    const errorStack = error instanceof Error ? error.stack : undefined
    console.error('Error details:', { errorMessage, errorStack })
    return NextResponse.json({ 
      error: 'Erreur serveur',
      details: errorMessage 
    }, { status: 500 })
  }
}
