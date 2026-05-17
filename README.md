# PCNC Corporate — Plateforme de gestion de formation

Plateforme web de gestion d'une école en ligne pour **PCNC Corporate**, le programme de formation de l'**Impact Centre Chrétien (ICC)**. Intègre Thinkific (LMS), Elvanto (gestion d'église), Zoom (réunions virtuelles) et un envoi d'email transactionnel SMTP.

---

## Architecture
icc-thinkific-management/
├── pcnc-server/ # Backend Node.js (Express + Prisma)
│ ├── src/
│ │ ├── config/ # Validation env (Zod)
│ │ ├── controllers/ # Handlers HTTP
│ │ ├── services/ # Logique métier
│ │ ├── routes/ # Routage Express
│ │ ├── middleware/ # Auth, errors, validation
│ │ ├── webhooks/ # Endpoints Thinkific/Elvanto
│ │ └── server.js # Bootstrap Express
│ └── prisma/schema.prisma
│
├── pcnc-app/ # Frontend React (Vite + Mantine v7)
│ ├── src/
│ │ ├── pages/ # Login, Dashboard, etc.
│ │ ├── components/ # Sidebar, TopNav, ...
│ │ ├── layouts/ # DashboardLayout
│ │ ├── api/ # Clients API
│ │ ├── context/ # AuthContext
│ │ ├── i18n/ # FR/EN
│ │ └── theme.js # Thème Mantine PCNC
│ └── package.json
│
├── docker-compose.yml
└── README.md

### Stack technique

| Couche       | Technologie                                |
|--------------|--------------------------------------------|
| Frontend     | React 18, Vite, Mantine v7, React Router 6 |
| Backend      | Node.js 20, Express 4, Prisma 5            |
| Base de données | PostgreSQL 17                           |
| Sessions     | express-session + @quixo3/prisma-session-store |
| Validation env | Zod                                      |
| Logging      | Pino (JSON structuré)                      |
| Process manager (prod) | pm2                              |
| Reverse proxy (prod)   | nginx                            |

---

## Installation locale

### Pré-requis

- Node.js 20+
- PostgreSQL 17 (ou via Docker)
- Compte Thinkific (clé API + OAuth)
- Compte Elvanto (clé API)
- Compte Zoom Server-to-Server (Client ID, Secret, Account ID)

### Étapes

```bash
# 1) Cloner
git clone git@github.com:rdefoundoux/icc-thinkific-management.git
cd icc-thinkific-management

# 2) Backend
cd pcnc-server
cp .env.example .env       # éditer DATABASE_URL, secrets, credentials
npm install
npx prisma generate
npx prisma db push
npm run dev                # :3000

# 3) Frontend (autre terminal)
cd ../pcnc-app
cp .env.example .env       # VITE_API_BASE_URL=http://localhost:3000
npm install
npm run dev                # :5173
```

### Via Docker (BD seulement)

```bash
docker-compose up -d postgres
```

---

## Variables d environnement

### Backend (pcnc-server/.env)

Voir pcnc-server/.env.example pour la liste complète. Variables critiques:

- DATABASE_URL — URL Postgres
- COOKIE_SECRET, JWT_SECRET, SESSION_SECRET — secrets 32 bytes hex
- ALLOWED_ORIGINS — origines CORS séparées par virgules
- THINKIFIC_*, ELVANTO_*, ZOOM_* — credentials API
- SMTP_* — serveur de mail

Génération de secrets:
```bash
openssl rand -hex 32
```

### Frontend (pcnc-app/.env)

- VITE_API_BASE_URL — host backend (sans /api/v1)
- VITE_API_URL — URL complète ${host}/api/v1

---

## Déploiement production (DigitalOcean droplet)

Ubuntu 25.04 + pm2 + nginx + PostgreSQL local.

### Bootstrap initial

```bash
apt update && apt install -y nodejs npm postgresql-17 nginx ufw
npm i -g pm2

sudo -u postgres psql -c "CREATE DATABASE icc_thinkific;"
sudo -u postgres psql -c "CREATE USER icc_app WITH ENCRYPTED PASSWORD 'CHANGE_ME';"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE icc_thinkific TO icc_app;"

cd /opt
git clone git@github.com:rdefoundoux/icc-thinkific-management.git
cd icc-thinkific-management

cd pcnc-server
cp .env.example .env       # remplir avec les vraies valeurs
npm install
npx prisma generate && npx prisma db push

cd ../pcnc-app
cp .env.example .env       # VITE_API_BASE_URL=http://votre-ip
npm install
npm run build

cd ../pcnc-server
pm2 start npm --name icc-server -- start
pm2 save
pm2 startup
```

### Configuration nginx (extrait)

```nginx
server {
    listen 80;
    server_name 143.198.39.187;
    root /opt/icc-thinkific-management/pcnc-app/dist;
    index index.html;

    location / { try_files $uri $uri/ /index.html; }

    location /api {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /health   { proxy_pass http://localhost:3000; }
    location /webhooks { proxy_pass http://localhost:3000; }
}
```

### Mise à jour

```bash
cd /opt/icc-thinkific-management
git pull origin refactor/postgres-icc-rebrand

cd pcnc-server
npm install
npx prisma generate
npx prisma db push
pm2 restart icc-server

cd ../pcnc-app
npm install
npm run build
```

---

## Sécurité

- Helmet (CSP, HSTS, anti-XSS)
- Rate limiting (500 req / 15 min par IP)
- CORS strict (whitelist via ALLOWED_ORIGINS)
- Sessions chiffrées en cookie HTTP-only (Postgres-backed)
- Validation des entrées (Zod sur env, validators sur routes)
- HTTPS recommandé — configurer Let s Encrypt via certbot --nginx

---

## Scripts npm

### Backend (pcnc-server)
| Commande            | Description                  |
|---------------------|------------------------------|
| npm run dev         | Dev mode (tsx watch)         |
| npm start           | Production                   |
| npm run db:push     | prisma db push               |
| npm run db:studio   | Prisma Studio (GUI BD)       |

### Frontend (pcnc-app)
| Commande         | Description           |
|------------------|-----------------------|
| npm run dev      | Vite dev (:5173)      |
| npm run build    | Build production      |
| npm run preview  | Preview du build      |

---

## Troubleshooting

**Login retourne 500 avec "Argument sess is missing"**
Le model Session dans schema.prisma doit avoir id/sid/data/expiresAt (compatibilité @quixo3/prisma-session-store v3).

**Le cookie de session n est pas envoyé**
Sans HTTPS, configure cookie.secure: false et cookie.sameSite: lax dans server.js.

**CORS bloque http://votre-ip**
La variable s appelle ALLOWED_ORIGINS (pas CORS_ORIGINS). Restart pm2 avec --update-env.

**Le bundle frontend tape /api/v1/api/v1/...**
VITE_API_BASE_URL doit être le hostname seul (le code ajoute /api/v1).

---

## Licence

Propriétaire — Impact Centre Chrétien (ICC). Tous droits réservés.

## Contact

Rodney Defoundoux — roddefou@gmail.com
