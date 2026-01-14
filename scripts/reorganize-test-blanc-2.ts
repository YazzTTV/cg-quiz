import { PrismaClient } from '@prisma/client'
import * as fs from 'fs'
import * as path from 'path'

const prisma = new PrismaClient()

// Importer les fonctions de parsing depuis les scripts existants
// Pour simplifier, on va réutiliser la logique directement ici

type QuestionData = {
  number: number
  prompt: string
  choices: Array<{ text: string; isCorrect: boolean; order: number }>
  comprehensionText?: string | null
}

// Fonction pour parser les fichiers Culture, Français, Anglais (format similaire)
function parseMarkdownFileStandard(filePath: string): QuestionData[] {
  const content = fs.readFileSync(filePath, 'utf-8')
  const lines = content.split('\n')
  const questions: QuestionData[] = []
  
  let currentQuestion: QuestionData | null = null
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const trimmed = line.trim()
    
    // Détecter une nouvelle question (## Question X)
    const questionMatch = trimmed.match(/^##\s*Question\s+(\d+)/i)
    if (questionMatch) {
      if (currentQuestion && currentQuestion.choices.length > 0) {
        questions.push(currentQuestion)
      }
      
      const num = parseInt(questionMatch[1], 10)
      currentQuestion = {
        number: num,
        prompt: '',
        choices: [],
        comprehensionText: null,
      }
      continue
    }
    
    if (currentQuestion) {
      // Ignorer les lignes vides, séparateurs, etc.
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
      
      // Détecter les choix (format: - **1.** texte)
      const choiceMatch = trimmed.match(/^[-*]\s*\*\*?(\d+)\.\*\*?\s*(.+)$/)
      if (choiceMatch) {
        const order = parseInt(choiceMatch[1], 10)
        const text = choiceMatch[2].trim()
        
        // Chercher la réponse correcte dans les lignes suivantes
        let isCorrect = false
        for (let j = i + 1; j < Math.min(i + 15, lines.length); j++) {
          const nextLine = lines[j].trim()
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
          order: order - 1,
        })
        continue
      }
      
      // Construire le prompt
      if (trimmed.length > 0 && !trimmed.match(/^[-*]\s*\*\*?\d+\./)) {
        if (!currentQuestion.prompt) {
          currentQuestion.prompt = trimmed
        } else {
          currentQuestion.prompt += ' ' + trimmed
        }
      }
    }
  }
  
  if (currentQuestion && currentQuestion.choices.length > 0) {
    questions.push(currentQuestion)
  }
  
  return questions
}

// Fonction pour parser le fichier Logique (format différent)
function parseMarkdownFileLogique(filePath: string): QuestionData[] {
  const content = fs.readFileSync(filePath, 'utf-8')
  const lines = content.split('\n')
  const questions: QuestionData[] = []
  
  let currentQuestion: QuestionData | null = null
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const trimmed = line.trim()
    
    // Ignorer les lignes vides, séparateurs, commentaires (mais pas les ###)
    if (!trimmed || trimmed === '---' || trimmed.startsWith('>') || (trimmed.startsWith('#') && !trimmed.startsWith('###'))) {
      continue
    }
    
    // Détecter une nouvelle question (format: ### 101. ...)
    const questionMatch = trimmed.match(/^###\s*(\d+)\.\s*(.+)$/)
    if (questionMatch) {
      if (currentQuestion && currentQuestion.choices.length > 0) {
        questions.push(currentQuestion)
      }
      
      const num = parseInt(questionMatch[1], 10)
      let promptParts: string[] = []
      
      const promptOnSameLine = questionMatch[2].trim()
      if (promptOnSameLine) {
        promptParts.push(promptOnSameLine)
      }
      
      // Regarder les lignes suivantes pour le reste du prompt
      let j = i + 1
      while (j < lines.length) {
        const nextLine = lines[j].trim()
        if (!nextLine || nextLine.match(/^(\d+)\./) || nextLine.match(/✅/) || nextLine === '---') {
          break
        }
        if (nextLine.startsWith('\\[') || nextLine.startsWith('\\begin') || nextLine.startsWith('|')) {
          j++
          continue
        }
        promptParts.push(nextLine)
        j++
      }
      
      let prompt = promptParts
        .map(p => p.replace(/\*\*/g, '').trim())
        .filter(p => p.length > 0)
        .join(' ')
      
      currentQuestion = {
        number: num,
        prompt: prompt || `Question ${num}`,
        choices: [],
      }
      continue
    }
    
    // Détecter les choix
    const choiceMatch = trimmed.match(/^(\d+)\.\s*(.+)$/)
    if (choiceMatch && currentQuestion) {
      const order = parseInt(choiceMatch[1], 10)
      let text = choiceMatch[2].trim().replace(/\s+$/, '')
      
      currentQuestion.choices.push({
        text,
        isCorrect: false,
        order: order - 1,
      })
      continue
    }
    
    // Détecter la bonne réponse
    const bonneReponseMatch = trimmed.match(/✅\s*\*\*Bonne réponse\s*:\s*(\d+)/)
    if (bonneReponseMatch && currentQuestion) {
      const correctOrder = parseInt(bonneReponseMatch[1], 10) - 1
      if (currentQuestion.choices[correctOrder]) {
        currentQuestion.choices[correctOrder].isCorrect = true
      }
      continue
    }
    
    const bonneReponseMatch2 = trimmed.match(/\*\*Bonne réponse\s*:\s*(\d+)/)
    if (bonneReponseMatch2 && currentQuestion && !currentQuestion.choices.some(c => c.isCorrect)) {
      const correctOrder = parseInt(bonneReponseMatch2[1], 10) - 1
      if (currentQuestion.choices[correctOrder]) {
        currentQuestion.choices[correctOrder].isCorrect = true
      }
      continue
    }
  }
  
  if (currentQuestion && currentQuestion.choices.length > 0) {
    questions.push(currentQuestion)
  }
  
  return questions
}

