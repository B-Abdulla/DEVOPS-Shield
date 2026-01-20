# Railway Deployment Guide

## Automatic Deployment

This project is configured for automatic deployment on Railway.app.

### Prerequisites
- Railway account connected to your GitHub repository
- Environment variables configured in Railway dashboard

### Environment Variables to Set in Railway

#### Required Variables
```env
PORT=8080
ENVIRONMENT=production
SECRET_KEY=<generate-secure-random-key>
```

Generate a secure SECRET_KEY:
```bash
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

#### CORS Configuration
```env
CORS_ORIGINS=https://*.railway.app,https://yourdomain.com
ALLOWED_HOSTS=*.railway.app,yourdomain.com
```

#### Optional Variables
```env
# Database (defaults to SQLite)
DB_PATH=/app/backend/database/fraud_logs.db

# Blockchain (disabled by default)
BLOCKCHAIN_ENABLED=false

# Logging
LOG_LEVEL=info
ACCESS_LOG=true

# Workers (Railway recommends 1 for hobby plan)
WORKERS=1
```

## Deployment Process

1. **Push to GitHub**: Railway automatically detects changes to the `main` branch
2. **Build Phase**: Railway uses Nixpacks to build the project
   - Installs Python 3.11
   - Installs dependencies from `backend/requirements.txt`
   - Makes start script executable
3. **Deploy Phase**: Runs `./start.sh` script
   - Sets up environment
   - Starts Uvicorn ASGI server
4. **Health Check**: Railway pings `/` endpoint every 30 seconds

## Troubleshooting

### Check Logs
```bash
railway logs
```

### Common Issues

#### 1. Port Binding Error
- **Issue**: "Address already in use"
- **Solution**: Railway automatically sets `$PORT` environment variable. The app respects it.

#### 2. Module Import Errors
- **Issue**: "ModuleNotFoundError"
- **Solution**: Check `PYTHONPATH` is set correctly in `start.sh`

#### 3. Database Errors
- **Issue**: SQLite database not persisting
- **Solution**: Use Railway's PostgreSQL addon or ensure DB_PATH points to mounted volume

#### 4. CORS Errors
- **Issue**: Frontend can't connect
- **Solution**: Update `CORS_ORIGINS` in Railway dashboard to include your frontend domain

### Testing Deployment

Once deployed, test the API:
```bash
curl https://your-app.railway.app/
```

Expected response:
```json
{
  "message": "DevOps Fraud Shield API - Advanced CI/CD Security Platform",
  "status": "running",
  "version": "2.0.0",
  "docs": "/docs"
}
```

## Files Involved in Deployment

- `railway.toml` - Railway platform configuration
- `nixpacks.toml` - Build configuration for Nixpacks
- `start.sh` - Startup script
- `Dockerfile` - Alternative deployment method (not used with Nixpacks)
- `.env.example` - Template for environment variables
- `backend/requirements.txt` - Python dependencies

## Monitoring

Railway provides:
- Real-time logs
- CPU and memory metrics
- Request analytics
- Health check status

Access via Railway dashboard: https://railway.app/dashboard

## Manual Deployment (Alternative)

If you need to deploy manually:

```bash
# Install Railway CLI
npm i -g @railway/cli

# Login
railway login

# Link to project
railway link

# Deploy
railway up
```

## CI/CD Integration

Railway automatically:
- ✅ Detects commits to main branch
- ✅ Builds using Nixpacks
- ✅ Runs health checks
- ✅ Deploys on success
- ✅ Rolls back on failure

## Support

- Railway Docs: https://docs.railway.app/
- Project Issues: https://github.com/Abdul9010150809/DEVOPS-Shield/issues
