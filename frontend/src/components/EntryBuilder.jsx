import React, { useState } from 'react';
import {
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown,
  ListPlus,
  CornerDownRight,
  FileText,
  RotateCcw,
  Copy,
  ClipboardList,
  Sparkles,
  CalendarDays,
  ChevronRight,
  Minimize2,
  Maximize2,
  X,
  AlertTriangle
} from 'lucide-react';

const COMMON_TASK_SNIPPETS = [
  'Attended the NAPWC Toolbox Meeting.',
  'Continued the development and improvement of the NAPWC Database Management System, including the creation of the following dashboards:',
  'Prepared the presentation for the upcoming PAMB meeting',
  'Assisted in planting Bagawak Morados behind the amphitheater',
  'Attended the orientation for all COS Employee'
];

export default function EntryBuilder({
  entries,
  setEntries,
  onLoadSample,
  periodLabel
}) {
  const [showPasteModal, setShowPasteModal] = useState(false);
  const [pasteTargetIndex, setPasteTargetIndex] = useState(0);
  const [pasteRawText, setPasteRawText] = useState('');
  const [collapsedBlocks, setCollapsedBlocks] = useState({});
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  // Toggle individual block collapse
  const toggleCollapse = (idx) => {
    setCollapsedBlocks((prev) => ({
      ...prev,
      [idx]: !prev[idx]
    }));
  };

  // Expand all / Collapse all
  const handleToggleAllCollapse = (shouldCollapse) => {
    const nextState = {};
    entries.forEach((_, idx) => {
      nextState[idx] = shouldCollapse;
    });
    setCollapsedBlocks(nextState);
  };

  const isAllCollapsed =
    entries.length > 0 && entries.every((_, idx) => collapsedBlocks[idx]);

  // Add new date block
  const handleAddDateBlock = () => {
    setEntries([
      ...entries,
      {
        subDateLabel: '',
        bullets: [{ text: '', subBullets: [] }]
      }
    ]);
  };

  // Duplicate an existing date block
  const handleDuplicateBlock = (blockIndex) => {
    const target = entries[blockIndex];
    const cloned = JSON.parse(JSON.stringify(target));
    cloned.subDateLabel = `${cloned.subDateLabel || 'BLOCK'} (COPY)`;
    const updated = [...entries];
    updated.splice(blockIndex + 1, 0, cloned);
    setEntries(updated);
  };

  // Delete date block
  const handleDeleteDateBlock = (blockIndex) => {
    if (entries.length <= 1) {
      setEntries([{ subDateLabel: '', bullets: [{ text: '', subBullets: [] }] }]);
      return;
    }
    const updated = [...entries];
    updated.splice(blockIndex, 1);
    setEntries(updated);
  };

  // Move date block up/down
  const handleMoveDateBlock = (blockIndex, direction) => {
    const targetIndex = blockIndex + direction;
    if (targetIndex < 0 || targetIndex >= entries.length) return;
    const updated = [...entries];
    const [moved] = updated.splice(blockIndex, 1);
    updated.splice(targetIndex, 0, moved);
    setEntries(updated);
  };

  // Change subDateLabel
  const handleDateLabelChange = (blockIndex, value) => {
    const updated = [...entries];
    updated[blockIndex] = {
      ...updated[blockIndex],
      subDateLabel: value.toUpperCase()
    };
    setEntries(updated);
  };

  // Add bullet to a block
  const handleAddBullet = (blockIndex, atIndex = null) => {
    const updated = [...entries];
    const newBullet = { text: '', subBullets: [] };
    if (atIndex !== null) {
      updated[blockIndex].bullets.splice(atIndex + 1, 0, newBullet);
    } else {
      updated[blockIndex].bullets.push(newBullet);
    }
    setEntries(updated);
  };

  // Delete bullet
  const handleDeleteBullet = (blockIndex, bulletIndex) => {
    const updated = [...entries];
    updated[blockIndex].bullets.splice(bulletIndex, 1);
    if (updated[blockIndex].bullets.length === 0) {
      updated[blockIndex].bullets.push({ text: '', subBullets: [] });
    }
    setEntries(updated);
  };

  // Move bullet up/down
  const handleMoveBullet = (blockIndex, bulletIndex, direction) => {
    const bullets = entries[blockIndex].bullets;
    const targetIndex = bulletIndex + direction;
    if (targetIndex < 0 || targetIndex >= bullets.length) return;
    const updated = [...entries];
    const [moved] = updated[blockIndex].bullets.splice(bulletIndex, 1);
    updated[blockIndex].bullets.splice(targetIndex, 0, moved);
    setEntries(updated);
  };

  // Change bullet text
  const handleBulletTextChange = (blockIndex, bulletIndex, value) => {
    const updated = [...entries];
    updated[blockIndex].bullets[bulletIndex].text = value;
    setEntries(updated);
  };

  // Add sub-bullet
  const handleAddSubBullet = (blockIndex, bulletIndex) => {
    const updated = [...entries];
    if (!updated[blockIndex].bullets[bulletIndex].subBullets) {
      updated[blockIndex].bullets[bulletIndex].subBullets = [];
    }
    updated[blockIndex].bullets[bulletIndex].subBullets.push('');
    setEntries(updated);
  };

  // Change sub-bullet text
  const handleSubBulletTextChange = (blockIndex, bulletIndex, subIndex, value) => {
    const updated = [...entries];
    updated[blockIndex].bullets[bulletIndex].subBullets[subIndex] = value;
    setEntries(updated);
  };

  // Delete sub-bullet
  const handleDeleteSubBullet = (blockIndex, bulletIndex, subIndex) => {
    const updated = [...entries];
    updated[blockIndex].bullets[bulletIndex].subBullets.splice(subIndex, 1);
    setEntries(updated);
  };

  // Keyboard navigation inside textarea
  const handleKeyDown = (e, blockIndex, bulletIndex) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleAddBullet(blockIndex, bulletIndex);
    } else if (e.key === 'Tab') {
      e.preventDefault();
      if (bulletIndex > 0) {
        // Convert current bullet to sub-bullet of previous
        const currentText = entries[blockIndex].bullets[bulletIndex].text;
        if (currentText.trim()) {
          const updated = [...entries];
          const prevBullet = updated[blockIndex].bullets[bulletIndex - 1];
          if (!prevBullet.subBullets) prevBullet.subBullets = [];
          prevBullet.subBullets.push(currentText);
          updated[blockIndex].bullets.splice(bulletIndex, 1);
          setEntries(updated);
        }
      }
    } else if (
      e.key === 'Backspace' &&
      !entries[blockIndex].bullets[bulletIndex].text &&
      entries[blockIndex].bullets.length > 1
    ) {
      e.preventDefault();
      handleDeleteBullet(blockIndex, bulletIndex);
    }
  };

  // Insert common snippet
  const handleInsertSnippet = (blockIndex, snippetText) => {
    const updated = [...entries];
    const currentBullets = updated[blockIndex].bullets;
    const lastBullet = currentBullets[currentBullets.length - 1];

    if (lastBullet && !lastBullet.text.trim()) {
      lastBullet.text = snippetText;
    } else {
      currentBullets.push({ text: snippetText, subBullets: [] });
    }
    setEntries(updated);
  };

  // Quick Scaffold Blocks based on semi-monthly convention
  const handleScaffoldWeekly = () => {
    const monthMatch = (periodLabel || '').match(/^([A-Z]+)\s+(\d{1,2})-(\d{1,2})/i);
    const month = monthMatch ? monthMatch[1].toUpperCase() : 'APRIL';
    const isFirstHalf = monthMatch ? parseInt(monthMatch[2], 10) <= 1 : true;

    let newBlocks = [];
    if (isFirstHalf) {
      newBlocks = [
        { subDateLabel: `${month} 01`, bullets: [{ text: '', subBullets: [] }] },
        { subDateLabel: `${month} 06-10`, bullets: [{ text: '', subBullets: [] }] },
        { subDateLabel: `${month} 13-15`, bullets: [{ text: '', subBullets: [] }] }
      ];
    } else {
      newBlocks = [
        { subDateLabel: `${month} 16-20`, bullets: [{ text: '', subBullets: [] }] },
        { subDateLabel: `${month} 23-27`, bullets: [{ text: '', subBullets: [] }] },
        { subDateLabel: `${month} 28-30`, bullets: [{ text: '', subBullets: [] }] }
      ];
    }
    setEntries(newBlocks);
  };

  // Clear all entries
  const handleConfirmClear = () => {
    setEntries([
      {
        subDateLabel: '',
        bullets: [{ text: '', subBullets: [] }]
      }
    ]);
    setShowClearConfirm(false);
  };

  // Process Batch Paste
  const handleProcessPaste = () => {
    if (!pasteRawText.trim()) return;

    const lines = pasteRawText.split('\n');
    const parsedBullets = [];
    let currentBullet = null;

    for (let line of lines) {
      if (!line.trim()) continue;

      const isSub = line.startsWith('  ') || line.startsWith('\t') || line.trim().startsWith('- ');
      const cleanLine = line.replace(/^[\s\t•\-\*\d\.\)]+/, '').trim();

      if (!cleanLine) continue;

      if (isSub && currentBullet) {
        currentBullet.subBullets.push(cleanLine);
      } else {
        currentBullet = { text: cleanLine, subBullets: [] };
        parsedBullets.push(currentBullet);
      }
    }

    if (parsedBullets.length === 0) return;

    const updated = [...entries];
    if (pasteTargetIndex === -1) {
      updated.push({
        subDateLabel: '',
        bullets: parsedBullets
      });
    } else if (updated[pasteTargetIndex]) {
      const targetBlock = updated[pasteTargetIndex];
      if (targetBlock.bullets.length === 1 && !targetBlock.bullets[0].text) {
        targetBlock.bullets = parsedBullets;
      } else {
        targetBlock.bullets.push(...parsedBullets);
      }
    }

    setEntries(updated);
    setPasteRawText('');
    setShowPasteModal(false);
  };

  const totalTasks = entries.reduce(
    (acc, b) => acc + (b.bullets ? b.bullets.filter((k) => k.text).length : 0),
    0
  );

  const totalSubtasks = entries.reduce(
    (acc, b) =>
      acc +
      (b.bullets
        ? b.bullets.reduce(
            (subAcc, k) => subAcc + (k.subBullets ? k.subBullets.filter((s) => s).length : 0),
            0
          )
        : 0),
    0
  );

  return (
    <div className="card entry-builder-card">
      {/* Header */}
      <div className="card-header flex-between">
        <div>
          <div className="title-with-badge">
            <h2 className="card-title">
              <FileText className="card-icon" size={18} />
              Accomplishment Entries
            </h2>
            <span className="count-pill">
              {entries.length} {entries.length === 1 ? 'block' : 'blocks'} &bull; {totalTasks} {totalTasks === 1 ? 'task' : 'tasks'}
              {totalSubtasks > 0 ? ` (${totalSubtasks} sub)` : ''}
            </span>
          </div>
          <span className="card-subtitle">
            Organize tasks by date or date-range blocks with bullets and nested dash items
          </span>
        </div>

        <div className="header-action-group">
          {entries.length > 1 && (
            <button
              type="button"
              className="secondary-btn btn-xs"
              onClick={() => handleToggleAllCollapse(!isAllCollapsed)}
              title={isAllCollapsed ? 'Expand all blocks' : 'Collapse all blocks'}
            >
              {isAllCollapsed ? <Maximize2 size={13} /> : <Minimize2 size={13} />}
              {isAllCollapsed ? 'Expand All' : 'Collapse All'}
            </button>
          )}

          <button
            type="button"
            className="secondary-btn btn-sm"
            onClick={() => setShowPasteModal(true)}
            title="Paste multiple tasks from clipboard"
          >
            <ClipboardList size={14} />
            Quick Paste
          </button>
          <button
            type="button"
            className="secondary-btn btn-sm"
            onClick={handleScaffoldWeekly}
            title="Automatically scaffold standard date blocks for this period"
          >
            <CalendarDays size={14} />
            Scaffold Dates
          </button>
          <button
            type="button"
            className="secondary-btn btn-sm"
            onClick={onLoadSample}
            title="Populate with the official NAPWC demo data"
          >
            <RotateCcw size={14} />
            Load Sample
          </button>
          <button
            type="button"
            className="secondary-btn btn-sm danger-hover"
            onClick={() => setShowClearConfirm(true)}
            title="Clear all tasks"
          >
            <Trash2 size={14} />
            Clear
          </button>
          <button
            type="button"
            className="primary-btn btn-sm"
            onClick={handleAddDateBlock}
          >
            <Plus size={15} />
            Add Block
          </button>
        </div>
      </div>

      {/* Date Blocks List */}
      <div className="date-blocks-container">
        {entries.map((block, blockIndex) => {
          const isCollapsed = Boolean(collapsedBlocks[blockIndex]);
          const blockTaskCount = block.bullets ? block.bullets.filter((k) => k.text).length : 0;
          const blockSubCount = block.bullets
            ? block.bullets.reduce((acc, k) => acc + (k.subBullets?.length || 0), 0)
            : 0;

          return (
            <div
              key={blockIndex}
              className={`date-block-card ${isCollapsed ? 'collapsed' : ''}`}
            >
              {/* Block Header */}
              <div className="date-block-header">
                <div className="date-label-input-wrapper">
                  <button
                    type="button"
                    className="collapse-toggle-btn"
                    onClick={() => toggleCollapse(blockIndex)}
                    title={isCollapsed ? 'Expand Block' : 'Collapse Block'}
                  >
                    {isCollapsed ? <ChevronRight size={16} /> : <ChevronDown size={16} />}
                  </button>

                  <span className="badge-index">#{blockIndex + 1}</span>

                  <input
                    type="text"
                    className="form-input block-date-input text-uppercase"
                    placeholder="DATE / RANGE (e.g. APRIL 01 or APRIL 06-10)"
                    value={block.subDateLabel}
                    onChange={(e) => handleDateLabelChange(blockIndex, e.target.value)}
                  />

                  {isCollapsed && (
                    <span className="collapsed-summary">
                      {blockTaskCount} {blockTaskCount === 1 ? 'task' : 'tasks'}
                      {blockSubCount > 0 ? `, ${blockSubCount} sub` : ''}
                    </span>
                  )}
                </div>

                <div className="block-actions">
                  <button
                    type="button"
                    className="icon-action-btn"
                    title="Duplicate Block"
                    onClick={() => handleDuplicateBlock(blockIndex)}
                  >
                    <Copy size={15} />
                  </button>
                  <button
                    type="button"
                    className="icon-action-btn"
                    title="Move Block Up"
                    disabled={blockIndex === 0}
                    onClick={() => handleMoveDateBlock(blockIndex, -1)}
                  >
                    <ChevronUp size={16} />
                  </button>
                  <button
                    type="button"
                    className="icon-action-btn"
                    title="Move Block Down"
                    disabled={blockIndex === entries.length - 1}
                    onClick={() => handleMoveDateBlock(blockIndex, 1)}
                  >
                    <ChevronDown size={16} />
                  </button>
                  <button
                    type="button"
                    className="icon-action-btn danger"
                    title="Delete Date Block"
                    onClick={() => handleDeleteDateBlock(blockIndex)}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              {/* Block Body (shown when expanded) */}
              {!isCollapsed && (
                <>
                  {/* Quick Task Snippets */}
                  <div className="quick-snippets-bar">
                    <span className="quick-snippets-label">
                      <Sparkles size={12} />
                      Quick Insert:
                    </span>
                    <button
                      type="button"
                      className="snippet-chip"
                      onClick={() =>
                        handleInsertSnippet(blockIndex, 'Attended the NAPWC Toolbox Meeting.')
                      }
                    >
                      Toolbox Meeting
                    </button>
                    <button
                      type="button"
                      className="snippet-chip"
                      onClick={() =>
                        handleInsertSnippet(
                          blockIndex,
                          'Prepared the presentation for the upcoming PAMB meeting'
                        )
                      }
                    >
                      PAMB Meeting
                    </button>
                    <button
                      type="button"
                      className="snippet-chip"
                      onClick={() =>
                        handleInsertSnippet(
                          blockIndex,
                          'Continued the development and improvement of the NAPWC Database Management System, including the creation of the following dashboards:'
                        )
                      }
                    >
                      NAPWC Database Dev
                    </button>
                  </div>

                  {/* Bullets List */}
                  <div className="bullets-wrapper">
                    {block.bullets.map((bullet, bulletIndex) => (
                      <div key={bulletIndex} className="bullet-item-container">
                        <div className="bullet-row">
                          <span className="bullet-disc">&bull;</span>
                          <textarea
                            rows={2}
                            className="form-input bullet-textarea"
                            placeholder="Enter task or accomplishment performed... (Press Enter to add next)"
                            value={bullet.text}
                            onKeyDown={(e) => handleKeyDown(e, blockIndex, bulletIndex)}
                            onChange={(e) =>
                              handleBulletTextChange(blockIndex, bulletIndex, e.target.value)
                            }
                          />
                          <div className="bullet-actions">
                            <button
                              type="button"
                              className="bullet-sub-btn"
                              title="Add indented sub-bullet (or press Tab)"
                              onClick={() => handleAddSubBullet(blockIndex, bulletIndex)}
                            >
                              <CornerDownRight size={13} />
                              Sub-bullet
                            </button>
                            <button
                              type="button"
                              className="icon-action-btn danger btn-xs"
                              title="Delete Task"
                              onClick={() => handleDeleteBullet(blockIndex, bulletIndex)}
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>

                        {/* Nested Sub-Bullets */}
                        {bullet.subBullets && bullet.subBullets.length > 0 && (
                          <div className="sub-bullets-container">
                            {bullet.subBullets.map((sub, subIndex) => (
                              <div key={subIndex} className="sub-bullet-row">
                                <span className="sub-bullet-dash">-</span>
                                <input
                                  type="text"
                                  className="form-input sub-bullet-input"
                                  placeholder="Nested dashboard, item, or detail..."
                                  value={sub}
                                  onChange={(e) =>
                                    handleSubBulletTextChange(
                                      blockIndex,
                                      bulletIndex,
                                      subIndex,
                                      e.target.value
                                    )
                                  }
                                />
                                <button
                                  type="button"
                                  className="icon-action-btn danger btn-xs"
                                  title="Delete sub-item"
                                  onClick={() =>
                                    handleDeleteSubBullet(blockIndex, bulletIndex, subIndex)
                                  }
                                >
                                  <Trash2 size={13} />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}

                    <div className="add-task-footer">
                      <button
                        type="button"
                        className="add-bullet-btn"
                        onClick={() => handleAddBullet(blockIndex)}
                      >
                        <ListPlus size={14} />
                        Add Another Task (or press Enter)
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>

      <div className="builder-bottom-bar">
        <button
          type="button"
          className="add-block-large-btn"
          onClick={handleAddDateBlock}
        >
          <Plus size={16} />
          Add Another Date Block
        </button>
      </div>

      {/* Quick Paste Modal */}
      {showPasteModal && (
        <div className="modal-backdrop" onClick={() => setShowPasteModal(false)}>
          <div
            className="modal-content paste-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <div className="modal-title-with-icon">
                <ClipboardList className="text-emerald" size={20} />
                <h3 className="modal-title">Quick Paste Multiline Tasks</h3>
              </div>
              <button
                type="button"
                className="close-btn"
                onClick={() => setShowPasteModal(false)}
              >
                <X size={18} />
              </button>
            </div>

            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Destination Block:</label>
                <select
                  className="form-select"
                  value={pasteTargetIndex}
                  onChange={(e) => setPasteTargetIndex(parseInt(e.target.value, 10))}
                >
                  {entries.map((b, idx) => (
                    <option key={idx} value={idx}>
                      Block #{idx + 1}: {b.subDateLabel || '(No Date Set)'}
                    </option>
                  ))}
                  <option value={-1}>+ Create as a New Date Block</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">
                  Paste task lines below (indented lines automatically become sub-bullets):
                </label>
                <textarea
                  rows={8}
                  className="form-input code-font"
                  placeholder={`Example:\nAttended the NAPWC Toolbox Meeting.\nContinued DBMS dashboard development\n  - Non-Living Component Inventory\n  - AFoCO Client Reservation\nPrepared PAMB presentation`}
                  value={pasteRawText}
                  onChange={(e) => setPasteRawText(e.target.value)}
                />
                <span className="input-hint">
                  Supports bullet symbols (&bull;, -, *), numbered items, and indented lines.
                </span>
              </div>
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="secondary-btn"
                onClick={() => setShowPasteModal(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="primary-btn"
                onClick={handleProcessPaste}
                disabled={!pasteRawText.trim()}
              >
                Insert Tasks
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Clear Confirmation Modal */}
      {showClearConfirm && (
        <div className="modal-backdrop" onClick={() => setShowClearConfirm(false)}>
          <div className="modal-content confirm-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title-with-icon">
                <AlertTriangle className="text-danger" size={20} />
                <h3 className="modal-title">Clear All Entries?</h3>
              </div>
              <button type="button" className="close-btn" onClick={() => setShowClearConfirm(false)}>
                <X size={18} />
              </button>
            </div>
            <div className="modal-body">
              <p>Are you sure you want to remove all date blocks and accomplishment tasks? This will reset the report entries to a blank block.</p>
            </div>
            <div className="modal-footer">
              <button type="button" className="secondary-btn" onClick={() => setShowClearConfirm(false)}>
                Cancel
              </button>
              <button type="button" className="primary-btn danger-btn" onClick={handleConfirmClear}>
                Yes, Clear All
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
