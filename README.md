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

## 🎯 Fonctionnalités principales

- ✅ Dashboard administrateur avec sidebar fixe et navigation intuitive
- ✅ Gestion des utilisateurs, matériels, locations et factures
- ✅ Système d'authentification JWT avec logout automatique
- ✅ API REST complète avec middleware CORS
- ✅ Scripts de seed automatiques pour dev et production
- ✅ Interface responsive et moderne
- ✅ Système de notifications en temps réel
- ✅ Monitoring avec Prometheus et Grafana

## 🔧 Corrections récentes

### ✅ UI/UX Dashboard
- Unification du layout admin avec sidebar fixe
- Correction des hooks API avec typage strict
- Amélioration de la pagination et gestion des erreurs
- Correction du composant calendar (react-day-picker v9)

### ✅ Système d'authentification
- Ajout d'une page `/logout` dédiée
- Correction du bouton de déconnexion dans la sidebar
- Gestion automatique de la redirection après logout

### ✅ Résolution CORS
- Ajout d'un middleware Next.js global pour CORS
- Configuration automatique des URLs en production
- Support des méthodes OPTIONS pour les requêtes preflight

### ✅ Scripts Prisma
- Correction du script de seed avec typage strict
- Génération automatique du client Prisma
- Intégration dans le workflow de déploiement

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
6. **Exécution automatique du seed de données**

### Configuration du déploiement

Pour configurer le déploiement, vous devez :

1. Configurer les secrets GitHub suivants (Repository Secrets) :
   - `EC2_PRIVATE_KEY` : Clé SSH privée pour accéder à l'instance EC2
   - `EC2_HOST` : Adresse IP ou DNS de l'instance EC2
   - `EC2_USERNAME` : Nom d'utilisateur SSH pour l'instance EC2

2. Configurer l'instance EC2 avec Docker et Docker Compose

3. Configurer les variables d'environnement sur l'instance EC2

## 🌐 Configuration Production

### Variables d'environnement importantes pour la production

**Remplacez ces valeurs dans votre `.env` sur le serveur de production :**

```bash
# API Configuration - Important pour CORS
NEXT_PUBLIC_API_URL=https://votre-domaine.com/api
# Ou laissez vide pour utiliser l'URL relative automatique

# Authentification - Utilisez des valeurs sécurisées
NEXTAUTH_SECRET=votre-secret-production-tres-securise
NEXTAUTH_URL=https://votre-domaine.com
JWT_SECRET=votre-jwt-secret-production-tres-securise

# Mode production
NODE_ENV=production

# Base de données production (RDS recommandé)
DB_HOST=votre-endpoint-rds.région.rds.amazonaws.com
DB_PORT=5432
DB_NAME=maraka_production
DB_USER=maraka_user
DB_PASSWORD=mot-de-passe-securise
```

### 🔧 Résolution des problèmes CORS

L'application inclut un **middleware CORS automatique** qui :

- ✅ Gère les requêtes `OPTIONS` (preflight)
- ✅ Configure les en-têtes CORS appropriés
- ✅ Utilise l'URL relative en production (`/api`) pour éviter les problèmes cross-origin

**En production :** L'API URL est automatiquement configurée comme `${window.location.origin}/api`

### 🌱 Seed automatique

Le workflow de déploiement exécute automatiquement :

```bash
npm run db:seed
```

Cela crée les données de test suivantes :
- 👥 **7 utilisateurs** (1 admin + 1 employé + 5 clients)
- 🏗️ **11 matériels** de différentes catégories
- 📅 **8 locations** avec historique
- ❤️ **5 favoris** pour tester les préférences
- 💰 **2 factures** pour les tests de facturation
- 🔔 **4 notifications** pour tester les alertes

**Comptes de test par défaut :**
- **Admin :** `admin@maraka.fr` / `password123`
- **Employé :** `employe@maraka.fr` / `password123`
- **Client :** `jean.martin@entreprise-martin.fr` / `password123`

### 🔒 Sécurité Production

**Avant de mettre en production :**

1. **Changez tous les mots de passe par défaut**
2. **Utilisez des secrets JWT/NextAuth forts et uniques**
3. **Configurez HTTPS avec un certificat SSL**
4. **Activez le firewall et limitez les ports exposés**
5. **Configurez des backups automatiques de la base de données**

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

## 🚀 Configuration de production

Pour la configuration de production, assurez-vous de :

1. Utiliser des variables d'environnement sécurisées pour toutes les clés et mots de passe sensibles.
2. Configurer correctement le groupe de sécurité de l'instance EC2 pour n'autoriser que le trafic nécessaire.
3. Mettre en place des sauvegardes automatiques pour la base de données RDS.
4. Surveiller les logs d'application et de serveur pour détecter toute activité suspecte.

## 🛡️ Sécurité

1. **Mises à jour régulières** : Assurez-vous que toutes les dépendances et l'instance EC2 sont régulièrement mises à jour avec les derniers correctifs de sécurité.
2. **Pare-feu** : Utilisez le pare-feu AWS (Security Groups) pour contrôler l'accès à votre instance EC2.
3. **SSL/TLS** : Configurez SSL/TLS pour sécuriser les communications entre le client et le serveur.
4. **Sauvegardes** : Effectuez des sauvegardes régulières de votre base de données et de votre application.

