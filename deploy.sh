#!/bin/bash

echo "========================================="
echo "Copywriting24.pl - Deploy Script"
echo "========================================="

SERVER="ubuntu@3.68.187.152"
KEY="/d/maturapolski/maturapolski-key.pem"
APP_DIR="/var/www/copywriting24"

# Push local changes first
echo "[0/4] Pushing to GitHub..."
git add .
git commit -m "deploy $(date +%Y-%m-%d_%H:%M)" 2>/dev/null
git push

# Deploy on server
echo ""
echo "[1/4] Pulling latest code on server..."
ssh -i "$KEY" "$SERVER" "cd $APP_DIR && git pull"

echo ""
echo "[2/4] Building Backend..."
ssh -i "$KEY" "$SERVER" "cd $APP_DIR/backend && npm install && npx prisma generate && npm run build && pm2 restart copywriting24-backend"

echo ""
echo "[3/4] Building Frontend..."
ssh -i "$KEY" "$SERVER" "cd $APP_DIR/frontend && npm install && npm run build"

echo ""
echo "[4/4] Reloading Nginx..."
ssh -i "$KEY" "$SERVER" "sudo systemctl reload nginx"

echo ""
echo "========================================="
echo "✓ Deploy complete!"
echo "https://www.copywriting24.pl"
echo "========================================="