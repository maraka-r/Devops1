#!/bin/bash

PREVIOUS_TAG=$1

if [ -z "$PREVIOUS_TAG" ]; then
    echo "Usage: ./rollback.sh <previous-tag>"
    echo "Example: ./rollback.sh abc123def"
    exit 1
fi

echo "🔄 Rolling back to $PREVIOUS_TAG..."

ssh $EC2_USERNAME@$EC2_HOST "
    # Modifier le docker-compose pour utiliser l'ancienne image
    sed -i 's|image: .*/my-nextjs-app:.*|image: $DOCKER_HUB_USERNAME/my-nextjs-app:$PREVIOUS_TAG|' docker-compose.yml
    
    # Redéployer
    docker-compose down
    docker pull $DOCKER_HUB_USERNAME/my-nextjs-app:$PREVIOUS_TAG
    docker-compose up -d
    
    echo 'Rollback completed!'
"