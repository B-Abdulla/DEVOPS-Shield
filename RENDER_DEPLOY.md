# Deploy DevOps-Shield to Render.com

## Prerequisites
- GitHub account (already have this ✓)
- Render.com free account (https://render.com)

## Step-by-Step Deployment

### 1. Create Render Account
1. Go to https://render.com
2. Sign up with GitHub (recommended for easy integration)
3. Authorize Render to access your repositories

### 2. Connect Your Repository
1. From Render dashboard, click "New +"
2. Select "Web Service"
3. Select "Connect a repository"
4. Choose `Abdul9010150809/DEVOPS-Shield`
5. Click "Connect"

### 3. Configure Service
Fill in the following details:

**Basic Settings:**
- Name: `devops-shield`
- Environment: `Python 3`
- Region: `Oregon` (free tier region)
- Branch: `main`

**Build Settings:**
- Build Command:
  ```
  pip install -r requirements.txt && pip install -r backend/requirements.txt
  ```
- Start Command:
  ```
  cd backend && python main.py
  ```

**Environment Variables:**
```
PORT=8080
ENVIRONMENT=production
HOST=0.0.0.0
```

### 4. Select Plan
- Choose **Free** tier
- Click "Create Web Service"

### 5. Monitor Deployment
- Render will automatically build and deploy
- View logs in real-time
- Wait for "Your service is live!"

### 6. Access Your App
Your app will be available at: `https://devops-shield.onrender.com`

## Features on Render Free Tier
✓ Automatic deployments from GitHub pushes
✓ Free SSL certificate
✓ Built-in health checks
✓ Free tier limits:
  - 0.5 CPU
  - 512 MB RAM
  - Auto-sleep after 15 minutes of inactivity
  - Spins up on request (5-30 seconds)

## Advanced: Using render.yaml
Render can automatically deploy using `render.yaml` file (included in repo):

1. In Render dashboard, select your service
2. Settings → Auto-Deploy from Git
3. Ensure branch is set to `main`
4. Render will use `render.yaml` configuration

## Upgrade Options
- Pay $7/month for reserved instances (always running)
- Suitable for production use

## Troubleshooting
- Check logs: Dashboard → Logs
- Service won't start: Check requirements.txt dependencies
- Port issues: Ensure app listens on port 8080

## Redeployment
- Manual: Dashboard → Redeploy
- Automatic: Push to main branch (if auto-deploy enabled)
