import { PrismaClient } from '@prisma/client'
import * as fs from 'fs'
import * as path from 'path'

const prisma = new PrismaClient()

interface QuestionData {
  number: number
  prompt: string
  choices: Array<{
    text: string
    isCorrect: boolean
    order: number
  }>
  comprehensionText?: string
}

function parseMarkdownFile(filePath: string): QuestionData[] {
  const content = fs.readFileSync(filePath, 'utf-8')
  const lines = content.split('\n')
  const questions: QuestionData[] = []
  
  let currentQuestion: QuestionData | null = null
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const trimmed = line.trim()
    
    // Détecter une nouvelle question (## Question X ou ### Question X)
    const questionMatch = trimmed.match(/^##\s*Question\s+(\d+)/i)
    if (questionMatch) {
      // Sauvegarder la question précédente si elle existe
      if (currentQuestion && currentQuestion.choices.length > 0) {
        questions.push(currentQuestion)
      }
      
      const num = parseInt(questionMatch[1], 10)
      currentQuestion = {
        number: num,
        prompt: '',
        choices: [],
      }
      continue
    }
    
    // Si on est dans une question
    if (currentQuestion) {
      // Ignorer les lignes vides, les séparateurs, et les réponses correctes
      if (
        trimmed === '' ||
        trimmed.startsWith('---') ||
        trimmed.startsWith('✅') ||
        trimmed.startsWith('**Réponse correcte') ||
        trimmed.startsWith('#') ||
        trimmed.startsWith('_Format')
      ) {
        continue
      }
      
      // Détecter les choix de réponse (format: - **1.** texte)
      const choiceMatch = trimmed.match(/^[-*]\s*\*\*?(\d+)\.\*\*?\s*(.+)$/)
      if (choiceMatch) {
        const order = parseInt(choiceMatch[1], 10)
        const text = choiceMatch[2].trim()
        
        // Chercher la réponse correcte dans les lignes suivantes (format: ✅ **Réponse correcte : X.**)
        let isCorrect = false
        for (let j = i + 1; j < Math.min(i + 15, lines.length); j++) {
          const nextLine = lines[j].trim()
          // Chercher "✅ **Réponse correcte : X.**" où X est le numéro du choix
          const correctMatch = nextLine.match(/✅\s*\*\*Réponse correcte\s*:\s*(\d+)\.\*\*/i)
          if (correctMatch) {
            const correctOrder = parseInt(correctMatch[1], 10)
            if (correctOrder === order) {
              isCorrect = true
              break
            }
          }
        }
        
        currentQuestion.choices.push({
          text,
          isCorrect,
          order: order - 1, // Convertir 1-5 en 0-4
        })
        continue
      }
      
      // Si ce n'est pas un choix et qu'on est dans une question, construire le prompt
      if (currentQuestion && trimmed.length > 0) {
        // Ignorer les lignes qui sont clairement des séparateurs ou des réponses
        if (trimmed.match(/^[-*]\s*\*\*?\d+\./)) {
          // C'est un choix, on a fini le prompt
          continue
        }
        
        // Ajouter au prompt
        if (!currentQuestion.prompt) {
          currentQuestion.prompt = trimmed
        } else {
          // Continuer le prompt sur plusieurs lignes
          currentQuestion.prompt += ' ' + trimmed
        }
      }
    }
  }
  
  // Ajouter la dernière question
  if (currentQuestion && currentQuestion.choices.length > 0) {
    questions.push(currentQuestion)
  }
  
  return questions
}

async function main() {
  console.log('📝 Import des questions Test Blanc 2...')
  
  // Chemins des fichiers
  const baseDir = path.join(__dirname, '..', '..')
  const file1 = path.join(baseDir, 'test 2', 'IAE-Message_Blanc2_Partie1_Culture_Q1-50.md')
  const file2 = path.join(baseDir, 'test 2', 'IAE-Message_Blanc2_Partie2_Francais_Q51-100.md')
  const file3 = path.join(baseDir, 'test 2', 'IAE-Message_Blanc2_Partie3_Anglais_Q121-170.md')
  
  if (!fs.existsSync(file1) || !fs.existsSync(file2) || !fs.existsSync(file3)) {
    console.error('❌ Fichiers non trouvés')
    process.exit(1)
  }
  
  // Parser les 3 fichiers
  const questions1 = parseMarkdownFile(file1)
  const questions2 = parseMarkdownFile(file2)
  const questions3 = parseMarkdownFile(file3)
  
  const allQuestions = [...questions1, ...questions2, ...questions3]
  console.log(`📊 ${allQuestions.length} questions parsées`)
  console.log(`   - Culture: ${questions1.length} questions`)
  console.log(`   - Français: ${questions2.length} questions`)
  console.log(`   - Anglais: ${questions3.length} questions`)
  
  // Récupérer ou créer le tag "Test Blanc 2"
  let testBlancTag = await prisma.tag.findUnique({ where: { name: 'Test Blanc 2' } })
  if (!testBlancTag) {
    testBlancTag = await prisma.tag.create({ data: { name: 'Test Blanc 2' } })
    console.log('✅ Tag "Test Blanc 2" créé')
  }
  
  let created = 0
  let updated = 0
  let skipped = 0
  
  // Trier les questions par numéro pour garantir l'ordre
  const sortedQuestions = [...allQuestions].sort((a, b) => a.number - b.number)
  
  for (const qData of sortedQuestions) {
    // Validation avant création
    if (qData.choices.length < 2) {
      skipped++
      console.log(`⚠️  Question ${qData.number} ignorée (moins de 2 choix)`)
      continue
    }
    
    // Vérifier qu'il y a exactement une bonne réponse
    const correctCount = qData.choices.filter((c) => c.isCorrect).length
    if (correctCount !== 1) {
      skipped++
      console.log(`⚠️  Question ${qData.number} ignorée (${correctCount} bonnes réponses au lieu de 1)`)
      continue
    }
    
    try {
      // Toujours créer une nouvelle question (les doublons sont gérés par la suppression préalable)
      await prisma.question.create({
        data: {
          prompt: qData.prompt,
          comprehensionText: qData.comprehensionText,
          status: 'APPROVED',
          source: 'IAE Message Test Blanc 2',
          choices: {
            create: qData.choices
              .sort((a, b) => a.order - b.order)
              .map((choice) => ({
                text: choice.text,
                isCorrect: choice.isCorrect,
                order: choice.order,
              })),
          },
          tags: {
            create: {
              tagId: testBlancTag.id,
            },
          },
        },
      })
      created++
      console.log(`✅ Question ${qData.number} créée`)
    } catch (error) {
      console.error(`❌ Erreur lors de la création de la question ${qData.number}:`, error)
      skipped++
    }
  }
  
  console.log(`\n✅ Import terminé:`)
  console.log(`   - ${created} questions créées`)
  console.log(`   - ${updated} questions mises à jour`)
  console.log(`   - ${skipped} questions ignorées`)
}

main()
  .catch((e) => {
    console.error('❌ Erreur:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
