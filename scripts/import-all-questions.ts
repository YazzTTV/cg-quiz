import { PrismaClient } from '@prisma/client'
import * as fs from 'fs'
import * as path from 'path'
import 'dotenv/config'

const prisma = new PrismaClient()

// Fonction pour parser le fichier Markdown
function parseMarkdownQuestions(filePath: string): Array<{
  prompt: string
  choices: Array<{ text: string; isCorrect: boolean }>
}> {
  const content = fs.readFileSync(filePath, 'utf-8')
  const questions: Array<{
    prompt: string
    choices: Array<{ text: string; isCorrect: boolean }>
  }> = []

  // Diviser par les questions (### Numéro. ou ## Numéro.)
  // Le nouveau format utilise ### pour les questions individuelles
  const questionBlocks = content.split(/###\s*\d+\.\s*/).slice(1) // Ignorer la première partie (titre)

  for (const block of questionBlocks) {
    const lines = block.split('\n').map(l => l.trim()).filter(l => l.length > 0)
    
    let prompt = ''
    const choices: Array<{ text: string; isCorrect: boolean; letter: string }> = []
    let correctAnswer = ''

    for (const line of lines) {
      // Détecter les choix (format: - **A.** texte)
      const choiceMatch = line.match(/^-\s*\*\*([A-D])\.\*\*\s*(.+)$/)
      if (choiceMatch) {
        const letter = choiceMatch[1]
        const text = choiceMatch[2].trim()
        choices.push({ text, isCorrect: false, letter })
      }
      // Détecter la bonne réponse (format: **Réponse : A**)
      else if (line.match(/\*\*Réponse\s*:\s*([A-D])\*\*/i)) {
        const answerMatch = line.match(/\*\*Réponse\s*:\s*([A-D])\*\*/i)
        if (answerMatch) {
          correctAnswer = answerMatch[1].toUpperCase()
        }
      }
      // La question est la première ligne qui n'est ni un choix ni la réponse
      else if (!prompt && !line.startsWith('-') && !line.includes('Réponse') && !line.startsWith('#') && !line.startsWith('---')) {
        prompt = line
      }
    }

    // Marquer la bonne réponse
    if (correctAnswer && choices.length > 0) {
      const correctChoice = choices.find(c => c.letter === correctAnswer)
      if (correctChoice) {
        correctChoice.isCorrect = true
      }

      // Nettoyer les réponses (enlever les troncatures)
      const cleanedChoices = choices.map(c => ({
        text: c.text.replace(/\.\.\.$/, '').replace(/-$/, '').replace(/,$/, '').trim(),
        isCorrect: c.isCorrect,
      })).filter(c => c.text.length > 0)

      // S'assurer qu'on a au moins 2 choix et une question valide
      if (cleanedChoices.length >= 2 && prompt && prompt.length > 5) {
        // Si on a moins de 4 choix, compléter avec des distractors
        while (cleanedChoices.length < 4) {
          cleanedChoices.push({
            text: `Option ${cleanedChoices.length + 1}`,
            isCorrect: false,
          })
        }

        questions.push({
          prompt: prompt.trim(),
          choices: cleanedChoices.slice(0, 4), // Limiter à 4 choix
        })
      }
    }
  }

  return questions
}

// Fonction pour parser le fichier HTML
function parseHTMLQuestions(filePath: string): Array<{
  prompt: string
  choices: Array<{ text: string; isCorrect: boolean }>
  explanation?: string
  category?: string
}> {
  const content = fs.readFileSync(filePath, 'utf-8')
  const questions: Array<{
    prompt: string
    choices: Array<{ text: string; isCorrect: boolean }>
    explanation?: string
    category?: string
  }> = []

  // Extraire le bloc JavaScript contenant les questions
  const scriptMatch = content.match(/<script>([\s\S]*?)<\/script>/)
  if (!scriptMatch) {
    console.log('  ⚠️  Aucun script trouvé dans le HTML')
    return questions
  }

  const scriptContent = scriptMatch[1]
  
  // Extraire l'objet db - chercher entre "const db = {" et "};"
  const dbStart = scriptContent.indexOf('const db = {')
  if (dbStart === -1) {
    console.log('  ⚠️  "const db" non trouvé')
    return questions
  }
  
  // Trouver la fin de l'objet db (chercher le "};" qui ferme l'objet)
  let braceCount = 0
  let dbEnd = dbStart + 11 // Après "const db = {"
  let foundStart = false
  
  for (let i = dbStart; i < scriptContent.length; i++) {
    if (scriptContent[i] === '{') {
      braceCount++
      foundStart = true
    } else if (scriptContent[i] === '}') {
      braceCount--
      if (foundStart && braceCount === 0) {
        // Vérifier si c'est suivi de ";"
        if (i + 1 < scriptContent.length && scriptContent[i + 1] === ';') {
          dbEnd = i + 2
          break
        }
      }
    }
  }
  
  const dbContent = scriptContent.substring(dbStart + 11, dbEnd - 1)

  // Extraire manuellement chaque catégorie
  const categories = [
    { name: 'actu', display: 'Actualités' },
    { name: 'eco', display: 'Économie' },
    { name: 'arts', display: 'Arts & Littérature' },
    { name: 'hist', display: 'Histoire & Géographie' },
  ]

  for (const { name, display } of categories) {
    // Trouver le tableau de la catégorie - chercher le début et la fin
    const categoryStartPattern = new RegExp(`${name}:\\s*\\[`)
    const categoryStart = dbContent.search(categoryStartPattern)
    
    if (categoryStart === -1) {
      console.log(`  ⚠️  Catégorie ${name} non trouvée`)
      continue
    }
    
    // Trouver la fin du tableau (chercher le "]" correspondant)
    let bracketCount = 0
    let categoryEnd = categoryStart
    let foundStart = false
    
    for (let i = categoryStart; i < dbContent.length; i++) {
      if (dbContent[i] === '[') {
        bracketCount++
        foundStart = true
      } else if (dbContent[i] === ']') {
        bracketCount--
        if (foundStart && bracketCount === 0) {
          categoryEnd = i + 1
          break
        }
      }
    }
    
    const categoryContent = dbContent.substring(categoryStart, categoryEnd)
    
    // Parser chaque question - trouver tous les objets { q: ..., o: ..., c: ..., r: ... }
    const questionRegex = /\{\s*q:\s*"([^"]*(?:\\.[^"]*)*)",\s*o:\s*\[([^\]]+)\],\s*c:\s*"([^"]*(?:\\.[^"]*)*)",\s*r:\s*"([^"]*(?:\\.[^"]*)*)"\s*\}/g
    let questionMatch
    
    while ((questionMatch = questionRegex.exec(categoryContent)) !== null) {
      const prompt = questionMatch[1].replace(/\\"/g, '"').replace(/\\'/g, "'")
      const optionsStr = questionMatch[2]
      const correctAnswer = questionMatch[3].replace(/\\"/g, '"').replace(/\\'/g, "'")
      const explanation = questionMatch[4].replace(/\\"/g, '"').replace(/\\'/g, "'")
      
      // Parser les options du tableau
      const options: string[] = []
      const optionRegex = /"([^"]*(?:\\.[^"]*)*)"/g
      let optMatch
      while ((optMatch = optionRegex.exec(optionsStr)) !== null) {
        options.push(optMatch[1].replace(/\\"/g, '"').replace(/\\'/g, "'"))
      }

      if (options.length >= 4 && prompt) {
        const choices = options.map(opt => ({
          text: opt,
          isCorrect: opt === correctAnswer,
        }))

        questions.push({
          prompt,
          choices,
          explanation,
          category: display,
        })
      }
    }
  }

  return questions
}

// Fonction pour formater les réponses en phrases complètes
// DÉSACTIVÉE : Les réponses doivent rester exactement comme dans les fichiers sources
function formatAnswer(text: string, question?: string): string {
  // Retourner le texte exact tel qu'il est dans le fichier source, sans modification
  return text.trim()
}

async function main() {
  console.log('🗑️  Suppression de toutes les questions existantes...')

  // Supprimer toutes les questions (cascade supprimera les choix et tags)
  const deleted = await prisma.question.deleteMany({})
  console.log(`  ✓ ${deleted.count} questions supprimées`)

  console.log('\n📖 Lecture du fichier Markdown...')
  const mdPath = path.join(process.cwd(), '..', 'Analyse pages 7-43.md')
  const mdQuestions = parseMarkdownQuestions(mdPath)
  console.log(`  ✓ ${mdQuestions.length} questions extraites du Markdown`)

  console.log('\n📖 Lecture du fichier HTML...')
  const htmlPath = path.join(process.cwd(), '..', 'flashcard_iae.html')
  const htmlQuestions = parseHTMLQuestions(htmlPath)
  console.log(`  ✓ ${htmlQuestions.length} questions extraites du HTML`)

  const allQuestions = [...mdQuestions, ...htmlQuestions]
  console.log(`\n📊 Total: ${allQuestions.length} questions à importer`)

  let created = 0
  let skipped = 0

  for (const questionData of allQuestions) {
    const { prompt, choices, explanation, category } = questionData as {
      prompt: string
      choices: Array<{ text: string; isCorrect: boolean }>
      explanation?: string
      category?: string
    }

    if (!prompt || choices.length < 2) {
      skipped++
      continue
    }

    // Formater les réponses
    const formattedChoices = choices.map(c => ({
      text: formatAnswer(c.text, prompt),
      isCorrect: c.isCorrect,
    }))

    // Vérifier qu'il y a exactement une bonne réponse
    const correctCount = formattedChoices.filter(c => c.isCorrect).length
    if (correctCount !== 1) {
      skipped++
      continue
    }

    // Mélanger les choix
    const shuffled = [...formattedChoices].sort(() => Math.random() - 0.5)

    try {
      // Créer ou récupérer le tag si catégorie fournie
      let tagId: string | undefined
      if (category) {
        let tag = await prisma.tag.findUnique({ where: { name: category } })
        if (!tag) {
          tag = await prisma.tag.create({ data: { name: category } })
        }
        tagId = tag.id
      }

      const question = await prisma.question.create({
        data: {
          prompt: prompt.trim(),
          explanation: explanation || null,
          status: 'APPROVED',
          source: category ? 'IAE Ultimate Trainer 2026 (HTML)' : 'QCM Culture Générale pages 7-43',
          choices: {
            create: shuffled.map((choice, index) => ({
              text: choice.text,
              isCorrect: choice.isCorrect,
              order: index,
            })),
          },
          ...(tagId && {
            tags: {
              create: {
                tagId,
              },
            },
          }),
        },
      })

      created++
    } catch (error) {
      console.error(`Erreur lors de la création de la question "${prompt}":`, error)
      skipped++
    }
  }

  console.log(`\n✅ Import terminé: ${created} questions créées, ${skipped} ignorées`)
}

main()
  .catch((e) => {
    console.error('❌ Erreur lors de l\'import:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

