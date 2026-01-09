import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const FRENCH_COMPREHENSION_TEXT = `L'œuvre philosophique
Henri Poincaré
Lorsque l'on entreprend de classer les idées philosophiques d'Henri
Poincaré et de situer exactement son œuvre parmi les doctrines contem-
poraines, il est nécessaire de procéder avec beaucoup de circonspection
si l'on ne veut pas risquer de faire fausse route. Henri Poincaré était en
philosophie un autodidacte, et il éprouvait à l'égard des systèmes une
méfiance particulière. Il s'est défendu d'être nominaliste, mais toute autre
qualification appliquée à sa doctrine l'eût également inquiété. Sur nombre
de problèmes, en effet, qui divisent les partis philosophiques, il se déclare
incapable de prendre aucun parti parce que, dit-il, pour un savant, la
question ne se pose même pas. Pour bien comprendre Henri Poincaré, il
faut se rappeler qu'il ne perd pas de vue les faits, et que, dans ses spécu-
lations les plus audacieuses, les plus paradoxales en apparence, il y reste
encore fermement attaché. Peu lui importe de savoir où il aboutira et si ses
conclusions s'accorderont ou non avec les idées traditionnelles. Il cherche
la vérité sans idée préconçue, en faisant soigneusement table rase de tout
ce qu'il a pu lire ou entendre, en évitant même de communiquer ses pen-
sées à autrui tant qu'elles ne sont pas définitivement formées. Comme s'il
craignait de se laisser influencer et de contrarier le travail d'analyse qui
s'accomplit au-dedans de lui et, pour ainsi dire, indépendamment de lui,
Poincaré médite seul et presque dans le secret. Puis brusquement l'idée
jaillit, avec ces caractères de brièveté et d'irrésistibilité que nous retrou-
vons dans l'invention mathématique ; et désormais elle s'impose. Aux
philosophes de trouver après coup des théories qui rendent compte de la
vérité ainsi découverte ; ils n'ont pas plus le droit de la contester qu'ils ne
peuvent nier la science : car la vérité au sens de Poincaré, ce n'est autre
chose, en somme, que l'expression philosophique des conditions impli-
quées par l'existence effective des sciences positives.
Cet ensemble de faits objectifs, ces jalons que doit respecter toute théorie
de la connaissance, Henri Poincaré y fut conduit tout naturellement par
ses études mathématiques, et, du jour où il les aperçut, il en eut une com-
préhension complète et définitive. Le fond des idées d'Henri Poincaré sur
la science et sur la recherche scientifique n'a jamais varié. C'est dans la
forme seulement que ces idées se sont modifiées, prenant peu à peu un
aspect moins technique et moins spécial à mesure que s'étendait leur
champ d'application, s'épurant, d'autre part, et se cristallisant au contact
des idées voisines ou opposées qui furent émises, durant les vingt der-
nières années, par divers penseurs éminents.
De bonne heure Henri Poincaré avait eu un goût très vif pour la contro-
verse philosophique. Lorsque M. Xavier Léon, créant en 1893 la Revue
de Métaphysique et de Morale, fit appel à son concours, il l'accorda avec
empressement, et il ne cessa depuis lors d'être un collaborateur régulier
de cette Revue. Il fut aussi l'un des premiers membres de la Société
française de philosophie. C'est ainsi qu'il prit l'habitude de s'adresser au
public philosophique et qu'il entra en discussion avec divers logiciens
et métaphysiciens tels que MM. Couturat, Russell, Le Roy, Lalande. Au
cours de cet échange d'idées, Henri Poincaré eut l'occasion de traiter des
questions nouvelles qu'il ne s'était pas posées auparavant. Et cependant,
au moment même où il est le plus intéressé et le plus entraîné par la
discussion, il évite encore, comme nous le disions tout à l'heure, d'entrer
proprement dans la lice philosophique. Il se demande simplement si, sous
la forme précise que leur ont donnée leurs auteurs, les théories qu'on lui
propose s'accordent ou non avec certains ensembles de faits. Puis il se
replie de nouveau sur lui-même, et sa pensée, prenant possession de la
pâture nouvelle qui lui est offerte, stimulée par les difficultés qu'on lui
suscite, poursuit méthodiquement son travail de réflexion intérieure.
C'est le mouvement, c'est le progrès continu de cette pensée, qu'il
faudrait étudier et suivre d'étape en étape, si l'on voulait pénétrer à
fond l'œuvre philosophique d'Henri Poincaré. Bien entendu, nous ne
pouvons prétendre, en ces quelques pages, accomplir un pareil travail.
Nous nous bornerons à indiquer quelques points de repère, qui pourront
peut-être aider à s'orienter les nombreux lecteurs du mathématicien phi-
losophe.`

