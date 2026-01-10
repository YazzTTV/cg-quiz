import { PrismaClient } from '@prisma/client'
import * as fs from 'fs'
import * as path from 'path'

const prisma = new PrismaClient()

type QuestionData = {
  number: number
  prompt: string
  choices: Array<{ text: string; isCorrect: boolean; order: number }>
}

function parseMarkdownFile(filePath: string): QuestionData[] {
  const content = fs.readFileSync(filePath, 'utf-8')
  const lines = content.split('\n')
  const questions: QuestionData[] = []
  
  let currentQuestion: QuestionData | null = null
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const trimmed = line.trim()
    
    // Ignorer les lignes vides, séparateurs, commentaires
    if (!trimmed || trimmed === '---' || trimmed.startsWith('>')) {
      continue
    }
    
    // Détecter une nouvelle question (format: ## 101. ...)
    const questionMatch = trimmed.match(/^##\s*(\d+)\.\s*(.+)$/)
    if (questionMatch) {
      // Sauvegarder la question précédente si elle existe
      if (currentQuestion && currentQuestion.choices.length > 0) {
        questions.push(currentQuestion)
      }
      
      const num = parseInt(questionMatch[1], 10)
      const prompt = questionMatch[2].trim()
      
      currentQuestion = {
        number: num,
        prompt: prompt,
        choices: [],
      }
      continue
    }
    
    // Détecter les choix (lignes commençant par un numéro suivi d'un point)
    const choiceMatch = trimmed.match(/^(\d+)\.\s*(.+)$/)
    if (choiceMatch && currentQuestion) {
      const order = parseInt(choiceMatch[1], 10)
      let text = choiceMatch[2].trim()
      
      // Vérifier si c'est la bonne réponse en regardant la ligne "Bonne réponse"
      // On va vérifier après avoir lu toutes les lignes
      currentQuestion.choices.push({
        text,
        isCorrect: false, // Sera mis à jour plus tard
        order: order - 1, // Convertir 1-5 en 0-4
      })
      continue
    }
    
    // Détecter la ligne "Bonne réponse"
    const bonneReponseMatch = trimmed.match(/^\*\*Bonne réponse\s*:\s*(\d+)\./)
    if (bonneReponseMatch && currentQuestion) {
      const correctOrder = parseInt(bonneReponseMatch[1], 10) - 1 // Convertir en index 0-based
      // Marquer la bonne réponse
      if (currentQuestion.choices[correctOrder]) {
        currentQuestion.choices[correctOrder].isCorrect = true
      }
      continue
    }
  }
  
  // Ajouter la dernière question
  if (currentQuestion && currentQuestion.choices.length > 0) {
    questions.push(currentQuestion)
  }
  
  return questions
}

async function main() {
  console.log('📝 Import des questions de logique (Q101-120) pour Test Blanc 1...')
  
  const filePath = path.join(__dirname, '..', '..', 'Mise en forme QCM Partie 3.md')
  
  if (!fs.existsSync(filePath)) {
    console.error(`❌ Fichier non trouvé: ${filePath}`)
    process.exit(1)
  }
  
  const questionsData = parseMarkdownFile(filePath)
  console.log(`📊 ${questionsData.length} questions parsées`)
  
  // Vérifier que ce sont bien les questions 101-120
  const expectedNumbers = Array.from({ length: 20 }, (_, i) => i + 101)
  const parsedNumbers = questionsData.map(q => q.number).sort((a, b) => a - b)
  
  if (parsedNumbers.length !== 20 || !parsedNumbers.every((n, i) => n === expectedNumbers[i])) {
    console.warn(`⚠️  Attention: Les numéros de questions ne correspondent pas exactement à 101-120`)
    console.warn(`   Numéros trouvés: ${parsedNumbers.join(', ')}`)
  }
  
  // Récupérer ou créer le tag "Test Blanc 1"
  let testBlancTag = await prisma.tag.findUnique({ where: { name: 'Test Blanc 1' } })
  if (!testBlancTag) {
    testBlancTag = await prisma.tag.create({ data: { name: 'Test Blanc 1' } })
  }
  
  // Récupérer les questions existantes du Test Blanc 1 pour vérifier l'ordre
  const existingQuestions = await prisma.question.findMany({
    where: {
      tags: {
        some: {
          tagId: testBlancTag.id,
        },
      },
    },
    orderBy: {
      createdAt: 'asc',
    },
  })
  
  console.log(`📋 ${existingQuestions.length} questions existantes dans Test Blanc 1`)
  
  // Les questions de logique doivent être insérées après la question 100
  // Donc après les 100 premières questions (Culture 1-50, Français 51-100)
  // On va créer les questions de logique maintenant
  
  let created = 0
  let updated = 0
  let skipped = 0
  
  // Trier les questions par numéro pour garantir l'ordre
  const sortedQuestions = [...questionsData].sort((a, b) => a.number - b.number)
  
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
      // Vérifier si la question existe déjà (par numéro et tag)
      const existing = await prisma.question.findFirst({
        where: {
          prompt: {
            equals: qData.prompt.trim(),
            mode: 'insensitive',
          },
          tags: {
            some: {
              tagId: testBlancTag.id,
            },
          },
        },
      })
      
      if (existing) {
        // Mettre à jour la question existante
        await prisma.question.update({
          where: { id: existing.id },
          data: {
            prompt: qData.prompt,
            choices: {
              deleteMany: {},
              create: qData.choices
                .sort((a, b) => a.order - b.order)
                .map((choice) => ({
                  text: choice.text,
                  isCorrect: choice.isCorrect,
                  order: choice.order,
                })),
          },
        },
      })
        updated++
        console.log(`🔄 Question ${qData.number} mise à jour`)
      } else {
        // Créer la nouvelle question
        await prisma.question.create({
          data: {
            prompt: qData.prompt,
            status: 'APPROVED',
            source: 'IAE Message QCM - Logique (Q101-120)',
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
      }
    } catch (error) {
      console.error(`❌ Erreur lors de la création de la question ${qData.number}:`, error)
      skipped++
    }
  }
  
  console.log(`\n✅ Import terminé:`)
  console.log(`   - ${created} questions créées`)
  console.log(`   - ${updated} questions mises à jour`)
  console.log(`   - ${skipped} questions ignorées`)
  console.log(`\n📝 Note: Les questions de logique (101-120) ont été ajoutées au Test Blanc 1.`)
  console.log(`   Le test complet contient maintenant 170 questions (Culture 1-50, Français 51-100, Logique 101-120, Anglais 121-170).`)
}

main()
  .catch((e) => {
    console.error('❌ Erreur:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
