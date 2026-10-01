import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

import { buildAccomplishmentReportBuffer, getReportFileName } from './lib/docxBuilder.js';
import {
  isOAuthConfigured,
  getAuthUrl,
  getTokensFromCode,
  uploadDocxToDrive
} from './lib/driveClient.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const isProd = process.env.NODE_ENV === 'production';
const PORT = process.env.PORT || 5000;

// Helper to determine redirect URL for OAuth flow
const getFrontendRedirectUrl = (queryParamString) => {
  // If explicitly configured (e.g., frontend on separate domain like Vercel)
  if (process.env.FRONTEND_URL) {
    const base = process.env.FRONTEND_URL.replace(/\/$/, '');
    return `${base}/?${queryParamString}`;
  }
  // In production when served from same Express instance, use relative URL
  if (isProd) {
    return `/?${queryParamString}`;
  }
  // Local development default (Vite dev server)
  return `http://localhost:5173/?${queryParamString}`;
};

// In-memory token store mapped by session ID (or cookies)
const tokenStore = new Map();

// Enable reverse proxy trust (critical for HTTPS cookies on Render, Railway, Cloud Run, Nginx)
app.set('trust proxy', 1);

// Middleware
app.use(cors({
  origin: true,
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(cookieParser(process.env.SESSION_SECRET || 'napwc-secret-key-2026'));

// Session middleware helper
app.use((req, res, next) => {
  let sessionId = req.signedCookies.sessionId;
  if (!sessionId) {
    sessionId = 'sess_' + Math.random().toString(36).substring(2) + Date.now().toString(36);
    res.cookie('sessionId', sessionId, {
      signed: true,
      httpOnly: true,
      secure: isProd, // Only send over HTTPS in production
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
    });
  }
  req.sessionId = sessionId;
  next();
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// Google Drive Auth Status
app.get('/api/auth/status', (req, res) => {
  const configured = isOAuthConfigured();
  const tokens = tokenStore.get(req.sessionId);
  const authenticated = Boolean(tokens && (tokens.access_token || tokens.refresh_token));

  res.json({
    configured,
    authenticated,
    folderName: 'Accomplishment Reports'
  });
});

// Start Google OAuth Flow
app.get('/api/auth/google', (req, res) => {
  try {
    if (!isOAuthConfigured()) {
      return res.status(400).json({
        error: 'Google OAuth is not configured. Please set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in backend/.env'
      });
    }

    const state = req.sessionId;
    const authUrl = getAuthUrl(state);
    res.redirect(authUrl);
  } catch (error) {
    console.error('OAuth initiation error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Google OAuth Callback
app.get('/api/auth/google/callback', async (req, res) => {
  const { code, state, error } = req.query;

  if (error) {
    console.error('OAuth error callback:', error);
    return res.redirect(getFrontendRedirectUrl(`auth_error=${encodeURIComponent(error)}`));
  }

  if (!code) {
    return res.redirect(getFrontendRedirectUrl('auth_error=no_code_provided'));
  }

  try {
    const tokens = await getTokensFromCode(code);
    const sessionId = state || req.sessionId;
    tokenStore.set(sessionId, tokens);

    res.redirect(getFrontendRedirectUrl('auth_success=1'));
  } catch (err) {
    console.error('Error exchanging OAuth code:', err);
    res.redirect(getFrontendRedirectUrl(`auth_error=${encodeURIComponent(err.message)}`));
  }
});

// Disconnect / Logout Google Drive
app.post('/api/auth/logout', (req, res) => {
  tokenStore.delete(req.sessionId);
  res.json({ success: true, message: 'Google Drive disconnected' });
});

// Generate .docx endpoint
app.post('/api/generate', async (req, res) => {
  try {
    const data = req.body;
    if (!data) {
      return res.status(400).json({ error: 'Request body cannot be empty.' });
    }

    const buffer = await buildAccomplishmentReportBuffer(data);
    const fileName = getReportFileName(data);

    // If client requested direct download file attachment
    if (req.query.download === '1' || req.query.download === 'true') {
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
      res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
      return res.send(buffer);
    }

    // Default: return base64 and filename
    res.json({
      success: true,
      fileName,
      size: buffer.length,
      fileBase64: buffer.toString('base64')
    });
  } catch (err) {
    console.error('Docx generation error:', err);
    res.status(500).json({ error: 'Failed to generate document: ' + err.message });
  }
});

// Save directly to Google Drive
app.post('/api/save-to-drive', async (req, res) => {
  try {
    const tokens = tokenStore.get(req.sessionId);
    if (!tokens) {
      return res.status(401).json({
        error: 'Not authenticated with Google Drive. Please click "Sign in with Google" first.'
      });
    }

    const data = req.body;
    if (!data) {
      return res.status(400).json({ error: 'Missing report data.' });
    }

    const buffer = await buildAccomplishmentReportBuffer(data);
    const fileName = getReportFileName(data);

    const driveResult = await uploadDocxToDrive(buffer, fileName, tokens);

    res.json({
      success: true,
      fileId: driveResult.id,
      fileName: driveResult.name,
      webViewLink: driveResult.webViewLink,
      webContentLink: driveResult.webContentLink,
      folderName: 'Accomplishment Reports'
    });
  } catch (err) {
    console.error('Google Drive save error:', err);
    // If token invalid/expired, remove from store
    if (err.message && (err.message.includes('invalid_grant') || err.message.includes('No access, refresh token'))) {
      tokenStore.delete(req.sessionId);
      return res.status(401).json({
        error: 'Google Drive authorization expired. Please sign in again.'
      });
    }
    res.status(500).json({ error: 'Failed to upload to Google Drive: ' + err.message });
  }
});

// Handle unmatched API requests with 404 JSON (prevents falling back to index.html)
app.all('/api/*', (req, res) => {
  res.status(404).json({ error: `API route not found: ${req.method} ${req.originalUrl}` });
});

// Serve frontend static build if built
const frontendDist = path.resolve(__dirname, '..', 'frontend', 'dist');
if (fs.existsSync(frontendDist)) {
  app.use(express.static(frontendDist));
  app.get('*', (req, res) => {
    res.sendFile(path.join(frontendDist, 'index.html'));
  });
}

const server = app.listen(PORT, () => {
  console.log(`NAPWC Accomplishment Report Server running on http://localhost:${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

// Graceful shutdown handling
const handleShutdown = (signal) => {
  console.log(`Received ${signal}. Shutting down gracefully...`);
  server.close(() => {
    console.log('HTTP server closed.');
    process.exit(0);
  });
  setTimeout(() => {
    console.error('Forced shutdown timeout.');
    process.exit(1);
  }, 10000).unref();
};

process.on('SIGTERM', () => handleShutdown('SIGTERM'));
process.on('SIGINT', () => handleShutdown('SIGINT'));
