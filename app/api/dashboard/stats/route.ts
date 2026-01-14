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
    const now = new Date()
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())

    // Récupérer les IDs des questions du test blanc à exclure
    let testBlancTag = null
    let testBlancQuestionIds: string[] = []
    try {
      testBlancTag = await prisma.tag.findUnique({ where: { name: 'Test Blanc 1' } })
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

    // Questions dues maintenant (exclure les questions du test blanc)
    const dueNow = await prisma.userQuestionState.count({
      where: {
        userId,
        nextReviewAt: {
          lte: now,
        },
        suspended: false,
        questionId: {
          notIn: testBlancQuestionIds,
        },
      },
    })

    // Questions dues aujourd'hui (exclure les questions du test blanc)
    const dueToday = await prisma.userQuestionState.count({
      where: {
        userId,
        nextReviewAt: {
          gte: todayStart,
          lte: new Date(todayStart.getTime() + 24 * 60 * 60 * 1000),
        },
        suspended: false,
        questionId: {
          notIn: testBlancQuestionIds,
        },
      },
    })

    // Total de questions uniques vues (exclure les questions du test blanc)
    const totalSeen = await prisma.userQuestionState.count({
      where: {
        userId,
        questionId: {
          notIn: testBlancQuestionIds,
        },
      },
    })

    // Total de tentatives (somme de timesSeen, exclure les questions du test blanc)
    const totalAttempts = await prisma.userQuestionState.aggregate({
      where: {
        userId,
        questionId: {
          notIn: testBlancQuestionIds,
        },
      },
      _sum: { timesSeen: true },
    })

    // Total de questions disponibles (exclure les questions du test blanc)
    const whereClause: any = {
      status: 'APPROVED',
    }
    if (testBlancTag) {
      whereClause.tags = {
        none: {
          tagId: testBlancTag.id,
        },
      }
    }
    const totalAvailable = await prisma.question.count({
      where: whereClause,
    })

    // Questions correctes (somme de timesCorrect, exclure les questions du test blanc)
    const totalCorrect = await prisma.userQuestionState.aggregate({
      where: {
        userId,
        questionId: {
          notIn: testBlancQuestionIds,
        },
      },
      _sum: { timesCorrect: true },
    })

    // Stats par tags (optionnel, exclure les questions du test blanc)
    const statsByTagWhere: any = {
      question: {
        status: 'APPROVED',
        id: {
          notIn: testBlancQuestionIds,
        },
        userQuestionStates: {
          some: { userId },
        },
      },
    }
    if (testBlancTag) {
      statsByTagWhere.tagId = {
        not: testBlancTag.id,
      }
    }
    
    const statsByTag = await prisma.questionTag.groupBy({
      by: ['tagId'],
      where: statsByTagWhere,
      _count: { questionId: true },
    })

    const tagsWithStats = await Promise.all(
      statsByTag.map(async (stat: { tagId: string; _count: { questionId: number } }) => {
        const tag = await prisma.tag.findUnique({ where: { id: stat.tagId } })
        return {
          tagName: tag?.name || 'Inconnu',
          count: stat._count.questionId,
        }
      })
    )

    return NextResponse.json({
      dueNow,
      dueToday,
      totalSeen,
      totalAttempts: totalAttempts._sum.timesSeen || 0,
      totalAvailable,
      totalCorrect: totalCorrect._sum.timesCorrect || 0,
      statsByTag: tagsWithStats,
    })
  } catch (error) {
    console.error('Error in /api/dashboard/stats:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}


