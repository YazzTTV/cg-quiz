import { PrismaClient } from '@prisma/client'
import * as fs from 'fs'
import * as path from 'path'
import { parse } from 'csv-parse/sync'
import 'dotenv/config'

const prisma = new PrismaClient()

// Fonction pour générer des distractors (mauvaises réponses)
function generateDistractors(correctAnswer: string, questionText?: string): string[] {
  const distractors: string[] = []
  const answer = correctAnswer.trim()
  const questionLower = questionText?.toLowerCase() || ''

  // Si c'est une date (format YYYY ou YYYY-MM-DD)
  const yearMatch = answer.match(/\b(1[0-9]{3}|20[0-2][0-9])\b/)
  if (yearMatch) {
    const year = parseInt(yearMatch[1])
    const variations = [-5, -3, 3, 5, -10, 10, -20, 20, -15, 15]
    for (const variation of variations) {
      const newYear = year + variation
      if (newYear > 0 && newYear < 2100) {
        const distractor = answer.replace(yearMatch[1], String(newYear))
        if (distractor !== answer && !distractors.includes(distractor) && distractor.length > 0) {
          distractors.push(distractor)
        }
      }
    }
  }

  // Si c'est un nombre
  const numberMatch = answer.match(/\b(\d{2,4})\b/)
  if (numberMatch && !yearMatch) {
    const num = parseInt(numberMatch[1])
    const variations = [-30, -20, 20, 30, -50, 50, -10, 10, -15, 15]
    for (const variation of variations) {
      const newNum = num + variation
      if (newNum > 0) {
        const distractor = answer.replace(numberMatch[1], String(newNum))
        if (distractor !== answer && !distractors.includes(distractor) && distractor.length > 0) {
          distractors.push(distractor)
        }
      }
    }
  }

  // Questions "Qui" - personnes/fonctions
  if (questionLower.includes('qui') || questionLower.includes('préside') || questionLower.includes('dirige')) {
    const fonctions = [
      'Le Président de la République',
      'Le Premier ministre',
      'Le ministre de l\'Intérieur',
      'Le ministre de la Justice',
      'Le ministre des Finances',
      'Le secrétaire général du gouvernement',
      'Le président de l\'Assemblée nationale',
      'Le président du Sénat',
      'Le maire',
      'Le préfet',
      'Le ministre des Affaires étrangères',
    ]
    for (const fonction of fonctions) {
      if (!answer.toLowerCase().includes(fonction.toLowerCase()) && 
          !answer.toLowerCase().includes('premier ministre') && 
          fonction !== answer && 
          !distractors.includes(fonction)) {
        distractors.push(fonction)
      }
    }
  }

  // Questions sur les institutions/organisations
  const institutions = [
    'Assemblée nationale',
    'Sénat',
    'Conseil constitutionnel',
    'Conseil d\'État',
    'Cour de cassation',
    'Conseil économique et social',
    'Conseil supérieur de la magistrature',
    'Parlement européen',
    'Commission européenne',
    'Conseil européen',
    'Cour de Justice',
    'Conseil des ministres',
    'Gouvernement',
  ]
  if (institutions.some((inst) => answer.toLowerCase().includes(inst.toLowerCase())) || 
      questionLower.includes('institution') || 
      questionLower.includes('conseil') ||
      questionLower.includes('parlement')) {
    for (const inst of institutions) {
      if (!answer.toLowerCase().includes(inst.toLowerCase()) && !distractors.includes(inst)) {
        distractors.push(inst)
      }
    }
  }

  // Questions sur les dates/événements historiques
  if (questionLower.includes('année') || questionLower.includes('date') || questionLower.includes('quand') || questionLower.includes('événement')) {
    const historicalEvents = [
      'Révolution française (1789)',
      'Première Guerre mondiale (1914-1918)',
      'Seconde Guerre mondiale (1939-1945)',
      'Renaissance',
      'Révolution industrielle',
      'Guerre de Cent Ans',
      'Révolution de 1848',
      'Commune de Paris (1871)',
    ]
    for (const event of historicalEvents) {
      if (!answer.toLowerCase().includes(event.toLowerCase()) && !distractors.includes(event)) {
        distractors.push(event)
      }
    }
  }

  // Questions sur les pouvoirs
  if (questionLower.includes('pouvoir')) {
    const powers = ['Exécutif', 'Législatif', 'Judiciaire', 'Constitutionnel', 'Réglementaire']
    for (const power of powers) {
      if (!answer.toLowerCase().includes(power.toLowerCase()) && !distractors.includes(power)) {
        distractors.push(power)
      }
    }
  }

  // Questions sur les lieux/endroits
  if (questionLower.includes('où') || questionLower.includes('lieu') || questionLower.includes('ville') || questionLower.includes('capitale')) {
    const lieux = [
      'Paris',
      'Lyon',
      'Marseille',
      'Bruxelles',
      'Strasbourg',
      'Luxembourg',
      'La Haye',
    ]
    for (const lieu of lieux) {
      if (!answer.toLowerCase().includes(lieu.toLowerCase()) && !distractors.includes(lieu)) {
        distractors.push(lieu)
      }
    }
  }

  // Questions sur les nombres/quantités
  if (questionLower.includes('combien') || questionLower.includes('nombre') || questionLower.includes('quantité')) {
    // Les variations numériques ont déjà été traitées plus haut
  }

  // Si on n'a toujours pas assez de distractors, créer des variations de la réponse
  if (distractors.length < 3) {
    // Essayer de créer des variations basées sur la réponse elle-même
    const answerWords = answer.split(/\s+/)
    if (answerWords.length > 1) {
      // Inverser l'ordre des mots
      const reversed = answerWords.reverse().join(' ')
      if (reversed !== answer && !distractors.includes(reversed)) {
        distractors.push(reversed)
      }
    }
  }

  // Distractors génériques en dernier recours (mais seulement si vraiment nécessaire)
  const genericDistractors = [
    'Réponse variable selon le contexte',
    'Non spécifié dans les textes',
    'Dépend de la situation',
  ]

  // Éviter les distractors trop génériques comme "Information non disponible" ou "Aucune de ces réponses"
  // sauf si on n'a vraiment rien d'autre
  while (distractors.length < 3) {
    // Essayer de créer des distractors plus spécifiques
    if (answer.length > 20) {
      // Pour les longues réponses, créer des variations partielles
      const partial = answer.substring(0, Math.min(30, answer.length - 5)) + '...'
      if (!distractors.includes(partial) && partial !== answer) {
        distractors.push(partial)
      }
    }
    
    // En dernier recours seulement, utiliser des génériques
    if (distractors.length < 3) {
      const generic = genericDistractors[distractors.length % genericDistractors.length]
      if (!distractors.includes(generic) && generic !== answer) {
        distractors.push(generic)
      } else {
        // Créer un distractor basé sur le contexte
        const num = distractors.length + 1
        distractors.push(`Option ${num}`)
      }
    }
  }

  return distractors.slice(0, 3)
}

