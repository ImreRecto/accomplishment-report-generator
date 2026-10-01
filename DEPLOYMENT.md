# Deployment Guide — NAPWC Accomplishment Report Generator

This guide provides end-to-end instructions for deploying the **NAPWC Semi-Monthly Accomplishment Report Generator** to production environments.

---

## Table of Contents
1. [Architecture Overview](#1-architecture-overview)
2. [Google Cloud Console Setup (Google Drive Integration)](#2-google-cloud-console-setup)
3. [Environment Variables Reference](#3-environment-variables-reference)
4. [Deployment Options](#4-deployment-options)
   - [Option A: Render (Fastest & Free Tier Available)](#option-a-render-recommended-fastest)
   - [Option B: Railway (One-Click Git / Docker Deploy)](#option-b-railway)
   - [Option C: Google Cloud Run (Recommended for Government / Official Agency Infrastructure)](#option-c-google-cloud-run)
   - [Option D: Docker & Docker Compose (Self-Hosted / VPS)](#option-d-docker--docker-compose)
   - [Option E: Ubuntu VPS (PM2 + Nginx + Certbot SSL)](#option-e-ubuntu-vps-with-pm2--nginx)
5. [Verification & Smoke Testing](#5-verification--smoke-testing)
6. [Troubleshooting & FAQ](#6-troubleshooting--faq)

---

## 1. Architecture Overview

The application is architected as a **unified full-stack application**:
- **Frontend:** React 18 + Vite (compiled to static HTML/CSS/JS in `frontend/dist`).
- **Backend:** Node.js (v18+) + Express, generating native `.docx` files via `docx` and uploading to Google Drive via `googleapis`.
- **Single-Origin Deployment:** In production, Express directly serves the optimized React frontend and handles `/api/*` endpoints from a single domain and port.
  - No cross-origin CORS complications.
  - Seamless, secure HTTP-only cookie transmission for session tokens.
  - Zero third-party cookie blocking issues across modern browsers (Chrome, Safari, Edge).

---

## 2. Google Cloud Console Setup

To enable direct saving to **Google Drive** in production, you need an OAuth 2.0 Client ID from Google Cloud Console.

### Step 2.1: Create or Select a Google Cloud Project
1. Navigate to the [Google Cloud Console](https://console.cloud.google.com/).
2. Log in with your agency or personal Google account.
3. Click the project dropdown in the top-left bar and select **"New Project"**.
4. Name the project (e.g., `NAPWC-Report-Generator`) and click **Create**.

### Step 2.2: Enable the Google Drive API
1. In the left navigation menu, go to **APIs & Services** > **Library**.
2. In the search box, search for **Google Drive API**.
3. Select **Google Drive API** and click **Enable**.

### Step 2.3: Configure the OAuth Consent Screen
1. Go to **APIs & Services** > **OAuth consent screen**.
2. Select User Type:
   - **Internal** (Recommended if using a Google Workspace organization like `@denr.gov.ph` or `@napwc.gov.ph`): Any member in your organization can log in without verification.
   - **External** (If using personal `@gmail.com` accounts): App starts in "Testing" mode.
3. Fill in required fields:
   - **App name:** `NAPWC Accomplishment Report Generator`
   - **User support email:** Select your email address.
   - **Developer contact information:** Enter your email address.
4. Click **Save and Continue**.
5. In the **Scopes** step:
   - Click **Add or Remove Scopes**.
   - Search for `drive.file` and check:
     `.../auth/drive.file` (*"See, edit, create, and delete only the specific Google Drive files you use with this app"*).
     *(This minimal scope ensures the app only has access to files it creates, preserving full user privacy).*
   - Click **Update** and then **Save and Continue**.
6. *(External only)* In the **Test Users** step:
   - Add the Gmail addresses of colleagues/users who will use the app during testing.
   - Click **Save and Continue**.

### Step 2.4: Create OAuth 2.0 Web Client Credentials
1. Go to **APIs & Services** > **Credentials**.
2. Click **+ Create Credentials** at the top and choose **OAuth client ID**.
3. Select **Application type**: **Web application**.
4. Set **Name**: `NAPWC Report Web Client`.
5. Under **Authorized JavaScript origins**, click **+ Add URI** and enter your production URL:
   - Example: `https://napwc-report.onrender.com`
   - *(For local development, keep `http://localhost:5000` and `http://localhost:5173`)*
6. Under **Authorized redirect URIs**, click **+ Add URI** and enter the callback route:
   - Example: `https://napwc-report.onrender.com/api/auth/google/callback`
   - *(For local testing: `http://localhost:5000/api/auth/google/callback`)*
7. Click **Create**.
8. A modal will display your **Client ID** and **Client Secret**. Copy both values for the next section.

---

## 3. Environment Variables Reference

| Variable Name | Required | Default Value | Description |
| :--- | :---: | :--- | :--- |
| `NODE_ENV` | **Yes** | `production` | Set to `production` in live environments (enables HTTPS-only cookies). |
| `PORT` | **Yes** | `5000` | Port Express listens on (Render/Railway/Cloud Run inject this automatically). |
| `SESSION_SECRET` | **Yes** | `napwc-secret-key-2026` | Random secret key used to sign and verify session cookies. |
| `GOOGLE_CLIENT_ID` | Optional | `""` | Google Cloud OAuth Client ID for Google Drive export. |
| `GOOGLE_CLIENT_SECRET` | Optional | `""` | Google Cloud OAuth Client Secret for Google Drive export. |
| `GOOGLE_REDIRECT_URI` | Optional | `http://localhost:5000/api/auth/google/callback` | Full callback URL matching Google Cloud Console exactly. |
| `FRONTEND_URL` | Optional | `""` | Only needed if frontend is hosted on a separate external domain (e.g. Vercel). |

---

## 4. Deployment Options

### Option A: Render (Recommended & Fastest)

Render supports automated Node deployments from GitHub and provides free SSL automatically.

#### Using Render Blueprint (Automatic 1-Click Setup)
1. Push your repository to GitHub or GitLab.
2. In [Render Dashboard](https://dashboard.render.com/), click **New +** > **Blueprint**.
3. Connect your repository. Render will automatically detect `render.yaml`.
4. Fill in the environment variables:
   - `GOOGLE_CLIENT_ID`: Your Google OAuth Client ID
   - `GOOGLE_CLIENT_SECRET`: Your Google OAuth Client Secret
   - `GOOGLE_REDIRECT_URI`: `https://<YOUR-RENDER-SUBDOMAIN>.onrender.com/api/auth/google/callback`
5. Click **Apply**. Render will install dependencies, build the frontend bundle, and boot the server.

#### Manual Setup on Render
1. Click **New +** > **Web Service**.
2. Select your repository.
3. Configure:
   - **Environment:** `Node`
   - **Build Command:** `npm --prefix backend install && npm --prefix frontend install && npm --prefix frontend run build`
   - **Start Command:** `node backend/server.js`
   - **Plan:** Free or Starter
4. Under **Environment Variables**, add:
   - `NODE_ENV` = `production`
   - `SESSION_SECRET` = *(Generate a 32+ character random string)*
   - `GOOGLE_CLIENT_ID` = `your-client-id.apps.googleusercontent.com`
   - `GOOGLE_CLIENT_SECRET` = `your-client-secret`
   - `GOOGLE_REDIRECT_URI` = `https://<app-name>.onrender.com/api/auth/google/callback`
5. Click **Create Web Service**.

---

### Option B: Railway

Railway automatically detects Dockerfiles and deploys in seconds.

1. Install Railway CLI (`npm i -g @railway/cli`) or go to [railway.app](https://railway.app/).
2. Click **New Project** > **Deploy from GitHub repo**.
3. Railway automatically detects the project root `Dockerfile`.
4. In the Railway service settings, go to the **Variables** tab and add:
   - `NODE_ENV` = `production`
   - `SESSION_SECRET` = `your-random-session-secret`
   - `GOOGLE_CLIENT_ID` = `your-google-client-id`
   - `GOOGLE_CLIENT_SECRET` = `your-google-client-secret`
   - `GOOGLE_REDIRECT_URI` = `https://<your-railway-domain>.up.railway.app/api/auth/google/callback`
5. In **Settings** > **Networking**, click **Generate Domain**.
6. Copy that domain and update `GOOGLE_REDIRECT_URI` and your Google Cloud Console credentials.

---

### Option C: Google Cloud Run

Google Cloud Run is an ideal solution for government institutions, DENR, and enterprise setups:
- High availability with auto-scaling to zero when idle (cost-efficient).
- Direct integration with Google Cloud Identity, IAM, and custom agency domains.

#### Prerequisites:
- Google Cloud SDK (`gcloud`) installed: [Install Guide](https://cloud.google.com/sdk/docs/install)

#### Deployment Steps:
1. Authenticate with Google Cloud:
   ```bash
   gcloud auth login
   gcloud config set project YOUR_PROJECT_ID
   ```
2. Build and deploy container directly using Google Cloud Build and Cloud Run:
   ```bash
   gcloud run deploy napwc-report-generator \
     --source . \
     --platform managed \
     --region asia-southeast1 \
     --allow-unauthenticated \
     --set-env-vars NODE_ENV=production \
     --set-env-vars SESSION_SECRET="your-strong-secret-key" \
     --set-env-vars GOOGLE_CLIENT_ID="your-client-id.apps.googleusercontent.com" \
     --set-env-vars GOOGLE_CLIENT_SECRET="your-client-secret" \
     --set-env-vars GOOGLE_REDIRECT_URI="https://YOUR-SERVICE-URL.a.run.app/api/auth/google/callback"
   ```
3. Cloud Run provides an HTTPS URL (e.g. `https://napwc-report-generator-xxx-as.a.run.app`).
4. Add this URL to your Google OAuth Authorized JavaScript Origins and Redirect URIs.

---

### Option D: Docker & Docker Compose

Deploy on any server (Ubuntu, Debian, CentOS, or Windows Server) with Docker installed.

1. Clone the repository on the server:
   ```bash
   git clone <repo-url> /opt/napwc-report-generator
   cd /opt/napwc-report-generator
   ```
2. Create production `.env` file:
   ```bash
   cp .env.example .env
   nano .env
   ```
   Fill in your Google OAuth details and production domain.
3. Start the container in detached mode:
   ```bash
   docker compose up -d --build
   ```
4. Verify the container is running:
   ```bash
   docker compose ps
   docker compose logs -f
   ```
5. The application is now serving on port `5000`.

---

### Option E: Ubuntu VPS with PM2 + Nginx

For a traditional Linux virtual private server (e.g., DigitalOcean Droplet, Linode, AWS EC2, or on-premise government server).

#### 1. Server Setup & Dependencies
```bash
sudo apt update && sudo apt upgrade -y
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs nginx git
sudo npm install -g pm2
```

#### 2. Clone and Build Application
```bash
sudo mkdir -p /var/www/napwc-report
sudo chown -R $USER:$USER /var/www/napwc-report
git clone <repo-url> /var/www/napwc-report
cd /var/www/napwc-report

# Install dependencies and build frontend
npm run build
```

#### 3. Setup Backend Environment
```bash
cp backend/.env.example backend/.env
nano backend/.env
```
Set `NODE_ENV=production`, `PORT=5000`, `SESSION_SECRET`, and your Google OAuth keys.

#### 4. Manage with PM2
```bash
pm2 start backend/server.js --name "napwc-report"
pm2 save
pm2 startup
```

#### 5. Configure Nginx Reverse Proxy
Create `/etc/nginx/sites-available/napwc-report`:
```nginx
server {
    listen 80;
    server_name reports.napwc.gov.ph; # Replace with your domain

    client_max_body_size 20M;

    location / {
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```
Enable the site:
```bash
sudo ln -s /etc/nginx/sites-available/napwc-report /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

#### 6. Enable Free SSL via Certbot
```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d reports.napwc.gov.ph
```

---

## 5. Verification & Smoke Testing

After deployment, perform this 5-point verification:

1. **Health Check:**
   Visit `https://<YOUR-DOMAIN>/api/health` in your browser.
   Expected response:
   ```json
   { "status": "ok", "time": "2026-10-01T..." }
   ```
2. **Web App Interface:**
   Visit `https://<YOUR-DOMAIN>/`. Verify:
   - Header logos (DENR / BMB) render in high resolution.
   - Form fields and WYSIWYG A4 preview render accurately.
3. **DOCX Generation & Download:**
   - Click **"Download .docx"**.
   - Open the generated `.docx` in Microsoft Word or LibreOffice.
   - Verify exact Arial font sizes, table layouts, `#A8D08D` header fill, and signature blocks.
4. **Google Drive Authentication:**
   - Click **"Sign in with Google"**.
   - Sign into your Google account and grant file creation permission.
   - The button should turn into a green indicator: **"Connected to Drive (Accomplishment Reports)"**.
5. **Google Drive Cloud Upload:**
   - Click **"Save to Google Drive"**.
   - Open the resulting Google Drive link.
   - Verify the file is stored in your Google Drive under the **"Accomplishment Reports"** folder.

---

## 6. Troubleshooting & FAQ

### Q: Google OAuth displays `Error 400: redirect_uri_mismatch`
- **Cause:** The redirect URI sent by the application does not match the URI configured in Google Cloud Console.
- **Fix:**
  1. Open Google Cloud Console > **APIs & Services** > **Credentials**.
  2. Click your OAuth 2.0 Web Client.
  3. Under **Authorized redirect URIs**, make sure `https://<YOUR-EXACT-DOMAIN>/api/auth/google/callback` is present.
  4. Ensure protocol (`https://`), trailing slashes, and capitalization match exactly. Note that changes in Google Cloud Console can take up to 5 minutes to propagate.

### Q: Google OAuth displays `"Google hasn't verified this app"`
- **Cause:** When an OAuth consent screen is configured as "External" and is still in "Testing" mode, Google displays a warning for safety.
- **Fix:**
  - For testing: Click **Advanced** > **Proceed to <App Name> (unsafe)**.
  - Make sure the Google account you are testing with is added to **Test users** in the OAuth Consent Screen.
  - For organization-wide use: Set the OAuth consent screen to **Internal** (requires Google Workspace).

### Q: Cookies are not retained / User is logged out after signing in
- **Cause:** `NODE_ENV=production` sets cookie attribute `Secure=true`. If your site is accessed over unencrypted `http://` instead of `https://`, modern browsers will discard the cookie.
- **Fix:** Ensure your production site has SSL/TLS enabled (`https://`). All platforms (Render, Railway, Cloud Run, Certbot) provide SSL automatically. Also ensure `app.set('trust proxy', 1)` is enabled in `backend/server.js` (which is configured by default).

### Q: How do I change the default Google Drive upload folder?
- By default, the app automatically finds or creates a folder named **"Accomplishment Reports"** at the root of the user's Google Drive. You can customize this folder name in `backend/lib/driveClient.js` (lines 67, 76, 89).
