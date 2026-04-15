import { useState, useEffect, useCallback, useRef } from 'react';
import * as api from '../api/gymApi';
import { useToast } from '../components/Toast';

export default function CheckIn() {
  const showToast = useToast();
  const [inputValue, setInputValue] = useState('');
  const [result, setResult] = useState(null);
  const [resultClass, setResultClass] = useState('');
  const resultTimerRef = useRef(null);

  // Keyboard support for check-in keypad
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key >= '0' && e.key <= '9') {
        setInputValue(prev => (prev.length < 4 ? prev + e.key : prev));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        handleCheckInRef.current();
      } else if (e.key === 'Backspace') {
        e.preventDefault();
        setInputValue(prev => prev.slice(0, -1));
      } else if (e.key === 'Escape') {
        handleClear();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleClear = useCallback(() => {
    setInputValue('');
    setResult(null);
    setResultClass('');
    clearTimeout(resultTimerRef.current);
  }, []);

  const handleCheckIn = useCallback(async () => {
    const memberId = inputValue.trim();
    if (!memberId) {
      showToast('Please enter a member ID', 'warning');
      return;
    }

    try {
      const res = await api.checkIn(memberId);
      setResult(res);
      setResultClass(res.success ? 'result-granted' : 'result-denied');

      // Clear input after brief delay
      setTimeout(() => setInputValue(''), 1000);

      // Auto-revert to idle after 4s
      clearTimeout(resultTimerRef.current);
      resultTimerRef.current = setTimeout(() => {
        setResult(null);
        setResultClass('');
      }, 4000);
    } catch (err) {
      showToast('Check-in failed: ' + err.message, 'error');
    }
  }, [inputValue, showToast]);

  // Keep a ref so the keydown handler always has the latest function
  const handleCheckInRef = useRef(handleCheckIn);
  useEffect(() => {
    handleCheckInRef.current = handleCheckIn;
  }, [handleCheckIn]);

  const keypadInput = (digit) => {
    setInputValue(prev => (prev.length < 4 ? prev + digit : prev));
  };

  const keypadBackspace = () => {
    setInputValue(prev => prev.slice(0, -1));
  };

  return (
    <section className="view active" id="view-checkin">
      <div className="view-header">
        <h2 className="view-title">Check-in Console</h2>
        <p className="view-subtitle">Simulate gym door access control</p>
      </div>

      <div className="checkin-layout">
        {/* Keypad */}
        <div className="keypad-section">
          <input
            type="text"
            className="keypad-display"
            id="checkinIdInput"
            placeholder="Enter Member ID"
            maxLength="4"
            readOnly
            value={inputValue}
          />

          <div className="keypad-grid">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => (
              <button
                key={n}
                className="keypad-btn"
                onClick={() => keypadInput(String(n))}
              >
                {n}
              </button>
            ))}
            <button
              className="keypad-btn keypad-clear"
              onClick={handleClear}
            >
              CLR
            </button>
            <button
              className="keypad-btn"
              onClick={() => keypadInput('0')}
            >
              0
            </button>
            <button
              className="keypad-btn keypad-backspace"
              onClick={keypadBackspace}
            >
              <span className="material-symbols-outlined" style={{ verticalAlign: 'middle' }}>backspace</span>
            </button>
            <button
              className="keypad-btn keypad-enter"
              onClick={handleCheckIn}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
            >
              <span className="material-symbols-outlined">lock_open</span> SCAN ACCESS
            </button>
          </div>
        </div>

        {/* Result Display */}
        <div
          className={`checkin-result-container ${resultClass}`}
          id="checkinResultContainer"
        >
          <div id="checkinResult">
            {result === null ? (
              <WaitState />
            ) : result.success ? (
              <GrantedResult result={result} />
            ) : (
              <DeniedResult result={result} />
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ── Sub-components ─────────────────────────────────────── */

function WaitState() {
  return (
    <div className="checkin-wait">
      <div className="checkin-wait-icon material-symbols-outlined">lock</div>
      <p>Enter a Member ID and press SCAN</p>
    </div>
  );
}

function GrantedResult({ result }) {
  const m = result.member;
  return (
    <div className="result-animate">
      <div className="result-icon result-icon-granted">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="64" height="64">
          <path d="M20 6L9 17l-5-5"/>
        </svg>
      </div>
      <h2 className="result-title">Access Granted</h2>
      <p className="result-member-name">{m.name}</p>
      <span className="badge" style={{ '--plan-color': m.plan_color || 'var(--text-muted)' }}>
        {m.displayBadge}
      </span>
      <p className="result-detail">
        Expires {fmtDate(m.expiry_date)}
      </p>
    </div>
  );
}

function DeniedResult({ result }) {
  return (
    <div className="result-animate">
      <div className="result-icon result-icon-denied">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="64" height="64">
          <line x1="18" y1="6" x2="6" y2="18"/>
          <line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
      </div>
      <h2 className="result-title">Access Denied</h2>
      <p className="result-member-name">
        {result.member ? result.member.name : 'Unknown Member'}
      </p>
      <p className="result-detail">{result.reason}</p>
    </div>
  );
}

function fmtDate(d) {
  return new Date(d).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}
