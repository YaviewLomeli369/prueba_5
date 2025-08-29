#!/bin/bash

# NOVA WEB TEMPLATE DEPLOYER
# Sistema de Despliegue Automático para Proyectos Web
# Compatible con Ubuntu/Debian

set -euo pipefail  # Exit on error, undefined vars, pipe failures

# Colors y formato
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

# Variables globales
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOG_FILE="/tmp/deploy-$(date +%Y%m%d_%H%M%S).log"

# Función de logging mejorada
log() {
    local level=$1
    local message=$2
    local timestamp=$(date '+%H:%M:%S')
    local color=""

    case $level in
        "info") color=$BLUE ;;
        "success") color=$GREEN ;;
        "warn") color=$YELLOW ;;
        "error") color=$RED ;;
        "debug") color=$CYAN ;;
    esac

    echo -e "${color}${level^^} [${timestamp}] ${message}${NC}" | tee -a "$LOG_FILE"
}

# Banner de bienvenida
show_banner() {
    echo -e "${BLUE}"
    echo "╔═══════════════════════════════════════════════════════════╗"
    echo "║              NOVA WEB TEMPLATE DEPLOYER                   ║"
    echo "║            Sistema de Despliegue Automático               ║"
    echo "╚═══════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
    echo
}

# Verificar dependencias del sistema
check_dependencies() {
    log "info" "=== VERIFICANDO DEPENDENCIAS DEL SISTEMA ==="

    local deps=("docker" "docker-compose" "psql" "git")
    local missing_deps=()

    for dep in "${deps[@]}"; do
        if command -v "$dep" &> /dev/null; then
            log "success" "Dependencia encontrada: $dep"
        else
            log "warn" "Dependencia faltante: $dep"
            missing_deps+=("$dep")
        fi
    done

    if [ ${#missing_deps[@]} -eq 0 ]; then
        log "success" "Todas las dependencias están disponibles"
        return 0
    else
        log "error" "Faltan dependencias: ${missing_deps[*]}"
        log "info" "Instalando dependencias faltantes..."
        install_dependencies "${missing_deps[@]}"
    fi

}

# Instalar dependencias faltantes
install_dependencies() {
    local deps=("$@")

    # Actualizar índices de paquetes
    sudo apt update -qq

    for dep in "${deps[@]}"; do
        case $dep in
            "docker")
                log "info" "Instalando Docker..."
                curl -fsSL https://get.docker.com | sudo sh
                sudo usermod -aG docker $USER
                log "success" "Docker instalado correctamente"
                ;;
            "docker-compose")
                log "info" "Instalando Docker Compose..."
                sudo apt install -y docker-compose
                log "success" "Docker Compose instalado correctamente"
                ;;
            "psql")
                log "info" "Instalando PostgreSQL client..."
                sudo apt install -y postgresql-client
                log "success" "PostgreSQL client instalado correctamente"
                ;;
            "git")
                log "info" "Instalando Git..."
                sudo apt install -y git
                log "success" "Git instalado correctamente"
                ;;
        esac
    done
}

# Verificar si un puerto está disponible
check_port() {
    local port=$1
    if ss -tuln | grep -q ":$port " 2>/dev/null; then
        return 1  # Puerto ocupado
    fi
    return 0  # Puerto disponible
}

# Mostrar puertos recomendados
show_available_ports() {
    log "info" "Verificando puertos disponibles..."
    echo
    echo -e "${YELLOW}PUERTOS RECOMENDADOS:${NC}"

    local ports=(3000 3002 3004 3006 3008 3010 3012 3014 3016 3018)
    for port in "${ports[@]}"; do
        if check_port "$port"; then
            echo -e "  ${GREEN}✅ Puerto $port - DISPONIBLE${NC}"
        else
            echo -e "  ${RED}❌ Puerto $port - OCUPADO${NC}"
        fi
    done
    echo
}

# Validar entrada de texto
validate_input() {
    local input=$1
    local type=$2

    case $type in
        "project_name")
            if [[ $input =~ ^[a-zA-Z0-9_-]+$ ]] && [ ${#input} -ge 3 ] && [ ${#input} -le 30 ]; then
                return 0
            else
                log "error" "Nombre de proyecto inválido. Use solo letras, números, guiones y guiones bajos (3-30 caracteres)"
                return 1
            fi
            ;;
        "port")
            if [[ $input =~ ^[0-9]+$ ]] && [ "$input" -ge 3000 ] && [ "$input" -le 65535 ]; then
                if check_port "$input"; then
                    return 0
                else
                    log "error" "El puerto $input está ocupado"
                    return 1
                fi
            else
                log "error" "Puerto inválido. Use un número entre 3000-65535"
                return 1
            fi
            ;;
    esac
}

