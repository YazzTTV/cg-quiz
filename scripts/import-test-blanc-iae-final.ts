import { PrismaClient } from '@prisma/client'
import * as fs from 'fs'
import * as path from 'path'
import 'dotenv/config'

const prisma = new PrismaClient()

interface QuestionData {
  number: number
  prompt: string
  choices: Array<{ text: string; isCorrect: boolean; order: number }>
}

// Fonction pour extraire les réponses du format tabulaire
function extractAnswersFromTable(corrigesSection: string): Record<number, number> {
  const answers: Record<number, number> = {}
  
  const lines = corrigesSection.split('\n')
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()
    
    // Format tabulaire : "1 2 3 4 5 6 7 8 9 10\n3 3 5 1 2 3 5 1 3 4"
    if (/^\d+\s+\d+/.test(line) && !line.includes('Réponse') && !line.includes('Nombre')) {
      const questionNums = line.split(/\s+/).filter(p => /^\d+$/.test(p) && parseInt(p) > 0)
      
      if (i + 1 < lines.length) {
        const answerLine = lines[i + 1].trim()
        const answerNums = answerLine.split(/\s+/).filter(p => /^[1-5]$/.test(p))
        
        for (let j = 0; j < questionNums.length && j < answerNums.length; j++) {
          const questionNum = parseInt(questionNums[j], 10)
          const answerNum = parseInt(answerNums[j], 10)
          if (questionNum > 0 && answerNum >= 1 && answerNum <= 5) {
            answers[questionNum] = answerNum
          }
        }
        i++
      }
    }
    
    // Format alternatif : "numéro. Réponse numéro"
    const answerMatch = line.match(/^(\d+)\.\s*Réponse\s*(\d+)/i)
    if (answerMatch) {
      const questionNum = parseInt(answerMatch[1], 10)
      const answerNum = parseInt(answerMatch[2], 10)
      answers[questionNum] = answerNum
    }
  }
  
  return answers
}

// Fonction pour parser un fichier de test blanc IAE
function parseTestBlancFile(filePath: string): QuestionData[] {
  const content = fs.readFileSync(filePath, 'utf-8')
  const questions: QuestionData[] = []
  
  // Séparer le contenu en deux parties : questions et corrigés
  const sections = content.split(/^---/m)
  const questionsSection = sections[0] || content
  const corrigesSection = sections.slice(1).join('---')
  
  // Extraire les réponses
  const answers = extractAnswersFromTable(corrigesSection)
  console.log(`  📋 ${Object.keys(answers).length} réponses trouvées dans le corrigé`)
  
  // Parser les questions en utilisant les réponses comme référence
  const lines = questionsSection.split('\n')
  const questionMap: Map<number, { prompt: string; choices: Array<{ text: string; order: number }> }> = new Map()
  
  // Gérer le cas spécial de la première question
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()
    if (/voici le test.*?(\d+)\.\s*(.+)/i.test(line)) {
      const match = line.match(/voici le test.*?(\d+)\.\s*(.+)/i)
      if (match && answers[parseInt(match[1], 10)]) {
        const num = parseInt(match[1], 10)
        questionMap.set(num, { prompt: match[2].trim(), choices: [] })
      }
    }
  }
  
  let currentQuestionNum: number | null = null
  let collectingPrompt = false
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const trimmed = line.trim()
    
    // Ignorer les lignes vides, les titres, les séparateurs
    if (!trimmed || 
        trimmed.startsWith('#') || 
        trimmed === '---' || 
        /^Temps\s*:/i.test(trimmed) ||
        (/^\d+$/.test(trimmed) && trimmed.length <= 3)) {
      continue
    }
    
    // Détecter une ligne qui commence par un numéro suivi d'un point
    const numberedMatch = trimmed.match(/^(\d+)\.\s*(.+)$/)
    if (numberedMatch) {
      const num = parseInt(numberedMatch[1], 10)
      const text = numberedMatch[2].trim()
      
      // Si ce numéro existe dans les réponses, c'est potentiellement une question
      if (answers[num] !== undefined) {
        // C'est une question si :
        // 1. Le numéro est > 5 (pas un choix)
        // 2. OU le texte est long (> 30 caractères) ET on n'a pas de question en cours
        // 3. OU le texte est long ET on a déjà collecté au moins 3 choix (fin de la question précédente)
        // 4. OU le texte se termine par "?" (c'est probablement une question)
        const currentQuestion = currentQuestionNum !== null ? questionMap.get(currentQuestionNum) : undefined
        const isQuestion = 
          num > 5 || 
          (text.length > 30 && currentQuestionNum === null) ||
          (text.length > 30 && currentQuestion !== undefined && currentQuestion.choices.length >= 3) ||
          text.trim().endsWith('?')
        
        if (isQuestion) {
          // Sauvegarder la question précédente si elle existe
          if (currentQuestionNum !== null && questionMap.has(currentQuestionNum)) {
            const prevQ = questionMap.get(currentQuestionNum)!
            if (prevQ.choices.length < 2) {
              // Question incomplète, on la supprime
              questionMap.delete(currentQuestionNum)
            }
          }
          
          // Nouvelle question
          currentQuestionNum = num
          questionMap.set(num, { prompt: text, choices: [] })
          collectingPrompt = true
          continue
        }
      }
      
      // Sinon, c'est probablement un choix (numéro entre 1 et 5)
      if (num >= 1 && num <= 5 && currentQuestionNum !== null && text.length > 0) {
        const question = questionMap.get(currentQuestionNum)
        if (question && !question.choices.find(c => c.order === num)) {
          question.choices.push({ text, order: num })
          collectingPrompt = false
        }
        continue
      }
    }
    
    // Si on est dans une question et qu'on collecte le prompt
    if (currentQuestionNum !== null && collectingPrompt && trimmed.length > 0) {
      const question = questionMap.get(currentQuestionNum)
      if (question) {
        // Vérifier si ce n'est pas un choix qui commence
        if (!/^[1-5]\.\s+/.test(trimmed)) {
          question.prompt += ' ' + trimmed
        } else {
          // C'est un choix, on arrête de collecter le prompt
          collectingPrompt = false
          const choiceMatch = trimmed.match(/^([1-5])\.\s+(.+)$/)
          if (choiceMatch) {
            const order = parseInt(choiceMatch[1], 10)
            const text = choiceMatch[2].trim()
            if (!question.choices.find(c => c.order === order)) {
              question.choices.push({ text, order })
            }
          }
        }
      }
    } else if (currentQuestionNum !== null && !collectingPrompt && trimmed.length > 0) {
      // On a fini de collecter le prompt, vérifier si c'est un choix
      const question = questionMap.get(currentQuestionNum)
      if (question) {
        const choiceMatch = trimmed.match(/^([1-5])\.\s+(.+)$/)
        if (choiceMatch) {
          const order = parseInt(choiceMatch[1], 10)
          const text = choiceMatch[2].trim()
          if (!question.choices.find(c => c.order === order)) {
            question.choices.push({ text, order })
          }
        }
      }
    }
  }
  
  // Convertir la map en tableau de questions
  for (const [num, question] of questionMap.entries()) {
    if (question.choices.length >= 2) {
      const correctAnswer = answers[num]
      if (correctAnswer) {
        const formattedChoices = question.choices
          .sort((a, b) => a.order - b.order)
          .map((choice, index) => ({
            text: choice.text,
            isCorrect: choice.order === correctAnswer,
            order: index,
          }))
        
        questions.push({
          number: num,
          prompt: question.prompt.trim(),
          choices: formattedChoices,
        })
      }
    }
  }
  
  // Trier par numéro de question
  questions.sort((a, b) => a.number - b.number)
  
  return questions
}

