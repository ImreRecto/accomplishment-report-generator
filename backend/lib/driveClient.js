import { google } from 'googleapis';
import stream from 'stream';
import dotenv from 'dotenv';
dotenv.config();

/**
 * Creates and returns an OAuth2 client using environment variables or passed credentials.
 */
export function getOAuth2Client(customCredentials = {}) {
  const clientId = customCredentials.clientId || process.env.GOOGLE_CLIENT_ID;
  const clientSecret = customCredentials.clientSecret || process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = customCredentials.redirectUri || process.env.GOOGLE_REDIRECT_URI || 'http://localhost:5000/api/auth/google/callback';

  if (!clientId || !clientSecret) {
    return null;
  }

  return new google.auth.OAuth2(clientId, clientSecret, redirectUri);
}

/**
 * Checks if OAuth credentials are configured in the environment.
 */
export function isOAuthConfigured() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  return Boolean(
    clientId && 
    clientSecret && 
    clientId !== 'your_google_client_id_here' &&
    clientSecret !== 'your_google_client_secret_here'
  );
}

/**
 * Generates the Google OAuth authorization URL.
 */
export function getAuthUrl(state = '') {
  const oauth2Client = getOAuth2Client();
  if (!oauth2Client) {
    throw new Error('Google OAuth credentials not configured. Please set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in backend/.env');
  }

  const scopes = [
    'https://www.googleapis.com/auth/drive.file'
  ];

  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: scopes,
    include_granted_scopes: true,
    prompt: 'consent',
    state: state || undefined
  });
}

/**
 * Exchanges authorization code for tokens.
 */
export async function getTokensFromCode(code) {
  const oauth2Client = getOAuth2Client();
  if (!oauth2Client) {
    throw new Error('Google OAuth credentials not configured.');
  }

  const { tokens } = await oauth2Client.getToken(code);
  return tokens;
}

/**
 * Finds or creates the "Accomplishment Reports" folder in user's Drive.
 */
export async function getOrCreateReportsFolder(authClient) {
  const drive = google.drive({ version: 'v3', auth: authClient });

  const query = "name = 'Accomplishment Reports' and mimeType = 'application/vnd.google-apps.folder' and trashed = false";
  const searchRes = await drive.files.list({
    q: query,
    fields: 'files(id, name)',
    spaces: 'drive'
  });

  if (searchRes.data.files && searchRes.data.files.length > 0) {
    return searchRes.data.files[0].id;
  }

  // Create folder
  const folderMetadata = {
    name: 'Accomplishment Reports',
    mimeType: 'application/vnd.google-apps.folder'
  };

  const folderRes = await drive.files.create({
    requestBody: folderMetadata,
    fields: 'id'
  });

  return folderRes.data.id;
}

/**
 * Uploads a .docx buffer to the "Accomplishment Reports" Google Drive folder.
 * 
 * @param {Buffer} buffer
 * @param {string} fileName
 * @param {Object} tokens - User's OAuth tokens
 * @returns {Promise<{ id: string, name: string, webViewLink: string }>}
 */
export async function uploadDocxToDrive(buffer, fileName, tokens) {
  const oauth2Client = getOAuth2Client();
  if (!oauth2Client) {
    throw new Error('Google OAuth credentials not configured.');
  }

  oauth2Client.setCredentials(tokens);

  const folderId = await getOrCreateReportsFolder(oauth2Client);
  const drive = google.drive({ version: 'v3', auth: oauth2Client });

  const bufferStream = new stream.PassThrough();
  bufferStream.end(buffer);

  const fileMetadata = {
    name: fileName,
    parents: [folderId]
  };

  const media = {
    mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    body: bufferStream
  };

  const response = await drive.files.create({
    requestBody: fileMetadata,
    media: media,
    fields: 'id, name, webViewLink, webContentLink'
  });

  return {
    id: response.data.id,
    name: response.data.name,
    webViewLink: response.data.webViewLink,
    webContentLink: response.data.webContentLink
  };
}
