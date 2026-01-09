import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/app/api/auth/[...nextauth]/route'
import { prisma } from '@/lib/prisma'

function isAdmin(email: string | undefined): boolean {
  if (!email) return false
  const adminEmails = process.env.ADMIN_EMAILS?.split(',') || []
  return adminEmails.includes(email)
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id || !isAdmin(session.user.email)) {
      return NextResponse.json({ error: 'Accès non autorisé' }, { status: 403 })
    }

    const { id } = await params

    const question = await prisma.question.update({
      where: { id },
      data: { status: 'REJECTED' },
    })

    return NextResponse.json({ message: 'Question rejetée', question })
  } catch (error) {
    console.error('Error in /api/admin/questions/[id]/reject:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

