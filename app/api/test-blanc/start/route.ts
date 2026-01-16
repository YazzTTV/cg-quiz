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
    const body = await req.json()
    const testNumber = body.testNumber || 1 // Par défaut Test Blanc 1

    // Récupérer les IDs des questions suspendues (signalées) par l'utilisateur
    const suspendedQuestions = await prisma.userQuestionState.findMany({
      where: {
        userId,
        suspended: true,
      },
      select: { questionId: true },
    })
    const suspendedQuestionIds = suspendedQuestions.map((s) => s.questionId)

    // Récupérer toutes les questions du test blanc spécifié
    const tagName = `Test Blanc ${testNumber}`
    const testBlancTag = await prisma.tag.findUnique({ where: { name: tagName } })
    if (!testBlancTag) {
      return NextResponse.json({ error: `Aucune question de ${tagName} trouvée` }, { status: 404 })
    }

    const questions = await prisma.question.findMany({
      where: {
        status: 'APPROVED',
        id: { notIn: suspendedQuestionIds },
        tags: {
          some: {
            tagId: testBlancTag.id,
          },
        },
      },
      select: {
        id: true,
        prompt: true,
        comprehensionText: true,
        choices: {
          orderBy: { order: 'asc' },
          select: {
            id: true,
            text: true,
            order: true,
          },
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    })

    if (questions.length === 0) {
      return NextResponse.json({ error: 'Aucune question de test blanc disponible' }, { status: 404 })
    }

    // Garder les questions dans l'ordre du fichier (ordre de création = ordre du markdown)
    // Pas de mélange pour respecter l'ordre : Culture (1-50), Français (51-100), Logique (101-120), Anglais (121-170)

    // Retourner les questions avec seulement les IDs (sans les bonnes réponses)
    const questionsForTest = questions.map((q) => ({
      id: q.id,
      prompt: q.prompt,
      comprehensionText: q.comprehensionText ?? null,
      choices: q.choices.map((c) => ({
        id: c.id,
        text: c.text,
        order: c.order,
      })),
    }))

    return NextResponse.json({
      questions: questionsForTest,
      totalQuestions: questionsForTest.length,
      startTime: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Error in /api/test-blanc/start:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

