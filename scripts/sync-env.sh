#!/bin/bash
# Script corrigé pour injecter les variables d'environnement

CONTAINER_NAME=$1
ENV_FILE=".env"

if [ -z "$CONTAINER_NAME" ]; then
  echo "❌ Utilisation : ./sync-env.sh <nom-du-conteneur>"
  echo "Exemple : ./sync-env.sh app-app-1"
  exit 1
fi

if [ ! -f "$ENV_FILE" ]; then
  echo "❌ Fichier $ENV_FILE introuvable."
  exit 1
fi

echo "📦 Injection des variables dans le conteneur: $CONTAINER_NAME"

# 1. Arrêter le conteneur
echo "🛑 Arrêt du conteneur..."
docker stop "$CONTAINER_NAME"

# 2. Corriger le fichier .env (résoudre les variables)
echo "🔧 Correction du fichier .env..."
TEMP_ENV="/tmp/resolved.env"

# Créer un fichier .env avec les variables résolues
while IFS='=' read -r key value; do
  # Ignore commentaires et lignes vides
  if [[ "$key" =~ ^#.*$ || -z "$key" ]]; then
    continue
  fi
  
  key=$(echo "$key" | xargs)
  value=$(echo "$value" | sed -e 's/^"//' -e 's/"$//' | xargs)
  
  # Résoudre les variables dans la valeur
  if [[ "$value" == *'${'* ]]; then
    # Exemple: postgresql://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}
    # Devient: postgresql://postgres:password123@db:5432/myapp
    
    # Lire toutes les variables du fichier pour substitution
    while IFS='=' read -r sub_key sub_value; do
      if [[ ! "$sub_key" =~ ^#.*$ && ! -z "$sub_key" ]]; then
        sub_key=$(echo "$sub_key" | xargs)
        sub_value=$(echo "$sub_value" | sed -e 's/^"//' -e 's/"$//' | xargs)
        value=${value//\$\{$sub_key\}/$sub_value}
      fi
    done < "$ENV_FILE"
  fi
  
  echo "$key=$value" >> "$TEMP_ENV"
  echo "→ $key=$value"
done < "$ENV_FILE"

# 3. Redémarrer le conteneur avec les nouvelles variables
echo "🚀 Redémarrage du conteneur avec les variables corrigées..."

# Option A: Utiliser docker run avec --env-file
CONTAINER_ID=$(docker ps -aq --filter "name=$CONTAINER_NAME")
if [ ! -z "$CONTAINER_ID" ]; then
  # Récupérer l'image du conteneur
  IMAGE=$(docker inspect --format='{{.Config.Image}}' "$CONTAINER_ID")
  
  # Arrêter et supprimer l'ancien conteneur
  docker rm -f "$CONTAINER_NAME" 2>/dev/null
  
  # Relancer avec le nouveau fichier env
  docker run -d \
    --name "$CONTAINER_NAME" \
    --network "$(basename $(pwd))_default" \
    --env-file "$TEMP_ENV" \
    -p 3000:3000 \
    "$IMAGE"
else
  echo "❌ Conteneur non trouvé"
  exit 1
fi

# # 4. Vérification
# echo "🔍 Vérification des variables chargées:"
# sleep 5

# echo "✅ Variables importantes:"
# docker exec "$CONTAINER_NAME" sh -c 'echo "DATABASE_URL: $DATABASE_URL"'
# docker exec "$CONTAINER_NAME" sh -c 'echo "DB_HOST: $DB_HOST"'
# docker exec "$CONTAINER_NAME" sh -c 'echo "NODE_ENV: $NODE_ENV"'

# 5. Test de connexion DB
echo "🗄️ Test de connexion base de données:"
docker exec "$CONTAINER_NAME" sh -c 'timeout 10 sh -c "until nc -z db 5432; do sleep 1; done" && echo "✅ DB accessible" || echo "❌ DB inaccessible"'

# Nettoyage
rm -f "$TEMP_ENV"

echo "✅ Injection terminée avec succès!"