import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/app/api/auth/[...nextauth]/route'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { updateWinStreak } from '@/lib/win-streak'

const submitTestSchema = z.object({
  answers: z.array(
    z.object({
      questionId: z.string(),
      choiceId: z.string(),
    })
  ),
  questionTypes: z.record(z.string(), z.boolean()).optional(), // Map questionId -> isLogique
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

    // Identifier les questions de logique depuis questionTypes passé par le client
    // Sinon, utiliser l'ordre de création comme fallback
    const questionTypesMap = data.questionTypes || {}
    
    // Fallback : identifier par ordre de création si questionTypes n'est pas fourni
    const allTestQuestions = await prisma.question.findMany({
      where: {
        id: { in: questionIds },
      },
      select: {
        id: true,
        source: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
    })
    
    // Créer un map pour identifier les questions de logique
    const isLogiqueMap = new Map<string, boolean>()
    allTestQuestions.forEach((q) => {
      // Utiliser questionTypes si disponible, sinon utiliser l'ordre de création
      if (questionTypesMap[q.id] !== undefined) {
        isLogiqueMap.set(q.id, questionTypesMap[q.id])
      } else {
        // Fallback : identifier par source et ordre (questions 101-120 sont logique)
        // Pour chaque source, les questions aux indices 100-119 sont logique
        // On doit grouper par source pour calculer l'index local
        // Pour simplifier, on va utiliser une approche basée sur le source
        const source = q.source || ''
        // Les questions de logique ont généralement "Logique" dans le source
        const isLogique = source.toLowerCase().includes('logique')
        isLogiqueMap.set(q.id, isLogique)
      }
    })

    // Calculer les résultats avec points différenciés
    let correctCount = 0
    let pointsObtenus = 0
    let totalPoints = 0
    
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
      
      // Identifier si c'est une question de logique
      const isLogique = isLogiqueMap.get(answer.questionId) ?? false
      
      // Points : 2 pour questions normales, 5 pour questions de logique
      const points = isLogique ? 5 : 2
      totalPoints += points
      
      if (isCorrect) {
        correctCount++
        pointsObtenus += points
      }

      return {
        questionId: answer.questionId,
        isCorrect,
        correctChoiceId: correctChoice?.id || null,
        explanation: question.explanation,
      }
    })

    const totalQuestions = data.answers.length
    // Calculer le score proportionnel sur 400 points
    const score = totalPoints > 0 ? Math.round((pointsObtenus / totalPoints) * 100) : 0
    const scoreSur400 = pointsObtenus // Score brut (proportionnel)

    // Calculer le temps écoulé
    const startTime = new Date(data.startTime)
    const endTime = new Date(data.endTime)
    const durationMs = endTime.getTime() - startTime.getTime()
    const durationMinutes = Math.round(durationMs / 1000 / 60)

    // Mettre à jour le win streak
    try {
      await updateWinStreak(userId)
    } catch (error) {
      // Ne pas faire échouer la requête si la mise à jour du win streak échoue
      console.error('Error updating win streak:', error)
    }

    return NextResponse.json({
      score, // Pourcentage
      scoreSur400, // Score brut (proportionnel)
      pointsObtenus,
      totalPoints,
      correctCount,
      totalQuestions,
      results,
      durationMinutes,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Données invalides', details: error.issues }, { status: 400 })
    }
    console.error('Error in /api/test-blitz/submit:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
