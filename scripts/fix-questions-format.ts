import { PrismaClient } from '@prisma/client'
import 'dotenv/config'

const prisma = new PrismaClient()

// Fonction pour transformer une question en phrase complète
function formatQuestion(question: string): string {
  let formatted = question.trim()

  // Si la question commence par "Définis / explique :", transformer en question
  if (formatted.startsWith('Définis / explique :')) {
    const content = formatted.replace('Définis / explique :', '').trim()
    // Si le contenu est une date
    if (/^\d{4}(-\d{2})?(-\d{2})?$/.test(content) || content.match(/\d{4}/)) {
      formatted = `Que s'est-il passé en ${content} ?`
    }
    // Si c'est un concept ou une institution
    else if (content.length < 50) {
      formatted = `Qu'est-ce que ${content} ?`
    }
    // Sinon, utiliser le contenu tel quel avec un point d'interrogation
    else {
      formatted = `${content} ?`
    }
  }

  // Si la question commence par "Que se passe-t-il à la date suivante :", transformer
  if (formatted.startsWith('Que se passe-t-il à la date suivante :')) {
    const date = formatted.replace('Que se passe-t-il à la date suivante :', '').trim()
    formatted = `Que s'est-il passé en ${date} ?`
  }

  // Si c'est juste un mot ou une phrase très courte sans ponctuation, transformer en question
  if (!formatted.includes('?') && !formatted.includes(':')) {
    // Si c'est un nombre ou une date seule
    if (/^\d{4}(-\d{2})?(-\d{2})?$/.test(formatted)) {
      formatted = `Que s'est-il passé en ${formatted} ?`
    }
    // Si c'est un nom propre ou concept court
    else if (formatted.length < 30 && !formatted.includes(' ')) {
      formatted = `Qu'est-ce que ${formatted} ?`
    }
    // Si c'est une phrase courte sans ponctuation
    else if (formatted.length < 50 && !formatted.endsWith('.')) {
      formatted = `${formatted} ?`
    }
  }

  // S'assurer que la question se termine par un point d'interrogation
  if (!formatted.endsWith('?') && !formatted.endsWith('.')) {
    formatted += ' ?'
  }

  return formatted
}

// Fonction pour transformer une réponse en phrase complète
// DÉSACTIVÉE : Les réponses doivent rester exactement comme dans les fichiers sources
function formatAnswer(answer: string, question?: string): string {
  // Retourner le texte exact tel qu'il est dans le fichier source, sans modification
  return answer.trim()
}

async function main() {
  console.log('🔧 Début de la correction du format des questions et réponses...')

  const questions = await prisma.question.findMany({
    include: {
      choices: true,
    },
  })

  let updated = 0
  let skipped = 0

  for (const question of questions) {
    const originalPrompt = question.prompt
    const formattedPrompt = formatQuestion(originalPrompt)

    // Vérifier si on doit mettre à jour la question (seulement le prompt, pas les réponses)
    const needsUpdate = formattedPrompt !== originalPrompt

    if (!needsUpdate) {
      skipped++
      continue
    }

    try {
      // Mettre à jour la question
      await prisma.question.update({
        where: { id: question.id },
        data: {
          prompt: formattedPrompt,
        },
      })

      // NE PAS modifier les choix - ils doivent rester exactement comme dans les fichiers sources

      updated++
    } catch (error) {
      console.error(`Erreur lors de la mise à jour de la question "${originalPrompt}":`, error)
      skipped++
    }
  }

  console.log(`✅ Correction terminée: ${updated} questions mises à jour, ${skipped} ignorées`)
}

main()
  .catch((e) => {
    console.error('❌ Erreur lors de la correction:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

