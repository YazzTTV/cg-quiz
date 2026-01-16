// Gestion des salles duo en mémoire
// En production, utiliser Redis ou une base de données

export interface DuoRoom {
  code: string
  hostId: string
  hostName: string
  guestId: string | null
  guestName: string | null
  status: 'waiting' | 'starting' | 'in_progress' | 'finished'
  createdAt: Date
  startedAt: Date | null
  questions: any[] | null
  currentQuestionIndex: number
  hostAnswers: Record<string, string>
  guestAnswers: Record<string, string>
  hostScore: number
  guestScore: number
  questionStartTime: Date | null
}

const rooms = new Map<string, DuoRoom>()

// Nettoyer les salles inactives (plus de 10 minutes)
setInterval(() => {
  const now = new Date()
  for (const [code, room] of rooms.entries()) {
    const age = now.getTime() - room.createdAt.getTime()
    if (age > 10 * 60 * 1000 && room.status === 'waiting') {
      rooms.delete(code)
    }
  }
}, 60000) // Vérifier toutes les minutes

// Générer un code à 4 chiffres unique
export function generateRoomCode(): string {
  let code: string
  do {
    code = Math.floor(1000 + Math.random() * 9000).toString()
  } while (rooms.has(code))
  return code
}

// Créer une salle
export function createRoom(hostId: string, hostName: string): DuoRoom {
  const code = generateRoomCode()
  const room: DuoRoom = {
    code,
    hostId,
    hostName,
    guestId: null,
    guestName: null,
    status: 'waiting',
    createdAt: new Date(),
    startedAt: null,
    questions: null,
    currentQuestionIndex: 0,
    hostAnswers: {},
    guestAnswers: {},
    hostScore: 0,
    guestScore: 0,
    questionStartTime: null,
  }

  rooms.set(code, room)
  return room
}

// Obtenir une salle
export function getRoom(code: string): DuoRoom | undefined {
  return rooms.get(code)
}

// Rejoindre une salle
export function joinRoom(code: string, guestId: string, guestName: string): DuoRoom | undefined {
  const room = rooms.get(code)
  if (!room) return undefined
  if (room.guestId !== null) return undefined // Salle pleine
  if (room.hostId === guestId) return undefined // Ne peut pas rejoindre sa propre salle

  room.guestId = guestId
  room.guestName = guestName
  return room
}

// Mettre à jour une salle
export function updateRoom(code: string, updates: Partial<DuoRoom>): boolean {
  const room = rooms.get(code)
  if (!room) return false

  Object.assign(room, updates)
  return true
}

// Supprimer une salle
export function deleteRoom(code: string): boolean {
  return rooms.delete(code)
}

// Obtenir toutes les salles (pour debug)
export function getAllRooms(): DuoRoom[] {
  return Array.from(rooms.values())
}
