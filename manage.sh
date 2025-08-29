#!/bin/bash
case $1 in
    "start")
        echo "Iniciando contenedores..."
        docker-compose up -d
        ;;
    "stop")
        echo "Deteniendo contenedores..."
        docker-compose down
        ;;
    "restart")
        echo "Reiniciando contenedores..."
        docker-compose restart
        ;;
    "logs")
        echo "Mostrando logs..."
        docker-compose logs -f
        ;;
    "status")
        echo "Estado de contenedores..."
        docker-compose ps
        ;;
    "rebuild")
        echo "Reconstruyendo contenedores..."
        docker-compose down --remove-orphans
        docker-compose up --build -d
        ;;
    *)
        echo "Uso: ./manage.sh {start|stop|restart|logs|status|rebuild}"
        ;;
esac
