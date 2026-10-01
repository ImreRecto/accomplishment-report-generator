import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  FileDown,
  Cloud,
  Eye,
  Edit3,
  Columns,
  Sparkles,
  CheckCircle2,
  Settings,
  AlertCircle,
  FileCheck2,
  RotateCcw,
  Check,
  Copy,
  Undo2,
  Redo2,
  Printer
} from 'lucide-react';

import HeaderForm from './components/HeaderForm.jsx';
import EntryBuilder from './components/EntryBuilder.jsx';
import SignOffPanel from './components/SignOffPanel.jsx';
import DocumentPreview from './components/DocumentPreview.jsx';
import GoogleDriveModal from './components/GoogleDriveModal.jsx';
import CopyTextModal from './components/CopyTextModal.jsx';
import Toast from './components/Toast.jsx';
import { generateDocxBlob, getReportFileName, triggerFileDownload } from './lib/docxGenerator.js';
import {
  getStoredAuth,
  clearStoredAuth,
  requestGoogleAccessToken,
  uploadDocxBlobToDrive,
  isGoogleDriveConfigured
} from './lib/googleDriveClient.js';
import './App.css';

const SAMPLE_ENTRIES = [
  {
    subDateLabel: 'APRIL 01',
    bullets: [
      {
        text: 'Continued the development and improvement of the NAPWC Database Management System, including the creation of the following dashboards:',
        subBullets: [
          'Non-Living Component Inventory Dashboard',
          'AFoCO Forest Bathing Client Reservation Dashboard'
        ]
      },
      {
        text: 'Prepared the presentation for the upcoming PAMB meeting',
        subBullets: []
      }
    ]
  },
  {
    subDateLabel: 'APRIL 06-10',
    bullets: [
      { text: 'Attended the NAPWC Toolbox Meeting.', subBullets: [] },
      { text: 'Continued on preparing the presentation for the upcoming PAMB meeting', subBullets: [] },
      {
        text: 'Continued the development and improvement of the NAPWC Database Management System, including the creation of the following dashboards:',
        subBullets: [
          'Non-Living Component Inventory Dashboard',
          'AFoCO Forest Bathing Client Reservation Dashboard'
        ]
      },
      { text: 'Assisted in planting Bagawak Morados behind the amphitheater', subBullets: [] }
    ]
  },
  {
    subDateLabel: 'APRIL 13-15',
    bullets: [
      { text: 'Attended the NAPWC Toolbox Meeting.', subBullets: [] },
      { text: 'Continued on preparing the presentation for the upcoming PAMB meeting', subBullets: [] },
      {
        text: 'Continued the development and improvement of the NAPWC Database Management System, including the creation and improvement of the following dashboards:',
        subBullets: [
          'Non-Living Component Inventory Dashboard',
          'Updated the Terms and Conditions of the AFoCO Forest Bathing Client Reservation Dashboard'
        ]
      },
      { text: 'Attended the orientation for all COS Employee', subBullets: [] }
    ]
  }
];

const DEFAULT_APPROVER = {
  approverName: 'ELPIDIO B. GELERA, JR.',
  approverTitle: 'Senior Ecosystems Management Specialist',
  approverOffice: 'Office-In-Charge, NAPWC'
};