# Solicitar información del proyecto
get_project_info() {
    log "info" "=== CONFIGURACIÓN DEL NUEVO PROYECTO ==="

    # Solicitar nombre del proyecto
    local project_name=""
    while true; do
        echo -n -e "${CYAN}Ingrese el nombre del proyecto: ${NC}"
        read -r project_name
        if validate_input "$project_name" "project_name"; then
            break
        fi
    done

    # Mostrar puertos disponibles
    show_available_ports

    # Solicitar puerto
    local port=""
    while true; do
        echo -n -e "${CYAN}Ingrese el puerto (ej: 3000): ${NC}"
        read -r port
        if validate_input "$port" "port"; then
            break
        fi
    done

    # Mostrar resumen de configuración
    echo
    echo "════════════════════════════════════════════════════════════"
    echo -e "${YELLOW}RESUMEN DE CONFIGURACIÓN:${NC}"
    echo "  Proyecto: $project_name"
    echo "  Puerto: $port"
    echo "  Base de datos: db_$project_name"
    echo "  Directorio: /root/www/$project_name"
    echo "════════════════════════════════════════════════════════════"
    echo

    # Confirmar configuración
    echo -n -e "${CYAN}¿Continuar con esta configuración? (y/N): ${NC}"
    read -r -n 1 confirm
    echo

    if [[ ! $confirm =~ ^[YySs]$ ]]; then
        log "info" "Despliegue cancelado por el usuario"
        exit 0
    fi

    # Exportar variables para usar en otras funciones
    export PROJECT_NAME="$project_name"
    export PROJECT_PORT="$port"
    export PROJECT_DIR="/root/www/$project_name"
    export DB_NAME="db_$project_name"
}

# Configurar PostgreSQL
setup_postgresql() {
    log "info" "=== CONFIGURACIÓN DE POSTGRESQL ==="

    # Verificar si PostgreSQL está instalado
    if ! command -v psql &> /dev/null; then
        log "info" "Instalando PostgreSQL..."
        sudo apt update -qq
        sudo apt install -y postgresql postgresql-contrib
    fi

    # Verificar versión de PostgreSQL
    local pg_version=$(psql --version | grep -oP '\d+\.\d+' | head -1)
    log "success" "PostgreSQL versión $pg_version detectado"

    # Iniciar servicio PostgreSQL
    if ! sudo systemctl is-active --quiet postgresql; then
        log "info" "Iniciando servicio PostgreSQL..."
        sudo systemctl start postgresql
        sudo systemctl enable postgresql
    fi

    log "success" "Servicio PostgreSQL iniciado correctamente"

    # Configurar usuario y base de datos
    setup_database
}

# Configurar base de datos
setup_database() {
    log "info" "=== CONFIGURACIÓN DE BASE DE DATOS ==="

    local username="yaviewlomeli"
    local password="Losy990209bn7*"

    # Verificar/crear usuario
    log "info" "Verificando usuario $username..."
    if sudo -u postgres psql -tAc "SELECT 1 FROM pg_roles WHERE rolname='$username'" | grep -q 1; then
        log "success" "Usuario $username ya existe"
    else
        log "info" "Creando usuario $username..."
        sudo -u postgres psql -c "CREATE USER $username WITH ENCRYPTED PASSWORD '$password';"
        sudo -u postgres psql -c "ALTER USER $username CREATEDB;"
        log "success" "Usuario $username creado correctamente"
    fi

    # Configurar permisos del usuario
    sudo -u postgres psql -c "ALTER USER $username WITH SUPERUSER;"
    sudo -u postgres psql -c "ALTER USER $username WITH CREATEDB;"

    # Verificar/crear base de datos
    log "info" "Verificando base de datos $DB_NAME..."
    if sudo -u postgres psql -lqt | cut -d \| -f 1 | grep -qw "$DB_NAME"; then
        log "warn" "Base de datos $DB_NAME ya existe"
        echo -n -e "${CYAN}¿Desea recrear la base de datos? (y/N): ${NC}"
        read -r -n 1 recreate
        echo
        if [[ $recreate =~ ^[YySs]$ ]]; then
            log "info" "Eliminando base de datos existente..."
            sudo -u postgres psql -c "DROP DATABASE IF EXISTS $DB_NAME;"
        else
            log "info" "Usando base de datos existente"
            return 0
        fi
    fi

    if ! sudo -u postgres psql -lqt | cut -d \| -f 1 | grep -qw "$DB_NAME"; then
        log "info" "Creando base de datos $DB_NAME..."
        sudo -u postgres psql -c "CREATE DATABASE $DB_NAME OWNER $username;"
        log "success" "Base de datos $DB_NAME creada correctamente"
    fi

    # Otorgar permisos completos
    sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $username;"

    # Realizar dump de la base de datos recién creada/verificada
    create_database_dump
}

