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

    // Récupérer l'ordre des questions pour identifier les questions de logique
    // Les questions de logique sont aux indices 100-119 (questions 101-120)
    const questionOrderMap = new Map<string, number>()
    const allTestQuestions = await prisma.question.findMany({
      where: {
        id: { in: questionIds },
      },
      select: {
        id: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
    })
    
    allTestQuestions.forEach((q, index) => {
      questionOrderMap.set(q.id, index)
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
      
      // Identifier si c'est une question de logique (indices 100-119)
      const questionIndex = questionOrderMap.get(answer.questionId) ?? -1
      const isLogique = questionIndex >= 100 && questionIndex < 120
      
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
    // Calculer le score sur 400 points (150 questions × 2 points + 20 questions × 5 points = 300 + 100 = 400)
    const score = totalPoints > 0 ? Math.round((pointsObtenus / totalPoints) * 100) : 0
    const scoreSur400 = pointsObtenus // Score brut sur 400

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
      scoreSur400, // Score sur 400 points
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
    console.error('Error in /api/test-blanc/submit:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

