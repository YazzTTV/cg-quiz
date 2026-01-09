# Dépannage de la connexion à la base de données Supabase

## Problème
Erreur : `Can't reach database server at aws-1-eu-central-1.pooler.supabase.com:5432`

## Solutions possibles

### 1. Vérifier que le projet Supabase est actif
- Allez sur [supabase.com](https://supabase.com)
- Vérifiez que votre projet n'est pas en pause
- Si le projet est en pause, réactivez-le

### 2. Vérifier les credentials
- Allez dans Settings > Database de votre projet Supabase
- Vérifiez que le mot de passe est correct
- Si nécessaire, réinitialisez le mot de passe

### 3. Utiliser l'URL de connexion directe (recommandé pour Prisma)
Pour Prisma, utilisez l'URL de connexion **directe** (pas le pooler) :

Dans Supabase : Settings > Database > Connection string > **Direct connection**

L'URL devrait ressembler à :
```
postgresql://postgres:[PASSWORD]@aws-1-eu-central-1.pooler.supabase.com:5432/postgres?sslmode=require
```

Mais remplacez `pooler` par l'URL directe si disponible, ou utilisez le port 5432 avec l'URL directe.

### 4. Utiliser le pooler avec le bon port
Si vous devez utiliser le pooler, utilisez le port **6543** au lieu de 5432 :

```
postgresql://postgres:[PASSWORD]@aws-1-eu-central-1.pooler.supabase.com:6543/postgres?sslmode=require&pgbouncer=true
```

### 5. Vérifier les paramètres de connexion
Ajoutez ces paramètres à votre URL :
- `?sslmode=require` (déjà présent)
- `?connection_limit=1` (pour Prisma)
- `?pgbouncer=true` (si vous utilisez le pooler)

### 6. Tester la connexion
```bash
# Tester avec psql
psql "postgresql://postgres:[PASSWORD]@aws-1-eu-central-1.pooler.supabase.com:5432/postgres?sslmode=require"

# Tester avec Prisma
npx prisma db pull
```

### 7. Alternative : Utiliser Neon
Si Supabase continue de poser problème, vous pouvez migrer vers Neon :
1. Créez un compte sur [neon.tech](https://neon.tech)
2. Créez un nouveau projet
3. Copiez la connection string
4. Mettez à jour `DATABASE_URL` dans `.env`
5. Exécutez les migrations : `npx prisma migrate deploy`
