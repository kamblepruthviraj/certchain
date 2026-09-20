# CertChain: Deployment & Operations Guide

## 1. System Requirements & Environment

### 1.1 Prerequisites
- **Node.js**: Version 18.x or 20.x LTS
- **npm**: Version 9.x or later
- **MongoDB**: Community or Enterprise Server v6.0+ running at `mongodb://127.0.0.1:27017`
- **Operating System**: Windows 10/11, Ubuntu 22.04 LTS, or macOS

---

## 2. Environment Configuration

The backend reads configuration from `backend/.env`. A production configuration template is provided below:

```ini
# Server Configuration
PORT=5000
NODE_ENV=production
FRONTEND_URL=https://certchain.univ.edu

# Database Connection
MONGODB_URI=mongodb://127.0.0.1:27017/pbl_certificate_db

# JWT Security
JWT_SECRET=super-secure-production-jwt-entropy-key-32-chars-min
JWT_EXPIRES_IN=7d

# Cryptographic Threshold Committee Configuration
THRESHOLD_REQUIRED=2
THRESHOLD_TOTAL=3

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_AUTH=30
RATE_LIMIT_MAX_VERIFY=120
```

---

## 3. Persistent Cryptographic Keystores

CertChain securely persists cryptographic keys in JSON vaults located in `backend/config/`:
- `official_keystore.json`: Stores official Ed25519 signing keypairs (`KEY-OFFICIAL-vN`).
- `tsa_keystore.json`: Stores the institutional TSA authority Ed25519 keypair.
- `delivery_keystore.json`: Stores the server's Curve25519 (X25519) delivery keypair.

### Keystore Backup & Security Policy
> [!IMPORTANT]
> In an enterprise deployment, these JSON keystores should be mounted to encrypted persistent volumes (e.g., AWS KMS, HashiCorp Vault, or hardware HSM) with restricted read/write permissions (`chmod 600`).

---

## 4. Production Installation & Startup

### Step 1: Install Dependencies
From the repository root:
```bash
npm install
npm --prefix backend install
npm --prefix frontend install
```

### Step 2: Build the Frontend
```bash
npm run build
```
This builds the production SPA into `frontend/dist/`.

### Step 3: Run the Application
For unified development running both frontend (port 3000) and backend (port 5000):
```bash
npm run dev
```

For production process management using `pm2`:
```bash
npm install -g pm2
pm2 start backend/server.js --name "certchain-backend"
pm2 serve frontend/dist 3000 --spa --name "certchain-frontend"
```

---

## 5. Reverse Proxy Configuration (Nginx Example)

```nginx
server {
    listen 80;
    server_name certchain.univ.edu;

    # Frontend Single Page App
    location / {
        root /var/www/certchain/frontend/dist;
        try_files $uri $uri/ /index.html;
    }

    # Backend API Reverse Proxy
    location /api/ {
        proxy_pass http://127.0.0.1:5000/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```