// Fonction pour mélanger un tableau
function shuffle<T>(array: T[]): T[] {
  const shuffled = [...array]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

async function main() {
  console.log('🌱 Début du seed...')

  // Lire les fichiers CSV
  const csvPath1 = path.join(process.cwd(), 'data', 'cg.csv')
  const csvPath2 = path.join(process.cwd(), 'score_iae_message_pages_7_43_clean_max_semicolon.csv')
  
  let allRecords: any[] = []

  // Lire le premier CSV (virgules)
  if (fs.existsSync(csvPath1)) {
    console.log(`📖 Lecture de ${csvPath1}...`)
    const csvContent1 = fs.readFileSync(csvPath1, 'utf-8')
    const records1 = parse(csvContent1, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
      delimiter: ',',
    })
    allRecords = [...allRecords, ...records1]
    console.log(`  ✓ ${records1.length} questions trouvées`)
  }

  // Lire le deuxième CSV (points-virgules)
  if (fs.existsSync(csvPath2)) {
    console.log(`📖 Lecture de ${csvPath2}...`)
    const csvContent2 = fs.readFileSync(csvPath2, 'utf-8')
    const records2 = parse(csvContent2, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
      delimiter: ';',
    })
    allRecords = [...allRecords, ...records2]
    console.log(`  ✓ ${records2.length} questions trouvées`)
  }

  if (allRecords.length === 0) {
    console.error('❌ Aucun fichier CSV trouvé')
    return
  }

  const records = allRecords

  console.log(`📊 ${records.length} questions trouvées dans le CSV`)

  let created = 0
  let skipped = 0

  for (const record of records) {
    const front = record.front?.trim()
    const back = record.back?.trim()

    if (!front || !back) {
      skipped++
      continue
    }

    // Vérifier si la question existe déjà
    const existing = await prisma.question.findFirst({
      where: { prompt: front },
    })

    if (existing) {
      skipped++
      continue
    }

    // Générer les distractors
    const distractors = generateDistractors(back, front)
    
    // Créer les 4 choix (1 correct + 3 distractors)
    const allChoices = [
      { text: back, isCorrect: true },
      ...distractors.map((text) => ({ text, isCorrect: false })),
    ]

    // Mélanger les choix
    const shuffledChoices = shuffle(allChoices)

    // Créer la question
    try {
      await prisma.question.create({
        data: {
          prompt: front,
          explanation: back, // Utiliser back comme explication
          status: 'APPROVED',
          source: 'PDF CG pages 7–43',
          choices: {
            create: shuffledChoices.map((choice, index) => ({
              text: choice.text,
              isCorrect: choice.isCorrect,
              order: index,
            })),
          },
        },
      })
      created++
    } catch (error) {
      console.error(`Erreur lors de la création de la question "${front}":`, error)
      skipped++
    }
  }

  console.log(`✅ Seed terminé: ${created} questions créées, ${skipped} ignorées`)
}

main()
  .catch((e) => {
    console.error('❌ Erreur lors du seed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

