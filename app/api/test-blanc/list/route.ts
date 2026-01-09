import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/app/api/auth/[...nextauth]/route'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    // Récupérer tous les tags de test blanc disponibles
    const tags = await prisma.tag.findMany({
      where: {
        name: {
          startsWith: 'Test Blanc ',
        },
      },
      include: {
        _count: {
          select: {
            questions: true,
          },
        },
      },
    })

    // Extraire les numéros de test et vérifier qu'ils ont des questions
    const tests = tags
      .filter((tag) => tag._count.questions > 0)
      .map((tag) => {
        const match = tag.name.match(/Test Blanc (\d+)/)
        return match ? parseInt(match[1], 10) : null
      })
      .filter((num): num is number => num !== null)
      .sort((a, b) => a - b)

    return NextResponse.json({ tests })
  } catch (error) {
    console.error('Error in /api/test-blanc/list:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
