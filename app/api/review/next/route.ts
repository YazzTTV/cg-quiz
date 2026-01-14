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

    // Récupérer les IDs des questions récemment vues (cooldown)
    const recentQuestionIds = req.nextUrl.searchParams.get('exclude')?.split(',') || []

    // Récupérer les IDs des questions du test blanc à exclure (uniquement celles avec le tag "Test Blanc 1")
    let testBlancQuestionIds: string[] = []
    try {
      const testBlancTag = await prisma.tag.findUnique({ where: { name: 'Test Blanc 1' } })
      if (testBlancTag) {
        const testBlancTags = await prisma.questionTag.findMany({
          where: { tagId: testBlancTag.id },
          select: { questionId: true },
        })
        testBlancQuestionIds = testBlancTags.map((t) => t.questionId)
      }
    } catch (error) {
      // Si erreur de connexion, continuer sans exclure (fallback)
      console.warn('Impossible de récupérer les questions du test blanc à exclure:', error)
    }

    // 1. Chercher une question due (nextReviewAt <= now)
    const dueQuestion = await prisma.userQuestionState.findFirst({
      where: {
        userId,
        nextReviewAt: {
          lte: new Date(),
        },
        suspended: false,
        questionId: {
          notIn: [...recentQuestionIds, ...testBlancQuestionIds],
        },
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
      orderBy: {
        nextReviewAt: 'asc',
      },
    })

    if (dueQuestion) {
      const { question } = dueQuestion
      return NextResponse.json({
        question: {
          id: question.id,
          prompt: question.prompt,
          explanation: question.explanation,
          choices: question.choices.map((c: { id: string; text: string; order: number }) => ({
            id: c.id,
            text: c.text,
            order: c.order,
            // Ne pas révéler isCorrect
          })),
        },
        userState: {
          timesSeen: dueQuestion.timesSeen,
          timesCorrect: dueQuestion.timesCorrect,
        },
      })
    }

    // 2. Sinon, chercher une question nouvelle (pas de UserQuestionState)
    const answeredQuestionIds = await prisma.userQuestionState.findMany({
      where: { userId },
      select: { questionId: true },
    })

    const answeredIds = answeredQuestionIds.map((s: { questionId: string }) => s.questionId)

    // Compter les questions disponibles (exclure les questions du test blanc)
    const whereClause: any = {
      status: 'APPROVED',
      id: { notIn: [...answeredIds, ...recentQuestionIds, ...testBlancQuestionIds] },
    }
    // Exclure les questions avec le tag "Test Blanc 1" si possible
    if (testBlancQuestionIds.length > 0) {
      // On utilise déjà notIn avec les IDs, donc pas besoin d'ajouter la condition tags
    }
    
    const availableCount = await prisma.question.count({
      where: whereClause,
    })

    if (availableCount > 0) {
      // Sélectionner une question aléatoire
      const skip = Math.floor(Math.random() * availableCount)
      const newQuestion = await prisma.question.findFirst({
        where: whereClause,
        include: {
          choices: {
            orderBy: { order: 'asc' },
          },
        },
        skip,
      })

      if (newQuestion) {
        return NextResponse.json({
          question: {
            id: newQuestion.id,
            prompt: newQuestion.prompt,
            explanation: newQuestion.explanation,
            choices: newQuestion.choices.map((c: { id: string; text: string; order: number }) => ({
              id: c.id,
              text: c.text,
              order: c.order,
            })),
          },
          userState: {
            timesSeen: 0,
            timesCorrect: 0,
          },
        })
      }
    }

    // 3. Fallback : Si toutes les questions ont été vues, proposer la question la plus proche à venir
    // (ou une question aléatoire si toutes sont programmées pour plus tard)
    const upcomingQuestion = await prisma.userQuestionState.findFirst({
      where: {
        userId,
        suspended: false,
        questionId: {
          notIn: [...recentQuestionIds, ...testBlancQuestionIds],
        },
        nextReviewAt: {
          not: null,
        },
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
      orderBy: {
        nextReviewAt: 'asc', // La plus proche à venir
      },
    })

    if (upcomingQuestion) {
      return NextResponse.json({
        question: {
          id: upcomingQuestion.question.id,
          prompt: upcomingQuestion.question.prompt,
          explanation: upcomingQuestion.question.explanation,
          choices: upcomingQuestion.question.choices.map((c: { id: string; text: string; order: number }) => ({
            id: c.id,
            text: c.text,
            order: c.order,
          })),
        },
        userState: {
          timesSeen: upcomingQuestion.timesSeen,
          timesCorrect: upcomingQuestion.timesCorrect,
        },
      })
    }

    // 4. Dernier recours : question aléatoire parmi toutes les questions vues (sans exclusion du test blanc)
    const allSeenQuestions = await prisma.userQuestionState.findMany({
      where: {
        userId,
        suspended: false,
        questionId: {
          notIn: testBlancQuestionIds,
        },
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

    if (allSeenQuestions.length > 0) {
      const randomIndex = Math.floor(Math.random() * allSeenQuestions.length)
      const randomQuestion = allSeenQuestions[randomIndex]
      
      return NextResponse.json({
        question: {
          id: randomQuestion.question.id,
          prompt: randomQuestion.question.prompt,
          explanation: randomQuestion.question.explanation,
          choices: randomQuestion.question.choices.map((c: { id: string; text: string; order: number }) => ({
            id: c.id,
            text: c.text,
            order: c.order,
          })),
        },
        userState: {
          timesSeen: randomQuestion.timesSeen,
          timesCorrect: randomQuestion.timesCorrect,
        },
      })
    }

    return NextResponse.json({ error: 'Aucune question disponible' }, { status: 404 })
  } catch (error) {
    console.error('Error in /api/review/next:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

