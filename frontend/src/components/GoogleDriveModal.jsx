import React from 'react';
import {
  Cloud,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  LogOut,
  FolderCheck,
  ShieldCheck,
  X,
  Copy
} from 'lucide-react';

export default function GoogleDriveModal({
  isOpen,
  onClose,
  driveStatus,
  onLogin,
  onLogout,
  onCopyText
}) {
  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content drive-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-with-icon">
            <Cloud className="drive-brand-icon" size={22} />
            <h3 className="modal-title">Google Drive Integration</h3>
          </div>
          <button type="button" className="close-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="modal-body">
          {/* Status Banner */}
          <div
            className={`status-banner ${
              driveStatus.authenticated
                ? 'status-connected'
                : driveStatus.configured
                ? 'status-ready'
                : 'status-unconfigured'
            }`}
          >
            {driveStatus.authenticated ? (
              <>
                <CheckCircle2 size={20} className="status-icon" />
                <div>
                  <strong>Connected to Google Drive</strong>
                  {driveStatus.userEmail && (
                    <div className="connected-user-pill">
                      <span>Account: <strong>{driveStatus.userEmail}</strong></span>
                    </div>
                  )}
                  <p>Reports will automatically save to your "Accomplishment Reports" folder.</p>
                </div>
              </>
            ) : driveStatus.configured ? (
              <>
                <AlertCircle size={20} className="status-icon" />
                <div>
                  <strong>Google OAuth Configured</strong>
                  <p>Sign in with your Google account to grant access to save reports.</p>
                </div>
              </>
            ) : (
              <>
                <AlertCircle size={20} className="status-icon" />
                <div>
                  <strong>Credentials Needed in backend/.env</strong>
                  <p>Configure your Google Cloud OAuth Client ID & Secret to enable 1-click cloud sync.</p>
                </div>
              </>
            )}
          </div>

          {/* Folder Target Info */}
          <div className="drive-info-box">
            <div className="info-item">
              <FolderCheck size={16} className="item-icon" />
              <span>
                Target Folder: <strong>Accomplishment Reports</strong> (auto-created if missing)
              </span>
            </div>
            <div className="info-item">
              <ShieldCheck size={16} className="item-icon" />
              <span>
                Minimal Government Scope: <code>https://www.googleapis.com/auth/drive.file</code> (Only manages files created by this app)
              </span>
            </div>
          </div>

          {/* Action Button */}
          <div className="drive-actions-section">
            {driveStatus.authenticated ? (
              <button
                type="button"
                className="secondary-btn danger-text btn-full"
                onClick={onLogout}
              >
                <LogOut size={16} />
                Disconnect Google Drive
              </button>
            ) : driveStatus.configured ? (
              <button
                type="button"
                className="google-signin-btn btn-full"
                onClick={onLogin}
              >
                <img
                  src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
                  alt="Google logo"
                  className="google-btn-icon"
                />
                Sign In with Google
              </button>
            ) : (
              <div className="setup-guide-box">
                <h4>Quick Google Cloud Setup (One-time)</h4>
                <ol className="setup-steps">
                  <li>
                    Open{' '}
                    <a
                      href="https://console.cloud.google.com/apis/credentials"
                      target="_blank"
                      rel="noreferrer"
                      className="link-highlight"
                    >
                      Google Cloud Console <ExternalLink size={12} />
                    </a>
                  </li>
                  <li>Enable the <strong>Google Drive API</strong>.</li>
                  <li>Create <strong>OAuth 2.0 Client ID</strong> (Application type: <em>Web Application</em>).</li>
                  <li>
                    Add this Authorized Redirect URI:
                    <div className="code-copy-row">
                      <code>{typeof window !== 'undefined' ? `${window.location.origin}/api/auth/google/callback` : 'http://localhost:5000/api/auth/google/callback'}</code>
                      <button
                        type="button"
                        className="copy-btn"
                        onClick={() =>
                          onCopyText(`${window.location.origin}/api/auth/google/callback`)
                        }
                        title="Copy Redirect URI"
                      >
                        <Copy size={13} />
                      </button>
                    </div>
                  </li>
                  <li>
                    Paste your <code>GOOGLE_CLIENT_ID</code> and <code>GOOGLE_CLIENT_SECRET</code> in your hosting Environment Variables (or <code>backend/.env</code> for local dev).
                  </li>
                </ol>
              </div>
            )}
          </div>
        </div>

        <div className="modal-footer">
          <button type="button" className="secondary-btn" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
