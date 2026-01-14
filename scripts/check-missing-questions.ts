import { PrismaClient } from '@prisma/client'
import * as fs from 'fs'
import * as path from 'path'

const prisma = new PrismaClient()

async function main() {
  console.log('🔍 Vérification des questions manquantes...\n')
  
  // Lire les fichiers markdown
  const baseDir = path.join(__dirname, '..', '..')
  const file1 = path.join(baseDir, 'test 2', 'IAE-Message_Blanc2_Partie1_Culture_Q1-50.md')
  const file2 = path.join(baseDir, 'test 2', 'IAE-Message_Blanc2_Partie2_Francais_Q51-100.md')
  const file3 = path.join(baseDir, 'test 2', 'IAE-Message_Blanc2_Partie3_Anglais_Q121-170.md')
  
  const files = [
    { path: file1, range: [1, 50] },
    { path: file2, range: [51, 100] },
    { path: file3, range: [121, 170] },
  ]
  
  // Extraire les prompts des fichiers
  const expectedQuestions: Map<number, string> = new Map()
  
  for (const file of files) {
    const content = fs.readFileSync(file.path, 'utf-8')
    const lines = content.split('\n')
    
    let currentQuestionNum = 0
    let currentPrompt = ''
    let inQuestion = false
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim()
      
      // Détecter une nouvelle question
      const questionMatch = line.match(/^##\s*Question\s+(\d+)/i)
      if (questionMatch) {
        if (currentQuestionNum > 0 && currentPrompt) {
          expectedQuestions.set(currentQuestionNum, currentPrompt.trim())
        }
        currentQuestionNum = parseInt(questionMatch[1], 10)
        currentPrompt = ''
        inQuestion = true
        continue
      }
      
      // Si on est dans une question et que ce n'est pas un choix
      if (inQuestion && currentQuestionNum > 0) {
        if (line === '' || line.startsWith('---') || line.startsWith('✅') || line.startsWith('**Réponse correcte') || line.startsWith('#') || line.startsWith('_Format')) {
          continue
        }
        
        // Détecter un choix (commence par - **1.** ou similaire)
        if (line.match(/^[-*]\s*\*\*?\d+\./)) {
          // On a fini le prompt
          if (currentPrompt) {
            expectedQuestions.set(currentQuestionNum, currentPrompt.trim())
            inQuestion = false
          }
          continue
        }
        
        // Ajouter au prompt
        if (line.length > 0) {
          currentPrompt += (currentPrompt ? ' ' : '') + line
        }
      }
    }
    
    // Ajouter la dernière question
    if (currentQuestionNum > 0 && currentPrompt) {
      expectedQuestions.set(currentQuestionNum, currentPrompt.trim())
    }
  }
  
  console.log(`📊 ${expectedQuestions.size} questions attendues dans les fichiers\n`)
  
  // Récupérer les questions de la base
  const tag = await prisma.tag.findUnique({ where: { name: 'Test Blanc 2' } })
  if (!tag) {
    console.log('❌ Tag "Test Blanc 2" non trouvé')
    await prisma.$disconnect()
    return
  }
  
  const dbQuestions = await prisma.question.findMany({
    where: {
      tags: {
        some: {
          tagId: tag.id,
        },
      },
    },
    orderBy: { createdAt: 'asc' },
    select: { prompt: true },
  })
  
  console.log(`📊 ${dbQuestions.length} questions trouvées en base de données\n`)
  
  // Comparer
  const missing: number[] = []
  const found: number[] = []
  
  for (const [num, expectedPrompt] of expectedQuestions.entries()) {
    const foundQuestion = dbQuestions.find((q) => {
      // Comparer les premiers mots du prompt
      const dbWords = q.prompt.split(' ').slice(0, 5).join(' ')
      const expectedWords = expectedPrompt.split(' ').slice(0, 5).join(' ')
      return dbWords === expectedWords || q.prompt.includes(expectedPrompt.substring(0, 30))
    })
    
    if (foundQuestion) {
      found.push(num)
    } else {
      missing.push(num)
    }
  }
  
  console.log(`✅ Questions trouvées: ${found.length}`)
  console.log(`❌ Questions manquantes: ${missing.length}\n`)
  
  if (missing.length > 0) {
    console.log('📋 Numéros de questions manquantes:')
    // Grouper par plage
    missing.sort((a, b) => a - b)
    let start = missing[0]
    let end = missing[0]
    
    for (let i = 1; i < missing.length; i++) {
      if (missing[i] === end + 1) {
        end = missing[i]
      } else {
        if (start === end) {
          console.log(`   ${start}`)
        } else {
          console.log(`   ${start}-${end}`)
        }
        start = missing[i]
        end = missing[i]
      }
    }
    if (start === end) {
      console.log(`   ${start}`)
    } else {
      console.log(`   ${start}-${end}`)
    }
    
    console.log('\n📝 Détail des questions manquantes:')
    missing.slice(0, 20).forEach((num) => {
      const prompt = expectedQuestions.get(num)
      console.log(`   ${num}. ${prompt?.substring(0, 60)}...`)
    })
    if (missing.length > 20) {
      console.log(`   ... et ${missing.length - 20} autres`)
    }
  }
  
  await prisma.$disconnect()
}

main().catch(console.error)
