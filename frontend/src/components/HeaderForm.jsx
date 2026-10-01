import React, { useState, useEffect } from 'react';
import { Calendar, User, SlidersHorizontal, Check, Clock, Sparkles } from 'lucide-react';

const MONTH_NAMES = [
  'JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE',
  'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER'
];

export default function HeaderForm({
  employeeName,
  setEmployeeName,
  periodLabel,
  setPeriodLabel
}) {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isManualOverride, setIsManualOverride] = useState(false);

  // Initialize dates to current period on first load if not manual
  useEffect(() => {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth();
    const day = today.getDate();

    if (day <= 15) {
      setStartDate(`${year}-${String(month + 1).padStart(2, '0')}-01`);
      setEndDate(`${year}-${String(month + 1).padStart(2, '0')}-15`);
    } else {
      const lastDay = new Date(year, month + 1, 0).getDate();
      setStartDate(`${year}-${String(month + 1).padStart(2, '0')}-16`);
      setEndDate(`${year}-${String(month + 1).padStart(2, '0')}-${lastDay}`);
    }
  }, []);

  // Format label from start and end dates
  const updatePeriodFromDates = (start, end) => {
    if (!start || !end) return;
    try {
      const s = new Date(start + 'T00:00:00');
      const e = new Date(end + 'T00:00:00');

      const sMonth = MONTH_NAMES[s.getMonth()];
      const eMonth = MONTH_NAMES[e.getMonth()];
      const sDay = String(s.getDate()).padStart(2, '0');
      const eDay = String(e.getDate()).padStart(2, '0');
      const year = e.getFullYear();

      let label = '';
      if (sMonth === eMonth && s.getFullYear() === e.getFullYear()) {
        label = `${sMonth} ${sDay}-${eDay}, ${year}`;
      } else {
        label = `${sMonth} ${sDay} - ${eMonth} ${eDay}, ${year}`;
      }
      setPeriodLabel(label);
    } catch {
      // ignore
    }
  };

  const handleStartDateChange = (val) => {
    setStartDate(val);
    if (!isManualOverride) {
      updatePeriodFromDates(val, endDate);
    }
  };

  const handleEndDateChange = (val) => {
    setEndDate(val);
    if (!isManualOverride) {
      updatePeriodFromDates(startDate, val);
    }
  };

  const setPeriodPreset = (type) => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const lastDay = new Date(year, month + 1, 0).getDate();

    let s = '';
    let e = '';

    if (type === 'first-half') {
      s = `${year}-${String(month + 1).padStart(2, '0')}-01`;
      e = `${year}-${String(month + 1).padStart(2, '0')}-15`;
    } else if (type === 'second-half') {
      s = `${year}-${String(month + 1).padStart(2, '0')}-16`;
      e = `${year}-${String(month + 1).padStart(2, '0')}-${lastDay}`;
    } else if (type === 'full-month') {
      s = `${year}-${String(month + 1).padStart(2, '0')}-01`;
      e = `${year}-${String(month + 1).padStart(2, '0')}-${lastDay}`;
    }

    setStartDate(s);
    setEndDate(e);
    setIsManualOverride(false);
    updatePeriodFromDates(s, e);
  };

  // Get initials for avatar
  const getInitials = (name) => {
    if (!name) return 'EMP';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  return (
    <div className="card header-card">
      <div className="card-header flex-between">
        <div>
          <h2 className="card-title">
            <User className="card-icon" size={18} />
            Report Information
          </h2>
          <span className="card-subtitle">Employee identification and semi-monthly coverage</span>
        </div>

        <div className="employee-avatar-badge" title="Employee profile initialized">
          <div className="avatar-circle">{getInitials(employeeName)}</div>
          <span className="avatar-name">{employeeName || 'Enter Name'}</span>
        </div>
      </div>

      <div className="form-grid">
        <div className="form-group">
          <label className="form-label" htmlFor="employeeName">
            Employee Full Name
          </label>
          <div className="input-with-icon-wrapper">
            <input
              id="employeeName"
              type="text"
              className="form-input text-uppercase font-semibold"
              placeholder="e.g. IMRE C. RECTO"
              value={employeeName}
              onChange={(e) => setEmployeeName(e.target.value.toUpperCase())}
            />
          </div>
          <span className="input-hint">Saved automatically to your local browser storage</span>
        </div>

        <div className="form-group">
          <div className="label-with-action">
            <label className="form-label">
              <Calendar size={14} className="inline-icon" />
              Semi-Monthly Period
            </label>
            <button
              type="button"
              className="link-btn"
              onClick={() => setIsManualOverride(!isManualOverride)}
            >
              {isManualOverride ? 'Use Date Pickers' : 'Edit Text Directly'}
            </button>
          </div>

          {!isManualOverride ? (
            <div>
              <div className="date-inputs-row">
                <div className="date-subgroup">
                  <span className="date-label-sub">Start:</span>
                  <input
                    type="date"
                    className="form-input date-input"
                    value={startDate}
                    onChange={(e) => handleStartDateChange(e.target.value)}
                  />
                </div>
                <span className="date-sep">to</span>
                <div className="date-subgroup">
                  <span className="date-label-sub">End:</span>
                  <input
                    type="date"
                    className="form-input date-input"
                    value={endDate}
                    onChange={(e) => handleEndDateChange(e.target.value)}
                  />
                </div>
              </div>

              <div className="period-presets">
                <span className="preset-label">Quick select:</span>
                <button
                  type="button"
                  className="preset-tag"
                  onClick={() => setPeriodPreset('first-half')}
                >
                  1st-15th (1st Half)
                </button>
                <button
                  type="button"
                  className="preset-tag"
                  onClick={() => setPeriodPreset('second-half')}
                >
                  16th-End (2nd Half)
                </button>
                <button
                  type="button"
                  className="preset-tag"
                  onClick={() => setPeriodPreset('full-month')}
                >
                  Full Month
                </button>
              </div>
            </div>
          ) : (
            <input
              type="text"
              className="form-input text-uppercase"
              placeholder="e.g. APRIL 01-15, 2026"
              value={periodLabel}
              onChange={(e) => setPeriodLabel(e.target.value.toUpperCase())}
            />
          )}

          <div className="period-formatted-badge">
            <Clock size={13} className="text-emerald" />
            <span>Document Period:</span>
            <strong>{periodLabel || 'NOT SET'}</strong>
          </div>
        </div>
      </div>
    </div>
  );
}