async function main() {
  console.log('🔄 Réorganisation des questions du Test Blanc 2...\n')
  
  // Étape 1: Supprimer toutes les questions existantes
  console.log('🗑️  Étape 1: Suppression des questions existantes...')
  const testBlancTag = await prisma.tag.findUnique({ where: { name: 'Test Blanc 2' } })
  
  if (!testBlancTag) {
    console.log('❌ Tag "Test Blanc 2" non trouvé')
    await prisma.$disconnect()
    return
  }
  
  const existingQuestions = await prisma.question.findMany({
    where: {
      tags: {
        some: {
          tagId: testBlancTag.id,
        },
      },
    },
  })
  
  console.log(`📊 ${existingQuestions.length} questions trouvées`)
  
  for (const question of existingQuestions) {
    await prisma.question.delete({
      where: { id: question.id },
    })
  }
  
  console.log(`✅ ${existingQuestions.length} questions supprimées\n`)
  
  // Étape 2: Importer les questions dans le bon ordre
  console.log('📝 Étape 2: Import des questions dans le bon ordre...\n')
  
  const baseDir = path.join(__dirname, '..', '..')
  const fileCulture = path.join(baseDir, 'test 2', 'IAE-Message_Blanc2_Partie1_Culture_Q1-50.md')
  const fileFrancais = path.join(baseDir, 'test 2', 'IAE-Message_Blanc2_Partie2_Francais_Q51-100.md')
  const fileLogique = path.join(baseDir, 'test 2', 'Mise en forme QCM Partie 3 Logique Q101-120.md')
  const fileAnglais = path.join(baseDir, 'test 2', 'IAE-Message_Blanc2_Partie3_Anglais_Q121-170.md')
  
  if (!fs.existsSync(fileCulture) || !fs.existsSync(fileFrancais) || !fs.existsSync(fileLogique) || !fs.existsSync(fileAnglais)) {
    console.error('❌ Fichiers non trouvés')
    process.exit(1)
  }
  
  // Parser les fichiers dans l'ordre
  console.log('📖 Parsing des fichiers...')
  const questionsCulture = parseMarkdownFileStandard(fileCulture)
  console.log(`   ✅ Culture: ${questionsCulture.length} questions`)
  
  const questionsFrancais = parseMarkdownFileStandard(fileFrancais)
  console.log(`   ✅ Français: ${questionsFrancais.length} questions`)
  
  const questionsLogique = parseMarkdownFileLogique(fileLogique)
  console.log(`   ✅ Logique: ${questionsLogique.length} questions`)
  
  const questionsAnglais = parseMarkdownFileStandard(fileAnglais)
  console.log(`   ✅ Anglais: ${questionsAnglais.length} questions`)
  
  // Combiner dans le bon ordre
  const allQuestions = [
    ...questionsCulture,
    ...questionsFrancais,
    ...questionsLogique,
    ...questionsAnglais,
  ]
  
  console.log(`\n📊 Total: ${allQuestions.length} questions à importer\n`)
  
  // Ajouter les textes de compréhension pour Français (86-100) et Anglais (156-170)
  // Ces textes doivent être ajoutés après l'import, donc on les laisse pour l'instant
  
  let created = 0
  let skipped = 0
  
  // Trier par numéro pour garantir l'ordre
  const sortedQuestions = [...allQuestions].sort((a, b) => a.number - b.number)
  
  console.log('💾 Création des questions...\n')
  
  for (const qData of sortedQuestions) {
    // Validation
    if (qData.choices.length < 2) {
      skipped++
      console.log(`⚠️  Question ${qData.number} ignorée (moins de 2 choix)`)
      continue
    }
    
    const correctCount = qData.choices.filter((c) => c.isCorrect).length
    if (correctCount !== 1) {
      skipped++
      console.log(`⚠️  Question ${qData.number} ignorée (${correctCount} bonnes réponses au lieu de 1)`)
      continue
    }
    
    try {
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
      if (created % 10 === 0) {
        console.log(`   ✅ ${created} questions créées...`)
      }
    } catch (error) {
      console.error(`❌ Erreur lors de la création de la question ${qData.number}:`, error)
      skipped++
    }
  }
  
  console.log(`\n✅ Réorganisation terminée:`)
  console.log(`   - ${created} questions créées`)
  console.log(`   - ${skipped} questions ignorées`)
  console.log(`\n📝 Note: Les questions sont maintenant dans l'ordre correct:`)
  console.log(`   - Culture (1-50)`)
  console.log(`   - Français (51-100)`)
  console.log(`   - Logique (101-120)`)
  console.log(`   - Anglais (121-170)`)
  console.log(`\n⚠️  N'oubliez pas d'exécuter le script add-comprehension-texts-test-blanc-2.ts pour ajouter les textes de compréhension.`)
}

main()
  .catch((e) => {
    console.error('❌ Erreur:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
