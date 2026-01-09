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
function formatAnswer(answer: string, question?: string): string {
  let formatted = answer.trim()

  // Nettoyer les doublons (ex: "Le taux est de Le taux est de 2%")
  if (formatted.includes('Le taux est de Le taux est de')) {
    formatted = formatted.replace('Le taux est de Le taux est de', 'Le taux est de')
  }
  if (formatted.includes('C\'est C\'est')) {
    formatted = formatted.replace('C\'est C\'est', 'C\'est')
  }

  // Nettoyer les réponses qui commencent par "C'est En" -> "C'était en"
  if (formatted.startsWith("C'est En ")) {
    formatted = formatted.replace("C'est En ", "C'était en ")
  }

  // Nettoyer les réponses qui commencent par "C'est" suivi d'une majuscule incorrecte
  if (formatted.startsWith("C'est ") && !formatted.includes('.')) {
    const withoutCest = formatted.replace("C'est ", "")
    // Si le mot suivant commence par une majuscule mais n'est pas un nom propre ou article
    if (withoutCest.charAt(0) === withoutCest.charAt(0).toUpperCase() && 
        withoutCest.includes(' ') && 
        !['Le', 'La', 'Les', 'Un', 'Une', 'Des'].includes(withoutCest.split(' ')[0])) {
      // Mettre en minuscule le premier mot après "C'est"
      const firstWord = withoutCest.split(' ')[0]
      const rest = withoutCest.slice(firstWord.length)
      formatted = `C'est ${firstWord.charAt(0).toLowerCase() + firstWord.slice(1)}${rest}`
    }
    // Si c'est un nom propre ou une institution, reformater correctement
    else if (withoutCest === withoutCest.charAt(0).toUpperCase() + withoutCest.slice(1) && 
             !withoutCest.includes(' ')) {
      formatted = withoutCest
    }
  }

  // Si la réponse est très courte (moins de 15 caractères) ou ne contient pas de verbe, la transformer en phrase
  const hasVerb = /\b(est|sont|fait|font|a|ont|était|étaient|sera|seront|peut|peuvent|doit|doivent|n'a|n'ont|signifie|désigne|correspond)\b/i.test(formatted)
  const isCompleteSentence = formatted.includes('.') || formatted.includes(',') || hasVerb || formatted.length > 40

  if (!isCompleteSentence || formatted.length < 20) {
    // Si c'est un nombre seul
    if (/^\d+$/.test(formatted)) {
      if (question?.includes('année') || question?.includes('date') || question?.includes('année')) {
        formatted = `C'était en ${formatted}`
      } else if (question?.includes('taux') || question?.includes('pourcentage') || question?.includes('inflation')) {
        formatted = `Le taux est de ${formatted}%`
      } else {
        formatted = `La réponse est ${formatted}`
      }
    }
    // Si c'est un pourcentage
    else if (formatted.endsWith('%')) {
      formatted = `Le taux est de ${formatted}`
    }
    // Si c'est juste "Aucun" ou "Aucune"
    else if (formatted.toLowerCase() === 'aucun' || formatted.toLowerCase() === 'aucune') {
      if (question?.includes('pays') || question?.includes('zone euro')) {
        formatted = 'Aucun pays n\'a rejoint la zone euro en 2025'
      } else {
        formatted = 'Aucune de ces réponses n\'est correcte'
      }
    }
    // Si c'est un nom d'institution
    else {
      const institutions: Record<string, string> = {
        'Sénat': 'C\'est le Sénat',
        'Le Sénat': 'C\'est le Sénat',
        'Assemblée nationale': 'C\'est l\'Assemblée nationale',
        'L\'Assemblée nationale': 'C\'est l\'Assemblée nationale',
        'Conseil constitutionnel': 'C\'est le Conseil constitutionnel',
        'Le Conseil constitutionnel': 'C\'est le Conseil constitutionnel',
        'Conseil d\'État': 'C\'est le Conseil d\'État',
        'Le Conseil d\'État': 'C\'est le Conseil d\'État',
        'Premier ministre': 'C\'est le Premier ministre',
        'Le Premier ministre': 'C\'est le Premier ministre',
        'Président': 'C\'est le Président de la République',
      }
      
      if (institutions[formatted]) {
        formatted = institutions[formatted]
      }
      // Si c'est un nom propre (personne, lieu, entreprise)
      else if (formatted === formatted.charAt(0).toUpperCase() + formatted.slice(1).toLowerCase() && 
               !formatted.includes(' ') && formatted.length > 3) {
        // Vérifier le contexte de la question
        if (question?.includes('Qui') || question?.includes('qui')) {
          formatted = `C'est ${formatted}`
        } else if (question?.includes('Où') || question?.includes('où') || question?.includes('capitale')) {
          formatted = `C'est ${formatted}`
        } else if (question?.includes('Quel') || question?.includes('quelle') || question?.includes('quel')) {
          formatted = `C'est ${formatted}`
        } else {
          formatted = `La réponse est ${formatted}`
        }
      }
      // Si c'est une phrase courte sans verbe (acronymes, définitions, noms propres)
      else if (formatted.length < 30 && !hasVerb) {
        // Si c'est un acronyme ou une définition
        if (question?.includes('acronyme') || question?.includes('signifie') || question?.includes('désigne')) {
          formatted = `C'est ${formatted}`
        }
        // Si c'est un nom propre (personne, lieu, entreprise)
        else if (formatted === formatted.charAt(0).toUpperCase() + formatted.slice(1).toLowerCase() && 
                 !formatted.includes(' ') && formatted.length > 3) {
          formatted = `C'est ${formatted}`
        }
        // Si c'est une phrase courte sans verbe qui se termine par une virgule ou un tiret
        else if (formatted.endsWith(',') || formatted.endsWith('-')) {
          // La réponse est probablement tronquée, on la complète
          if (formatted.endsWith(',')) {
            formatted = formatted.slice(0, -1) + '.'
          } else {
            formatted = formatted.slice(0, -1) + '.'
          }
        }
        // Si c'est une phrase courte sans verbe
        else if (!hasVerb) {
          formatted = `C'est ${formatted}`
        }
      }
    }
  }

  // S'assurer que la réponse commence par une majuscule
  if (formatted.length > 0) {
    formatted = formatted.charAt(0).toUpperCase() + formatted.slice(1)
  }

  return formatted
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

    // Vérifier si on doit mettre à jour la question
    const needsUpdate = formattedPrompt !== originalPrompt || 
      question.choices.some(c => {
        const formattedChoice = formatAnswer(c.text, formattedPrompt)
        return formattedChoice !== c.text && formattedChoice.length > c.text.length
      })

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

      // Mettre à jour les choix
      for (const choice of question.choices) {
        const formattedChoice = formatAnswer(choice.text, formattedPrompt)
        
        // Mettre à jour si la réponse est trop courte ou si on peut l'améliorer
        if (formattedChoice !== choice.text) {
          await prisma.choice.update({
            where: { id: choice.id },
            data: {
              text: formattedChoice,
            },
          })
        }
      }

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

