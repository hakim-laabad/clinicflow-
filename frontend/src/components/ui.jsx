import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import Icon from './Icon.jsx';

export function Modal({ title, onClose, children }) {
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [onClose]);

  return createPortal(
    <div className="overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" role="dialog" aria-modal="true" aria-label={title}>
        <header>
          <h3>{title}</h3>
          <button className="icon-btn" onClick={onClose} aria-label="Close"><Icon name="x" size={17} /></button>
        </header>
        {children}
      </div>
    </div>,
    document.body
  );
}

export function ConfirmDialog({ title, message, confirmLabel = 'Delete', busy, onConfirm, onCancel }) {
  return (
    <Modal title={title} onClose={onCancel}>
      <p className="muted">{message}</p>
      <div className="actions">
        <button className="btn" onClick={onCancel}>Cancel</button>
        <button className="btn danger" onClick={onConfirm} disabled={busy}>{busy ? 'Please wait…' : confirmLabel}</button>
      </div>
    </Modal>
  );
}

export const StatusBadge = ({ status }) => <span className={`badge ${status}`}>{status}</span>;

export function TableSkeleton({ rows = 5, cols = 4 }) {
  return Array.from({ length: rows }, (_, r) => (
    <tr key={r}>{Array.from({ length: cols }, (_, c) => <td key={c}><div className="skeleton" /></td>)}</tr>
  ));
}

export function EmptyState({ title, hint }) {
  return <div className="state"><strong>{title}</strong>{hint && <p className="muted">{hint}</p>}</div>;
}

export function ErrorState({ message, onRetry }) {
  return (
    <div className="state error">
      <strong>Something went wrong</strong>
      <p className="muted">{message}</p>
      {onRetry && <button className="btn" onClick={onRetry}>Try again</button>}
    </div>
  );
}

export function Field({ label, error, children }) {
  return (
    <label className="field">
      <span>{label}</span>
      {children}
      {error && <small className="err" role="alert">{error}</small>}
    </label>
  );
}
