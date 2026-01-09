# Configuration des variables d'environnement

Créez un fichier `.env` à la racine du projet avec le contenu suivant :

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/cg_quiz?schema=public"

# NextAuth
NEXTAUTH_SECRET="your-secret-key-here-generate-with-openssl-rand-base64-32"
NEXTAUTH_URL="http://localhost:3000"

# Admin emails (comma-separated)
ADMIN_EMAILS="admin@example.com"
```

## Génération de NEXTAUTH_SECRET

Pour générer une clé secrète sécurisée, utilisez :

```bash
openssl rand -base64 32
```

Ou en ligne de commande Node.js :

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

## Configuration de la base de données

### PostgreSQL local

1. Installez PostgreSQL
2. Créez une base de données :
```sql
CREATE DATABASE cg_quiz;
```

3. Mettez à jour `DATABASE_URL` :
```
DATABASE_URL="postgresql://postgres:password@localhost:5432/cg_quiz?schema=public"
```

### Neon (cloud)

1. Créez un compte sur [neon.tech](https://neon.tech)
2. Créez un nouveau projet
3. Copiez la connection string et utilisez-la comme `DATABASE_URL`

### Supabase (cloud)

1. Créez un projet sur [supabase.com](https://supabase.com)
2. Allez dans Settings > Database
3. Copiez la connection string et utilisez-la comme `DATABASE_URL`

## Configuration sur Vercel

Pour déployer sur Vercel, vous devez configurer les variables d'environnement dans le dashboard Vercel :

### Méthode 1 : Via le Dashboard Vercel (recommandé)

1. Allez sur [vercel.com](https://vercel.com) et connectez-vous
2. Sélectionnez votre projet `cg-quiz`
3. Allez dans **Settings** > **Environment Variables**
4. Ajoutez les variables suivantes :

| Variable | Valeur | Description |
|----------|--------|-------------|
| `DATABASE_URL` | `postgresql://...` | URL de connexion à votre base de données PostgreSQL (Neon, Supabase, etc.) |
| `NEXTAUTH_SECRET` | `v6ox90F/hDEqFoC7Ibrl8gZ5NjU03hCs1OuZxOXtoFY=` | Clé secrète pour NextAuth (générez-en une nouvelle avec `openssl rand -base64 32`) |
| `NEXTAUTH_URL` | `https://cg-quiz-96ieuyjna-noahs-projects-6c1762cf.vercel.app` | URL de votre application Vercel (remplacez par votre URL) |
| `ADMIN_EMAILS` | `votre-email@example.com` | Emails des administrateurs (séparés par des virgules) |

5. Sélectionnez **Production**, **Preview**, et **Development** pour chaque variable
6. Cliquez sur **Save**
7. **Redéployez** votre application pour que les variables soient prises en compte

### Méthode 2 : Via le CLI Vercel

```bash
# Configurer les variables d'environnement
vercel env add DATABASE_URL production
vercel env add NEXTAUTH_SECRET production
vercel env add NEXTAUTH_URL production
vercel env add ADMIN_EMAILS production

# Redéployer
vercel --prod
```

### Important : Base de données en production

**Vous devez utiliser une base de données cloud**, pas `localhost` :

- **Neon** (recommandé) : [neon.tech](https://neon.tech) - Gratuit jusqu'à 0.5 GB
- **Supabase** : [supabase.com](https://supabase.com) - Gratuit jusqu'à 500 MB
- **Railway** : [railway.app](https://railway.app) - Gratuit avec crédits
- **Vercel Postgres** : Disponible directement dans Vercel

### Exemple de DATABASE_URL (Neon)

```
postgresql://user:password@ep-xxx-xxx.region.aws.neon.tech/dbname?sslmode=require
```

### Après configuration

1. **Exécutez les migrations** sur votre base de données de production :
```bash
# Connectez-vous à votre base de données et exécutez
DATABASE_URL="votre-url-production" npx prisma migrate deploy
```

2. **Optionnel : Seed la base de données** :
```bash
DATABASE_URL="votre-url-production" npm run db:seed
```

### Vérification

Après avoir configuré les variables et redéployé, vérifiez que tout fonctionne :
- L'inscription/connexion fonctionne
- Les questions s'affichent
- Les révisions fonctionnent

