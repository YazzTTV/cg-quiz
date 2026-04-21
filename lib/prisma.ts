import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Fonction pour créer une nouvelle instance du client Prisma
const createPrismaClient = () => {
  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
  })
}

// Vérifier si le client Prisma en cache a les modèles nécessaires
let prisma = globalForPrisma.prisma ?? createPrismaClient()

// Si les modèles ne sont pas disponibles, forcer une réinitialisation
if (!prisma.dailyChallenge || !prisma.flashcard) {
  console.warn('Prisma client: certains modèles ne sont pas disponibles. Création d\'une nouvelle instance...')
  // Déconnecter l'ancien client s'il existe
  if (globalForPrisma.prisma) {
    globalForPrisma.prisma.$disconnect().catch(() => {})
  }
  // Créer un nouveau client
  prisma = createPrismaClient()
  if (process.env.NODE_ENV !== 'production') {
    globalForPrisma.prisma = prisma
  }
}

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

export { prisma }