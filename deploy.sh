#!/bin/bash
echo "🚀 Desplegando proyecto..."
docker-compose down --remove-orphans 2>/dev/null || true
docker-compose up --build -d
if [ $? -eq 0 ]; then
    echo "✅ Proyecto desplegado correctamente"
    echo "🌐 Acceso: http://localhost:${PROJECT_PORT}"
else
    echo "❌ Error en el despliegue"
    docker-compose logs
fi
