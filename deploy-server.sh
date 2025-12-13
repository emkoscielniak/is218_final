#!/bin/bash

# PetWell Deployment Setup Script
# Run this script on your DigitalOcean server (138.197.75.94)

set -e

echo "🚀 Setting up PetWell deployment..."

# Create application directory
echo "📁 Creating application directory..."
mkdir -p ~/petwell
cd ~/petwell

# Generate secure secrets
echo "🔐 Generating secure secrets..."
POSTGRES_PASSWORD=$(openssl rand -base64 32)
SECRET_KEY=$(python3 -c "import secrets; print(secrets.token_urlsafe(32))")

# Create .env file
echo "📝 Creating .env file..."
cat > .env << EOF
# Database Configuration
POSTGRES_DB=petwell_db
POSTGRES_USER=postgres
POSTGRES_PASSWORD=$POSTGRES_PASSWORD

# Application Configuration
DATABASE_URL=postgresql://postgres:$POSTGRES_PASSWORD@db:5432/petwell_db
SECRET_KEY=$SECRET_KEY

# OpenAI Configuration (you'll need to add your key)
OPENAI_API_KEY=your_openai_key_here

# SMTP Configuration (you'll need to add your credentials)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASSWORD=your_app_password_here
SMTP_FROM_EMAIL=your_email@gmail.com

# Docker
DOCKER_IMAGE=emkoscielniak/pet_well
DOCKER_USERNAME=emkoscielniak
EOF

echo "✅ Created .env file with secure passwords"
echo "⚠️  IMPORTANT: Edit ~/petwell/.env and add your OpenAI API key and SMTP credentials"

# Download production docker-compose file
echo "📥 Downloading docker-compose file..."
cat > docker-compose.yml << 'EOF'
version: '3.8'

services:
  web:
    image: ${DOCKER_IMAGE:-emkoscielniak/pet_well}:latest
    restart: unless-stopped
    container_name: petwell-app
    environment:
      - DATABASE_URL=${DATABASE_URL}
      - SECRET_KEY=${SECRET_KEY}
      - OPENAI_API_KEY=${OPENAI_API_KEY}
      - SMTP_HOST=${SMTP_HOST}
      - SMTP_PORT=${SMTP_PORT}
      - SMTP_USER=${SMTP_USER}
      - SMTP_PASSWORD=${SMTP_PASSWORD}
      - SMTP_FROM_EMAIL=${SMTP_FROM_EMAIL}
    ports:
      - "8000:8000"
    depends_on:
      - db
    labels:
      - "com.centurylinklabs.watchtower.enable=true"
    networks:
      - app-network

  db:
    image: postgres:15
    restart: unless-stopped
    container_name: petwell-db
    environment:
      - POSTGRES_DB=${POSTGRES_DB:-petwell_db}
      - POSTGRES_USER=${POSTGRES_USER:-postgres}
      - POSTGRES_PASSWORD=${POSTGRES_PASSWORD}
    volumes:
      - postgres-data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 10s
      timeout: 5s
      retries: 5
    networks:
      - app-network

  watchtower:
    image: containrrr/watchtower
    restart: unless-stopped
    container_name: petwell-watchtower
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock
    environment:
      - WATCHTOWER_CLEANUP=true
      - WATCHTOWER_POLL_INTERVAL=300
      - WATCHTOWER_LABEL_ENABLE=true
      - WATCHTOWER_INCLUDE_STOPPED=true
      - WATCHTOWER_REVIVE_STOPPED=false
    command: --interval 300 --cleanup
    networks:
      - app-network

volumes:
  postgres-data:

networks:
  app-network:
    driver: bridge
EOF

echo "✅ Created docker-compose.yml"

# Pull and start services
echo "🐳 Pulling Docker images..."
docker compose pull

echo "🚀 Starting services..."
docker compose up -d

echo ""
echo "✅ Deployment setup complete!"
echo ""
echo "📊 Next steps:"
echo "1. Edit ~/petwell/.env and add your API keys"
echo "2. Run: docker compose restart web"
echo "3. Check logs: docker compose logs -f"
echo "4. View status: docker compose ps"
echo ""
echo "🌐 Your app will be available at:"
echo "   http://138.197.75.94:8000"
echo "   https://petwell.emkoscielniak.com (after Caddy setup)"
