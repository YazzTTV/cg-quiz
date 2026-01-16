import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/app/api/auth/[...nextauth]/route'
import { createRoom, getRoom, joinRoom } from '@/lib/duo-rooms'

// Créer une salle
export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const userId = session.user.id
    const userName = session.user.name || session.user.email || 'Joueur'

    const room = createRoom(userId, userName)

    return NextResponse.json({ code: room.code })
  } catch (error) {
    console.error('Error in /api/duo/rooms POST:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

// Rejoindre une salle ou obtenir l'état d'une salle
export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const userId = session.user.id
    const code = req.nextUrl.searchParams.get('code')

    if (!code) {
      return NextResponse.json({ error: 'Code de salle requis' }, { status: 400 })
    }

    let room = getRoom(code)

    if (!room) {
      return NextResponse.json({ error: 'Salle introuvable' }, { status: 404 })
    }

    // Si l'utilisateur n'est ni l'hôte ni l'invité, essayer de rejoindre
    if (room.hostId !== userId && room.guestId !== userId) {
      if (room.guestId !== null) {
        return NextResponse.json({ error: 'Salle pleine' }, { status: 403 })
      }

      // Rejoindre la salle comme invité
      const guestName = session.user.name || session.user.email || 'Joueur'
      room = joinRoom(code, userId, guestName)
      if (!room) {
        return NextResponse.json({ error: 'Impossible de rejoindre la salle' }, { status: 403 })
      }
    }

    // Retourner l'état de la salle (sans les bonnes réponses)
    const roomState = {
      code: room.code,
      hostName: room.hostName,
      guestName: room.guestName,
      status: room.status,
      currentQuestionIndex: room.currentQuestionIndex,
      totalQuestions: room.questions?.length || 0,
      isHost: room.hostId === userId,
      isGuest: room.guestId === userId,
      hasGuest: room.guestId !== null,
    }

    return NextResponse.json(roomState)
  } catch (error) {
    console.error('Error in /api/duo/rooms GET:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
