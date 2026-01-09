import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/app/api/auth/[...nextauth]/route'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const body = await req.json()
    const duration = body.duration // '30' ou '60' en minutes

    if (!duration || (duration !== 30 && duration !== 60)) {
      return NextResponse.json({ error: 'Durée invalide. Doit être 30 ou 60 minutes' }, { status: 400 })
    }

    // Récupérer toutes les questions des deux tests blancs
    const testBlanc1Tag = await prisma.tag.findUnique({ where: { name: 'Test Blanc 1' } })
    const testBlanc2Tag = await prisma.tag.findUnique({ where: { name: 'Test Blanc 2' } })
    
    if (!testBlanc1Tag && !testBlanc2Tag) {
      return NextResponse.json({ error: 'Aucune question de test blanc trouvée' }, { status: 404 })
    }

    // Calculer le nombre de questions par partie selon la durée
    // Test normal : 150 questions pour 145 min (2h25)
    // Prorata : 10 questions par partie pour 30min, 20 questions par partie pour 1h
    const questionsPerPart = duration === 30 ? 10 : 20

    // Récupérer les questions de chaque test séparément
    // Chaque test a : Culture (1-50), Français (51-100), Anglais (121-170)
    
    let test1Questions: Array<{
      id: string
      prompt: string
      comprehensionText: string | null
      choices: Array<{ id: string; text: string; order: number }>
    }> = []
    let test2Questions: Array<{
      id: string
      prompt: string
      comprehensionText: string | null
      choices: Array<{ id: string; text: string; order: number }>
    }> = []
    
    if (testBlanc1Tag) {
      test1Questions = await prisma.question.findMany({
        where: {
          status: 'APPROVED',
          tags: {
            some: {
              tagId: testBlanc1Tag.id,
            },
          },
        },
        include: {
          choices: {
            orderBy: { order: 'asc' },
          },
        },
        orderBy: {
          createdAt: 'asc',
        },
      })
    }
    
    if (testBlanc2Tag) {
      test2Questions = await prisma.question.findMany({
        where: {
          status: 'APPROVED',
          tags: {
            some: {
              tagId: testBlanc2Tag.id,
            },
          },
        },
        include: {
          choices: {
            orderBy: { order: 'asc' },
          },
        },
        orderBy: {
          createdAt: 'asc',
        },
      })
    }
    
    if (test1Questions.length === 0 && test2Questions.length === 0) {
      return NextResponse.json({ error: 'Aucune question de test blanc disponible' }, { status: 404 })
    }
    
    // Séparer chaque test par partie (ordre de création = ordre du fichier)
    // Culture : premières 50 questions (indices 0-49)
    // Français : questions 51-100 (indices 50-99)
    // Anglais : questions 121-170 (indices 100-149)
    const test1Culture = test1Questions.slice(0, 50)
    const test1Francais = test1Questions.slice(50, 100)
    const test1Anglais = test1Questions.slice(100, 150)
    
    const test2Culture = test2Questions.slice(0, 50)
    const test2Francais = test2Questions.slice(50, 100)
    const test2Anglais = test2Questions.slice(100, 150)
    
    // Combiner les questions de même type des deux tests
    const cultureQuestions = [...test1Culture, ...test2Culture]
    const francaisQuestions = [...test1Francais, ...test2Francais]
    const anglaisQuestions = [...test1Anglais, ...test2Anglais]

    // Sélectionner aléatoirement le bon nombre de questions par partie
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
    const selectedAnglais = shuffle(anglaisQuestions).slice(0, questionsPerPart)

    // Combiner toutes les questions sélectionnées dans l'ordre : Culture, Français, Anglais
    // (sans mélanger l'ordre final pour garder la structure du test)
    const selectedQuestions = [...selectedCulture, ...selectedFrancais, ...selectedAnglais]

    // Retourner les questions avec seulement les IDs (sans les bonnes réponses)
    const questionsForTest = selectedQuestions.map((q) => ({
      id: q.id,
      prompt: q.prompt,
      comprehensionText: q.comprehensionText || null,
      choices: q.choices.map((c) => ({
        id: c.id,
        text: c.text,
        order: c.order,
      })),
    }))

    return NextResponse.json({
      questions: questionsForTest,
      totalQuestions: questionsForTest.length,
      duration: duration * 60, // Durée en secondes
      startTime: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Error in /api/test-blitz/start:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
