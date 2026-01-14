import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/app/api/auth/[...nextauth]/route'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const userId = session.user.id
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

    // Récupérer l'utilisateur
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { winStreak: true, lastActivityDate: true },
    })

    if (!user) {
      return NextResponse.json({ error: 'Utilisateur introuvable' }, { status: 404 })
    }

    let newWinStreak = 1

    if (user.lastActivityDate) {
      const lastActivity = new Date(user.lastActivityDate)
      const lastActivityDate = new Date(lastActivity.getFullYear(), lastActivity.getMonth(), lastActivity.getDate())
      
      // Calculer la différence en jours
      const diffTime = today.getTime() - lastActivityDate.getTime()
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))

      if (diffDays === 0) {
        // Même jour, ne pas changer le win streak
        newWinStreak = user.winStreak
      } else if (diffDays === 1) {
        // Jour consécutif, incrémenter
        newWinStreak = user.winStreak + 1
      } else {
        // Plus d'un jour de différence, réinitialiser
        newWinStreak = 1
      }
    }

    // Mettre à jour l'utilisateur
    const updated = await prisma.user.update({
      where: { id: userId },
      data: {
        winStreak: newWinStreak,
        lastActivityDate: now,
      },
      select: {
        winStreak: true,
        lastActivityDate: true,
      },
    })

    return NextResponse.json({
      winStreak: updated.winStreak,
      lastActivityDate: updated.lastActivityDate,
    })
  } catch (error) {
    console.error('Error in /api/win-streak:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const userId = session.user.id

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        winStreak: true,
        lastActivityDate: true,
      },
    })

    if (!user) {
      return NextResponse.json({ error: 'Utilisateur introuvable' }, { status: 404 })
    }

    // Vérifier si le win streak doit être réinitialisé
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    let winStreak = user.winStreak

    if (user.lastActivityDate) {
      const lastActivity = new Date(user.lastActivityDate)
      const lastActivityDate = new Date(lastActivity.getFullYear(), lastActivity.getMonth(), lastActivity.getDate())
      
      const diffTime = today.getTime() - lastActivityDate.getTime()
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))

      if (diffDays > 1) {
        // Plus d'un jour de différence, réinitialiser
        winStreak = 0
        // Mettre à jour en base
        await prisma.user.update({
          where: { id: userId },
          data: { winStreak: 0 },
        })
      }
    }

    return NextResponse.json({
      winStreak,
      lastActivityDate: user.lastActivityDate,
    })
  } catch (error) {
    console.error('Error in /api/win-streak:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
