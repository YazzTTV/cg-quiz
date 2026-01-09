# CG Quiz + Révisions espacées

Application web de quiz avec système de révisions espacées type Anki pour la culture générale.

## 🚀 Fonctionnalités

- **Authentification** : Inscription/Connexion avec email et mot de passe
- **Révisions espacées** : Système SRS avec 4 niveaux de difficulté
  - À revoir (<1m)
  - Difficile (<6m)
  - Correct (<10m)
  - Facile (3j)
- **QCM** : Questions à choix multiples (4 choix, 1 seule bonne réponse)
- **Dashboard** : Statistiques de progression et performance
- **Création de questions** : Les utilisateurs peuvent proposer leurs propres questions
- **Modération** : Interface admin pour approuver/rejeter les questions proposées
- **Import CSV** : Script de seed pour importer des questions depuis un CSV

## 📋 Prérequis

- Node.js 18+ 
- PostgreSQL
- npm ou yarn

## 🛠️ Installation

1. **Cloner le projet** (ou utiliser le dossier actuel)

2. **Installer les dépendances**
```bash
npm install
```

3. **Configurer la base de données**

Créez un fichier `.env` à la racine du projet :
```bash
cp .env.example .env
```

Éditez `.env` et configurez :
- `DATABASE_URL` : URL de connexion PostgreSQL
- `NEXTAUTH_SECRET` : Générez une clé secrète avec `openssl rand -base64 32`
- `NEXTAUTH_URL` : URL de l'application (http://localhost:3000 en dev)
- `ADMIN_EMAILS` : Emails des administrateurs (séparés par des virgules)

4. **Initialiser Prisma**

Générer le client Prisma :
```bash
npm run db:generate
```

Créer et appliquer les migrations :
```bash
npm run db:migrate
```

5. **Importer les questions (seed)**

Placez votre fichier CSV dans `data/cg.csv` avec le format :
```csv
front,back
"Question 1?","Réponse 1"
"Question 2?","Réponse 2"
```

Puis exécutez le seed :
```bash
npm run db:seed
```

Le script transforme automatiquement les paires front/back en QCM avec 4 choix (1 correct + 3 distractors générés).

## 🏃 Lancer l'application

Mode développement :
```bash
npm run dev
```

L'application sera accessible sur [http://localhost:3000](http://localhost:3000)

## 📁 Structure du projet

```
cg-quiz/
├── app/                    # Pages Next.js (App Router)
│   ├── api/               # API Routes
│   │   ├── auth/         # Authentification
│   │   ├── review/       # Système de révisions
│   │   ├── questions/    # Gestion des questions
│   │   └── admin/        # Administration
│   ├── login/            # Page de connexion
│   ├── register/         # Page d'inscription
│   ├── review/           # Page de révision
│   ├── dashboard/        # Dashboard statistiques
│   ├── create/           # Création de questions
│   └── admin/            # Interface admin
├── components/           # Composants React réutilisables
├── lib/                  # Utilitaires (Prisma, Auth)
├── prisma/               # Schéma Prisma
│   └── schema.prisma
├── scripts/              # Scripts utilitaires
│   └── seed.ts          # Script d'import CSV
├── data/                 # Données (CSV)
│   └── cg.csv
└── types/                # Types TypeScript
```

## 🗄️ Modèle de données

- **User** : Utilisateurs
- **Question** : Questions (status: APPROVED, PENDING, REJECTED)
- **Choice** : Choix de réponse (4 par question)
- **UserQuestionState** : État de révision par utilisateur (SRS)
- **Tag** : Tags/thèmes
- **QuestionTag** : Relation question-tag
- **Report** : Signalements (optionnel)

## 🔐 Authentification

L'application utilise NextAuth (Auth.js) avec le provider Credentials.

Pour créer un compte admin, ajoutez l'email dans `ADMIN_EMAILS` dans le fichier `.env`.

## 📊 Système de révisions espacées (SRS)

Le système sert les questions dans cet ordre de priorité :
1. Questions **dues** (`nextReviewAt <= now`)
2. Questions **nouvelles** (jamais vues)

Les intervalles de révision sont fixes :
- **À revoir** : 1 minute
- **Difficile** : 6 minutes
- **Correct** : 10 minutes
- **Facile** : 3 jours

## ⌨️ Raccourcis clavier

Sur la page de révision :
- **1-4** : Sélectionner un choix
- **A** : À revoir
- **H** : Difficile
- **G** : Correct
- **E** : Facile

## 🚢 Déploiement

### Vercel + Neon/Supabase

1. **Base de données** : Créez une base PostgreSQL sur [Neon](https://neon.tech) ou [Supabase](https://supabase.com)

2. **Vercel** :
   - Connectez votre repo GitHub à Vercel
   - Configurez les variables d'environnement :
     - `DATABASE_URL`
     - `NEXTAUTH_SECRET`
     - `NEXTAUTH_URL` (URL de votre app Vercel)
     - `ADMIN_EMAILS`

3. **Migrations** : Vercel exécutera automatiquement `prisma generate` lors du build. Pour les migrations, vous pouvez :
   - Les exécuter manuellement après le déploiement
   - Utiliser un script de post-deploy dans Vercel

4. **Seed** : Exécutez le seed manuellement après le premier déploiement :
```bash
npm run db:seed
```

## 🧪 Tests

Tests manuels recommandés :
1. Inscription/Connexion
2. Révision d'une question
3. Réponse et scheduling
4. Création d'une question
5. Approbation admin
6. Vérification que la question apparaît dans les révisions

## 📝 Notes

- Le script de seed génère automatiquement 3 distractors (mauvaises réponses) à partir de la réponse correcte
- Les questions créées par les utilisateurs ont le status `PENDING` et nécessitent une approbation admin
- Le système évite de répéter les mêmes questions dans une session (cooldown de 20 questions)

## 🔄 Évolutions futures (V2)

- Tags/thèmes avancés
- Mode examen (chrono, score)
- Import/export CSV
- Algorithme SRS avancé (SM-2)
- Statistiques détaillées par thème

## 📄 Licence

MIT
