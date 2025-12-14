# PetWell Deployment Guide

## Step 1: Set Up Docker Hub (5 minutes)

1. **Go to Docker Hub**: https://hub.docker.com
2. **Create account** or sign in
3. **Create new repository**:
   - Click "Create Repository"
   - Name: `petwell`
   - Visibility: Public
   - Click "Create"
4. **Generate Access Token**:
   - Go to Account Settings → Security
   - Click "New Access Token"
   - Description: `github-actions-petwell`
   - Access: Read & Write
   - Click "Generate" and **COPY THE TOKEN** (you won't see it again!)

## Step 2: Configure GitHub Secrets (3 minutes)

1. **Go to your GitHub repository**: https://github.com/emkoscielniak/is218_final
2. **Navigate to**: Settings → Secrets and variables → Actions
3. **Add these secrets** (click "New repository secret" for each):

   **Secret 1: DOCKER_USERNAME**
   - Value: `emkoscielniak` (or your Docker Hub username)

   **Secret 2: DOCKER_TOKEN**
   - Value: [paste the token you copied from Docker Hub]

   **Secret 3: DOCKER_IMAGE**
   - Value: `emkoscielniak/pet_well`

## Step 3: Push Code to Trigger Build (2 minutes)

From your local machine:

```bash
cd /Users/emisk/is218/is218_final

# Stage the new files
git add .github/workflows/deploy.yml docker-compose.prod.yml .env.production deploy-server.sh

# Commit
git commit -m "Add CI/CD deployment configuration"

# Push to GitHub
git push origin main
```

**Watch the build**:
- Go to GitHub → Actions tab
- Watch the workflow run
- Once complete, check Docker Hub to see your image

## Step 4: Set Up Server (10 minutes)

### Connect to your server:

```bash
ssh root@138.197.75.94
# or
ssh ubuntu@138.197.75.94
```

### Run the setup script:

```bash
# Download the setup script
curl -o setup-petwell.sh https://raw.githubusercontent.com/emkoscielniak/is218_final/main/deploy-server.sh

# Make it executable
chmod +x setup-petwell.sh

# Run it
./setup-petwell.sh
```

### Configure environment variables:

```bash
cd ~/petwell
nano .env
```

**Update these values:**
- `OPENAI_API_KEY=` - Add your OpenAI API key
- `SMTP_USER=` - Add your Gmail address
- `SMTP_PASSWORD=` - Add your Gmail app password
- `SMTP_FROM_EMAIL=` - Add your Gmail address

Save (Ctrl+O, Enter) and exit (Ctrl+X)

### Restart the application:

```bash
docker compose restart web
docker compose logs -f web
```

Press Ctrl+C when you see "Application startup complete"

## Step 5: Configure Caddy for HTTPS (5 minutes)

### Edit Caddyfile:

```bash
sudo nano /etc/caddy/Caddyfile
```

### Add this configuration:

```caddyfile
# PetWell Application
petwell.emkoscielniak.com {
    reverse_proxy localhost:8001
}

# Redirect www to apex
www.petwell.emkoscielniak.com {
    redir https://petwell.emkoscielniak.com{uri}
}
```

### Reload Caddy:

```bash
sudo systemctl reload caddy
sudo systemctl status caddy
```

## Step 6: Test Your Deployment

### Test locally on server:

```bash
curl http://localhost:8000
curl http://localhost:8000/health
```

### Test via domain:

```bash
curl https://petwell.emkoscielniak.com
curl https://petwell.emkoscielniak.com/health
```

### Open in browser:

- https://petwell.emkoscielniak.com
- https://petwell.emkoscielniak.com/docs (API documentation)
- https://petwell.emkoscielniak.com/register

## Step 7: Verify Automatic Deployment

### Make a test change locally:

```bash
cd /Users/emisk/is218/is218_final

# Make a small change
echo "# Last deployed: $(date)" >> README.md

# Commit and push
git add README.md
git commit -m "Test automatic deployment"
git push origin main
```

### Watch the magic:

1. **GitHub Actions** builds and pushes new image (2-3 minutes)
2. **Watchtower** detects update on server (within 5 minutes)
3. **Application** automatically updates!

### Monitor on server:

```bash
ssh root@138.197.75.94
cd ~/petwell

# Watch Watchtower logs
docker compose logs -f watchtower

# You should see:
# - Checking for updates...
# - Found new image
# - Pulling image...
# - Restarting container...
```

## Useful Commands

### On Server:

```bash
cd ~/petwell

# View all logs
docker compose logs -f

# View specific service
docker compose logs -f web
docker compose logs -f watchtower

# Check status
docker compose ps

# Restart service
docker compose restart web

# Pull latest manually
docker compose pull && docker compose up -d

# Backup database
docker compose exec db pg_dump -U postgres petwell_db > backup-$(date +%Y%m%d).sql

# Stop all services
docker compose down

# View disk usage
docker system df
```

### Local Development:

```bash
cd /Users/emisk/is218/is218_final

# Start local development
docker compose up --build

# Run tests
pytest tests/

# Push changes (triggers deployment)
git add .
git commit -m "Your changes"
git push origin main
```

## Troubleshooting

### Issue: Can't access website

```bash
# Check if containers are running
docker compose ps

# Check web logs
docker compose logs web --tail=50

# Check if port 8000 is accessible
curl http://localhost:8000
```

### Issue: Database connection error

```bash
# Check database is running
docker compose ps db

# Check database logs
docker compose logs db

# Verify DATABASE_URL in .env
cat .env | grep DATABASE_URL
```

### Issue: Watchtower not updating

```bash
# Check Watchtower logs
docker compose logs watchtower --tail=50

# Manually trigger update
docker compose pull
docker compose up -d
docker compose restart watchtower
```

### Issue: HTTPS not working

```bash
# Check Caddy status
sudo systemctl status caddy

# Check Caddy logs
sudo journalctl -u caddy -n 50

# Reload Caddy
sudo systemctl reload caddy
```

## Success Checklist

- ✅ Docker Hub repository created
- ✅ GitHub secrets configured
- ✅ GitHub Actions workflow running successfully
- ✅ Server setup complete
- ✅ Environment variables configured
- ✅ Containers running on server
- ✅ Caddy configured for HTTPS
- ✅ Website accessible at https://petwell.emkoscielniak.com
- ✅ Automatic deployment working
- ✅ Watchtower monitoring updates

## Your Deployment URL

**Production**: https://petwell.emkoscielniak.com

**API Docs**: https://petwell.emkoscielniak.com/docs

**Server IP**: 138.197.75.94

## Support

If you encounter issues:
1. Check the logs on the server
2. Verify all environment variables are set
3. Ensure DNS has propagated (can take up to 24 hours)
4. Check GitHub Actions for build errors
5. Verify Docker Hub shows your images
