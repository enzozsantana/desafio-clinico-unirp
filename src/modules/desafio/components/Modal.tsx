import { useEffect, useId, useRef } from 'react';

export type ModalProps = {
  open: boolean;
  title: string;
  message: string;
  mode: 'alert' | 'confirm';
  danger?: boolean;
  onClose: (ok: boolean) => void;
};

export function Modal({ open, title, message, mode, danger, onClose }: ModalProps) {
  const titleId = useId();
  const okRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose(false);
      } else if (e.key === 'Enter' && e.target === okRef.current) {
        e.preventDefault();
        onClose(true);
      }
    };
    document.addEventListener('keydown', onKey, true);
    const t = window.setTimeout(() => okRef.current?.focus(), 30);
    return () => {
      document.removeEventListener('keydown', onKey, true);
      window.clearTimeout(t);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="modal-root">
      <div className="modal-backdrop" onClick={() => onClose(false)} aria-hidden />
      <div
        className="modal-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        <h2 className="modal-title" id={titleId}>
          {title}
        </h2>
        <p className="modal-msg" style={{ whiteSpace: 'pre-wrap' }}>
          {message}
        </p>
        <div className="modal-actions">
          {mode === 'confirm' ? (
            <button type="button" className="btn ghost" onClick={() => onClose(false)}>
              Cancelar
            </button>
          ) : null}
          <button
            ref={okRef}
            type="button"
            className={`btn${danger ? ' danger' : ' teal'}`}
            onClick={() => onClose(true)}
          >
            {mode === 'confirm' ? 'Confirmar' : 'OK'}
          </button>
        </div>
      </div>
    </div>
  );
}