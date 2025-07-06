#!/bin/bash
echo "🔄 Redeploying application..."
docker-compose down
docker-compose up -d --build
echo "✅ Done! Check http://your-ec2-ip"