import React from 'react';
import { CheckCircle2, AlertTriangle, Info, X, ExternalLink } from 'lucide-react';

export default function Toast({ toast, onClose }) {
  if (!toast) return null;

  const getIcon = () => {
    switch (toast.type) {
      case 'success':
        return <CheckCircle2 className="toast-icon success" size={18} />;
      case 'error':
        return <AlertTriangle className="toast-icon error" size={18} />;
      default:
        return <Info className="toast-icon info" size={18} />;
    }
  };

  return (
    <div className={`toast-container toast-${toast.type || 'info'}`}>
      {getIcon()}
      <div className="toast-content">
        <p className="toast-message">{toast.message}</p>
        {toast.link && (
          <a
            href={toast.link}
            target="_blank"
            rel="noreferrer"
            className="toast-link"
          >
            {toast.linkText || 'Open Link'} <ExternalLink size={12} />
          </a>
        )}
      </div>
      <button type="button" className="toast-close" onClick={onClose}>
        <X size={14} />
      </button>
    </div>
  );
}
