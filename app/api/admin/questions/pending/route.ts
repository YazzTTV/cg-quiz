import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/app/api/auth/[...nextauth]/route'
import { prisma } from '@/lib/prisma'

function isAdmin(email: string | undefined): boolean {
  if (!email) return false
  const adminEmails = process.env.ADMIN_EMAILS?.split(',') || []
  return adminEmails.includes(email)
}

export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id || !isAdmin(session.user.email)) {
      return NextResponse.json({ error: 'Accès non autorisé' }, { status: 403 })
    }

    const questions = await prisma.question.findMany({
      where: { status: 'PENDING' },
      include: {
        choices: {
          orderBy: { order: 'asc' },
        },
        tags: {
          include: { tag: true },
        },
        createdBy: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    })

    return NextResponse.json(questions)
  } catch (error) {
    console.error('Error in /api/admin/questions/pending:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

