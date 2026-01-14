import { PrismaClient } from '@prisma/client'
import * as fs from 'fs'
import * as path from 'path'
import 'dotenv/config'

const prisma = new PrismaClient()

// Questions extraites du fichier HTML
const htmlQuestions = [
  // Actualités
  { q: "Qui a remporté l'élection présidentielle américaine de novembre 2024 ?", c: "Donald Trump", r: "Actualité : Donald Trump a été élu 47e président des États-Unis.", category: "Actualités" },
  { q: "Quel pays a officiellement rejoint l'OTAN en mars 2024 ?", c: "Suède", r: "Actualité : La Suède est devenue le 32e membre de l'Alliance.", category: "Actualités" },
  { q: "Où se sont déroulés les Jeux Olympiques d'été de 2024 ?", c: "Paris", r: "Actualité : Paris a accueilli les JO du 26 juillet au 11 août 2024.", category: "Actualités" },
  { q: "Quel film a remporté l'Oscar du meilleur film en 2024 ?", c: "Oppenheimer", r: "Actualité : Le film de Christopher Nolan a dominé la cérémonie.", category: "Actualités" },
  { q: "Qui a été nommé Premier ministre français en septembre 2024 ?", c: "Michel Barnier", r: "Actualité : Michel Barnier a succédé à Gabriel Attal.", category: "Actualités" },
  { q: "Quelle entreprise a dépassé Apple en capitalisation boursière en 2024 grâce à l'IA ?", c: "NVIDIA", r: "Actualité : NVIDIA est devenu brièvement la première entreprise mondiale.", category: "Actualités" },
  { q: "Quel pays a quitté l'Union Européenne (Brexit) ?", c: "Royaume-Uni", r: "Rappel : Sortie effective en 2020/2021.", category: "Actualités" },
  { q: "En 2025, quel pays a rejoint la zone euro ?", c: "Aucun", r: "Note : La Croatie était la dernière en 2023. La Bulgarie vise 2026.", category: "Actualités" },
  { q: "Quel est le nom de l'IA générative lancée par Google pour concurrencer ChatGPT ?", c: "Gemini", r: "Technologie : Google a renommé Bard en Gemini début 2024.", category: "Actualités" },
  { q: "Qui est le président de l'Ukraine en 2025 ?", c: "Volodymyr Zelensky", r: "Actualité Internationale.", category: "Actualités" },
  
  // Économie
  { q: "Que signifie l'acronyme BCE ?", c: "Banque Centrale Européenne", r: "Page 39 : Siège à Francfort.", category: "Économie" },
  { q: "Quel est le taux d'inflation visé par la BCE ?", c: "2%", r: "Économie : C'est l'objectif de stabilité des prix.", category: "Économie" },
  { q: "Qu'est-ce que le CAC 40 ?", c: "Un indice boursier", r: "Économie : Regroupe les 40 plus grandes sociétés françaises cotées.", category: "Économie" },
  { q: "Qui est l'actuelle directrice du FMI ?", c: "Kristalina Georgieva", r: "Économie : Christine Lagarde dirige la BCE.", category: "Économie" },
  { q: "Quelle est la monnaie de la Chine ?", c: "Yuan (Renminbi)", r: "Note : Le Yen est japonais.", category: "Économie" },
  { q: "Que signifie l'acronyme PIB ?", c: "Produit Intérieur Brut", r: "Page 40 : Mesure la richesse produite sur un territoire.", category: "Économie" },
  { q: "L'OPEP concerne quel secteur ?", c: "Le pétrole", r: "Économie : Organisation des Pays Exportateurs de Pétrole.", category: "Économie" },
  { q: "Qui est considéré comme le père de l'économie libérale ?", c: "Adam Smith", r: "Culture : Auteur de 'La Richesse des Nations' (1776).", category: "Économie" },
  { q: "Qu'est-ce qu'une OPA ?", c: "Offre Publique d'Achat", r: "Finance : Stratégie de rachat d'une entreprise.", category: "Économie" },
  { q: "Le siège de l'OMC se situe à :", c: "Genève", r: "Économie : Organisation Mondiale du Commerce.", category: "Économie" },
  
  // Arts & Littérature
  { q: "Qui a remporté le Prix Goncourt 2024 ?", c: "Kamel Daoud", r: "Actualité : Pour son roman 'Houris'.", category: "Arts & Littérature" },
  { q: "Qui a remporté le Prix Nobel de littérature 2024 ?", c: "Han Kang", r: "Actualité : Première autrice sud-coréenne primée.", category: "Arts & Littérature" },
  { q: "Dans quel musée peut-on voir 'La Joconde' ?", c: "Le Louvre", r: "Arts : Peint par Léonard de Vinci.", category: "Arts & Littérature" },
  { q: "À quel mouvement appartient le peintre Claude Monet ?", c: "Impressionnisme", r: "Page 43 : Chef de file avec 'Impression, soleil levant'.", category: "Arts & Littérature" },
  { q: "Qui a écrit 'À la recherche du temps perdu' ?", c: "Marcel Proust", r: "Littérature : Œuvre fleuve en 7 tomes.", category: "Arts & Littérature" },
  { q: "Quel prix récompense le meilleur film au Festival de Cannes ?", c: "La Palme d'Or", r: "Culture : Le Lion d'Or est à Venise, l'Ours d'Or à Berlin.", category: "Arts & Littérature" },
  { q: "Qui a sculpté 'Le Penseur' ?", c: "Auguste Rodin", r: "Arts : Œuvre majeure du XIXe siècle.", category: "Arts & Littérature" },
  { q: "Guernica est une œuvre de :", c: "Pablo Picasso", r: "Page 43 : Peinte en 1937 contre les horreurs de la guerre.", category: "Arts & Littérature" },
  { q: "Qui a écrit 'En attendant Godot' ?", c: "Samuel Beckett", r: "Littérature : Théâtre de l'absurde.", category: "Arts & Littérature" },
  { q: "Quel architecte a conçu la Cité Radieuse à Marseille ?", c: "Le Corbusier", r: "Page 42 : Charles-Édouard Jeanneret-Gris.", category: "Arts & Littérature" },
  
  // Histoire & Géographie
  { q: "En quelle année a été signée la Déclaration des Droits de l'Homme et du Citoyen ?", c: "1789", r: "Histoire : 26 août 1789.", category: "Histoire & Géographie" },
  { q: "Qui était le président français lors du passage aux 35 heures ?", c: "Jacques Chirac", r: "Histoire : Gouvernement de Lionel Jospin sous Chirac.", category: "Histoire & Géographie" },
  { q: "Quelle est la capitale du Nigeria ?", c: "Abuja", r: "Géographie : Souvent confondu avec Lagos (plus grande ville).", category: "Histoire & Géographie" },
  { q: "En quelle année l'Algérie a-t-elle obtenu son indépendance ?", c: "1962", r: "Histoire : Suite aux accords d'Évian.", category: "Histoire & Géographie" },
  { q: "Qui a instauré le Code Civil en 1804 ?", c: "Napoléon Bonaparte", r: "Histoire : Aussi appelé Code Napoléon.", category: "Histoire & Géographie" },
  { q: "Quel pays a pour capitale Canberra ?", c: "Australie", r: "Géographie : Souvent confondu avec Sydney.", category: "Histoire & Géographie" },
  { q: "La chute du mur de Berlin a eu lieu en :", c: "1989", r: "Histoire : Le 9 novembre.", category: "Histoire & Géographie" },
  { q: "Qui était le chef d'État de l'URSS lors de sa dissolution en 1991 ?", c: "Gorbatchev", r: "Histoire : Mikhaïl Gorbatchev.", category: "Histoire & Géographie" },
  { q: "En quelle année a été créé l'État d'Israël ?", c: "1948", r: "Histoire : Le 14 mai 1948.", category: "Histoire & Géographie" },
  { q: "Quelle est la capitale du Vietnam ?", c: "Hanoï", r: "Géographie : Hô Chi Minh-Ville est la plus grande ville.", category: "Histoire & Géographie" },
]

