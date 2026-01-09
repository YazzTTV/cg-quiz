import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/app/api/auth/[...nextauth]/route'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    // Récupérer tous les utilisateurs avec leurs statistiques
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        userQuestionStates: {
          select: {
            timesSeen: true,
            timesCorrect: true,
          },
        },
      },
    })

    // Calculer le taux de réussite pour chaque utilisateur
    const leaderboard = users
      .map((user) => {
        const totalAttempts = user.userQuestionStates.reduce(
          (sum, state) => sum + state.timesSeen,
          0
        )
        const totalCorrect = user.userQuestionStates.reduce(
          (sum, state) => sum + state.timesCorrect,
          0
        )

        const successRate =
          totalAttempts > 0
            ? Math.round((totalCorrect / totalAttempts) * 100)
            : 0

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          successRate,
          totalAttempts,
          totalCorrect,
        }
      })
      .filter((user) => user.totalAttempts > 0) // Filtrer les utilisateurs sans tentatives
      .sort((a, b) => {
        // Trier par taux de réussite décroissant, puis par nombre de tentatives
        if (b.successRate !== a.successRate) {
          return b.successRate - a.successRate
        }
        return b.totalAttempts - a.totalAttempts
      })
      .slice(0, 10) // Limiter aux 10 premiers

    return NextResponse.json(leaderboard)
  } catch (error) {
    console.error('Error in /api/dashboard/leaderboard:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

