ssh -i /d/maturapolski/maturapolski-key.pem ubuntu@3.68.187.152 "cat > /var/www/copywriting24/deploy.sh << 'EOF'
#!/bin/bash
echo \"=========================================\"
echo \"Copywriting24.pl - Deploy\"
echo \"=========================================\"

cd /var/www/copywriting24/backend
echo \"[1/3] Backend...\"
npm install && npx prisma generate && npm run build && pm2 restart copywriting24-backend
echo \"✓ Backend done\"

cd /var/www/copywriting24/frontend
echo \"[2/3] Frontend...\"
npm install && npm run build
echo \"✓ Frontend done\"

echo \"[3/3] Nginx...\"
sudo systemctl reload nginx

echo \"=========================================\"
echo \"✓ Done! https://www.copywriting24.pl\"
echo \"=========================================\"
EOF
chmod +x /var/www/copywriting24/deploy.sh"