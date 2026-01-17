import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const dailyChallenges = [
  {
    dayNumber: 1,
    prompt: "Si 3 pommes coûtent 2 euros, combien coûtent 12 pommes ?",
    explanation: "Si 3 pommes coûtent 2 euros, alors 1 pomme coûte 2/3 euros. Donc 12 pommes coûtent 12 × (2/3) = 8 euros.",
    choices: [
      { text: "8 euros", isCorrect: true, order: 1 },
      { text: "10 euros", isCorrect: false, order: 2 },
      { text: "12 euros", isCorrect: false, order: 3 },
      { text: "6 euros", isCorrect: false, order: 4 },
    ],
  },
  {
    dayNumber: 2,
    prompt: "Dans une classe de 30 élèves, 60% sont des filles. Combien y a-t-il de garçons ?",
    explanation: "Si 60% sont des filles, alors 40% sont des garçons. 40% de 30 = 0,4 × 30 = 12 garçons.",
    choices: [
      { text: "18 garçons", isCorrect: false, order: 1 },
      { text: "10 garçons", isCorrect: false, order: 2 },
      { text: "20 garçons", isCorrect: false, order: 3 },
      { text: "12 garçons", isCorrect: true, order: 4 },
    ],
  },
  {
    dayNumber: 3,
    prompt: "Un train parcourt 240 km en 2 heures. Quelle est sa vitesse moyenne en km/h ?",
    explanation: "Vitesse = Distance / Temps = 240 km / 2 h = 120 km/h.",
    choices: [
      { text: "140 km/h", isCorrect: false, order: 1 },
      { text: "100 km/h", isCorrect: false, order: 2 },
      { text: "160 km/h", isCorrect: false, order: 3 },
      { text: "120 km/h", isCorrect: true, order: 4 },
    ],
  },
  {
    dayNumber: 4,
    prompt: "Si A = 5 et B = 3, quelle est la valeur de (A + B) × (A - B) ?",
    explanation: "(A + B) × (A - B) = (5 + 3) × (5 - 3) = 8 × 2 = 16.",
    choices: [
      { text: "16", isCorrect: true, order: 1 },
      { text: "18", isCorrect: false, order: 2 },
      { text: "14", isCorrect: false, order: 3 },
      { text: "20", isCorrect: false, order: 4 },
    ],
  },
  {
    dayNumber: 5,
    prompt: "Un rectangle a une longueur de 8 cm et une largeur de 5 cm. Quelle est son aire ?",
    explanation: "Aire d'un rectangle = Longueur × Largeur = 8 cm × 5 cm = 40 cm².",
    choices: [
      { text: "45 cm²", isCorrect: false, order: 1 },
      { text: "35 cm²", isCorrect: false, order: 2 },
      { text: "50 cm²", isCorrect: false, order: 3 },
      { text: "40 cm²", isCorrect: true, order: 4 },
    ],
  },
  {
    dayNumber: 6,
    prompt: "Quel est le résultat de 15% de 200 ?",
    explanation: "15% de 200 = 0,15 × 200 = 30.",
    choices: [
      { text: "35", isCorrect: false, order: 1 },
      { text: "25", isCorrect: false, order: 2 },
      { text: "30", isCorrect: true, order: 3 },
      { text: "40", isCorrect: false, order: 4 },
    ],
  },
  {
    dayNumber: 7,
    prompt: "Si un nombre est multiplié par 3 puis soustrait de 20, on obtient 5. Quel est ce nombre ?",
    explanation: "Soit x le nombre. On a : 20 - 3x = 5, donc 3x = 15, donc x = 5.",
    choices: [
      { text: "5", isCorrect: true, order: 1 },
      { text: "7", isCorrect: false, order: 2 },
      { text: "3", isCorrect: false, order: 3 },
      { text: "9", isCorrect: false, order: 4 },
    ],
  },
  {
    dayNumber: 8,
    prompt: "Combien de côtés a un hexagone ?",
    explanation: "Un hexagone a 6 côtés (hexa = 6 en grec).",
    choices: [
      { text: "4", isCorrect: false, order: 1 },
      { text: "5", isCorrect: false, order: 2 },
      { text: "6", isCorrect: true, order: 3 },
      { text: "8", isCorrect: false, order: 4 },
    ],
  },
  {
    dayNumber: 9,
    prompt: "Si 4 ouvriers construisent un mur en 6 jours, combien de jours faudra-t-il à 8 ouvriers ?",
    explanation: "Si 4 ouvriers prennent 6 jours, alors 8 ouvriers (2 fois plus) prendront 3 jours (2 fois moins).",
    choices: [
      { text: "3 jours", isCorrect: true, order: 1 },
      { text: "4 jours", isCorrect: false, order: 2 },
      { text: "2 jours", isCorrect: false, order: 3 },
      { text: "6 jours", isCorrect: false, order: 4 },
    ],
  },
  {
    dayNumber: 10,
    prompt: "Quel est le carré de 7 ?",
    explanation: "7² = 7 × 7 = 49.",
    choices: [
      { text: "56", isCorrect: false, order: 1 },
      { text: "42", isCorrect: false, order: 2 },
      { text: "63", isCorrect: false, order: 3 },
      { text: "49", isCorrect: true, order: 4 },
    ],
  },
  {
    dayNumber: 11,
    prompt: "Quelle est la racine carrée de 144 ?",
    explanation: "√144 = 12 car 12 × 12 = 144.",
    choices: [
      { text: "14", isCorrect: false, order: 1 },
      { text: "10", isCorrect: false, order: 2 },
      { text: "12", isCorrect: true, order: 3 },
      { text: "16", isCorrect: false, order: 4 },
    ],
  },
  {
    dayNumber: 12,
    prompt: "Un produit coûte 80€. Après une réduction de 25%, quel est son nouveau prix ?",
    explanation: "Réduction de 25% = 0,25 × 80 = 20€. Nouveau prix = 80 - 20 = 60€.",
    choices: [
      { text: "60€", isCorrect: true, order: 1 },
      { text: "65€", isCorrect: false, order: 2 },
      { text: "55€", isCorrect: false, order: 3 },
      { text: "70€", isCorrect: false, order: 4 },
    ],
  },
  {
    dayNumber: 13,
    prompt: "Combien font 2³ + 3² ?",
    explanation: "2³ = 8 et 3² = 9, donc 2³ + 3² = 8 + 9 = 17.",
    choices: [
      { text: "19", isCorrect: false, order: 1 },
      { text: "15", isCorrect: false, order: 2 },
      { text: "21", isCorrect: false, order: 3 },
      { text: "17", isCorrect: true, order: 4 },
    ],
  },
  {
    dayNumber: 14,
    prompt: "Si 5 stylos coûtent 7,50€, combien coûtent 12 stylos ?",
    explanation: "1 stylo coûte 7,50€ / 5 = 1,50€. Donc 12 stylos coûtent 12 × 1,50€ = 18€.",
    choices: [
      { text: "20€", isCorrect: false, order: 1 },
      { text: "16€", isCorrect: false, order: 2 },
      { text: "18€", isCorrect: true, order: 3 },
      { text: "22€", isCorrect: false, order: 4 },
    ],
  },
  {
    dayNumber: 15,
    prompt: "Quel est le plus petit commun multiple (PPCM) de 6 et 8 ?",
    explanation: "Les multiples de 6 : 6, 12, 18, 24... Les multiples de 8 : 8, 16, 24... Le PPCM est 24.",
    choices: [
      { text: "32", isCorrect: false, order: 1 },
      { text: "18", isCorrect: false, order: 2 },
      { text: "48", isCorrect: false, order: 3 },
      { text: "24", isCorrect: true, order: 4 },
    ],
  },
  {
    dayNumber: 16,
    prompt: "Un triangle équilatéral a un côté de 6 cm. Quel est son périmètre ?",
    explanation: "Un triangle équilatéral a 3 côtés égaux. Périmètre = 3 × 6 = 18 cm.",
    choices: [
      { text: "21 cm", isCorrect: false, order: 1 },
      { text: "15 cm", isCorrect: false, order: 2 },
      { text: "18 cm", isCorrect: true, order: 3 },
      { text: "24 cm", isCorrect: false, order: 4 },
    ],
  },
  {
    dayNumber: 17,
    prompt: "Quel est le résultat de (10 + 5) × 2 - 8 ?",
    explanation: "(10 + 5) × 2 - 8 = 15 × 2 - 8 = 30 - 8 = 22.",
    choices: [
      { text: "24", isCorrect: false, order: 1 },
      { text: "20", isCorrect: false, order: 2 },
      { text: "26", isCorrect: false, order: 3 },
      { text: "22", isCorrect: true, order: 4 },
    ],
  },
  {
    dayNumber: 18,
    prompt: "Si x + 7 = 15, quelle est la valeur de x ?",
    explanation: "x + 7 = 15, donc x = 15 - 7 = 8.",
    choices: [
      { text: "6", isCorrect: false, order: 1 },
      { text: "7", isCorrect: false, order: 2 },
      { text: "8", isCorrect: true, order: 3 },
      { text: "9", isCorrect: false, order: 4 },
    ],
  },
  {
    dayNumber: 19,
    prompt: "Un cercle a un rayon de 5 cm. Quelle est son aire ? (π ≈ 3,14)",
    explanation: "Aire d'un cercle = π × r² = 3,14 × 5² = 3,14 × 25 = 78,5 cm².",
    choices: [
      { text: "78,5 cm²", isCorrect: true, order: 1 },
      { text: "94,2 cm²", isCorrect: false, order: 2 },
      { text: "62,8 cm²", isCorrect: false, order: 3 },
      { text: "125,6 cm²", isCorrect: false, order: 4 },
    ],
  },
  {
    dayNumber: 20,
    prompt: "Quel est le plus grand commun diviseur (PGCD) de 18 et 24 ?",
    explanation: "Les diviseurs de 18 : 1, 2, 3, 6, 9, 18. Les diviseurs de 24 : 1, 2, 3, 4, 6, 8, 12, 24. Le PGCD est 6.",
    choices: [
      { text: "8", isCorrect: false, order: 1 },
      { text: "4", isCorrect: false, order: 2 },
      { text: "12", isCorrect: false, order: 3 },
      { text: "6", isCorrect: true, order: 4 },
    ],
  },
  {
    dayNumber: 21,
    prompt: "Si 3x - 5 = 10, quelle est la valeur de x ?",
    explanation: "3x - 5 = 10, donc 3x = 15, donc x = 5.",
    choices: [
      { text: "5", isCorrect: true, order: 1 },
      { text: "6", isCorrect: false, order: 2 },
      { text: "4", isCorrect: false, order: 3 },
      { text: "7", isCorrect: false, order: 4 },
    ],
  },
  {
    dayNumber: 22,
    prompt: "Un carré a une aire de 64 cm². Quelle est la longueur de son côté ?",
    explanation: "Aire d'un carré = côté². Si côté² = 64, alors côté = √64 = 8 cm.",
    choices: [
      { text: "10 cm", isCorrect: false, order: 1 },
      { text: "6 cm", isCorrect: false, order: 2 },
      { text: "12 cm", isCorrect: false, order: 3 },
      { text: "8 cm", isCorrect: true, order: 4 },
    ],
  },
  {
    dayNumber: 23,
    prompt: "Quel est le résultat de 2/3 + 1/6 ?",
    explanation: "2/3 + 1/6 = 4/6 + 1/6 = 5/6.",
    choices: [
      { text: "3/9", isCorrect: false, order: 1 },
      { text: "3/6", isCorrect: false, order: 2 },
      { text: "1/2", isCorrect: false, order: 3 },
      { text: "5/6", isCorrect: true, order: 4 },
    ],
  },
  {
    dayNumber: 24,
    prompt: "Un nombre est augmenté de 20% puis diminué de 20%. Par rapport au nombre initial, le résultat est :",
    explanation: "Si on augmente de 20% puis diminue de 20%, on obtient : x × 1,20 × 0,80 = x × 0,96. Donc une diminution de 4%.",
    choices: [
      { text: "Plus petit", isCorrect: true, order: 1 },
      { text: "Identique", isCorrect: false, order: 2 },
      { text: "Plus grand", isCorrect: false, order: 3 },
      { text: "Impossible à déterminer", isCorrect: false, order: 4 },
    ],
  },
  {
    dayNumber: 25,
    prompt: "Combien font 0,5 × 0,4 ?",
    explanation: "0,5 × 0,4 = 0,20 = 0,2.",
    choices: [
      { text: "0,3", isCorrect: false, order: 1 },
      { text: "0,1", isCorrect: false, order: 2 },
      { text: "0,4", isCorrect: false, order: 3 },
      { text: "0,2", isCorrect: true, order: 4 },
    ],
  },
  {
    dayNumber: 26,
    prompt: "Un rectangle a un périmètre de 24 cm et une largeur de 4 cm. Quelle est sa longueur ?",
    explanation: "Périmètre = 2 × (longueur + largeur). 24 = 2 × (longueur + 4), donc 12 = longueur + 4, donc longueur = 8 cm.",
    choices: [
      { text: "8 cm", isCorrect: true, order: 1 },
      { text: "10 cm", isCorrect: false, order: 2 },
      { text: "6 cm", isCorrect: false, order: 3 },
      { text: "12 cm", isCorrect: false, order: 4 },
    ],
  },
  {
    dayNumber: 27,
    prompt: "Quel est le résultat de 4! (factorielle de 4) ?",
    explanation: "4! = 4 × 3 × 2 × 1 = 24.",
    choices: [
      { text: "32", isCorrect: false, order: 1 },
      { text: "16", isCorrect: false, order: 2 },
      { text: "24", isCorrect: true, order: 3 },
      { text: "48", isCorrect: false, order: 4 },
    ],
  },
  {
    dayNumber: 28,
    prompt: "Si un nombre est divisé par 4 puis multiplié par 3, on obtient 15. Quel est ce nombre ?",
    explanation: "Soit x le nombre. (x / 4) × 3 = 15, donc x / 4 = 5, donc x = 20.",
    choices: [
      { text: "22", isCorrect: false, order: 1 },
      { text: "18", isCorrect: false, order: 2 },
      { text: "24", isCorrect: false, order: 3 },
      { text: "20", isCorrect: true, order: 4 },
    ],
  },
  {
    dayNumber: 29,
    prompt: "Quel est le résultat de 2⁴ - 3² ?",
    explanation: "2⁴ = 16 et 3² = 9, donc 2⁴ - 3² = 16 - 9 = 7.",
    choices: [
      { text: "9", isCorrect: false, order: 1 },
      { text: "5", isCorrect: false, order: 2 },
      { text: "11", isCorrect: false, order: 3 },
      { text: "7", isCorrect: true, order: 4 },
    ],
  },
  {
    dayNumber: 30,
    prompt: "Un produit passe de 50€ à 60€. Quel est le pourcentage d'augmentation ?",
    explanation: "Augmentation = 60 - 50 = 10€. Pourcentage = (10 / 50) × 100 = 20%.",
    choices: [
      { text: "25%", isCorrect: false, order: 1 },
      { text: "15%", isCorrect: false, order: 2 },
      { text: "30%", isCorrect: false, order: 3 },
      { text: "20%", isCorrect: true, order: 4 },
    ],
  },
  {
    dayNumber: 31,
    prompt: "Combien de diagonales a un pentagone (polygone à 5 côtés) ?",
    explanation: "Un pentagone a 5 sommets. Le nombre de diagonales = n(n-3)/2 = 5(5-3)/2 = 5×2/2 = 5 diagonales.",
    choices: [
      { text: "7", isCorrect: false, order: 1 },
      { text: "3", isCorrect: false, order: 2 },
      { text: "9", isCorrect: false, order: 3 },
      { text: "5", isCorrect: true, order: 4 },
    ],
  },
]

