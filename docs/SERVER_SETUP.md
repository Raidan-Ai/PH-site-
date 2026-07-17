# PressHouse Server Setup & Deployment

This guide covers setting up a production environment for the PressHouse Enterprise Platform.

## 1. Initial Server Preparation (Ubuntu/Debian)

Update system and install required tools:
```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y nodejs npm git certbot python3-certbot-nginx
```

## 2. Installation & Setup

1. **Clone the Repository**
   ```bash
   git clone <repository_url> presshouse
   cd presshouse
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Interactive Setup Wizard**
   Run the interactive setup to generate secure secrets and configure your domain/admin accounts:
   ```bash
   npm run setup
   ```
   *Follow the prompts carefully to enter your domain, Root Admin credentials, and AI/SMTP keys.*

## 3. Web Server Configuration (Nginx)

PressHouse runs on port 3000. Use Nginx as a reverse proxy.

1. **Create Nginx Config**
   ```bash
   sudo nano /etc/nginx/sites-available/presshouse
   ```
   Add the following:
   ```nginx
   server {
       listen 80;
       server_name ph-ye.org api.ph-ye.org;

       location / {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```
2. **Enable Site & Install SSL**
   ```bash
   sudo ln -s /etc/nginx/sites-available/presshouse /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl restart nginx
   sudo certbot --nginx -d ph-ye.org -d api.ph-ye.org
   ```

## 4. Running the Platform

Use PM2 to keep the application running in the background:
```bash
sudo npm install -g pm2
pm2 start server.ts --name presshouse --interpreter tsx
pm2 save
pm2 startup
```

## 5. Security & Maintenance

- **Environment Secrets**: Ensure `.env` is NOT world-readable (`chmod 600 .env`).
- **Backups**: The system uses SQLite (`database.sqlite`) by default. Ensure periodic backups of this file and the `uploads/` directory.
- **Updates**: 
  ```bash
  git pull
  npm install
  npm run build
  pm2 restart presshouse
  ```
