import React, { useState } from 'react';
import { Copy, Check, X, FileText } from 'lucide-react';

export default function CopyTextModal({
  isOpen,
  onClose,
  employeeName,
  periodLabel,
  entries,
  notedBy
}) {
  const [copied, setCopied] = useState(false);
  const [format, setFormat] = useState('text'); // 'text' or 'markdown'

  if (!isOpen) return null;

  const generateFormattedContent = () => {
    if (format === 'markdown') {
      let md = `# ACCOMPLISHMENT REPORT\n\n`;
      md += `**NAME:** ${employeeName || 'N/A'}\n`;
      md += `**DATE:** ${periodLabel || 'N/A'}\n\n`;
      md += `## ACCOMPLISHMENTS (Task/s Performed)\n\n`;

      entries.forEach((block) => {
        md += `### ${block.subDateLabel || 'DATE BLOCK'}\n`;
        (block.bullets || []).forEach((b) => {
          if (b.text) {
            md += `- ${b.text}\n`;
            (b.subBullets || []).forEach((sub) => {
              if (sub) md += `  - ${sub}\n`;
            });
          }
        });
        md += `\n`;
      });

      md += `**Noted by:**\n`;
      md += `**${notedBy.approverName || 'N/A'}**\n`;
      md += `${notedBy.approverTitle || ''}\n`;
      md += `${notedBy.approverOffice || ''}\n`;
      return md;
    } else {
      let txt = `ACCOMPLISHMENT REPORT FORM\n`;
      txt += `NAME: ${employeeName || 'N/A'}\n`;
      txt += `DATE: ${periodLabel || 'N/A'}\n\n`;
      txt += `ACCOMPLISHMENTS / Task/s Performed:\n\n`;

      entries.forEach((block) => {
        txt += `[${block.subDateLabel || 'DATE BLOCK'}]\n`;
        (block.bullets || []).forEach((b) => {
          if (b.text) {
            txt += `• ${b.text}\n`;
            (b.subBullets || []).forEach((sub) => {
              if (sub) txt += `  - ${sub}\n`;
            });
          }
        });
        txt += `\n`;
      });

      txt += `Noted by:\n`;
      txt += `${notedBy.approverName || 'N/A'}\n`;
      txt += `${notedBy.approverTitle || ''}\n`;
      txt += `${notedBy.approverOffice || ''}\n`;
      return txt;
    }
  };

  const content = generateFormattedContent();

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content copy-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-with-icon">
            <FileText className="card-icon" size={20} />
            <h3 className="modal-title">Copy Report Summary</h3>
          </div>
          <button type="button" className="close-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="modal-body">
          <div className="format-toggle-bar">
            <span className="format-label">Format:</span>
            <div className="format-pills">
              <button
                type="button"
                className={`format-pill ${format === 'text' ? 'active' : ''}`}
                onClick={() => setFormat('text')}
              >
                Plain Text (Email/Chat)
              </button>
              <button
                type="button"
                className={`format-pill ${format === 'markdown' ? 'active' : ''}`}
                onClick={() => setFormat('markdown')}
              >
                Markdown
              </button>
            </div>
          </div>

          <textarea
            readOnly
            rows={12}
            className="form-input code-font copy-textarea"
            value={content}
          />
        </div>

        <div className="modal-footer">
          <button type="button" className="secondary-btn" onClick={onClose}>
            Close
          </button>
          <button type="button" className="primary-btn" onClick={handleCopy}>
            {copied ? (
              <>
                <Check size={16} />
                Copied to Clipboard!
              </>
            ) : (
              <>
                <Copy size={16} />
                Copy to Clipboard
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
