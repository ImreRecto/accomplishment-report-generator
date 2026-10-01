import React, { useState, useEffect } from 'react';
import { Award, Settings2, Plus, Trash2, Check, X, UserCheck } from 'lucide-react';

const DEFAULT_PRESETS = [
  {
    id: 'oic-gelera',
    approverName: 'ELPIDIO B. GELERA, JR.',
    approverTitle: 'Senior Ecosystems Management Specialist',
    approverOffice: 'Office-In-Charge, NAPWC'
  },
  {
    id: 'custom-supervisor',
    approverName: 'ENGR. JUAN D. DELA CRUZ',
    approverTitle: 'Supervising EMS',
    approverOffice: 'Parks Management Section, NAPWC'
  }
];

export default function SignOffPanel({
  notedBy,
  setNotedBy
}) {
  const [presets, setPresets] = useState(() => {
    try {
      const saved = localStorage.getItem('napwc_approver_presets');
      return saved ? JSON.parse(saved) : DEFAULT_PRESETS;
    } catch {
      return DEFAULT_PRESETS;
    }
  });

  const [selectedPresetId, setSelectedPresetId] = useState(presets[0]?.id || '');
  const [showManageModal, setShowManageModal] = useState(false);

  // New preset draft in modal
  const [newPreset, setNewPreset] = useState({
    approverName: '',
    approverTitle: '',
    approverOffice: ''
  });

  // Save presets whenever they change
  useEffect(() => {
    try {
      localStorage.setItem('napwc_approver_presets', JSON.stringify(presets));
    } catch {
      // ignore
    }
  }, [presets]);

  const handleSelectPreset = (id) => {
    setSelectedPresetId(id);
    const found = presets.find((p) => p.id === id);
    if (found) {
      setNotedBy({
        approverName: found.approverName,
        approverTitle: found.approverTitle,
        approverOffice: found.approverOffice
      });
    }
  };

  const handleAddPreset = () => {
    if (!newPreset.approverName.trim()) return;
    const item = {
      id: 'preset_' + Date.now(),
      approverName: newPreset.approverName.toUpperCase().trim(),
      approverTitle: newPreset.approverTitle.trim(),
      approverOffice: newPreset.approverOffice.trim()
    };
    const updated = [...presets, item];
    setPresets(updated);
    setSelectedPresetId(item.id);
    setNotedBy({
      approverName: item.approverName,
      approverTitle: item.approverTitle,
      approverOffice: item.approverOffice
    });
    setNewPreset({ approverName: '', approverTitle: '', approverOffice: '' });
  };

  const handleDeletePreset = (id) => {
    if (presets.length <= 1) return;
    const updated = presets.filter((p) => p.id !== id);
    setPresets(updated);
    if (selectedPresetId === id) {
      handleSelectPreset(updated[0].id);
    }
  };

  return (
    <div className="card signoff-card">
      <div className="card-header flex-between">
        <div>
          <h2 className="card-title">
            <Award className="card-icon" size={18} />
            Sign-Off & Approving Official
          </h2>
          <span className="card-subtitle">
            Signatory for "Noted by" right-hand block
          </span>
        </div>

        <button
          type="button"
          className="secondary-btn btn-sm"
          onClick={() => setShowManageModal(true)}
          title="Manage Saved Presets"
        >
          <Settings2 size={14} />
          Manage Presets
        </button>
      </div>

      {/* 1-Click Quick Preset Chips */}
      <div className="approver-chips-row">
        <span className="chips-label">Quick select approver:</span>
        <div className="chips-container">
          {presets.map((p) => (
            <button
              key={p.id}
              type="button"
              className={`approver-chip ${selectedPresetId === p.id ? 'active' : ''}`}
              onClick={() => handleSelectPreset(p.id)}
            >
              <UserCheck size={13} />
              <span>{p.approverName}</span>
              <small className="chip-office">({p.approverOffice || p.approverTitle})</small>
            </button>
          ))}
        </div>
      </div>

      <div className="form-grid approver-grid">
        <div className="form-group">
          <label className="form-label">Approver Full Name</label>
          <input
            type="text"
            className="form-input text-uppercase font-semibold"
            placeholder="e.g. ELPIDIO B. GELERA, JR."
            value={notedBy.approverName}
            onChange={(e) =>
              setNotedBy({ ...notedBy, approverName: e.target.value.toUpperCase() })
            }
          />
        </div>

        <div className="form-group">
          <label className="form-label">Designation / Title</label>
          <input
            type="text"
            className="form-input"
            placeholder="e.g. Senior Ecosystems Management Specialist"
            value={notedBy.approverTitle}
            onChange={(e) =>
              setNotedBy({ ...notedBy, approverTitle: e.target.value })
            }
          />
        </div>

        <div className="form-group span-full">
          <label className="form-label">Office / Assignment</label>
          <input
            type="text"
            className="form-input"
            placeholder="e.g. Office-In-Charge, NAPWC"
            value={notedBy.approverOffice}
            onChange={(e) =>
              setNotedBy({ ...notedBy, approverOffice: e.target.value })
            }
          />
        </div>
      </div>

      {/* Presets Modal */}
      {showManageModal && (
        <div className="modal-backdrop" onClick={() => setShowManageModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Manage Approver Presets</h3>
              <button
                type="button"
                className="close-btn"
                onClick={() => setShowManageModal(false)}
              >
                <X size={18} />
              </button>
            </div>

            <div className="modal-body">
              <div className="saved-presets-list">
                <span className="section-label">Existing Presets:</span>
                {presets.map((p) => (
                  <div key={p.id} className="preset-item-row">
                    <div className="preset-item-info">
                      <strong>{p.approverName}</strong>
                      <span>{p.approverTitle}</span>
                      <small>{p.approverOffice}</small>
                    </div>
                    {presets.length > 1 && (
                      <button
                        type="button"
                        className="icon-action-btn danger btn-xs"
                        title="Delete preset"
                        onClick={() => handleDeletePreset(p.id)}
                      >
                        <Trash2 size={15} />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              <div className="add-preset-box">
                <span className="section-label">Add New Preset:</span>
                <input
                  type="text"
                  className="form-input mb-2 text-uppercase"
                  placeholder="Approver Full Name (e.g. ATTY. MARIA SANTOS)"
                  value={newPreset.approverName}
                  onChange={(e) =>
                    setNewPreset({ ...newPreset, approverName: e.target.value })
                  }
                />
                <input
                  type="text"
                  className="form-input mb-2"
                  placeholder="Designation / Title"
                  value={newPreset.approverTitle}
                  onChange={(e) =>
                    setNewPreset({ ...newPreset, approverTitle: e.target.value })
                  }
                />
                <input
                  type="text"
                  className="form-input mb-2"
                  placeholder="Office (e.g. Office-In-Charge, NAPWC)"
                  value={newPreset.approverOffice}
                  onChange={(e) =>
                    setNewPreset({ ...newPreset, approverOffice: e.target.value })
                  }
                />
                <button
                  type="button"
                  className="primary-btn btn-sm"
                  onClick={handleAddPreset}
                >
                  <Plus size={14} />
                  Save Preset
                </button>
              </div>
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="secondary-btn"
                onClick={() => setShowManageModal(false)}
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