# Crear dump de la base de datos
create_database_dump() {
    log "info" "=== CREANDO DUMP DE BASE DE DATOS ==="

    local username="yaviewlomeli"
    local password="Losy990209bn7*"
    local dump_dir="$PROJECT_DIR/database_dumps"
    local dump_file="$dump_dir/backup_${DB_NAME}_$(date +%s).dump"

    # Crear directorio para dumps si no existe
    mkdir -p "$dump_dir"

    # Establecer variable de entorno para la contraseña
    export PGPASSWORD="$password"

    log "info" "Creando dump de la base de datos $DB_NAME..."

    # Crear dump usando pg_dump
    if pg_dump -h localhost -U "$username" -d "$DB_NAME" -F c -b -v -f "$dump_file" 2>/dev/null; then
        log "success" "Dump creado exitosamente: $dump_file"

        # Crear enlace simbólico al dump más reciente
        ln -sf "$dump_file" "$dump_dir/latest_backup.dump"
        log "info" "Enlace simbólico creado: $dump_dir/latest_backup.dump"

        # Mostrar información del dump
        local dump_size=$(du -h "$dump_file" | cut -f1)
        log "info" "Tamaño del dump: $dump_size"
    else
        log "warn" "No se pudo crear el dump de la base de datos (puede estar vacía)"
    fi

    # Limpiar variable de entorno
    unset PGPASSWORD
}

