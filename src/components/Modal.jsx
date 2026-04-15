import { useEffect, useCallback } from 'react';

export default function Modal({ isOpen, title, onClose, children }) {
  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === 'Escape') onClose();
    },
    [onClose]
  );

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, handleKeyDown]);

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div
      className={`modal-overlay${isOpen ? ' active' : ''}`}
      id="modalOverlay"
      onClick={handleOverlayClick}
    >
      <div className="modal" id="modal">
        <div className="modal-header">
          <h3 id="modalTitle">{title}</h3>
          <button className="modal-close" id="modalClose" onClick={onClose}>
            &times;
          </button>
        </div>
        <div className="modal-body" id="modalBody">
          {children}
        </div>
      </div>
    </div>
  );
}
