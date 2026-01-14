import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🗑️  Suppression de toutes les questions du Test Blanc...')
  
  // Récupérer le tag "Test Blanc 1"
  const testBlancTag = await prisma.tag.findUnique({ where: { name: 'Test Blanc 1' } })
  if (!testBlancTag) {
    console.log('❌ Tag "Test Blanc 1" non trouvé')
    return
  }
  
  // Récupérer toutes les questions avec ce tag
  const questions = await prisma.question.findMany({
    where: {
      tags: {
        some: {
          tagId: testBlancTag.id,
        },
      },
    },
  })
  
  console.log(`📊 ${questions.length} questions trouvées avec le tag "Test Blanc 1"`)
  
  // Supprimer toutes ces questions (les choix seront supprimés en cascade)
  let deleted = 0
  for (const question of questions) {
    await prisma.question.delete({
      where: { id: question.id },
    })
    deleted++
  }
  
  console.log(`✅ ${deleted} questions supprimées`)
}

main()
  .catch((e) => {
    console.error('❌ Erreur:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
