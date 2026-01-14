import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Textes de compréhension
const FRENCH_COMPREHENSION_TEXT = `De l'individualité comme un des éléments du bien-être
John Stuart Mill – 1859
L'espèce humaine n'est pas infaillible ; ses vérités ne sont, pour la plu-
part, que des demi-vérités : l'unité d'opinion n'est pas désirable, à moins
qu'elle ne résulte de la comparaison la plus libre et la plus entière des
opinions contraires : la diversité d'opinions n'est pas un mal mais un
bien, tant que l'humanité ne sera pas beaucoup plus capable qu'elle ne
l'est aujourd'hui de reconnaître toutes les diverses faces de la vérité :
voilà autant de principes tout aussi applicables à la manière d'agir des
hommes qu'à leurs opinions. Puisqu'il est utile, tant que le genre humain
est imparfait, qu'il y ait des opinions différentes, il est bon également
qu'on essaie de différentes manières de vivre. Il est utile de donner un
libre essor aux divers caractères, en les empêchant toutefois de nuire
aux autres ; et chacun doit pouvoir, quand il le juge convenable, faire
l'épreuve des différents genres de vie. Où la règle de conduite n'est pas le
caractère de chacun, mais bien les traditions ou les coutumes d'autrui, là
manque complètement un des principaux éléments du bonheur humain
et l'unique élément du progrès individuel et social.
Ici la plus grande difficulté n'est pas dans l'appréciation des moyens qui
conduisent à un but reconnu, mais dans l'indifférence des personnes en
général à l'égard du but lui-même.
Si on regardait le libre développement de l'individualité comme un des
principes essentiels du bien-être, si on le tenait non comme un élément
qui se coordonne avec tout ce qu'on désigne par les mots civilisation,
instruction, éducation, culture, mais bien comme une partie nécessaire
et une condition de toutes ces choses, il n'y aurait pas de danger que
la liberté ne fût pas appréciée à sa valeur ; on ne rencontrerait pas de
difficultés extraordinaires à tracer la ligne de démarcation entre elle et le
contrôle social. Mais malheureusement on accorde à peine à la sponta-
néité individuelle aucune espèce de valeur intrinsèque.
La majorité étant satisfaite des coutumes actuelles de l'humanité (car c'est
elle qui les a faites ce qu'elles sont), ne peut comprendre pourquoi ces
coutumes ne suffiraient pas à tout le monde. Il y a plus encore, la spon-
tanéité n'entre pas dans l'idéal de la majorité des réformateurs moraux et
sociaux : ils la regardent plutôt avec jalousie, comme un obstacle gênant
et peut-être insurmontable à l'acceptation générale de ce qui, suivant
le jugement de ces réformateurs, serait le mieux pour l'humanité. Peu
de personnes, même en dehors de l'Allemagne, comprennent le sens
de cette doctrine sur laquelle Guillaume de Humboldt, si distingué et
comme savant et comme politique, a fait un traité, à savoir que « la fin de
l'homme, non pas telle que la suggèrent de vagues et fugitifs désirs, mais
telles que la prescrivent les décrets éternels ou immuables de la raison,
est le développement le plus étendu et le plus harmonieux de toutes ses
facultés en un ensemble complet et consistant » donc le but « vers lequel
doit tendre incessamment tout être humain, et en particulier ceux qui
veulent influer sur leurs semblables, est l'individualité de puissance et de
développement. » Pour cela deux choses sont nécessaires : « La liberté et
une variété de situation. » Leur union produit « la vigueur individuelle et
la diversité multiple » qui se fondent en « originalité ».
Cependant, si nouvelle et si surprenante que puisse paraître cette doc-
trine de Humboldt qui attache tant de prix à l'individualité, la question
n'est après tout, on le pense bien, qu'une question du plus au moins.
Personne ne suppose que la perfection de la conduite humaine soit de
se copier exactement les uns les autres. Personne n'affirme que le juge-
ment ou le caractère particulier d'un homme ne doit entrer pour rien
dans sa manière de vivre et de soigner ses intérêts. D'un autre côté, il
serait absurde de prétendre que les hommes devraient vivre comme si on
n'avait rien su au monde avant qu'ils y vinssent, comme si l'expérience
n'avait encore jamais montré que certaine manière de vivre ou de se
conduire est préférable à certaine autre. Nul ne conteste qu'on doive
élever et instruire la jeunesse de façon à la faire profiter des résultats
obtenus par l'expérience humaine. Mais c'est le privilège et la condition
propre d'un être humain arrivé à la maturité de ses facultés, de se servir
de l'expérience et de l'interpréter à sa façon. C'est à lui de découvrir ce
qu'il y a d'applicable dans l'expérience acquise à sa position et à son
caractère. Les traditions et les coutumes des autres individus sont jusqu'à
un certain point des témoignages de ce que l'expérience leur a appris, et
ces témoignages, cette présomption doit être accueillie avec déférence
par l'adulte que nous venons de supposer. Mais d'abord l'expérience des
autres peut être trop bornée ou ils peuvent l'avoir interprétée de travers ;
l'eussent-ils interprétée juste, leur interprétation peut ne pas convenir à
un individu en particulier.
Les coutumes sont faites pour les caractères et les positions ordinaires :
or, son caractère et sa position peuvent ne pas être de ce nombre. Quand
même les coutumes seraient bonnes en elles-mêmes, et pourraient conve-
nir à cet individu, un homme qui se conforme à la coutume uniquement
parce que c'est la coutume, n'entretient ni ne développe en lui aucune
des qualités qui sont l'attribut distinctif d'un être humain. Les facultés
humaines de perception, de jugement, de discernement, d'activité intel-
lectuelle, et même de préférence morale, ne s'exercent qu'en faisant
un choix. Celui qui n'agit jamais que suivant la coutume ne fait pas de
choix. Il n'apprend nullement à discerner ou à désirer le mieux ; la force
intellectuelle et la force morale, tout comme la force musculaire, ne font
de progrès qu'autant qu'on les exerce. On n'exerce pas ses facultés en
faisant une chose simplement parce que d'autres la font, pas plus qu'en
croyant une chose uniquement parce qu'ils la croient. Si une personne
adopte une opinion sans que les principes de cette opinion lui paraissent
concluants, sa raison n'en sera point fortifiée mais probablement affai-
blie ; et si elle fait une action dont les motifs ne sont pas conformes à ses
opinions et à son caractère (là où il ne s'agit pas d'affection ni des droits
d'autrui), elle n'y gagnera que d'énerver son caractère et ses opinions qui
devraient être actifs et énergiques.
L'homme qui laisse le monde ou du moins son monde choisir pour lui
sa manière de vivre, n'a besoin que de la faculté d'imitation des singes.
L'homme qui choisit lui-même sa manière de vivre se sert de toutes ses
facultés. Il doit employer l'observation pour voir, le raisonnement et le
jugement pour prévoir, l'activité pour rassembler les matériaux de la
décision, le discernement pour décider, et quand il a décidé, la fermeté
et l'empire sur lui-même pour s'en tenir à sa décision délibérée. Et plus la
portion de sa conduite qu'il règle d'après son jugement et ses sentiments
est grande, plus toutes ces diverses qualités lui sont nécessaires.
Il peut au besoin être guidé dans le bon chemin et préservé de toute
influence nuisible, sans aucune de ces choses. Mais quelle sera sa valeur
comparative comme être humain ? Ce qui est vraiment important, ce
n'est pas seulement ce que font les hommes, mais aussi quels sont les
hommes. Parmi les œuvres de l'homme, que la vie humaine est légitime-
ment employée à perfectionner et à embellir, la plus importante est sûre-
ment l'homme lui-même. En supposant qu'on puisse bâtir des maisons,
faire pousser du blé, livrer des batailles, juger des causes et même ériger
des églises et dire des prières à la mécanique au moyen d'automates de
forme humaine, on perdrait beaucoup à accepter ces automates contre
les hommes et les femmes qui habitent actuellement les parties les
plus civilisées du globe, bien qu'ils ne soient à coup sûr que des tristes
échantillons de ce que la nature peut produire et produira un jour. La
nature humaine n'est pas une machine qu'on puisse construire d'après
un modèle pour faire exactement un ouvrage désigné, c'est un arbre qui
veut croître et se développer de tous les côtés, suivant la tendance des
forces intérieures qui en font une chose vivante.
On avouera sans doute qu'il est désirable pour les hommes de cultiver
leur intelligence, et qu'il vaut mieux suivre intelligemment la coutume
ou même à l'occasion s'en éloigner d'une façon intelligente, que de s'y
conformer aveuglément et machinalement. On admet jusqu'à un certain
point que notre intelligence doit nous appartenir ; mais on n'admet pas
aussi facilement qu'il doit en être de même quant à nos désirs et à nos
impulsions ; on regarde presque comme un péril et un piège d'avoir de
fortes impulsions. Cependant les désirs et les impulsions font tout autant
partie d'un être humain dans sa perfection que les croyances et les
abstentions. De fortes impulsions ne sont dangereuses que lorsqu'elles
ne sont pas équilibrées, un ensemble de vues et d'inclinations s'étant
développé fortement, tandis que d'autres vues et d'autres inclinations
qui devraient exister à côté, restent faibles et inactives. Ce n'est pas parce
que les désirs des hommes sont ardents qu'ils agissent mal, c'est parce
que leurs consciences sont faibles. Il n'y a pas de rapport naturel entre
de fortes impulsions et une conscience faible : le rapport naturel est dans
l'autre sens. Dire que les désirs et les sentiments d'une personne sont
plus vifs et plus nombreux que ceux d'une autre, c'est dire simplement
que la dose de matière brute de nature humaine est plus forte chez cette
personne ; par conséquent elle est capable peut-être de plus de mal, mais
certainement de plus de bien. De fortes impulsions, c'est de l'énergie
sous un autre nom, voilà tout. L'énergie peut être employée à mal, mais
une nature énergique peut faire plus de bien qu'une nature indolente et
apathique. Ceux qui ont le plus de sentiments naturels sont aussi ceux
dont on peut développer le plus les sentiments cultivés. Cette ardente
sensibilité qui rend les impulsions personnelles vives et impuissantes, est
aussi la source d'où découlent l'amour le plus passionné de la vertu, le
plus strict empire sur soi-même. C'est en cultivant cette sensibilité que
la société fait son devoir et protège ses intérêts, et non en rejetant la
matière dont on fait les héros, parce qu'elle ne sait pas les faire. On dit
d'une personne qu'elle a du caractère lorsque ses désirs et ses impulsions
lui appartiennent en propre, sont l'expression de sa propre nature telle
que l'a développée et modifiée sa propre culture. Un être qui n'a pas de
désirs et d'impulsions à lui, n'a pas plus de caractère qu'une machine
à vapeur. Si, outre qu'un homme a des impulsions à lui, ces impulsions
sont fortes et placées sous le contrôle d'une volonté puissante, il a un
caractère énergique. Quiconque pense qu'on ne devrait pas encourager
l'individualité de désirs et d'impulsions à se déployer, doit soutenir aussi
que la société n'a pas besoin de natures fortes, qu'elle ne s'en trouve pas
mieux pour renfermer un grand nombre de personnes ayant du caractère,
et qu'il n'est pas à désirer de voir la moyenne des hommes posséder
beaucoup d'énergie.
Dans des sociétés naissantes, ces forces sont peut-être sans proportion
avec le pouvoir que possède la société de les discipliner et de les contrô-
ler. Il fut un temps où l'élément de spontanéité et d'individualité dominait
d'une façon excessive et où le principe social avait à lui livrer de rudes
combats.
La difficulté était alors d'amener des hommes puissants de corps ou
d'esprit à subir des règles qui prétendaient contrôler leurs impulsions.
Pour vaincre cette difficulté, la loi et la discipline (les papes par exemple
en lutte contre les empereurs) proclamèrent leur pouvoir sur l'homme
tout entier, revendiquant le droit de contrôler sa vie tout entière, afin de
pouvoir contrôler son caractère que la société ne trouvait aucun autre
moyen de contenir. Mais la société aujourd'hui a pleinement raison de
l'individualité, et le danger qui menace la nature humaine n'est plus
l'excès mais le manque d'impulsions et de goûts personnels. Les choses
ont bien changé depuis le temps où les passions des hommes puissants
par leur position ou par leurs qualités personnelles, étaient dans un état
de rébellion habituelle contre les lois et les ordonnances, et devaient être
rigoureusement enchaînées, afin que tout ce qui les entourait pût jouir
d'une certaine sécurité. À notre époque, tout homme, depuis le premier
jusqu'au dernier, vit sous le regard d'une censure hostile et redoutée.
Non seulement pour ce qui touche les autres, mais encore pour ce qui
ne touche qu'eux-mêmes, l'individu ou la famille ne se demandent pas :
« Qu'est-ce que je préfère ? Qu'est-ce qui conviendrait à mon caractère
et à mes dispositions ? Qu'est-ce qui donnerait beau jeu et le plus de
chances de croître à nos facultés les plus élevées ? Ils se demandent :
Qu'est-ce qui convient à ma situation, ou qu'est-ce que font ordinaire-
ment les personnes de ma position et de ma fortune, ou (pire encore)
que font ordinairement les personnes d'une position et d'une fortune
au-dessus de moi ? » Je ne prétends pas dire qu'ils préfèrent ce qui est la
coutume à ce qui leur plaît : il ne leur vient pas à l'idée qu'ils puissent
avoir de goût pour autre chose que ce qui est la coutume. Ainsi l'esprit
lui-même est courbé sous le joug : même dans ce que les hommes font
pour leur plaisir, la conformité est leur première pensée ; ils aiment en
masse, ne portent leur choix que sur les choses qu'on fait en général ;
ils évitent comme un crime toute singularité de goût, toute originalité de
conduite, si bien qu'à force de ne pas suivre leur naturel, ils n'ont plus de
naturel à suivre ; leurs capacités humaines sont desséchées et réduites à
rien ; ils deviennent incapables de ressentir aucun vif désir, aucun plaisir
naturel ; ils n'ont généralement ni opinions ni sentiments de leur cru, à
eux appartenant.`