// Fonction pour générer des distractors à partir des options du HTML
function generateDistractorsFromOptions(correctAnswer: string, allOptions: string[]): string[] {
  // Exclure la bonne réponse et prendre 3 autres options
  const distractors = allOptions.filter(opt => opt !== correctAnswer).slice(0, 3)
  
  // Si on n'a pas assez, compléter avec des distractors génériques
  while (distractors.length < 3) {
    distractors.push(`Option ${distractors.length + 1}`)
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
  console.log('🌱 Début de l\'import des questions HTML...')

  // Options pour chaque question (extrait du HTML)
  const questionOptions: Record<string, string[]> = {
    "Qui a remporté l'élection présidentielle américaine de novembre 2024 ?": ["Joe Biden", "Kamala Harris", "Donald Trump", "Ron DeSantis", "Nikki Haley"],
    "Quel pays a officiellement rejoint l'OTAN en mars 2024 ?": ["Ukraine", "Suède", "Finlande", "Moldavie", "Géorgie"],
    "Où se sont déroulés les Jeux Olympiques d'été de 2024 ?": ["Londres", "Paris", "Los Angeles", "Tokyo", "Brisbane"],
    "Quel film a remporté l'Oscar du meilleur film en 2024 ?": ["Barbie", "Oppenheimer", "Anatomie d'une chute", "Pauvres Créatures", "The Holdovers"],
    "Qui a été nommé Premier ministre français en septembre 2024 ?": ["Gabriel Attal", "Michel Barnier", "Lucie Castets", "Xavier Bertrand", "Bernard Cazeneuve"],
    "Quelle entreprise a dépassé Apple en capitalisation boursière en 2024 grâce à l'IA ?": ["Google", "Meta", "NVIDIA", "Tesla", "Amazon"],
    "Quel pays a quitté l'Union Européenne (Brexit) ?": ["Irlande", "Norvège", "Royaume-Uni", "Islande", "Suisse"],
    "En 2025, quel pays a rejoint la zone euro ?": ["Pologne", "Roumanie", "Bulgarie", "Hongrie", "Aucun"],
    "Quel est le nom de l'IA générative lancée par Google pour concurrencer ChatGPT ?": ["Bard", "Gemini", "Claude", "Llama", "Copilot"],
    "Qui est le président de l'Ukraine en 2025 ?": ["Vladimir Poutine", "Volodymyr Zelensky", "Viktor Orban", "Petro Porochenko", "Andrzej Duda"],
    "Que signifie l'acronyme BCE ?": ["Banque Centrale Européenne", "Bureau de Crédit Européen", "Banque de Commerce Extérieur", "Bourse Centrale d'Échange", "Budget Commun d'Épargne"],
    "Quel est le taux d'inflation visé par la BCE ?": ["0%", "1%", "2%", "3%", "5%"],
    "Qu'est-ce que le CAC 40 ?": ["Un indice boursier", "Une taxe sur le carbone", "Une loi sur le chômage", "Un prêt immobilier", "Une institution européenne"],
    "Qui est l'actuelle directrice du FMI ?": ["Christine Lagarde", "Kristalina Georgieva", "Ursula von der Leyen", "Janet Yellen", "Ngozi Okonjo-Iweala"],
    "Quelle est la monnaie de la Chine ?": ["Yen", "Won", "Yuan (Renminbi)", "Baht", "Ringgit"],
    "Que signifie l'acronyme PIB ?": ["Produit Intérieur Brut", "Produit Industriel de Base", "Placement Immobilier Brut", "Profit Interne Brut", "Part Interne de Branche"],
    "L'OPEP concerne quel secteur ?": ["Le blé", "L'acier", "Le pétrole", "Le gaz naturel", "L'or"],
    "Qui est considéré comme le père de l'économie libérale ?": ["Karl Marx", "Adam Smith", "John Keynes", "Milton Friedman", "David Ricardo"],
    "Qu'est-ce qu'une OPA ?": ["Offre Publique d'Achat", "Option de Paiement Annuel", "Opération de Prêt Assisté", "Offre Privée d'Action", "Ordre Public Administratif"],
    "Le siège de l'OMC se situe à :": ["Paris", "Londres", "New York", "Genève", "Bruxelles"],
    "Qui a remporté le Prix Goncourt 2024 ?": ["Jean-Baptiste Andrea", "Kamel Daoud", "Hervé Le Tellier", "Brigitte Giraud", "Mohamed Mbougar Sarr"],
    "Qui a remporté le Prix Nobel de littérature 2024 ?": ["Annie Ernaux", "Jon Fosse", "Han Kang", "Haruki Murakami", "Michel Houellebecq"],
    "Dans quel musée peut-on voir 'La Joconde' ?": ["Musée d'Orsay", "Le Louvre", "Le Prado", "Le MoMA", "British Museum"],
    "À quel mouvement appartient le peintre Claude Monet ?": ["Cubisme", "Surréalisme", "Impressionnisme", "Fauvisme", "Romantisme"],
    "Qui a écrit 'À la recherche du temps perdu' ?": ["Victor Hugo", "Gustave Flaubert", "Marcel Proust", "Émile Zola", "Albert Camus"],
    "Quel prix récompense le meilleur film au Festival de Cannes ?": ["L'Ours d'Or", "Le Lion d'Or", "La Palme d'Or", "L'Oscar", "Le César"],
    "Qui a sculpté 'Le Penseur' ?": ["Michel-Ange", "Bernin", "Auguste Rodin", "Camille Claudel", "Alberto Giacometti"],
    "Guernica est une œuvre de :": ["Salvador Dalí", "Joan Miró", "Pablo Picasso", "Francisco Goya", "Velázquez"],
    "Qui a écrit 'En attendant Godot' ?": ["Jean-Paul Sartre", "Samuel Beckett", "Eugène Ionesco", "Albert Camus", "Arthur Adamov"],
    "Quel architecte a conçu la Cité Radieuse à Marseille ?": ["Jean Nouvel", "Le Corbusier", "Renzo Piano", "Frank Gehry", "Gustave Eiffel"],
    "En quelle année a été signée la Déclaration des Droits de l'Homme et du Citoyen ?": ["1776", "1789", "1792", "1804", "1848"],
    "Qui était le président français lors du passage aux 35 heures ?": ["François Mitterrand", "Jacques Chirac", "Nicolas Sarkozy", "Lionel Jospin", "Valéry Giscard d'Estaing"],
    "Quelle est la capitale du Nigeria ?": ["Lagos", "Abuja", "Accra", "Dakar", "Nairobi"],
    "En quelle année l'Algérie a-t-elle obtenu son indépendance ?": ["1954", "1958", "1960", "1962", "1968"],
    "Qui a instauré le Code Civil en 1804 ?": ["Louis XIV", "Robespierre", "Napoléon Bonaparte", "Louis-Philippe", "Charles de Gaulle"],
    "Quel pays a pour capitale Canberra ?": ["Nouvelle-Zélande", "Australie", "Canada", "Afrique du Sud", "Autriche"],
    "La chute du mur de Berlin a eu lieu en :": ["1987", "1988", "1989", "1990", "1991"],
    "Qui était le chef d'État de l'URSS lors de sa dissolution en 1991 ?": ["Staline", "Khrouchtchev", "Gorbatchev", "Eltsine", "Poutine"],
    "En quelle année a été créé l'État d'Israël ?": ["1945", "1947", "1948", "1956", "1967"],
    "Quelle est la capitale du Vietnam ?": ["Saïgon", "Hô Chi Minh-Ville", "Hanoï", "Hué", "Da Nang"],
  }

  let created = 0
  let skipped = 0

  for (const questionData of htmlQuestions) {
    const { q: prompt, c: correctAnswer, r: explanation, category } = questionData

    // Vérifier si la question existe déjà
    const existing = await prisma.question.findFirst({
      where: { prompt },
    })

    if (existing) {
      skipped++
      continue
    }

    // Récupérer les options du HTML
    const allOptions = questionOptions[prompt] || []
    
    // Générer les distractors à partir des options du HTML
    const distractors = allOptions.filter(opt => opt !== correctAnswer).slice(0, 3)
    
    // Si on n'a pas assez d'options, créer des distractors génériques
    while (distractors.length < 3) {
      distractors.push(`Option ${distractors.length + 1}`)
    }

    // Créer les 4 choix (1 correct + 3 distractors)
    const allChoices = [
      { text: correctAnswer, isCorrect: true },
      ...distractors.map((text) => ({ text, isCorrect: false })),
    ]

    // Mélanger les choix
    const shuffledChoices = shuffle(allChoices)

    // Créer la question
    try {
      // Créer ou récupérer le tag
      let tag = await prisma.tag.findUnique({ where: { name: category } })
      if (!tag) {
        tag = await prisma.tag.create({ data: { name: category } })
      }

      const question = await prisma.question.create({
        data: {
          prompt,
          explanation: explanation || null,
          status: 'APPROVED',
          source: 'IAE Ultimate Trainer 2026 (HTML)',
          choices: {
            create: shuffledChoices.map((choice, index) => ({
              text: choice.text,
              isCorrect: choice.isCorrect,
              order: index,
            })),
          },
          tags: {
            create: {
              tagId: tag.id,
            },
          },
        },
      })

      created++
    } catch (error) {
      console.error(`Erreur lors de la création de la question "${prompt}":`, error)
      skipped++
    }
  }

  console.log(`✅ Import terminé: ${created} questions créées, ${skipped} ignorées`)
}

main()
  .catch((e) => {
    console.error('❌ Erreur lors de l\'import:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

