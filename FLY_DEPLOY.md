# Deploy DevOps-Shield to Fly.io

## Why Fly.io?
✓ Better performance than Render (true VMs, not shared)
✓ Free tier: 3 shared-cpu-1x 256MB VMs
✓ Global deployment (multiple regions)
✓ No auto-sleep (always running)
✓ Better for production

## Prerequisites
- GitHub account
- Fly.io account (https://fly.io)
- Fly CLI installed

## Installation

### 1. Install Fly CLI

**macOS:**
```bash
brew install flyctl
```

**Linux:**
```bash
curl -L https://fly.io/install.sh | sh
```

**Windows (WSL):**
```bash
curl -L https://fly.io/install.sh | sh
```

### 2. Authenticate
```bash
flyctl auth login
```
Follow the browser prompt to authenticate.

## Deployment Steps

### 1. Prepare the App
The `fly.toml` file is already in the repo. Review it:
```bash
cat fly.toml
```

### 2. Initialize App (if needed)
If fly.toml doesn't exist:
```bash
flyctl launch
```

### 3. Deploy
```bash
flyctl deploy
```

### 4. Get Your App URL
```bash
flyctl info
```

Your app will be at: `https://devops-shield.fly.dev`

## Fly.io Free Tier Limits
✓ 3 shared-cpu-1x 256MB VMs
✓ 160GB/month egress
✓ 3 GB persistent storage
✓ Perfect for small projects

## Set Environment Variables
```bash
flyctl secrets set PORT=8080
flyctl secrets set ENVIRONMENT=production
flyctl secrets set HOST=0.0.0.0
```

## Monitor App
```bash
# View logs
flyctl logs --follow

# Check status
flyctl status

# SSH into machine
flyctl ssh console
```

## Scaling
```bash
# Scale to multiple machines
flyctl scale count 2

# Scale memory
flyctl scale memory 512
```

## Useful Commands
```bash
# Redeploy
flyctl deploy

# Restart
flyctl restart

# View metrics
flyctl metrics

# List machines
flyctl machine list
```

## Upgrade Options
- $7/month for reserved instances (dedicated hardware)
- Pay-as-you-go pricing for additional resources

## GitHub Actions Integration (Optional)
Create `.github/workflows/deploy.yml` for automatic deployment on push.

## Comparison: Render vs Fly.io
| Feature | Render | Fly.io |
|---------|--------|--------|
| Free Tier | Yes | Yes |
| Always Running | No (sleeps) | Yes |
| CPU | Shared | Shared/Dedicated |
| Performance | Good | Better |
| Regions | Limited | Global |
| Setup | Easier | Requires CLI |
| Best For | Testing | Production |
