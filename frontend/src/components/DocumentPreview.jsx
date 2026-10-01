import React, { useState } from 'react';
import {
  Eye,
  Download,
  Printer,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2,
  FileCheck,
  RotateCcw,
  Sliders,
  FileText
} from 'lucide-react';

export default function DocumentPreview({
  employeeName,
  periodLabel,
  entries,
  notedBy,
  onDownload
}) {
  const [zoomLevel, setZoomLevel] = useState(100);
  const [showMarginsGuide, setShowMarginsGuide] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const handleZoom = (delta) => {
    setZoomLevel((prev) => Math.min(150, Math.max(60, prev + delta)));
  };

  const handleResetZoom = () => {
    setZoomLevel(100);
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  return (
    <div className={`preview-container ${isFullscreen ? 'fullscreen-preview-mode' : ''}`}>
      {/* Document Preview Toolbar */}
      <div className="preview-toolbar">
        <div className="preview-title-group">
          <div className="preview-title">
            <Eye size={16} className="text-emerald" />
            <span>Word Print Preview</span>
          </div>
          <span className="page-spec-tag">A4 &bull; Arial &bull; Official Form</span>
        </div>

        <div className="preview-controls-group">
          {/* Margins Guide Toggle */}
          <label className="margins-toggle-label" title="Show 1-inch printable margin bounds">
            <input
              type="checkbox"
              checked={showMarginsGuide}
              onChange={(e) => setShowMarginsGuide(e.target.checked)}
            />
            <span>Margins</span>
          </label>

          {/* Zoom Controls */}
          <div className="zoom-controls">
            <button
              type="button"
              className="zoom-btn"
              onClick={() => handleZoom(-10)}
              title="Zoom Out"
            >
              <ZoomOut size={14} />
            </button>
            <button
              type="button"
              className="zoom-level-indicator"
              onClick={handleResetZoom}
              title="Reset to 100%"
            >
              {zoomLevel}%
            </button>
            <button
              type="button"
              className="zoom-btn"
              onClick={() => handleZoom(10)}
              title="Zoom In"
            >
              <ZoomIn size={14} />
            </button>
          </div>

          <div className="toolbar-divider"></div>

          {/* Fullscreen Toggle */}
          <button
            type="button"
            className="icon-action-btn"
            onClick={toggleFullscreen}
            title={isFullscreen ? 'Exit Fullscreen' : 'View Fullscreen'}
          >
            {isFullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
          </button>

          {/* Actions */}
          <button
            type="button"
            className="secondary-btn btn-sm"
            onClick={() => window.print()}
            title="Print or Save to PDF via Browser"
          >
            <Printer size={14} />
            Print
          </button>
          <button
            type="button"
            className="word-export-btn btn-sm"
            onClick={onDownload}
            title="Generate native Word document (.docx)"
          >
            <Download size={14} />
            Download .docx
          </button>
        </div>
      </div>

      {/* Word Status Bar */}
      <div className="word-status-bar">
        <div className="status-left">
          <span>PAGE 1 OF 1</span>
          <span className="status-dot">&bull;</span>
          <span>A4 (210 &times; 297 mm)</span>
          <span className="status-dot">&bull;</span>
          <span>MICROSOFT WORD DOCUMENT</span>
        </div>
        <div className="status-right">
          <span>100% ACCURATE OOXML</span>
        </div>
      </div>

      {/* The Printable Paper Canvas */}
      <div className="paper-canvas">
        <div
          className="paper-scale-wrapper"
          style={{ transform: `scale(${zoomLevel / 100})` }}
        >
          <div className={`document-sheet ${showMarginsGuide ? 'show-margins-guide' : ''}`}>
            {/* Header: Official Logos */}
            <div className="doc-logos-header">
              <img
                src="/assets/header_logos.png"
                alt="DENR & BMB Logos"
                className="doc-logo official-logos"
              />
              <img
                src="/assets/napwc_banner.jpg"
                alt="NAPWC Banner"
                className="doc-logo official-banner"
              />
            </div>

            {/* Document Title (16pt Arial Bold, Centered) */}
            <h1 className="doc-main-title">ACCOMPLISHMENT REPORT FORM</h1>

            {/* Main Content Table */}
            <div className="doc-table">
              {/* Row 1: Name */}
              <div className="doc-table-row">
                <div className="doc-table-cell name-cell">
                  <div className="doc-cell-label">NAME:</div>
                  <div className="doc-cell-value employee-name-val">
                    {employeeName ? employeeName.toUpperCase() : '(EMPLOYEE NAME)'}
                  </div>
                </div>
              </div>

              {/* Row 2: Date */}
              <div className="doc-table-row">
                <div className="doc-table-cell date-cell">
                  <div className="doc-cell-label">DATE:</div>
                  <div className="doc-cell-value period-val">
                    {periodLabel ? periodLabel.toUpperCase() : '(SEMI_MONTHLY_RANGE)'}
                  </div>
                </div>
              </div>

              {/* Row 3: Green Header Cell (#A8D08D) */}
              <div className="doc-table-row">
                <div className="doc-table-cell accomplishments-header-cell">
                  <div className="accomplishments-title">ACCOMPLISHMENTS</div>
                  <div className="tasks-subtitle">Task/s Performed</div>
                </div>
              </div>

              {/* Date Block Rows */}
              {entries && entries.length > 0 ? (
                entries.map((block, bIdx) => (
                  <div key={bIdx} className="doc-table-row date-block-row">
                    <div className="doc-table-cell date-block-cell">
                      <div className="doc-block-date-heading">
                        {block.subDateLabel ? block.subDateLabel.toUpperCase() : `WEEK ${bIdx + 1}`}
                      </div>

                      <div className="doc-bullets-list">
                        {block.bullets && block.bullets.length > 0 ? (
                          block.bullets.map((bullet, kIdx) => (
                            <div key={kIdx} className="doc-bullet-entry">
                              {bullet.text ? (
                                <div className="doc-bullet-line">
                                  <span className="doc-bullet-sym">&bull;</span>
                                  <span className="doc-bullet-text">{bullet.text}</span>
                                </div>
                              ) : null}

                              {/* Nested Sub-Bullets */}
                              {bullet.subBullets && bullet.subBullets.length > 0 && (
                                <div className="doc-subbullets-list">
                                  {bullet.subBullets.map((sub, sIdx) =>
                                    sub ? (
                                      <div key={sIdx} className="doc-subbullet-line">
                                        <span className="doc-subbullet-sym">-</span>
                                        <span className="doc-subbullet-text">{sub}</span>
                                      </div>
                                    ) : null
                                  )}
                                </div>
                              )}
                            </div>
                          ))
                        ) : (
                          <div className="empty-hint">No tasks entered for this block</div>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="doc-table-row">
                  <div className="doc-table-cell date-block-cell empty-block-cell">
                    (No accomplishment entries added yet)
                  </div>
                </div>
              )}
            </div>

            {/* "Noted by:" row with checkbox box */}
            <div className="noted-by-container">
              <span className="noted-by-text">Noted by:</span>
              <div className="noted-by-box" title="Approval Checkbox"></div>
            </div>

            {/* Two-column Sign-Off Table (matching Table 2 in template) */}
            <div className="sign-off-table-layout">
              <div className="sign-off-row">
                {/* Employee Column (Left) */}
                <div className="col-signee">
                  <div className="signature-spacing"></div>
                  <div className="signee-name-display">
                    {employeeName ? employeeName.toUpperCase() : '{NAME}'}
                  </div>
                </div>

                {/* Approver Column (Right) */}
                <div className="col-approver">
                  <div className="signature-spacing"></div>
                  <div className="approver-name-display">
                    {notedBy?.approverName ? notedBy.approverName.toUpperCase() : '{HEAD}'}
                  </div>
                  <div className="approver-title-display">
                    {notedBy?.approverTitle || '{DESIGNATION}'}
                  </div>
                  <div className="approver-office-display">
                    {notedBy?.approverOffice || 'Office-In-Charge, NAPWC'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