const ENGLISH_COMPREHENSION_TEXT = `BRITAIN'S TOP EARNERS SURGE AHEAD AS
WEALTH DIVIDE WIDENS
the guardian.com, Friday 27 June 2014
Office for National Statistics figures contradict Osborne's claim that aus-
terity has not caused inequality.
Britain's top earners have pulled away from all other income groups, with
the top 20% of households increasing their disposable incomes last year
while all others fell. The top fifth of earners saw their annual disposable
income rise by £940, while the bottom fifth lost £381 and all other groups
lost around £250. The figures covering 2011/12 to 2012/13 appeared
to blow a hole in George Osborne's claim that its austerity policies had
done nothing to make Britain a more unequal society, according to the
Office for National Statistics (ONS).
The chancellor said in his last budget that inequality was at its lowest in
28 years and highlighted data showing that top earners had suffered more
than other groups since the financial crash. Figures from the ONS covering
the six years to 2013 show the richest fifth of households saw a 5.2% drop
in income and the average income for the poorest fifth grew by 3.5%.
But most of the drop in top pay over the six years came from a collapse
in bonuses early in the last recession, when a sharp rise in tax credit
and other benefit payments protected the incomes of the poorest. The
TUC said the last few years represented a return to the trend for growing
income inequality, and the ONS figures were proof «most people are
failing to have a fair share in the benefits of recovery».
General secretary Frances O'Grady said: «The return of rising inequality
should worry everyone as it suggests that nothing has been learned from
the financial crisis despite the huge fall in living standards that so many
people are still experiencing.»
Duncan Exley, director of the anti-poverty charity, the Equality Trust said
the figures showed the government's main measure of income inequality,
the Gini coefficient, had returned to its 2009/10 level. The Gini for dis-
posable household income is 33.2 for 2012/13, up from 32.3 in 2011/12.
He said: «By George Osborne's own measure, inequality has now risen
to the same level as before his government came to power. There is now
overwhelming evidence that the UK's unusually high inequality is dama-
ging our health, society and economy.
«We need a drastic rethink, with policies that address inequality reduc-
tion and a commitment from politicians that their policies will have a net
reduction on inequality.»
The Bank of England is among many forecasters expecting a rise in
average incomes before the end of the year to lift the living standards
of people in the middle of the income scale. So far this goal has proved
elusive as employers continue to maintain a tight grip on pay. The latest
ONS figures show pay rising by only 0.7% a year at a time when annual
inflation is up 1.5%.The coalition government can point to the protection
offered to the poorest over the last six years and the figures showing the
richest, at least in percentage terms, took the biggest hit. Those in the top
20% of households had an average income of £81,300 and paid £20,300
in taxes.
However, the better than expected mean average figures shown by the
ONS for all households, especially for the low paid, is skewed by the
over 65s, who are the biggest winners over the six years from 2007/8
to 2012/13.The average disposable incomes of retired households has
jumped 7.9% in real terms, or £1,700, since 2007/08 and the largest rise
– 14% – was among the bottom fifth. This provides much of the boost to
the average for all low income households.
To emphasize the point, the ONS figures show that excluding retired
households, disposable incomes fell overall by 6.3% on average, or
£2,100, much further than the £1,200 fall for all households. The bottom
fifth of non-retired households saw a 2% fall in incomes in contrast to
the 3.5% rise. Total taxes paid by the "squeezed middle'' 20% rose 1%
between 2011 and 2013. Cuts in tax credits and other benefits reduced
its net dependency by 17%. Nevertheless, the ONS said the UK was no
more unequal than in 2011 once all tax and benefits were taken into
account. A ratio of 15:1 in gross incomes between the highest and lowest
fifth of incomes reduces to 6.5:1 after tax and cash benefits.
Non-cash benefits, such as education and health, have been included
by the ONS for the first time. A calculation shows 52% of households
received more in benefits than they paid in taxes in 2012/13. This figure,
equal to 13.8m households, has fallen 1.5 percentage points since 2011,
though it is 8.2 percentage points higher than in 2000. For non-retired
households the proportion has fallen 1.8 percentage points - from 39.7%
in 2011 to 37.9% in 2013.`