const ENGLISH_COMPREHENSION_TEXT = `Australia keeps voting for coal, but investors are quietly
abandoning plans for new mines.
Climate Consciousness
Every decision counts.
On May 18, Australians surprised the pollsters. At the federal election, the
expectation was for the incumbent coalition to be thumped by the pro-
climate Labor party. Instead, citizens of Queensland, Australia's coal-rich
province, swung hard to support the coalition backing the construction of
new coal mines. It was enough to ensure the coalition remains in power.
Queensland's Carmichael coal mine lies at the heart of the debate.
Many political campaigns were focused on the mine, using hashtags like
#StopAdani or #StartAdani. Adani, the Indian conglomerate that has an
exploration license for the coal mine, plans to build it into one of the
world's largest. Emissions from the process of mining at Carmichael,
and the burning of the coal produced, would each separately be more
than emissions produced by entire countries like Austria, Denmark, and
Norway.
But Adani has struggled to first get the environmental licenses it needs,
as well as the financing to pull off the project. Last year, the company
announced that it would move ahead with a scaled-down version of the
Carmichael mine, producing only 10 million metric tons of coal each
year of the possible annual capacity of 60 million metric tons.
Environmentalists around the world see the Adani mine, located in the
Galilee basin, as a bellwether for the future of the dirtiest fossil fuel. That's
because the basin has potential to provide a lot more coal beyond the
Adani mine, at a time when Australia (and the world) is struggling to cut
its emissions and hit ambitious climate goals.
Among rich nations, Australia is expected to suffer the most damages
because of the climate crisis. In the past few months, the country
has experienced its hottest summer on record, extreme flooding in
Queensland, and mass die-off of a million fish in New South Wales.
While the Australian elections didn't go as environmentalists wanted,
they do have something, perhaps even bigger, to celebrate. On May 23,
Australian broadcaster ABC found that investors have abandoned plans
to build a much larger mine that was supposed to be located only 30 km
away from the Carmichael mine.
The China Stone project, run by MacMines AustAsia and wholly owned
by the Meijin Energy Group, which is China's largest producer of metal-
lurgical coke, was expected to produce 38 million metric tons of coal
each year. The A$6.7 billion ($4.6 billion) mine would have supported
3,000 jobs and contributed A$188 million to the Queensland govern-
ment's coffers each year for the 25 years the mining was expected to last.
All that now seems to be up in the air. ABC revealed that MacMines
terminated the process of acquiring mining leases from the government
in March. Though the company wouldn't comment on why it did that,
analysts believe that the coal mine is neither financially viable nor in
China's interests anymore.
"China has made it very, very clear it wants to progressively reduce expo-
sure to highly polluting coal-fired power generation. That won't happen
overnight, it will take decades to come," Tim Buckley of the Institute
of Energy Economics and Financial Analysis told ABC. "But if you are
moving in that direction, the last thing you want to do is introduce a
whole lot more expensive imported thermal coal."
Notably, the China Stone mine's financial viability is expected to be simi-
lar to the Carmichael mine. David Fickling, a Bloomberg columnist, did
the math on the latter. After taking into consideration the cost to build the
mine, the railway line, the operating expenses, and the interest payments
on the loans taken, he found that each metric ton of coal would cost
about $88. That's much higher than the open-market cost for the same
quality of coal, which can be bought from Indonesia's Adaro Energy for
as little as $66 per metric ton.
MacMines still owns an exploration license for the China Stone project,
so no other company can develop it. That means, for now, the China
Stone coal will stay in the ground.
Akshat Rathi, www.qz.com, May 27th, 2019`

async function main() {
  console.log('📝 Ajout des textes de compréhension pour le Test Blanc 2...\n')
  
  // Récupérer le tag "Test Blanc 2"
  const testBlancTag = await prisma.tag.findUnique({ where: { name: 'Test Blanc 2' } })
  if (!testBlancTag) {
    console.error('❌ Tag "Test Blanc 2" non trouvé')
    await prisma.$disconnect()
    return
  }
  
  // Récupérer toutes les questions du Test Blanc 2 dans l'ordre
  const allQuestions = await prisma.question.findMany({
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
  
  console.log(`📊 ${allQuestions.length} questions trouvées\n`)
  
  let updated = 0
  
  // Questions 86-100 : texte français
  const frenchStartIndex = 85 // Index 85 = Question 86 (0-based)
  const frenchEndIndex = 99   // Index 99 = Question 100
  
  for (let i = frenchStartIndex; i <= frenchEndIndex && i < allQuestions.length; i++) {
    const question = allQuestions[i]
    const questionNumber = i + 1 // Index 85 = Question 86
    
    await prisma.question.update({
      where: { id: question.id },
      data: {
        comprehensionText: FRENCH_COMPREHENSION_TEXT,
      },
    })
    
    updated++
    console.log(`✅ Question ${questionNumber} (${question.id.substring(0, 8)}...) mise à jour avec texte français`)
  }
  
  // Questions 156-170 : texte anglais
  // Les questions vont de 1 à 50 (Culture), puis 51 à 100 (Français), puis 121 à 170 (Anglais)
  // Dans le tableau : indices 0-49 (Q1-50), 50-99 (Q51-100), 100-149 (Q121-170)
  // Q156 = index 135 dans le tableau (50 Culture + 50 Français + 35 = 135)
  // Q170 = index 149 dans le tableau
  
  const englishStartIndex = 135 // Index 135 = Question 156 (50 Culture + 50 Français + 35 = 135)
  const englishEndIndex = 149    // Index 149 = Question 170
  
  for (let i = englishStartIndex; i <= englishEndIndex && i < allQuestions.length; i++) {
    const question = allQuestions[i]
    // Calculer le numéro réel : Q156 = index 135, donc questionNumber = 156 + (i - 135)
    const questionNumber = 156 + (i - englishStartIndex)
    
    await prisma.question.update({
      where: { id: question.id },
      data: {
        comprehensionText: ENGLISH_COMPREHENSION_TEXT,
      },
    })
    
    updated++
    console.log(`✅ Question ${questionNumber} (${question.id.substring(0, 8)}...) mise à jour avec texte anglais`)
  }
  
  console.log(`\n✅ Terminé : ${updated} questions mises à jour avec des textes de compréhension`)
}

main()
  .catch((e) => {
    console.error('❌ Erreur:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
