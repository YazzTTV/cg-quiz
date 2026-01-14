import { prisma } from './prisma'

export async function updateWinStreak(userId: string): Promise<number> {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { winStreak: true, lastActivityDate: true },
  })

  if (!user) {
    return 0
  }

  let newWinStreak = 1

  if (user.lastActivityDate) {
    const lastActivity = new Date(user.lastActivityDate)
    const lastActivityDate = new Date(lastActivity.getFullYear(), lastActivity.getMonth(), lastActivity.getDate())
    
    const diffTime = today.getTime() - lastActivityDate.getTime()
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays === 0) {
      // Même jour, ne pas changer le win streak
      newWinStreak = user.winStreak
    } else if (diffDays === 1) {
      // Jour consécutif, incrémenter
      newWinStreak = user.winStreak + 1
    } else {
      // Plus d'un jour de différence, réinitialiser
      newWinStreak = 1
    }
  }

  await prisma.user.update({
    where: { id: userId },
    data: {
      winStreak: newWinStreak,
      lastActivityDate: now,
    },
  })

  return newWinStreak
}
