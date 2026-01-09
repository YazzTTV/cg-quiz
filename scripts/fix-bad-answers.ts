import { PrismaClient } from '@prisma/client'
import 'dotenv/config'

const prisma = new PrismaClient()

// Fonction pour détecter si une réponse est tronquée ou mal formée
function isBadAnswer(text: string): boolean {
  const trimmed = text.trim()
  
  // Réponses tronquées
  if (trimmed.endsWith('...') || trimmed.endsWith('...') || trimmed.endsWith('-') || trimmed.endsWith(',')) {
    return true
  }
  
  // Réponses avec des mots mélangés (détection améliorée)
  const words = trimmed.split(/\s+/)
  if (words.length > 4) {
    // Détecter les mots avec majuscules au milieu d'une phrase (sauf articles)
    let capsInMiddle = 0
    for (let i = 1; i < words.length; i++) {
      const word = words[i]
      const prevWord = words[i - 1]
      if (word.length > 0 && word[0] === word[0].toUpperCase()) {
        const isCommonWord = ['Le', 'La', 'Les', 'Un', 'Une', 'Des', 'C\'est', 'Il', 'Elle', 'Ils', 'Elles', 'Il', 'Elle'].includes(word)
        // Si le mot précédent était en minuscule et ce n'est pas un mot commun
        if (prevWord && prevWord[0] === prevWord[0].toLowerCase() && !isCommonWord) {
          capsInMiddle++
          if (capsInMiddle > 2) {
            return true // Probablement des mots mélangés
          }
        }
      } else {
        capsInMiddle = 0
      }
    }
    
    // Détecter les phrases avec des mots dans un ordre grammaticalement incorrect
    // Ex: "Des hiérarchie une a y Il variable"
    const hasIncorrectOrder = /^[A-Z][a-z]+ [a-z]+ [a-z]+ [A-Z][a-z]+ [a-z]+ [A-Z][a-z]+/.test(trimmed)
    if (hasIncorrectOrder) {
      return true
    }
  }
  
  // Réponses mal formatées comme "C'est Dépend" (devrait être "Cela dépend")
  // Mais on accepte "C'est [Nom propre]" comme "C'est Paris", "C'est Suède"
  if (trimmed.includes("C'est ") && trimmed.split("C'est ").length > 1) {
    const afterCest = trimmed.split("C'est ")[1]
    if (afterCest && afterCest[0] === afterCest[0].toUpperCase()) {
      const firstWord = afterCest.split(' ')[0]
      // Accepter les noms propres (un seul mot en majuscule) comme "Paris", "Suède", "NVIDIA"
      const isProperNoun = firstWord.length > 2 && firstWord === firstWord.charAt(0) + firstWord.slice(1).toLowerCase() && !afterCest.includes(' ')
      // Accepter les articles
      const isArticle = ['Le', 'La', 'Les', 'Un', 'Une', 'Des'].includes(firstWord)
      // Rejeter seulement si c'est un verbe ou un adjectif mal formaté
      const isVerbOrAdj = ['Dépend', 'Varie', 'Nécessite', 'Détermine'].includes(firstWord)
      if (!isProperNoun && !isArticle && isVerbOrAdj) {
        return true
      }
    }
  }
  
  // Réponses trop courtes (moins de 10 caractères)
  if (trimmed.length < 10) {
    return true
  }
  
  // Réponses qui se terminent par une virgule sans phrase complète
  if (trimmed.endsWith(',') && trimmed.length < 30) {
    return true
  }
  
  return false
}

// Fonction pour générer un meilleur distractor
function generateBetterDistractor(correctAnswer: string, question: string, existingChoices: string[]): string {
  const answer = correctAnswer.trim()
  
  // Si la question est sur une institution ou un concept
  if (question.includes('Composition') || question.includes('composition')) {
    return 'La composition varie selon le contexte et les besoins spécifiques'
  }
  
  if (question.includes('Attributions') || question.includes('attributions')) {
    return 'Les attributions sont définies par la loi et peuvent évoluer'
  }
  
  if (question.includes('Fin des fonctions') || question.includes('fin des fonctions')) {
    return 'La fin des fonctions intervient selon les règles établies'
  }
  
  // Distractors génériques mais cohérents
  const genericDistractors = [
    'Cette information nécessite un contexte plus précis pour être complète',
    'La réponse dépend des circonstances et du contexte spécifique',
    'Il existe plusieurs variantes possibles selon les situations',
    'Cette notion peut varier selon différents facteurs',
  ]
  
  // Choisir un distractor qui n'est pas déjà utilisé
  for (const distractor of genericDistractors) {
    if (!existingChoices.includes(distractor) && distractor !== answer) {
      return distractor
    }
  }
  
  return 'La réponse nécessite plus de précisions'
}

async function main() {
  console.log('🔧 Début de la correction des mauvaises réponses...')

  const questions = await prisma.question.findMany({
    include: {
      choices: true,
    },
  })

  let fixed = 0
  let deleted = 0
  let skipped = 0

  for (const question of questions) {
    let hasBadAnswers = false
    const badChoices: typeof question.choices = []

    // Identifier les mauvaises réponses
    for (const choice of question.choices) {
      if (isBadAnswer(choice.text)) {
        hasBadAnswers = true
        badChoices.push(choice)
      }
    }

    if (!hasBadAnswers) {
      skipped++
      continue
    }

    try {
      // Si toutes les réponses sont mauvaises ou si la bonne réponse est mauvaise, supprimer la question
      const badCorrect = question.choices.find(c => c.isCorrect && isBadAnswer(c.text))
      if (badCorrect) {
        console.log(`❌ Suppression de la question "${question.prompt}" (bonne réponse invalide)`)
        await prisma.choice.deleteMany({ where: { questionId: question.id } })
        await prisma.question.delete({ where: { id: question.id } })
        deleted++
        continue
      }

      // Remplacer les mauvaises réponses par de meilleures
      for (const badChoice of badChoices) {
        if (!badChoice.isCorrect) {
          const existingTexts = question.choices.map(c => c.text)
          const betterDistractor = generateBetterDistractor(
            question.choices.find(c => c.isCorrect)?.text || '',
            question.prompt,
            existingTexts
          )

          await prisma.choice.update({
            where: { id: badChoice.id },
            data: {
              text: betterDistractor,
            },
          })
        }
      }

      fixed++
    } catch (error) {
      console.error(`Erreur lors de la correction de la question "${question.prompt}":`, error)
      skipped++
    }
  }

  console.log(`✅ Correction terminée: ${fixed} questions corrigées, ${deleted} questions supprimées, ${skipped} ignorées`)
}

main()
  .catch((e) => {
    console.error('❌ Erreur lors de la correction:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

