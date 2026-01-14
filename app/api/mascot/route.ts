import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/app/api/auth/[...nextauth]/route'
import { prisma } from '@/lib/prisma'

const MASCOTS = ['owl', 'lion', 'monkey', 'dolphin', 'bear'] as const

export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const userId = session.user.id

    // Récupérer l'utilisateur
    let user = await prisma.user.findUnique({
      where: { id: userId },
      select: { mascot: true },
    })

    // Si pas de mascotte, en assigner une aléatoirement
    if (!user?.mascot) {
      const randomMascot = MASCOTS[Math.floor(Math.random() * MASCOTS.length)]
      await prisma.user.update({
        where: { id: userId },
        data: { mascot: randomMascot },
      })
      user = { mascot: randomMascot }
    }

    // Récupérer tous les utilisateurs pour calculer le rang
    const allUsers = await prisma.user.findMany({
      select: {
        id: true,
        userQuestionStates: {
          select: {
            timesSeen: true,
            timesCorrect: true,
          },
        },
      },
    })

    // Calculer le classement
    const leaderboard = allUsers
      .map((u) => {
        const totalAttempts = u.userQuestionStates.reduce(
          (sum, state) => sum + state.timesSeen,
          0
        )
        const totalCorrect = u.userQuestionStates.reduce(
          (sum, state) => sum + state.timesCorrect,
          0
        )
        const successRate =
          totalAttempts > 0
            ? Math.round((totalCorrect / totalAttempts) * 100)
            : 0

        return {
          id: u.id,
          successRate,
          totalAttempts,
          totalCorrect,
        }
      })
      .filter((u) => u.totalAttempts > 0)
      .sort((a, b) => {
        if (b.successRate !== a.successRate) {
          return b.successRate - a.successRate
        }
        return b.totalAttempts - a.totalAttempts
      })

    // Trouver le rang de l'utilisateur (1-indexed)
    const userIndex = leaderboard.findIndex((u) => u.id === userId)
    const userRank = userIndex >= 0 ? userIndex + 1 : leaderboard.length + 1

    // Récupérer les stats par tag pour les suggestions
    const statsByTag = await prisma.questionTag.groupBy({
      by: ['tagId'],
      where: {
        question: {
          status: 'APPROVED',
          userQuestionStates: {
            some: { userId },
          },
        },
      },
      _count: { questionId: true },
    })

    const tagsWithStats = await Promise.all(
      statsByTag.map(async (stat) => {
        const tag = await prisma.tag.findUnique({ where: { id: stat.tagId } })
        return {
          tagName: tag?.name || 'Inconnu',
          count: stat._count.questionId,
        }
      })
    )

    return NextResponse.json({
      mascot: user.mascot,
      rank: userRank,
      statsByTag: tagsWithStats,
    })
  } catch (error) {
    console.error('Error in /api/mascot:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
