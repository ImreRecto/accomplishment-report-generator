/**
 * Client-Side Google Drive Integration using Google Identity Services (GIS)
 * and Google Drive REST API v3.
 * 
 * Works 100% on static hosts (Vercel, Netlify) and local development without
 * requiring a dedicated backend server for uploads.
 */

export const DEFAULT_CLIENT_ID = '630595160124-p8oualb7ddvrbgiqsbcfb3akn6rck5cs.apps.googleusercontent.com';

const SCOPES = 'https://www.googleapis.com/auth/drive.file';
const TOKEN_KEY = 'napwc_drive_token';
const USER_KEY = 'napwc_drive_user';
const EXPIRY_KEY = 'napwc_drive_token_expires_at';

/**
 * Returns the active Google Client ID from environment or fallback default.
 */
export function getGoogleClientId() {
  return import.meta.env?.VITE_GOOGLE_CLIENT_ID || DEFAULT_CLIENT_ID;
}

/**
 * Checks if Google Client ID is configured.
 */
export function isGoogleDriveConfigured() {
  const cid = getGoogleClientId();
  return Boolean(cid && !cid.includes('your_google_client_id'));
}

/**
 * Dynamically loads the official Google Identity Services (GIS) script.
 */
export function loadGsiScript() {
  return new Promise((resolve, reject) => {
    if (typeof window !== 'undefined' && window.google?.accounts?.oauth2) {
      return resolve(window.google);
    }

    const existingScript = document.getElementById('google-gsi-script');
    if (existingScript) {
      existingScript.addEventListener('load', () => resolve(window.google));
      existingScript.addEventListener('error', reject);
      return;
    }

    const script = document.createElement('script');
    script.id = 'google-gsi-script';
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => resolve(window.google);
    script.onerror = () => reject(new Error('Failed to load Google Identity Services'));
    document.head.appendChild(script);
  });
}

/**
 * Retrieves cached authentication data if valid.
 */
export function getStoredAuth() {
  try {
    const token = localStorage.getItem(TOKEN_KEY);
    const expiresAt = Number(localStorage.getItem(EXPIRY_KEY) || 0);
    const userStr = localStorage.getItem(USER_KEY);
    const user = userStr ? JSON.parse(userStr) : null;

    if (token && expiresAt && Date.now() < expiresAt) {
      return { token, user, authenticated: true };
    }
    // Expired or missing
    if (token && Date.now() >= expiresAt) {
      clearStoredAuth();
    }
  } catch (e) {
    console.warn('Error reading stored auth:', e);
  }
  return { token: null, user: null, authenticated: false };
}

/**
 * Clears stored authentication data.
 */
export function clearStoredAuth() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  localStorage.removeItem(EXPIRY_KEY);
}

/**
 * Initiates the Google OAuth token consent flow in a non-blocking popup.
 */
export async function requestGoogleAccessToken() {
  await loadGsiScript();

  const clientId = getGoogleClientId();
  if (!clientId) {
    throw new Error('Google Client ID is not configured.');
  }

  return new Promise((resolve, reject) => {
    try {
      const client = window.google.accounts.oauth2.initTokenClient({
        client_id: clientId,
        scope: SCOPES,
        callback: async (tokenResponse) => {
          if (tokenResponse.error) {
            return reject(new Error(tokenResponse.error_description || tokenResponse.error));
          }

          const accessToken = tokenResponse.access_token;
          const expiresIn = Number(tokenResponse.expires_in || 3600);
          const expiresAt = Date.now() + (expiresIn - 60) * 1000;

          // Save token
          localStorage.setItem(TOKEN_KEY, accessToken);
          localStorage.setItem(EXPIRY_KEY, String(expiresAt));

          // Fetch basic profile info (email)
          let userInfo = null;
          try {
            const userRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
              headers: { Authorization: `Bearer ${accessToken}` }
            });
            if (userRes.ok) {
              userInfo = await userRes.json();
              localStorage.setItem(USER_KEY, JSON.stringify(userInfo));
            }
          } catch (err) {
            console.warn('Could not fetch user profile info:', err);
          }

          resolve({
            token: accessToken,
            user: userInfo,
            authenticated: true
          });
        }
      });

      client.requestAccessToken({ prompt: 'consent' });
    } catch (err) {
      reject(err);
    }
  });
}

/**
 * Finds or creates the "Accomplishment Reports" folder in the logged-in user's Drive.
 */
export async function getOrCreateDriveFolder(accessToken) {
  const q = encodeURIComponent("name = 'Accomplishment Reports' and mimeType = 'application/vnd.google-apps.folder' and trashed = false");
  const listRes = await fetch(`https://www.googleapis.com/drive/v3/files?q=${q}&fields=files(id,name)&spaces=drive`, {
    headers: { Authorization: `Bearer ${accessToken}` }
  });

  if (!listRes.ok) {
    if (listRes.status === 401) {
      clearStoredAuth();
      throw new Error('Google Drive authorization has expired. Please sign in again.');
    }
    throw new Error('Failed to search Google Drive folders.');
  }

  const listData = await listRes.json();
  if (listData.files && listData.files.length > 0) {
    return listData.files[0].id;
  }

  // Create folder if not found
  const createRes = await fetch('https://www.googleapis.com/drive/v3/files', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      name: 'Accomplishment Reports',
      mimeType: 'application/vnd.google-apps.folder'
    })
  });

  if (!createRes.ok) {
    throw new Error('Failed to create "Accomplishment Reports" folder in Google Drive.');
  }

  const createData = await createRes.json();
  return createData.id;
}

/**
 * Uploads a .docx file Blob directly to the logged-in user's Google Drive.
 */
export async function uploadDocxBlobToDrive(blob, fileName, accessToken) {
  if (!accessToken) {
    throw new Error('Not authenticated with Google Drive.');
  }

  // 1. Locate or create target folder
  const folderId = await getOrCreateDriveFolder(accessToken);

  // 2. Prepare multipart body (metadata + binary file)
  const metadata = {
    name: fileName,
    parents: [folderId],
    mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  };

  const boundary = '-------314159265358979323846';
  const delimiter = `\r\n--${boundary}\r\n`;
  const closeDelimiter = `\r\n--${boundary}--`;

  const metadataPart = `${delimiter}Content-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(metadata)}`;
  const fileHeader = `${delimiter}Content-Type: application/vnd.openxmlformats-officedocument.wordprocessingml.document\r\n\r\n`;

  const fileArrayBuffer = await blob.arrayBuffer();

  const multipartBlob = new Blob(
    [
      metadataPart,
      fileHeader,
      fileArrayBuffer,
      closeDelimiter
    ],
    { type: `multipart/related; boundary=${boundary}` }
  );

  // 3. Upload to Google Drive
  const uploadRes = await fetch(
    'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,webViewLink,webContentLink',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`
      },
      body: multipartBlob
    }
  );

  if (!uploadRes.ok) {
    if (uploadRes.status === 401) {
      clearStoredAuth();
      throw new Error('Google Drive authorization expired. Please sign in again.');
    }
    const err = await uploadRes.json().catch(() => ({}));
    throw new Error(err.error?.message || 'Failed to upload report to Google Drive.');
  }

  return await uploadRes.json();
}
