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

    // Supprimer tous les UserQuestionState de l'utilisateur
    const deleted = await prisma.userQuestionState.deleteMany({
      where: { userId },
    })

    return NextResponse.json({
      message: 'Toutes vos questions ont été réinitialisées',
      deletedCount: deleted.count,
    })
  } catch (error) {
    console.error('Error in /api/dashboard/reset:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

