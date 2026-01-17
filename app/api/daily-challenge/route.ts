import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/app/api/auth/[...nextauth]/route'
import { prisma } from '@/lib/prisma'

// Fonction pour calculer le numéro du jour du mois (1-31)
// Le numéro du jour correspond au jour du mois actuel
const getDayNumber = (date: Date = new Date()): number => {
  return date.getDate() // Retourne le jour du mois (1-31)
}

export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const userId = session.user.id
    const searchParams = req.nextUrl.searchParams
    const dayParam = searchParams.get('day')
    
    // Si un jour spécifique est demandé, l'utiliser, sinon utiliser le jour actuel
    const dayNumber = dayParam ? parseInt(dayParam, 10) : getDayNumber()
    const today = getDayNumber()
    
    if (isNaN(dayNumber) || dayNumber < 1) {
      return NextResponse.json({ error: 'Numéro de jour invalide' }, { status: 400 })
    }
    
    // Bloquer l'accès aux jours futurs
    if (dayNumber > today) {
      return NextResponse.json({ 
        error: 'Jour futur non disponible',
        dayNumber,
        today,
        message: 'Les défis futurs ne sont pas encore disponibles'
      }, { status: 403 })
    }

    // Vérifier que le modèle dailyChallenge est disponible
    if (!prisma.dailyChallenge) {
      console.error('Prisma client: dailyChallenge model is not available')
      return NextResponse.json({ 
        error: 'Modèle DailyChallenge non disponible',
        details: 'Le client Prisma doit être régénéré. Redémarrez le serveur après avoir exécuté: npx prisma generate'
      }, { status: 500 })
    }

    console.log(`Recherche du défi pour le jour ${dayNumber}`)
    
    // Récupérer le défi du jour
    const challenge = await prisma.dailyChallenge.findUnique({
      where: { dayNumber },
      include: {
        choices: {
          orderBy: { order: 'asc' },
        },
      },
    })

    console.log(`Résultat de la recherche:`, challenge ? `Défi trouvé (ID: ${challenge.id})` : 'Aucun défi trouvé')

    if (!challenge) {
      // Vérifier combien de défis existent dans la base
      const allChallenges = await prisma.dailyChallenge.findMany({
        select: { dayNumber: true },
        orderBy: { dayNumber: 'asc' },
      })
      console.log(`Défis disponibles dans la base:`, allChallenges.map(c => c.dayNumber))
      
      return NextResponse.json({ 
        error: 'Défi non trouvé',
        dayNumber,
        availableDays: allChallenges.map(c => c.dayNumber),
        message: 'Aucun défi disponible pour ce jour'
      }, { status: 404 })
    }

    // Vérifier si l'utilisateur a déjà répondu
    const userAnswer = await prisma.userDailyChallenge.findUnique({
      where: {
        userId_dailyChallengeId: {
          userId,
          dailyChallengeId: challenge.id,
        },
      },
    })

    // Retourner le défi avec les informations de réponse de l'utilisateur
    return NextResponse.json({
      challenge: {
        id: challenge.id,
        dayNumber: challenge.dayNumber,
        prompt: challenge.prompt,
        explanation: challenge.explanation,
        choices: challenge.choices.map(choice => ({
          id: choice.id,
          text: choice.text,
          order: choice.order,
          // Ne pas révéler la réponse correcte si l'utilisateur n'a pas encore répondu
          isCorrect: userAnswer ? choice.isCorrect : undefined,
        })),
      },
      userAnswer: userAnswer ? {
        selectedChoiceId: userAnswer.selectedChoiceId,
        isCorrect: userAnswer.isCorrect,
        answeredAt: userAnswer.answeredAt,
      } : null,
    })
  } catch (error) {
    console.error('Error in /api/daily-challenge:', error)
    const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue'
    return NextResponse.json({ 
      error: 'Erreur serveur',
      details: errorMessage 
    }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const userId = session.user.id
    const body = await req.json()
    const { challengeId, choiceId } = body

    if (!challengeId || !choiceId) {
      return NextResponse.json({ error: 'Données manquantes' }, { status: 400 })
    }

    // Récupérer le défi et le choix sélectionné
    const challenge = await prisma.dailyChallenge.findUnique({
      where: { id: challengeId },
      include: {
        choices: true,
      },
    })

    if (!challenge) {
      return NextResponse.json({ error: 'Défi non trouvé' }, { status: 404 })
    }

    const selectedChoice = challenge.choices.find(c => c.id === choiceId)
    if (!selectedChoice) {
      return NextResponse.json({ error: 'Choix invalide' }, { status: 400 })
    }

    // Vérifier si l'utilisateur a déjà répondu
    const existingAnswer = await prisma.userDailyChallenge.findUnique({
      where: {
        userId_dailyChallengeId: {
          userId,
          dailyChallengeId: challengeId,
        },
      },
    })

    if (existingAnswer) {
      return NextResponse.json({ 
        error: 'Vous avez déjà répondu à ce défi',
        isCorrect: existingAnswer.isCorrect,
      }, { status: 400 })
    }

    // Enregistrer la réponse
    const isCorrect = selectedChoice.isCorrect
    const userAnswer = await prisma.userDailyChallenge.create({
      data: {
        userId,
        dailyChallengeId: challengeId,
        selectedChoiceId: choiceId,
        isCorrect,
      },
    })

    // Retourner la réponse avec toutes les informations
    return NextResponse.json({
      isCorrect,
      explanation: challenge.explanation,
      correctChoice: challenge.choices.find(c => c.isCorrect),
      userAnswer,
    })
  } catch (error) {
    console.error('Error in /api/daily-challenge POST:', error)
    const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue'
    return NextResponse.json({ 
      error: 'Erreur serveur',
      details: errorMessage 
    }, { status: 500 })
  }
}