export default function App() {
  // State with LocalStorage persistence
  const [employeeName, setEmployeeName] = useState(() => {
    return localStorage.getItem('napwc_employee_name') || 'IMRE C. RECTO';
  });

  const [periodLabel, setPeriodLabel] = useState(() => {
    return localStorage.getItem('napwc_period_label') || 'APRIL 01-15, 2026';
  });

  const [entries, setEntriesState] = useState(() => {
    try {
      const saved = localStorage.getItem('napwc_report_entries');
      return saved ? JSON.parse(saved) : SAMPLE_ENTRIES;
    } catch {
      return SAMPLE_ENTRIES;
    }
  });

  const [notedBy, setNotedBy] = useState(() => {
    try {
      const saved = localStorage.getItem('napwc_report_notedby');
      return saved ? JSON.parse(saved) : DEFAULT_APPROVER;
    } catch {
      return DEFAULT_APPROVER;
    }
  });

  // Undo / Redo stacks
  const historyRef = useRef({
    past: [],
    present: entries,
    future: []
  });

  const setEntries = (newEntries) => {
    const current = historyRef.current.present;
    historyRef.current.past.push(JSON.parse(JSON.stringify(current)));
    if (historyRef.current.past.length > 30) {
      historyRef.current.past.shift();
    }
    historyRef.current.present = newEntries;
    historyRef.current.future = [];
    setEntriesState(newEntries);
  };

  const handleUndo = () => {
    if (historyRef.current.past.length === 0) return;
    const previous = historyRef.current.past.pop();
    historyRef.current.future.unshift(JSON.parse(JSON.stringify(historyRef.current.present)));
    historyRef.current.present = previous;
    setEntriesState(previous);
  };

  const handleRedo = () => {
    if (historyRef.current.future.length === 0) return;
    const next = historyRef.current.future.shift();
    historyRef.current.past.push(JSON.parse(JSON.stringify(historyRef.current.present)));
    historyRef.current.present = next;
    setEntriesState(next);
  };

  // Keyboard shortcut for Undo/Redo
  useEffect(() => {
    const onKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        handleUndo();
      } else if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
        e.preventDefault();
        handleRedo();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // UI state
  const [viewMode, setViewMode] = useState('split'); // 'edit', 'preview', 'split'
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSavingToDrive, setIsSavingToDrive] = useState(false);
  const [showDriveModal, setShowDriveModal] = useState(false);
  const [showCopyModal, setShowCopyModal] = useState(false);
  const [toast, setToast] = useState(null);
  const [saveStatus, setSaveStatus] = useState('Saved');

  // Google Drive state
  const [driveStatus, setDriveStatus] = useState({
    configured: false,
    authenticated: false,
    folderName: 'Accomplishment Reports'
  });

  // Trigger brief "Saving..." indicator then "Saved"
  const triggerAutoSaveBadge = () => {
    setSaveStatus('Saving...');
    setTimeout(() => {
      setSaveStatus('Saved');
    }, 350);
  };

  // Persistence effects
  useEffect(() => {
    localStorage.setItem('napwc_employee_name', employeeName);
    triggerAutoSaveBadge();
  }, [employeeName]);

  useEffect(() => {
    localStorage.setItem('napwc_period_label', periodLabel);
    triggerAutoSaveBadge();
  }, [periodLabel]);

  useEffect(() => {
    localStorage.setItem('napwc_report_entries', JSON.stringify(entries));
    triggerAutoSaveBadge();
  }, [entries]);

  useEffect(() => {
    localStorage.setItem('napwc_report_notedby', JSON.stringify(notedBy));
    triggerAutoSaveBadge();
  }, [notedBy]);

  // Check Drive Status (checks both client-side GIS token and optional backend)
  const fetchDriveStatus = useCallback(async () => {
    // 1. Check local client-side token (Google Identity Services)
    const stored = getStoredAuth();
    if (stored.authenticated && stored.token) {
      setDriveStatus({
        configured: true,
        authenticated: true,
        folderName: 'Accomplishment Reports',
        userEmail: stored.user?.email || null,
        mode: 'client'
      });
      return;
    }

    const clientConfigured = isGoogleDriveConfigured();

    // 2. Check if backend server has session tokens
    try {
      const res = await fetch('/api/auth/status');
      if (res.ok) {
        const data = await res.json();
        setDriveStatus({
          ...data,
          configured: data.configured || clientConfigured,
          mode: 'server'
        });
        return;
      }
    } catch (err) {
      // Backend not running (e.g. static host like Vercel)
    }

    // Default status
    setDriveStatus({
      configured: clientConfigured,
      authenticated: false,
      folderName: 'Accomplishment Reports'
    });
  }, []);

  useEffect(() => {
    fetchDriveStatus();

    const params = new URLSearchParams(window.location.search);
    if (params.get('auth_success')) {
      setToast({
        type: 'success',
        message: 'Successfully connected to Google Drive!'
      });
      fetchDriveStatus();
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (params.get('auth_error')) {
      setToast({
        type: 'error',
        message: `Google Drive connection error: ${params.get('auth_error')}`
      });
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [fetchDriveStatus]);

  // Load sample template
  const handleLoadSample = () => {
    setEmployeeName('IMRE C. RECTO');
    setPeriodLabel('APRIL 01-15, 2026');
    setEntries(SAMPLE_ENTRIES);
    setNotedBy(DEFAULT_APPROVER);
    setToast({
      type: 'info',
      message: 'Official NAPWC sample form loaded!'
    });
  };

  // Direct Download .docx (Resilient Architecture: Fast in-browser generator + server fallback)
  const handleDownloadDocx = async () => {
    setIsGenerating(true);
    const payload = {
      employeeName,
      periodLabel,
      entries,
      notedBy
    };
    const filename = getReportFileName(payload);

    try {
      // 1. Primary: Generate directly in client browser (instant, works on Vercel/Netlify/Render, zero cold start)
      const blob = await generateDocxBlob(payload);
      triggerFileDownload(blob, filename);

      setToast({
        type: 'success',
        message: `Document "${filename}" generated and downloaded!`
      });
    } catch (clientErr) {
      console.warn('In-browser docx generation encountered an issue, trying server API:', clientErr);
      try {
        // 2. Fallback: Request generation from backend API
        const res = await fetch('/api/generate?download=1', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        if (!res.ok) {
          const errJson = await res.json().catch(() => ({}));
          throw new Error(errJson.error || `Server responded with HTTP ${res.status}`);
        }

        const blob = await res.blob();
        triggerFileDownload(blob, filename);

        setToast({
          type: 'success',
          message: `Document "${filename}" generated and downloaded!`
        });
      } catch (serverErr) {
        console.error('Download error:', serverErr);
        setToast({
          type: 'error',
          message: `Download failed: ${serverErr.message || 'Please check network connection.'}`
        });
      }
    } finally {
      setIsGenerating(false);
    }
  };

  // Save to Google Drive (Resilient: Client-Side direct upload + Backend fallback)
  const handleSaveToDrive = async () => {
    if (!driveStatus.authenticated) {
      setShowDriveModal(true);
      return;
    }

    setIsSavingToDrive(true);
    const payload = {
      employeeName,
      periodLabel,
      entries,
      notedBy
    };
    const filename = getReportFileName(payload);

    try {
      const stored = getStoredAuth();
      if (stored.authenticated && stored.token) {
        // 1. Direct in-browser upload to logged-in user's Google Drive (works on Vercel/Netlify/local)
        const blob = await generateDocxBlob(payload);
        const driveData = await uploadDocxBlobToDrive(blob, filename, stored.token);

        setToast({
          type: 'success',
          message: `Saved to Google Drive folder "Accomplishment Reports"!`,
          link: driveData.webViewLink,
          linkText: 'Open in Google Drive'
        });
        return;
      }

      // 2. Fallback: Backend server upload
      const res = await fetch('/api/save-to-drive', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) {
        if (res.status === 401) {
          fetchDriveStatus();
          setShowDriveModal(true);
        }
        throw new Error(data.error || 'Failed to save to Google Drive');
      }

      setToast({
        type: 'success',
        message: `Saved to Google Drive folder "${data.folderName}"!`,
        link: data.webViewLink,
        linkText: 'Open in Google Drive'
      });
    } catch (err) {
      console.error('Drive save error:', err);
      // If authorization expired, prompt to reconnect
      if (err.message && (err.message.includes('expired') || err.message.includes('401'))) {
        fetchDriveStatus();
        setShowDriveModal(true);
      }
      setToast({
        type: 'error',
        message: err.message || 'Failed to upload to Google Drive'
      });
    } finally {
      setIsSavingToDrive(false);
    }
  };

  const handleLoginGoogle = async () => {
    try {
      setIsSavingToDrive(true);
      const auth = await requestGoogleAccessToken();
      setDriveStatus({
        configured: true,
        authenticated: true,
        folderName: 'Accomplishment Reports',
        userEmail: auth.user?.email || null,
        mode: 'client'
      });
      setShowDriveModal(false);
      setToast({
        type: 'success',
        message: auth.user?.email 
          ? `Connected to Google Drive as ${auth.user.email}!` 
          : 'Successfully connected to Google Drive!'
      });
    } catch (err) {
      console.warn('In-browser Google popup encountered an issue, trying backend redirect:', err);
      if (err.message && err.message.includes('popup_closed_by_user')) {
        // User voluntarily dismissed popup
        return;
      }
      // If client ID invalid or backend exists, try backend redirect
      try {
        window.location.href = '/api/auth/google';
      } catch (redirectErr) {
        setToast({
          type: 'error',
          message: `Google Sign-in failed: ${err.message}`
        });
      }
    } finally {
      setIsSavingToDrive(false);
    }
  };

  const handleLogoutGoogle = async () => {
    try {
      clearStoredAuth();
      try {
        await fetch('/api/auth/logout', { method: 'POST' });
      } catch (e) {
        // Server may not be present (static host)
      }
      fetchDriveStatus();
      setShowDriveModal(false);
      setToast({
        type: 'info',
        message: 'Google Drive disconnected'
      });
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setToast({
      type: 'info',
      message: 'Copied to clipboard!'
    });
  };

  // Document completion score
  const hasName = Boolean(employeeName && employeeName.trim());
  const hasDate = Boolean(periodLabel && periodLabel.trim());
  const hasTasks = entries.some((b) => b.bullets && b.bullets.some((k) => k.text.trim()));
  const isReady = hasName && hasDate && hasTasks;

  return (
    <div className="app-layout">
      {/* Top Header Navigation */}
      <header className="navbar">
        <div className="navbar-brand">
          <div className="brand-logos-cluster">
            <img src="/assets/header_logos.png" alt="DENR & BMB" className="nav-logo official" />
            <img src="/assets/napwc_banner.jpg" alt="NAPWC" className="nav-logo banner" />
          </div>
          <div className="brand-titles">
            <div className="brand-badge-row">
              <span className="gov-badge">DENR &bull; BMB</span>
              <span className="gov-badge-sub">PHILIPPINES</span>
            </div>
            <h1 className="brand-heading">Accomplishment Report Generator</h1>
          </div>
        </div>

        <div className="navbar-actions">
          {/* Undo / Redo Controls */}
          <div className="history-controls">
            <button
              type="button"
              className="icon-action-btn"
              onClick={handleUndo}
              disabled={historyRef.current.past.length === 0}
              title="Undo (Ctrl+Z)"
            >
              <Undo2 size={14} />
            </button>
            <button
              type="button"
              className="icon-action-btn"
              onClick={handleRedo}
              disabled={historyRef.current.future.length === 0}
              title="Redo (Ctrl+Y)"
            >
              <Redo2 size={14} />
            </button>
          </div>

          {/* Auto-Save & Status Badge */}
          <div className={`status-pill ${isReady ? 'ready' : 'in-progress'}`}>
            <span className="status-indicator-dot"></span>
            <span>{isReady ? 'Ready to Export' : 'Drafting'}</span>
          </div>

          <div className="autosave-badge" title="All changes saved continuously in your local browser">
            <Check size={12} className="check-icon" />
            <span>{saveStatus}</span>
          </div>

          {/* View mode toggle */}
          <div className="view-mode-pills">
            <button
              type="button"
              className={`pill-btn ${viewMode === 'edit' ? 'active' : ''}`}
              onClick={() => setViewMode('edit')}
              title="Show Form Editor only"
            >
              <Edit3 size={15} />
              <span>Editor</span>
            </button>
            <button
              type="button"
              className={`pill-btn ${viewMode === 'split' ? 'active' : ''}`}
              onClick={() => setViewMode('split')}
              title="Show Side-by-Side Split View"
            >
              <Columns size={15} />
              <span>Split View</span>
            </button>
            <button
              type="button"
              className={`pill-btn ${viewMode === 'preview' ? 'active' : ''}`}
              onClick={() => setViewMode('preview')}
              title="Show Document Preview only"
            >
              <Eye size={15} />
              <span>Preview</span>
            </button>
          </div>

          {/* Copy Text Summary */}
          <button
            type="button"
            className="secondary-btn"
            onClick={() => setShowCopyModal(true)}
            title="Copy Report Summary as Text or Markdown"
          >
            <Copy size={14} />
            <span>Copy Text</span>
          </button>

          {/* Google Drive Status & Connect */}
          <button
            type="button"
            className={`drive-status-badge ${
              driveStatus.authenticated ? 'connected' : 'disconnected'
            }`}
            onClick={() => setShowDriveModal(true)}
            title="Google Drive Settings & Cloud Sync"
          >
            <Cloud size={16} />
            <span>
              {driveStatus.authenticated ? 'Drive Synced' : 'Connect Drive'}
            </span>
            <Settings size={13} className="badge-gear" />
          </button>

          {/* Download Word Document */}
          <button
            type="button"
            className="word-export-btn"
            onClick={handleDownloadDocx}
            disabled={isGenerating}
            title="Download official Microsoft Word document (.docx)"
          >
            <FileDown size={16} />
            <span>{isGenerating ? 'Generating...' : 'Download .docx'}</span>
          </button>

          {/* Save to Drive */}
          <button
            type="button"
            className="primary-btn pulse-glow"
            onClick={handleSaveToDrive}
            disabled={isSavingToDrive}
            title="Save formatted document directly to Google Drive"
          >
            <Cloud size={16} />
            <span>
              {isSavingToDrive ? 'Uploading...' : 'Save to Drive'}
            </span>
          </button>
        </div>
      </header>

      {/* Main Workspace Grid */}
      <main className={`workspace-content view-${viewMode}`}>
        {/* Left Column: Form Editor */}
        {(viewMode === 'edit' || viewMode === 'split') && (
          <section className="editor-column">
            <HeaderForm
              employeeName={employeeName}
              setEmployeeName={setEmployeeName}
              periodLabel={periodLabel}
              setPeriodLabel={setPeriodLabel}
            />

            <EntryBuilder
              entries={entries}
              setEntries={setEntries}
              onLoadSample={handleLoadSample}
              periodLabel={periodLabel}
            />

            <SignOffPanel notedBy={notedBy} setNotedBy={setNotedBy} />
          </section>
        )}

        {/* Right Column: High Fidelity WYSIWYG Preview */}
        {(viewMode === 'preview' || viewMode === 'split') && (
          <section className="preview-column">
            <DocumentPreview
              employeeName={employeeName}
              periodLabel={periodLabel}
              entries={entries}
              notedBy={notedBy}
              onDownload={handleDownloadDocx}
            />
          </section>
        )}
      </main>

      {/* Copy Summary Modal */}
      <CopyTextModal
        isOpen={showCopyModal}
        onClose={() => setShowCopyModal(false)}
        employeeName={employeeName}
        periodLabel={periodLabel}
        entries={entries}
        notedBy={notedBy}
      />

      {/* Google Drive Connection Modal */}
      <GoogleDriveModal
        isOpen={showDriveModal}
        onClose={() => setShowDriveModal(false)}
        driveStatus={driveStatus}
        onLogin={handleLoginGoogle}
        onLogout={handleLogoutGoogle}
        onCopyText={copyToClipboard}
      />

      {/* Global Toast Notification */}
      <Toast toast={toast} onClose={() => setToast(null)} />
    </div>
  );
}
