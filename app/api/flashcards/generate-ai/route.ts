import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/app/api/auth/[...nextauth]/route'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const generateAISchema = z.object({
  flashcardId: z.string().uuid(),
})

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const userId = session.user.id
    const body = await req.json()
    const { flashcardId } = generateAISchema.parse(body)

    // Récupérer la fiche avec la question
    const flashcard = await prisma.flashcard.findUnique({
      where: { id: flashcardId },
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

    if (!flashcard) {
      return NextResponse.json({ error: 'Fiche introuvable' }, { status: 404 })
    }

    if (flashcard.userId !== userId) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
    }

    // Si le contenu IA existe déjà, le retourner
    if (flashcard.aiContent) {
      return NextResponse.json({ aiContent: flashcard.aiContent })
    }

    // Générer le contenu IA avec une requête simple (sans API externe pour l'instant)
    // Vous pouvez intégrer OpenAI, Anthropic, etc. ici
    const correctAnswer = flashcard.question.choices.find(c => c.isCorrect)
    const allChoices = flashcard.question.choices.map(c => c.text).join('\n• ')
    
    // Créer un contenu structuré pour la mémorisation
    let aiContent = `📚 **FICHE MÉMO**\n\n`
    
    aiContent += `**Question :**\n${flashcard.question.prompt}\n\n`
    
    if (flashcard.question.comprehensionText) {
      aiContent += `**Contexte :**\n${flashcard.question.comprehensionText}\n\n`
    }
    
    aiContent += `**Réponse correcte :**\n✓ ${correctAnswer?.text || 'Non disponible'}\n\n`
    
    aiContent += `**Toutes les options :**\n• ${allChoices}\n\n`
    
    if (flashcard.question.explanation) {
      aiContent += `**Explication détaillée :**\n${flashcard.question.explanation}\n\n`
    }
    
    aiContent += `**💡 Conseils de mémorisation :**\n\n`
    aiContent += `1. **Répétition active** : Posez-vous la question et répondez sans regarder\n`
    aiContent += `2. **Association** : Créez une image mentale ou une histoire liant la question à la réponse\n`
    aiContent += `3. **Contexte** : ${flashcard.question.comprehensionText ? 'Utilisez le contexte fourni pour mieux comprendre' : 'Mémorisez les éléments clés de la question'}\n`
    aiContent += `4. **Répétition espacée** : Réviser cette fiche dans 1 jour, puis 3 jours, puis 1 semaine\n`
    aiContent += `5. **Auto-évaluation** : Testez-vous régulièrement sur cette question\n\n`
    
    aiContent += `**🎯 Points clés à retenir :**\n`
    if (flashcard.question.explanation) {
      // Extraire les points clés de l'explication
      const keyPoints = flashcard.question.explanation.split(/[.!?]/).filter(p => p.trim().length > 20).slice(0, 3)
      keyPoints.forEach((point, i) => {
        aiContent += `• ${point.trim()}\n`
      })
    } else {
      aiContent += `• La réponse correcte est : ${correctAnswer?.text}\n`
      aiContent += `• Mémorisez bien cette association question-réponse\n`
    }

    // Mettre à jour la fiche avec le contenu IA
    const updatedFlashcard = await prisma.flashcard.update({
      where: { id: flashcardId },
      data: { aiContent },
    })

    return NextResponse.json({ aiContent: updatedFlashcard.aiContent })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Données invalides', details: error.issues }, { status: 400 })
    }
    console.error('Error in /api/flashcards/generate-ai:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