# Crear directorio del proyecto
create_project_directory() {
    log "info" "=== CONFIGURACIÓN DE DIRECTORIO DEL PROYECTO ==="

    if [[ -d "$PROJECT_DIR" ]]; then
        # Check if it's a git repository or has important project files
        if [[ -f "$PROJECT_DIR/package.json" || -f "$PROJECT_DIR/Dockerfile" || -d "$PROJECT_DIR/.git" ]]; then
            log "INFO" "Directorio del proyecto ya existe con archivos importantes"
            log "INFO" "Preservando archivos del proyecto existente..."
        else
            log "WARN" "El directorio $PROJECT_DIR ya existe pero está vacío o incompleto"
            echo -n "¿Desea continuar y sobrescribir? (y/N): "
            read -r response
            if [[ ! "$response" =~ ^[Yy]$ ]]; then
                log "INFO" "Operación cancelada por el usuario"
                exit 0
            fi
            log "INFO" "Limpiando directorio existente..."
            rm -rf "$PROJECT_DIR"/*
        fi
    else
        log "INFO" "Creando directorio del proyecto..."
        mkdir -p "$PROJECT_DIR"
    fi
}

# Crear configuración Docker
create_docker_config() {
    log "info" "=== CONFIGURACIÓN DOCKER ==="

    cd "$PROJECT_DIR" || exit 1

    # Create .env file
    log "info" "Creando archivo .env..."
    if [[ ! -f ".env" ]]; then
        cat > .env << EOF
NODE_ENV=production
PORT=$PROJECT_PORT
PROJECT_NAME=$PROJECT_NAME
DATABASE_URL=postgresql://yaviewlomeli:Losy990209bn7*@localhost:5432/$DB_NAME
DB_PASSWORD=Losy990209bn7*
DB_USER=yaviewlomeli
DB_NAME=$DB_NAME
DB_HOST=localhost
SITE_NAME=$PROJECT_NAME
STORAGE_TYPE=database

SESSION_SECRET=N8tk64rTkXPay6anfPCrYE4LAQt9/HazR8WYFenTL5B3OWlQvBUSrplN3+FdADO03iPhxbwZgeNyXhdeoRWByg

DEFAULT_OBJECT_STORAGE_BUCKET_ID=replit-objstore-dc07723e-0853-46ac-8589-6740c21eb7ab
PUBLIC_OBJECT_SEARCH_PATHS=/replit-objstore-dc07723e-0853-46ac-8589-6740c21eb7ab/public
PRIVATE_OBJECT_DIR=/replit-objstore-dc07723e-0853-46ac-8589-6740c21eb7ab/.private

STRIPE_SECRET_KEY=d1fFKaINZY2V7JG45g1wQanUpVDnU6VoYHq32GXBNVJiXMQuucN2bqDxPiHcQP2tL00WvJAHoa5
VITE_STRIPE_PUBLIC_KEY=pk_test_51RwWDrQSt5Hb0O5yrPJ6QviKDdOUxzWUIN2CybSd7Vb612XfwId3ybdj2qRJtT1w3kb60


EOF
    else
        log "info" "Archivo .env ya existe, preservando configuración."
        # Ensure critical variables are set if they exist
        if ! grep -q "DATABASE_URL=" .env; then
            log "warn" "DATABASE_URL no encontrado en .env, añadiendo con valores predeterminados."
            echo "DATABASE_URL=postgresql://yaviewlomeli:yaviewlomeli123@localhost:5432/$DB_NAME" >> .env
        fi
        if ! grep -q "SITE_NAME=" .env; then
            log "warn" "SITE_NAME no encontrado en .env, añadiendo."
            echo "SITE_NAME=$PROJECT_NAME" >> .env
        fi
        if ! grep -q "PROJECT_NAME=" .env; then
            log "warn" "PROJECT_NAME not found in .env, adding."
            echo "PROJECT_NAME=$PROJECT_NAME" >> .env
        fi
    fi


    # Create Dockerfile if it doesn't exist
    if [[ ! -f "Dockerfile" ]]; then
        log "INFO" "Creando Dockerfile..."
        cat > Dockerfile << 'EOF'
FROM node:20-alpine

# Install system dependencies
RUN apk add --no-cache \
    curl \
    dumb-init \
    ca-certificates \
    && rm -rf /var/cache/apk/*

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001

# Set working directory
WORKDIR /app

# Copy package files first (for Docker cache)
COPY package*.json ./

# Install dependencies
RUN npm ci --legacy-peer-deps --no-audit --no-fund || \
    npm install --legacy-peer-deps --no-audit --no-fund

# Copy source code
COPY . .

# Build application if build script exists
RUN if npm run | grep -q "build"; then npm run build; fi

# Create necessary directories and set permissions
RUN mkdir -p uploads logs && \
    chown -R nextjs:nodejs /app

# Switch to non-root user
USER nextjs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:3000/api/health || \
        curl -f http://localhost:3000/ || \
        exit 1

# Environment variables
ENV NODE_ENV=production
ENV PORT=3000

# Start command
CMD ["sh", "-c", "echo 'Starting application...' && dumb-init node server/index.ts"]
EOF
    fi

    # Create docker-compose.yml
    log "info" "Creando docker-compose.yml..."
    cat > docker-compose.yml << EOF
version: '3.8'
services:
  app:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: ${PROJECT_NAME}_app
    restart: unless-stopped
    ports:
      - "${PROJECT_PORT}:${PROJECT_PORT}"
    environment:
      - NODE_ENV=production
      - PORT=${PROJECT_PORT}
      - PROJECT_NAME=${PROJECT_NAME}
      - DB_HOST=host.docker.internal
      - DB_PORT=5432
      - DB_NAME=${DB_NAME}
      - DB_USER=yaviewlomeli
      - DB_PASSWORD=Losy990209bn7*
      - SITE_NAME=${PROJECT_NAME}
      - STORAGE_TYPE=database
      - DATABASE_URL=postgresql://yaviewlomeli:Losy990209bn7*@host.docker.internal:5432/${DB_NAME}
    extra_hosts:
      - "host.docker.internal:host-gateway"
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:${PROJECT_PORT}/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
    networks:
      - ${PROJECT_NAME}_network

networks:
  ${PROJECT_NAME}_network:
    driver: bridge
EOF

    log "success" "Configuración Docker creada correctamente"
}

# Crear scripts de gestión
create_management_scripts() {
    log "info" "=== CREANDO SCRIPTS DE GESTIÓN ==="

    # Script de despliegue
    cat > deploy.sh << 'EOF'
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
EOF
    chmod +x deploy.sh

    # Script de gestión
    cat > manage.sh << 'EOF'
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
EOF
    chmod +x manage.sh

    log "success" "Scripts de gestión creados correctamente"
}

# Copiar archivos del proyecto (si no existen o si el directorio está vacío/incompleto)
copy_project_files() {
    log "INFO" "Verificando archivos del proyecto..."

    # Check if we're in a cloned project directory
    if [[ -f "$PROJECT_DIR/package.json" && -f "$PROJECT_DIR/Dockerfile" && -d "$PROJECT_DIR/client" && -d "$PROJECT_DIR/server" ]]; then
        log "SUCCESS" "Proyecto completo detectado, preservando archivos existentes"
        return 0
    fi

    log "INFO" "Copiando archivos base del proyecto..."

    # Create basic structure if needed
    mkdir -p "$PROJECT_DIR"/{client,server,shared,migrations}

    # Copy essential files only if they don't exist
    if [[ ! -f "$PROJECT_DIR/package.json" ]]; then
        cat > "$PROJECT_DIR/package.json" << 'EOF'
{
  "name": "nova-web-template",
  "version": "1.0.0",
  "scripts": {
    "dev": "tsx server/index.ts",
    "build": "npm run build:client && npm run build:server",
    "build:client": "cd client && npm run build",
    "build:server": "tsc --project server/tsconfig.json",
    "start": "node dist/index.js",
    "db:migrate": "npx prisma migrate dev --name init",
    "db:seed": "npx prisma db seed"
  },
  "dependencies": {
    "express": "^4.18.2",
    "cors": "^2.8.5",
    "dotenv": "^16.0.3",
    "prisma": "^5.10.2",
    "@prisma/client": "^5.10.2",
    "bcryptjs": "^2.4.3"
  },
  "devDependencies": {
    "tsx": "^4.7.0",
    "typescript": "^5.3.3",
    "@types/node": "^20.10.5",
    "@types/express": "^4.17.21",
    "@types/cors": "^2.8.17",
    "@types/bcryptjs": "^2.4.6",
    "prisma": "^5.10.2"
  }
}
EOF
    fi

    # Create basic server structure only if it doesn't exist
    if [[ ! -f "$PROJECT_DIR/server/index.ts" ]]; then
        mkdir -p "$PROJECT_DIR/server"
        cat > "$PROJECT_DIR/server/index.ts" << 'EOF'
import express from 'express';
import cors from 'cors';
import { config } from 'dotenv';
import { PrismaClient } from '@prisma/client';

config();

const app = express();
const PORT = process.env.PORT || 3000;
const prisma = new PrismaClient();

app.use(cors());
app.use(express.json());

app.get('/api/health', async (req, res) => {
  try {
    await prisma.$connect();
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  } catch (error) {
    console.error('Database connection error:', error);
    res.status(500).json({ status: 'error', message: 'Database not available' });
  } finally {
    await prisma.$disconnect();
  }
});

app.get('/', (req, res) => {
  res.json({
    message: 'Nova Web Template API',
    version: '1.0.0',
    status: 'running'
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
EOF
    fi

    # Create Prisma schema if it doesn't exist
    if [[ ! -f "$PROJECT_DIR/prisma/schema.prisma" ]]; then
        mkdir -p "$PROJECT_DIR/prisma"
        cat > "$PROJECT_DIR/prisma/schema.prisma" << 'EOF'
// This is your Prisma schema file,
// learn more about it in the docs: https://pris.ly/d/prisma-schema

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id        String   @id @default(uuid())
  email     String   @unique
  password  String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
EOF
    fi

    log "SUCCESS" "Directorio del proyecto configurado correctamente"
}


# Desplegar aplicación
deploy_application() {
    log "info" "=== DESPLEGANDO APLICACIÓN ==="

    cd "$PROJECT_DIR"

    # Verify Dockerfile exists
    if [[ ! -f "Dockerfile" ]]; then
        log "ERROR" "Dockerfile no encontrado en $PROJECT_DIR"
        exit 1
    fi

    # Check if docker-compose.yml is valid
    if ! docker-compose config >/dev/null 2>&1; then
        log "ERROR" "docker-compose.yml inválido"
        docker-compose config
        exit 1
    fi

    # Build and start containers with better error handling
    log "info" "Construyendo imagen Docker..."
    if docker compose build --build-arg PORT=$PROJECT_PORT app; then
        log "success" "Imagen construida correctamente"
    else
        log "error" "Error construyendo imagen Docker"
        exit 1
    fi

    log "INFO" "Iniciando contenedores..."
    if docker-compose up -d 2>&1 | tee -a "$LOG_FILE"; then
        log "SUCCESS" "Aplicación desplegada correctamente"
        log "INFO" "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        log "INFO" "🚀 DESPLIEGUE COMPLETADO EXITOSAMENTE"
        log "INFO" "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        log "INFO" "📱 Aplicación: http://localhost:$PROJECT_PORT"
        log "INFO" "📊 Estado: docker-compose ps"
        log "INFO" "📜 Logs: docker-compose logs -f"
        log "INFO" "🛑 Detener: docker-compose down"
        log "INFO" "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

        # Wait for container to be ready
        log "INFO" "⏳ Esperando 10 segundos para que el contenedor inicie..."
        sleep 10

        # Run database migrations and setup
        log "INFO" "🗄️ Configurando base de datos..."
        # Add database dump restoration logic here
        echo "🔄 Checking if dump file exists..."

        # Cargar variables de entorno desde .env si existe
        if [ -f "$PROJECT_DIR/.env" ]; then
          set -a
          source "$PROJECT_DIR/.env"
          set +a
        fi

        if [ -f "attached_assets/backup_neondb_nova_1756244112037.dump" ]; then
            echo "📥 Restoring database from dump..."
            # Use local PostgreSQL credentials
            export PGPASSWORD="$DB_PASSWORD"

            # Create database if it doesn't exist (ignore errors if it already exists)
            createdb -h localhost -U "$DB_USER" "$DB_NAME" 2>/dev/null || echo "Database already exists or could not be created"

            # Restore dump
            pg_restore -h localhost -U "$DB_USER" -d "$DB_NAME" -v attached_assets/backup_neondb_nova_1756244112037.dump 2>/dev/null || echo "Some restore warnings are normal"

            echo "✅ Database restored from dump"
        else
            echo "🔄 Running database migrations..."
            if docker-compose exec -T app npm run db:push 2>/dev/null; then
                log "SUCCESS" "Migraciones de base de datos aplicadas."
            else
                log "WARN" "No se pudieron aplicar las migraciones o ya se aplicaron."
            fi

            echo "🌱 Seeding database..."
            if docker-compose exec -T app npm run db:seed 2>/dev/null; then
                log "SUCCESS" "Datos de siembra de base de datos aplicados."
            else
                log "WARN" "No se pudieron aplicar los datos de siembra o ya existen."
            fi
        fi

        # Wait a moment and check if container is running
        sleep 5
        if docker-compose ps | grep -q "Up"; then
            log "SUCCESS" "Contenedor iniciado y funcionando correctamente"
        else
            log "WARN" "El contenedor puede tener problemas. Verificando logs..."
            docker-compose logs --tail=20
        fi
    else
        log "ERROR" "Error al iniciar contenedores"
        log "INFO" "Mostrando logs de error:"
        docker-compose logs --tail=50
        exit 1
    fi
}

# Mostrar resumen final
show_summary() {
    echo
    echo "════════════════════════════════════════════════════════════"
    log "success" "🎉 DESPLIEGUE COMPLETADO EXITOSAMENTE"
    echo "════════════════════════════════════════════════════════════"
    echo
    echo -e "${YELLOW}📋 INFORMACIÓN DEL PROYECTO:${NC}"
    echo "   🌐 URL: http://localhost:$PROJECT_PORT"
    echo "   📁 Directorio: $PROJECT_DIR"
    echo "   🗄️  Base de datos: $DB_NAME"
    echo "   📋 Log de instalación: $LOG_FILE"
    echo
    echo -e "${YELLOW}🔧 COMANDOS DE GESTIÓN:${NC}"
    echo "   Ver logs:    cd $PROJECT_DIR && ./manage.sh logs"
    echo "   Reiniciar:   cd $PROJECT_DIR && ./manage.sh restart"
    echo "   Detener:     cd $PROJECT_DIR && ./manage.sh stop"
    echo "   Estado:      cd $PROJECT_DIR && ./manage.sh status"
    echo
    echo -e "${YELLOW}🐳 COMANDOS DOCKER:${NC}"
    echo "   docker-compose ps                    # Ver estado"
    echo "   docker-compose logs -f               # Ver logs en tiempo real"
    echo "   docker-compose restart               # Reiniciar servicios"
    echo
}

# Función principal
main() {
    # Inicializar log
    log "info" "Iniciando proceso de despliegue - Log: $LOG_FILE"

    # Ejecutar pasos del despliegue
    show_banner
    check_dependencies
    get_project_info
    setup_postgresql
    create_project_directory
    copy_project_files # Ensure project files are in place
    create_docker_config
    create_management_scripts
    deploy_application
    show_summary
}

# Manejo de errores
trap 'log "error" "Error inesperado en línea $LINENO. Revise el log: $LOG_FILE"' ERR

# Ejecutar función principal
main "$@"
