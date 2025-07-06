#!/bin/bash

echo "🔍 Checking application health..."

# Vérifier les services Docker
echo "=== Docker Services ==="
docker-compose ps

# Vérifier les endpoints
echo "=== Health Checks ==="
curl -s http://localhost/api/health | jq '.'
curl -s http://localhost:9090/-/healthy && echo "✅ Prometheus healthy"
curl -s http://localhost:3001/api/health && echo "✅ Grafana healthy"
curl -s http://localhost:9093/-/healthy && echo "✅ Alertmanager healthy"

# Vérifier les métriques
echo "=== Metrics Sample ==="
curl -s http://localhost/api/metrics | head -20

echo "=== Resource Usage ==="
docker stats --no-stream