async function main() {
  console.log('📝 Ajout des textes de compréhension aux questions...')

  // Récupérer le tag "Test Blanc 1"
  const testBlancTag = await prisma.tag.findUnique({ where: { name: 'Test Blanc 1' } })
  if (!testBlancTag) {
    console.log('❌ Tag "Test Blanc 1" non trouvé')
    return
  }

  // Récupérer toutes les questions du test blanc, triées par date de création
  const questions = await prisma.question.findMany({
    where: {
      status: 'APPROVED',
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

  console.log(`📊 ${questions.length} questions trouvées`)

  // Les questions 86-100 sont pour la compréhension écrite en français
  // Les questions 156-170 sont pour la compréhension écrite en anglais
  
  let updated = 0

  // Identifier les questions par leur position dans l'ordre de création
  // Les questions sont dans l'ordre : 1-50 (culture), 51-100 (français), 121-170 (anglais)
  // Donc : indices 0-49 = Q1-50, indices 50-99 = Q51-100, indices 100-148 = Q121-170
  
  for (let i = 0; i < questions.length; i++) {
    const question = questions[i]
    let comprehensionText: string | null = null
    let questionNumber: number | null = null

    // Questions 86-100 (indices 85-99 dans le tableau) : français
    if (i >= 85 && i < 100) {
      questionNumber = i + 1 // Q51 devient Q86 si on compte depuis le début
      comprehensionText = FRENCH_COMPREHENSION_TEXT
    }
    // Questions 156-170 (indices 155-169 dans le tableau, mais en réalité ce sont Q121-170)
    // Q121 est à l'index 100, donc Q156 est à l'index 100 + (156-121) = 135
    else if (i >= 135 && i < 149) {
      questionNumber = 121 + (i - 100) // Q121 + offset
      comprehensionText = ENGLISH_COMPREHENSION_TEXT
    }

    if (comprehensionText) {
      await prisma.question.update({
        where: { id: question.id },
        data: { comprehensionText },
      })
      updated++
      console.log(`✅ Question ${questionNumber || i + 1} (${question.id.substring(0, 8)}...) mise à jour`)
    }
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
