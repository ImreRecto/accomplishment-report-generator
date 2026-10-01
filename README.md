# NAPWC Accomplishment Report Generator

A standalone web application to fill out semi-monthly Accomplishment Report Forms for the **Ninoy Aquino Parks and Wildlife Center (NAPWC)**, preview them in real time, and export native Microsoft Word (`.docx`) files directly or upload them to **Google Drive**.

![Preview](/backend/assets/logo_napwc.png)

---

## Features

- **Document-Accurate Word Generation (`.docx`)**:
  - Recreates the exact official layout with the 3 logos (DENR seal, BMB seal, NAPWC banner).
  - Exact table border formatting and cell paddings.
  - `#C6E0B4` green shaded header cell for `"ACCOMPLISHMENTS / Task/s Performed"`.
  - Date blocks with disc bullets (`•`) and nested dash sub-bullets (`- `).
  - Bottom sign-off block with `"Noted by:"`, checkbox cell, employee name, and approver details.
- **Real-Time WYSIWYG Preview**:
  - Live paper-sheet rendering updates as you type.
  - Split-view, Editor-only, or Preview-only modes.
- **Quick Period Auto-Formatting**:
  - Two date pickers automatically format to `"MONTH DD-DD, YYYY"` (e.g. `"APRIL 01-15, 2026"`).
  - Quick buttons for `"1st Half (01-15)"`, `"2nd Half (16-End)"`, and `"Full Month"`.
- **Approver Presets Manager**:
  - Saved presets for frequent signatories (e.g. `ELPIDIO B. GELERA, JR. - OIC, NAPWC`).
  - Add, edit, or delete presets with localStorage persistence.
- **Direct Local Download**:
  - Generate and download native `.docx` files locally with 1 click — no login or Google setup required!
- **Google Drive Integration**:
  - 1-click cloud sync into a dedicated `"Accomplishment Reports"` folder in your Drive.
  - Uses the minimal, secure scope: `https://www.googleapis.com/auth/drive.file`.

---

## Tech Stack

- **Frontend**: React 18, Vite, Lucide Icons, Plain CSS with CSS Custom Properties.
- **Backend**: Node.js, Express, `docx` library (native OOXML generator), `googleapis` (OAuth 2.0 & Drive API v3).

---

## Quick Start

### 1. Install Dependencies
```bash
# In backend
cd backend
npm install

# In frontend
cd ../frontend
npm install
```

### 2. Start Development Servers

In terminal 1 (Backend):
```bash
cd backend
node server.js
```
*Backend runs on `http://localhost:5000`.*

In terminal 2 (Frontend):
```bash
cd frontend
npm run dev
```
*Frontend runs on `http://localhost:5173` (with `/api` proxied to port 5000).*

---

---

## Production Deployment & Docker

For full, step-by-step deployment instructions for **Render**, **Railway**, **Google Cloud Run**, **Docker**, and **Ubuntu VPS**, see the dedicated guide:

👉 **[Complete Deployment Guide (DEPLOYMENT.md)](file:///c:/Users/ADMIN/Desktop/Antigravity/Accomplishment%20Report%20Generator/DEPLOYMENT.md)**

### Run via Docker in 1 Command
```bash
docker compose up -d --build
```
The app will immediately run on `http://localhost:5000`.

### Production Build & Single Server
You can build the frontend and serve both frontend and backend from a single Node/Express server:

```bash
# Build frontend and install dependencies
npm run build

# Start production server
npm start
```
*Visit `http://localhost:5000`.*

---

## Google Drive OAuth Setup (Optional)

To enable direct upload to Google Drive:

1. Go to the [Google Cloud Console](https://console.cloud.google.com/).
2. Create a new project or select an existing one.
3. Enable the **Google Drive API** under **APIs & Services > Library**.
4. Go to **APIs & Services > Credentials** > **Create Credentials** > **OAuth client ID**.
5. Set Application Type to **Web application**.
6. Add the Authorized Redirect URI:
   ```
   http://localhost:5000/api/auth/google/callback
   ```
7. Copy your **Client ID** and **Client Secret** into `backend/.env`:
   ```env
   GOOGLE_CLIENT_ID=your_actual_client_id.apps.googleusercontent.com
   GOOGLE_CLIENT_SECRET=your_actual_client_secret
   GOOGLE_REDIRECT_URI=http://localhost:5000/api/auth/google/callback
   PORT=5000
   FRONTEND_URL=http://localhost:5173
   ```
8. Restart `backend/server.js`.
9. In the app, click **Connect Drive** and sign in with Google!

---

## Data Model Reference

The generator accepts and persists state matching this structure:

```json
{
  "employeeName": "IMRE C. RECTO",
  "periodLabel": "APRIL 01-15, 2026",
  "entries": [
    {
      "subDateLabel": "APRIL 01",
      "bullets": [
        {
          "text": "Continued the development and improvement of the NAPWC Database Management System, including the creation of the following dashboards:",
          "subBullets": [
            "Non-Living Component Inventory Dashboard",
            "AFoCO Forest Bathing Client Reservation Dashboard"
          ]
        },
        { "text": "Prepared the presentation for the upcoming PAMB meeting", "subBullets": [] }
      ]
    }
  ],
  "notedBy": {
    "approverName": "ELPIDIO B. GELERA, JR.",
    "approverTitle": "Senior Ecosystems Management Specialist",
    "approverOffice": "Office-In-Charge, NAPWC"
  }
}
```