async function main() {
  console.log('🌱 Mise à jour des défis quotidiens...')

  for (const challengeData of dailyChallenges) {
    const { choices, ...challenge } = challengeData

    // Vérifier si le défi existe déjà
    const existing = await prisma.dailyChallenge.findUnique({
      where: { dayNumber: challenge.dayNumber },
      include: { choices: true },
    })

    if (existing) {
      // Supprimer les anciens choix
      await prisma.dailyChallengeChoice.deleteMany({
        where: { dailyChallengeId: existing.id },
      })
      
      // Créer les nouveaux choix avec le nouvel ordre
      await prisma.dailyChallengeChoice.createMany({
        data: choices.map(choice => ({
          dailyChallengeId: existing.id,
          text: choice.text,
          isCorrect: choice.isCorrect,
          order: choice.order,
        })),
      })
      
      console.log(`🔄 Défi jour ${challenge.dayNumber} mis à jour`)
    } else {
      // Créer le défi avec ses choix
      const created = await prisma.dailyChallenge.create({
        data: {
          ...challenge,
          choices: {
            create: choices,
          },
        },
      })

      console.log(`✅ Défi jour ${challenge.dayNumber} créé`)
    }
  }

  console.log('✨ Terminé !')
}

main()
  .catch((e) => {
    console.error('❌ Erreur:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
