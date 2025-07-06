# Maraka - Next.js Fullstack Application

Application fullstack basée sur Next.js avec PostgreSQL, Prisma, CI/CD et monitoring complet.

## 📋 Vue d'ensemble

Ce projet est une application fullstack qui comprend :
- **Frontend** : Next.js avec React
- **Backend** : API Routes Next.js
- **Base de données** : PostgreSQL avec Prisma ORM
- **Conteneurisation** : Docker et Docker Compose
- **CI/CD** : GitHub Actions pour déploiement sur AWS EC2 (build direct sur EC2)
- **Monitoring** : Grafana et Prometheus

## 🚀 Guide de démarrage

### Prérequis

- Node.js 18 ou supérieur
- Docker et Docker Compose
- Git
- Compte AWS avec accès RDS et EC2

### Configuration de l'environnement de développement

1. **Cloner le dépôt**
   ```bash
   git clone <url-du-repo>
   cd maraka
   ```

2. **Installer les dépendances**
   ```bash
   npm install
   ```

3. **Configurer les variables d'environnement**
   ```bash
   cp .env.example .env
   ```
   
   Modifiez le fichier `.env` avec vos propres valeurs :
   - `DATABASE_URL` : URL de connexion construite à partir des variables DB_*
   - `NEXTAUTH_SECRET` : Clé secrète pour l'authentification
   - `NEXTAUTH_URL` : URL de base de l'application
   - Variables AWS pour le déploiement
   - Variables RDS pour la connexion à la base de données
   - Autres variables spécifiques à votre application

4. **Générer le client Prisma**
   ```bash
   npx prisma generate
   ```

5. **Démarrer l'application en mode développement**
   ```bash
   npm run dev
   ```
   L'application sera disponible à l'adresse [http://localhost:3000](http://localhost:3000).

### Démarrage avec Docker

```bash
# Construire et démarrer tous les services
docker-compose up -d

# Arrêter tous les services
docker-compose down
```

## 💻 Structure du projet

```
/
├── .github/          # Configuration GitHub Actions
├── grafana/          # Configuration et dashboards Grafana
├── prisma/           # Schéma et migrations Prisma
├── public/           # Fichiers statiques
├── src/              # Code source
│   ├── app/         # Routes Next.js (App Router)
│   ├── components/   # Composants React
│   ├── lib/         # Bibliothèques et utilitaires
│   └── styles/      # Fichiers CSS/SCSS
├── .env.example     # Exemple de variables d'environnement
├── alertmanager.yml  # Configuration Alertmanager
├── docker-compose.yml # Configuration Docker Compose
├── Dockerfile       # Configuration Docker
├── package.json     # Dépendances et scripts
├── prometheus.yml   # Configuration Prometheus
└── README.md        # Documentation
```

## 📊 Commandes principales

### Développement

```bash
# Démarrer en mode développement
npm run dev

# Construire l'application
npm run build

# Démarrer l'application construite
npm start

# Lancer les tests
npm test

# Lancer le linter
npm run lint
```

### Base de données (Prisma)

```bash
# Générer le client Prisma
npx prisma generate

# Créer une migration
npx prisma migrate dev --name nom_de_la_migration

# Appliquer les migrations
npx prisma migrate deploy

# Visualiser la base de données avec Prisma Studio
npx prisma studio
```

### Docker

```bash
# Construire l'image Docker
docker build -t maraka-app .

# Exécuter l'image Docker
docker run -p 3000:3000 maraka-app
```

## 🛠️ Déploiement

Le déploiement est automatisé via GitHub Actions. Lorsque vous poussez du code sur la branche `main`, le workflow suivant est exécuté :

1. Exécution des tests
2. Création d'un package de déploiement
3. Transfert des fichiers vers EC2
4. Construction de l'image Docker directement sur EC2
5. Démarrage des services avec Docker Compose

### Configuration du déploiement

Pour configurer le déploiement, vous devez :

1. Configurer les secrets GitHub suivants (Repository Secrets) :
   - `EC2_PRIVATE_KEY` : Clé SSH privée pour accéder à l'instance EC2
   - `EC2_HOST` : Adresse IP ou DNS de l'instance EC2
   - `EC2_USERNAME` : Nom d'utilisateur SSH pour l'instance EC2

2. Configurer l'instance EC2 avec Docker et Docker Compose

3. Configurer les variables d'environnement sur l'instance EC2

## 💰 Variables d'environnement

### Variables pour le développement local (.env)

```
# Base de données
DATABASE_URL=postgresql://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}

# Next Auth
NEXTAUTH_SECRET=votre-clé-secrète
NEXTAUTH_URL=http://localhost:3000

# RDS (pour production)
DB_HOST=votre-endpoint-rds
DB_PORT=5432
DB_NAME=nom-de-votre-db
DB_USER=utilisateur-db
DB_PASSWORD=mot-de-passe-db
```

### Variables pour AWS RDS

Pour configurer une base de données RDS sur AWS :

1. Créez une instance RDS PostgreSQL via la console AWS
2. Notez les informations suivantes :
   - Endpoint (DB_HOST)
   - Port (DB_PORT, généralement 5432)
   - Nom de la base de données (DB_NAME)
   - Nom d'utilisateur (DB_USER)
   - Mot de passe (DB_PASSWORD)

### Déclenchement du déploiement

Poussez vos modifications sur la branche `main` pour déclencher le déploiement automatique.

## 📊 Monitoring

### Accès aux dashboards

- **Grafana** : http://votre-ec2-ip:3001 (utilisateur: admin, mot de passe: admin123)
- **Prometheus** : http://votre-ec2-ip:9090

### Vérification de l'état du système

```bash
./scripts/check-health.sh
```

## 🛠️ Développement de fonctionnalités

### Frontend

Pour développer de nouvelles pages ou composants :
1. Créez les composants dans `src/app/`
2. Utilisez le système de routing de Next.js App Router

### Backend (API)

Pour développer de nouvelles API :
1. Créez de nouveaux endpoints dans `src/app/api/`
2. Suivez le modèle des endpoints existants (health, metrics)

### Modèles de données

Pour modifier le schéma de la base de données :
1. Modifiez `prisma/schema.prisma`
2. Exécutez `npm run db:migrate` pour créer une migration
3. Donnez un nom descriptif à votre migration

## ⚠️ Points d'attention

1. **Nginx** : Le service Nginx est présent dans le docker-compose.yml mais n'est pas nécessaire selon les spécifications initiales. Vous pouvez le supprimer si vous n'en avez pas besoin.

2. **Variables sensibles** : Ne stockez jamais de secrets directement dans les fichiers de configuration. Utilisez toujours les variables d'environnement ou les secrets GitHub.

3. **Monitoring** : La configuration actuelle est complète mais peut être simplifiée si tous les exporters ne sont pas nécessaires.

