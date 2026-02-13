#!/bin/bash
echo "========================================="
echo "Copywriting24.pl - Deploy"
echo "========================================="

cd /var/www/copywriting24/backend
echo "[1/3] Backend..."
npm install && npx prisma generate && npm run build && pm2 restart copywriting24-backend
echo "Done"

cd /var/www/copywriting24/frontend
echo "[2/3] Frontend..."
npm install && npm run build
echo "Done"

echo "[3/3] Nginx..."
sudo systemctl reload nginx

echo "========================================="
echo "Deploy complete!"
echo "========================================="
EOF
chmod +x /var/www/copywriting24/deploy.sh