async function main() {
  console.log('📚 Import des tests blancs IAE...\n')
  
  const testFiles = [
    '../Tests IAE Markdown.md',
    '../Tests IAE Markdown (1).md',
    '../Tests IAE Markdown (2).md',
    '../Tests IAE Markdown 3.md',
    '../Tests IAE Markdown 4.md',
    '../Test IAE 5.md',
  ]
  
  let allQuestions: QuestionData[] = []
  
  // Parser tous les fichiers
  for (const filePath of testFiles) {
    const fullPath = path.join(process.cwd(), filePath)
    if (!fs.existsSync(fullPath)) {
      console.log(`⚠️  Fichier non trouvé: ${filePath}`)
      continue
    }
    
    console.log(`📖 Lecture de ${path.basename(fullPath)}...`)
    try {
      const questions = parseTestBlancFile(fullPath)
      console.log(`  ✓ ${questions.length} questions extraites`)
      allQuestions = [...allQuestions, ...questions]
    } catch (error) {
      console.error(`  ❌ Erreur lors du parsing: ${error}`)
    }
  }
  
  console.log(`\n📊 Total: ${allQuestions.length} questions à importer\n`)
  
  // Créer ou récupérer le tag "Test Blanc"
  let testBlancTag = await prisma.tag.findUnique({ where: { name: 'Test Blanc' } })
  if (!testBlancTag) {
    testBlancTag = await prisma.tag.create({ data: { name: 'Test Blanc' } })
    console.log('✓ Tag "Test Blanc" créé')
  }
  
  let created = 0
  let skipped = 0
  let updated = 0
  
  // Importer les questions
  for (const questionData of allQuestions) {
    const { prompt, choices } = questionData
    
    if (!prompt || choices.length < 2) {
      skipped++
      continue
    }
    
    // Vérifier qu'il y a exactement une bonne réponse
    const correctCount = choices.filter(c => c.isCorrect).length
    if (correctCount !== 1) {
      skipped++
      continue
    }
    
    // Vérifier si la question existe déjà (par le prompt)
    const existing = await prisma.question.findFirst({
      where: {
        prompt: {
          equals: prompt.trim(),
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
      updated++
      continue
    }
    
    try {
      // Mélanger les choix pour éviter l'ordre fixe
      const shuffled = [...choices].sort(() => Math.random() - 0.5)
      
      const question = await prisma.question.create({
        data: {
          prompt: prompt.trim(),
          status: 'APPROVED',
          source: 'Test Blanc IAE',
          choices: {
            create: shuffled.map((choice, index) => ({
              text: choice.text,
              isCorrect: choice.isCorrect,
              order: index,
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
    } catch (error) {
      console.error(`Erreur lors de la création de la question "${prompt.substring(0, 50)}...":`, error)
      skipped++
    }
  }
  
  console.log(`\n✅ Import terminé:`)
  console.log(`   ${created} questions créées`)
  console.log(`   ${updated} questions déjà existantes`)
  console.log(`   ${skipped} questions ignorées`)
}

main()
  .catch((e) => {
    console.error('❌ Erreur lors de l\'import:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

