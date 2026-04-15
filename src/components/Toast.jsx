import { useState, useCallback, useEffect, createContext, useContext } from 'react';

const ToastContext = createContext(null);

export function useToast() {
  return useContext(ToastContext);
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((message, type = 'info') => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, message, type, visible: false }]);

    // Trigger slide-in on next frame
    requestAnimationFrame(() => {
      setToasts(prev =>
        prev.map(t => (t.id === id ? { ...t, visible: true } : t))
      );
    });

    // Auto-dismiss after 3s
    setTimeout(() => {
      setToasts(prev =>
        prev.map(t => (t.id === id ? { ...t, visible: false } : t))
      );
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id));
      }, 400);
    }, 3000);
  }, []);

  return (
    <ToastContext.Provider value={showToast}>
      {children}
      <div className="toast-container" id="toastContainer">
        {toasts.map(toast => (
          <Toast key={toast.id} toast={toast} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

const ICONS = { success: 'check_circle', error: 'error', warning: 'warning', info: 'info' };

function Toast({ toast }) {
  return (
    <div className={`toast toast-${toast.type}${toast.visible ? ' toast-visible' : ''}`}>
      <span className="toast-icon material-symbols-outlined">{ICONS[toast.type] || ICONS.info}</span>
      <span className="toast-message">{toast.message}</span>
    </div>
  );
}
