import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/app/api/auth/[...nextauth]/route'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const createQuestionSchema = z.object({
  prompt: z.string().min(1),
  explanation: z.string().optional(),
  choices: z
    .array(
      z.object({
        text: z.string().min(1),
        isCorrect: z.boolean(),
      })
    )
    .length(4),
  tags: z.array(z.string()).optional(),
})

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const userId = session.user.id
    const body = await req.json()
    const data = createQuestionSchema.parse(body)

    // Validation : exactement 1 choix correct
    const correctCount = data.choices.filter((c) => c.isCorrect).length
    if (correctCount !== 1) {
      return NextResponse.json({ error: 'Il doit y avoir exactement 1 choix correct' }, { status: 400 })
    }

    // Créer la question avec les choix
    const question = await prisma.question.create({
      data: {
        prompt: data.prompt,
        explanation: data.explanation,
        status: 'PENDING',
        createdByUserId: userId,
        choices: {
          create: data.choices.map((choice, index) => ({
            text: choice.text,
            isCorrect: choice.isCorrect,
            order: index,
          })),
        },
      },
    })

    // Ajouter les tags si fournis
    if (data.tags && data.tags.length > 0) {
      for (const tagName of data.tags) {
        let tag = await prisma.tag.findUnique({ where: { name: tagName } })
        if (!tag) {
          tag = await prisma.tag.create({ data: { name: tagName } })
        }
        await prisma.questionTag.create({
          data: {
            questionId: question.id,
            tagId: tag.id,
          },
        })
      }
    }

    return NextResponse.json({ id: question.id, message: 'Question soumise à validation' }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Données invalides', details: error.issues }, { status: 400 })
    }
    console.error('Error in /api/questions:', error)
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
    const url = new URL(req.url)
    const mine = url.searchParams.get('mine') === 'true'

    if (mine) {
      const questions = await prisma.question.findMany({
        where: { createdByUserId: userId },
        include: {
          choices: {
            orderBy: { order: 'asc' },
          },
          tags: {
            include: { tag: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      })

      return NextResponse.json(questions)
    }

    return NextResponse.json({ error: 'Paramètre invalide' }, { status: 400 })
  } catch (error) {
    console.error('Error in /api/questions:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

