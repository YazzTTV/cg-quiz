import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🗑️  Suppression de toutes les questions du Test Blanc 2...')
  
  const testBlancTag = await prisma.tag.findUnique({ where: { name: 'Test Blanc 2' } })
  
  if (!testBlancTag) {
    console.log('❌ Tag "Test Blanc 2" non trouvé')
    await prisma.$disconnect()
    return
  }
  
  const questions = await prisma.question.findMany({
    where: {
      tags: {
        some: {
          tagId: testBlancTag.id,
        },
      },
    },
  })
  
  console.log(`📊 ${questions.length} questions trouvées avec le tag "Test Blanc 2"`)
  
  for (const question of questions) {
    await prisma.question.delete({
      where: { id: question.id },
    })
  }
  
  console.log(`✅ ${questions.length} questions supprimées`)
}

main()
  .catch((e) => {
    console.error('❌ Erreur:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
