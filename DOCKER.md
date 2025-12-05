# Docker Deployment Guide for UNI-CHAIN

## 🐳 Quick Start

### Production Deployment

1. **Create environment file:**
   ```bash
   cp .env.example .env
   # Edit .env with your actual values
   ```

2. **Build and start all services:**
   ```bash
   docker-compose up -d --build
   ```

3. **Run database migrations:**
   ```bash
   docker-compose exec backend npx prisma migrate deploy
   ```

4. **Seed database (optional):**
   ```bash
   docker-compose exec backend npm run seed
   ```

5. **Access the application:**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:3001
   - Database: localhost:5432

### Development Mode

```bash
docker-compose -f docker-compose.dev.yml up --build
```

## 📋 Available Commands

### View Logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f postgres
```

### Stop Services
```bash
# Stop all services
docker-compose down

# Stop and remove volumes (clean slate)
docker-compose down -v
```

### Rebuild Services
```bash
# Rebuild all services
docker-compose build

# Rebuild specific service
docker-compose build backend
docker-compose build frontend
```

### Execute Commands in Containers
```bash
# Run Prisma migrations
docker-compose exec backend npx prisma migrate deploy

# Seed database
docker-compose exec backend npm run seed

# Open Prisma Studio
docker-compose exec backend npx prisma studio

# Access backend shell
docker-compose exec backend sh

# Access database
docker-compose exec postgres psql -U postgres -d unichain
```

### View Running Containers
```bash
docker-compose ps
```

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the project root with:

```env
# Database Configuration
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your_secure_password
POSTGRES_DB=unichain

# Backend Configuration
NODE_ENV=production
JWT_SECRET=your_jwt_secret_key_min_32_characters
MASTER_KEY=your_master_encryption_key_32_chars

# Frontend Configuration
VITE_API_URL=http://localhost:3001/api
```

### Port Configuration

- **Frontend**: 3000 (mapped to nginx port 80)
- **Backend**: 3001
- **PostgreSQL**: 5432

To change ports, modify `docker-compose.yml`:

```yaml
ports:
  - "YOUR_PORT:3001"  # Backend
  - "YOUR_PORT:80"    # Frontend
```

## 🏗️ Architecture

### Services

1. **PostgreSQL** (`postgres`)
   - Database server
   - Persistent data storage
   - Health checks enabled

2. **Backend** (`backend`)
   - Node.js + Express API
   - Prisma ORM
   - Auto-runs migrations on startup
   - Health checks enabled

3. **Frontend** (`frontend`)
   - React + Vite
   - Served via Nginx
   - API proxy configured
   - Health checks enabled

### Networks

All services communicate via `unichain-network` (production) or `unichain-network-dev` (development).

### Volumes

- `postgres_data`: Persistent PostgreSQL data
- `postgres_data_dev`: Development PostgreSQL data

## 🔒 Security Best Practices

1. **Non-root user**: Backend runs as non-root user (nodejs:1001)
2. **Alpine Linux**: Minimal base images for smaller attack surface
3. **Health checks**: All services have health monitoring
4. **Network isolation**: Services communicate via Docker network
5. **Environment variables**: Sensitive data via .env file

## 🐛 Troubleshooting

### Build Fails
```bash
# Clean build
docker-compose down -v
docker-compose build --no-cache
docker-compose up -d
```

### Database Connection Issues
```bash
# Check database logs
docker-compose logs postgres

# Verify database is healthy
docker-compose ps

# Test connection
docker-compose exec backend node -e "console.log(process.env.DATABASE_URL)"
```

### Backend Won't Start
```bash
# Check backend logs
docker-compose logs backend

# Verify environment variables
docker-compose exec backend env | grep -E "DATABASE_URL|JWT_SECRET|MASTER_KEY"

# Run migrations manually
docker-compose exec backend npx prisma migrate deploy
```

### Frontend Can't Connect to API
- Verify `VITE_API_URL` in environment
- Check backend is running: `docker-compose ps`
- Check network connectivity: `docker-compose exec frontend ping backend`

### Port Already in Use
```bash
# Find process using port
lsof -i :3000
lsof -i :3001
lsof -i :5432

# Kill process or change port in docker-compose.yml
```

## 📦 Production Deployment

### Build for Production
```bash
docker-compose -f docker-compose.yml build
```

### Deploy to Server
1. Copy project files to server
2. Create `.env` file with production values
3. Run `docker-compose up -d --build`
4. Run migrations: `docker-compose exec backend npx prisma migrate deploy`

### Update Application
```bash
git pull
docker-compose build
docker-compose up -d
docker-compose exec backend npx prisma migrate deploy
```

## 🔄 Development Workflow

1. **Start development environment:**
   ```bash
   docker-compose -f docker-compose.dev.yml up
   ```

2. **Make code changes** - Files are mounted as volumes, changes reflect immediately

3. **View logs:**
   ```bash
   docker-compose -f docker-compose.dev.yml logs -f
   ```

4. **Stop when done:**
   ```bash
   docker-compose -f docker-compose.dev.yml down
   ```

## 📊 Monitoring

### Health Checks
All services have health checks configured. Check status:
```bash
docker-compose ps
```

### Resource Usage
```bash
docker stats
```

## 🚀 Next Steps

1. Set up CI/CD pipeline
2. Configure reverse proxy (nginx/traefik)
3. Set up SSL certificates
4. Configure monitoring and logging
5. Set up backup strategy for database

