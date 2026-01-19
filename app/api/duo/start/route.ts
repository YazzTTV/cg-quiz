import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/app/api/auth/[...nextauth]/route'
import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'

// Fonction pour obtenir les questions (similaire au test blitz)
async function getDuoQuestions(userId: string) {
  // Utiliser la même logique que le test blitz mais avec un nombre fixe de questions
  // Pour le mode duo, on prend 32 questions (comme le test blitz 30min)
  const questionsPerPart = 8

  // Récupérer les IDs des questions suspendues (signalées) par l'utilisateur
  const suspendedQuestions = await prisma.userQuestionState.findMany({
    where: {
      userId,
      suspended: true,
    },
    select: { questionId: true },
  })
  const suspendedQuestionIds = suspendedQuestions.map((s) => s.questionId)

  const testBlanc1Tag = await prisma.tag.findUnique({ where: { name: 'Test Blanc 1' } })
  const testBlanc2Tag = await prisma.tag.findUnique({ where: { name: 'Test Blanc 2' } })
  
  if (!testBlanc1Tag && !testBlanc2Tag) {
    throw new Error('Aucune question de test blanc trouvée')
  }

  let test1Questions: any[] = []
  let test2Questions: any[] = []
  
  if (testBlanc1Tag) {
    test1Questions = await prisma.question.findMany({
      where: {
        status: 'APPROVED',
        id: { notIn: suspendedQuestionIds },
        tags: {
          some: { tagId: testBlanc1Tag.id },
        },
      },
      include: {
        choices: { orderBy: { order: 'asc' } },
        tags: { include: { tag: true } },
      },
      orderBy: { createdAt: 'asc' },
    })
  }
  
  if (testBlanc2Tag) {
    test2Questions = await prisma.question.findMany({
      where: {
        status: 'APPROVED',
        id: { notIn: suspendedQuestionIds },
        tags: {
          some: { tagId: testBlanc2Tag.id },
        },
      },
      include: {
        choices: { orderBy: { order: 'asc' } },
        tags: { include: { tag: true } },
      },
      orderBy: { createdAt: 'asc' },
    })
  }
  
  if (test1Questions.length === 0 && test2Questions.length === 0) {
    throw new Error('Aucune question de test blanc disponible')
  }
  
  // Séparer par partie
  const test1Culture = test1Questions.slice(0, 50)
  const test1Francais = test1Questions.slice(50, 100)
  const test1Logique = test1Questions.slice(100, 120)
  const test1Anglais = test1Questions.slice(120, 170)
  
  const test2Culture = test2Questions.slice(0, 50)
  const test2Francais = test2Questions.slice(50, 100)
  const test2Logique = test2Questions.slice(100, 120)
  const test2Anglais = test2Questions.slice(120, 170)
  
  const cultureQuestions = [...test1Culture, ...test2Culture]
  const francaisQuestions = [...test1Francais, ...test2Francais]
  const logiqueQuestions = [...test1Logique, ...test2Logique]
  const anglaisQuestions = [...test1Anglais, ...test2Anglais]

  const shuffle = <T>(array: T[]): T[] => {
    const shuffled = [...array]
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
    }
    return shuffled
  }

  const selectedCulture = shuffle(cultureQuestions).slice(0, questionsPerPart)
  const selectedFrancais = shuffle(francaisQuestions).slice(0, questionsPerPart)
  const selectedLogique = shuffle(logiqueQuestions).slice(0, questionsPerPart)
  const selectedAnglais = shuffle(anglaisQuestions).slice(0, questionsPerPart)

  const selectedQuestions = [...selectedCulture, ...selectedFrancais, ...selectedLogique, ...selectedAnglais]
  const logiqueQuestionIds = new Set([...selectedLogique].map(q => q.id))
  
  // Déterminer le type de question et le temps alloué
  const questionsForTest = selectedQuestions.map((q, index) => {
    let questionType: 'culture' | 'francais' | 'logique' | 'anglais'
    let timeLimit: number

    if (index < questionsPerPart) {
      questionType = 'culture'
      timeLimit = 15
    } else if (index < questionsPerPart * 2) {
      questionType = 'francais'
      timeLimit = 18
    } else if (index < questionsPerPart * 3) {
      questionType = 'logique'
      timeLimit = 25
    } else {
      questionType = 'anglais'
      timeLimit = 20
    }

    // Si la question a un texte de compréhension, ajouter du temps
    if (q.comprehensionText) {
      timeLimit += 10
    }

    return {
      id: q.id,
      prompt: q.prompt,
      comprehensionText: q.comprehensionText || null,
      questionType,
      timeLimit,
      isLogique: logiqueQuestionIds.has(q.id),
      choices: q.choices.map((c: any) => ({
        id: c.id,
        text: c.text,
        order: c.order,
      })),
    }
  })

  return questionsForTest
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const userId = session.user.id
    const body = await req.json()
    const { code } = body

    if (!code) {
      return NextResponse.json({ error: 'Code de salle requis' }, { status: 400 })
    }

    let room = await prisma.duoRoom.findUnique({ where: { code } })
    if (!room) {
      return NextResponse.json({ error: 'Salle introuvable' }, { status: 404 })
    }

    // Vérifier que l'utilisateur est l'hôte ou l'invité
    if (room.hostId !== userId && room.guestId !== userId) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
    }

    // Vérifier qu'il y a 2 joueurs
    if (room.guestId === null) {
      return NextResponse.json({ error: 'En attente du deuxième joueur' }, { status: 400 })
    }

    const existingQuestions = room.questions as unknown as any[] | null

    if (room.status === 'waiting' && room.hostId !== userId) {
      return NextResponse.json({ error: 'En attente du démarrage par l’hôte' }, { status: 409 })
    }

    // Si la partie n'a pas encore commencé, tenter d'initialiser une seule fois
    if (room.status === 'waiting' && !existingQuestions) {
      const questions = await getDuoQuestions(userId)
      const updated = await prisma.duoRoom.updateMany({
        where: {
          code,
          status: 'waiting',
          questions: { equals: Prisma.DbNull },
        },
        data: {
          questions,
          status: 'starting',
          startedAt: new Date(),
        },
      })

      // Toujours relire la salle pour utiliser les questions stockées
      room = await prisma.duoRoom.findUnique({ where: { code } })
      if (!room || !room.questions) {
        return NextResponse.json({ error: 'Questions indisponibles' }, { status: 500 })
      }

      // Si cette requête n'a pas gagné la course, ignorer les questions générées localement
      if (updated.count === 0 && !room.questions) {
        return NextResponse.json({ error: 'Questions indisponibles' }, { status: 500 })
      }
    }

    if (!room.questions) {
      return NextResponse.json({ error: 'Questions indisponibles' }, { status: 500 })
    }

    // Retourner les questions (sans les bonnes réponses)
    const questionsForClient = (room.questions as any[]).map((q: any) => ({
      id: q.id,
      prompt: q.prompt,
      comprehensionText: q.comprehensionText,
      questionType: q.questionType,
      timeLimit: q.timeLimit,
      choices: q.choices,
    }))

    return NextResponse.json({
      questions: questionsForClient,
      totalQuestions: questionsForClient.length,
    })
  } catch (error) {
    console.error('Error in /api/duo/start:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
