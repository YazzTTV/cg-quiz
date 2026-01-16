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

    // Récupérer les IDs des questions récemment vues (cooldown pour éviter les répétitions immédiates)
    const recentQuestionIds = req.nextUrl.searchParams.get('exclude')?.split(',') || []

    // Récupérer les IDs des questions du test blanc à exclure
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
      console.warn('Impossible de récupérer les questions du test blanc à exclure:', error)
    }

    // Récupérer les IDs des questions suspendues (signalées) par l'utilisateur
    const suspendedQuestions = await prisma.userQuestionState.findMany({
      where: {
        userId,
        suspended: true,
      },
      select: { questionId: true },
    })
    const suspendedQuestionIds = suspendedQuestions.map((s) => s.questionId)

    // Mode survie : questions aléatoires sans SRS
    // Exclure les questions récentes, les questions du test blanc et les questions suspendues
    const whereClause: any = {
      status: 'APPROVED',
      id: { notIn: [...recentQuestionIds, ...testBlancQuestionIds, ...suspendedQuestionIds] },
    }

    const availableCount = await prisma.question.count({
      where: whereClause,
    })

    if (availableCount > 0) {
      // Sélectionner une question aléatoire
      const skip = Math.floor(Math.random() * availableCount)
      const randomQuestion = await prisma.question.findFirst({
        where: whereClause,
        include: {
          choices: {
            orderBy: { order: 'asc' },
          },
        },
        skip,
      })

      if (randomQuestion) {
        // Récupérer les stats utilisateur si elles existent
        const userState = await prisma.userQuestionState.findUnique({
          where: {
            userId_questionId: {
              userId,
              questionId: randomQuestion.id,
            },
          },
        })

        return NextResponse.json({
          question: {
            id: randomQuestion.id,
            prompt: randomQuestion.prompt,
            explanation: randomQuestion.explanation,
            choices: randomQuestion.choices.map((c: { id: string; text: string; order: number }) => ({
              id: c.id,
              text: c.text,
              order: c.order,
            })),
          },
          userState: {
            timesSeen: userState?.timesSeen || 0,
            timesCorrect: userState?.timesCorrect || 0,
          },
        })
      }
    }

    // Fallback : si toutes les questions ont été exclues, proposer une question aléatoire parmi toutes (sauf suspendues)
    const allQuestionsCount = await prisma.question.count({
      where: {
        status: 'APPROVED',
        id: { notIn: [...testBlancQuestionIds, ...suspendedQuestionIds] },
      },
    })

    if (allQuestionsCount > 0) {
      const skip = Math.floor(Math.random() * allQuestionsCount)
      const randomQuestion = await prisma.question.findFirst({
        where: {
          status: 'APPROVED',
          id: { notIn: [...testBlancQuestionIds, ...suspendedQuestionIds] },
        },
        include: {
          choices: {
            orderBy: { order: 'asc' },
          },
        },
        skip,
      })

      if (randomQuestion) {
        const userState = await prisma.userQuestionState.findUnique({
          where: {
            userId_questionId: {
              userId,
              questionId: randomQuestion.id,
            },
          },
        })

        return NextResponse.json({
          question: {
            id: randomQuestion.id,
            prompt: randomQuestion.prompt,
            explanation: randomQuestion.explanation,
            choices: randomQuestion.choices.map((c: { id: string; text: string; order: number }) => ({
              id: c.id,
              text: c.text,
              order: c.order,
            })),
          },
          userState: {
            timesSeen: userState?.timesSeen || 0,
            timesCorrect: userState?.timesCorrect || 0,
          },
        })
      }
    }

    return NextResponse.json({ error: 'Aucune question disponible' }, { status: 404 })
  } catch (error) {
    console.error('Error in /api/review/survival/next:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
