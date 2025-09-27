import { type ReactNode, useEffect } from 'react';
import { createPortal } from 'react-dom';

type ModalProps = {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  closeLabel?: string;
};

const modalRootId = 'warp-modal-root';

const ensureModalRoot = () => {
  if (typeof document === 'undefined') return null;
  let root = document.getElementById(modalRootId);
  if (!root) {
    root = document.createElement('div');
    root.setAttribute('id', modalRootId);
    document.body.appendChild(root);
  }
  return root;
};

const Modal = ({ isOpen, onClose, title, children, closeLabel = 'Close' }: ModalProps) => {
  useEffect(() => {
    if (!isOpen) return undefined;

    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKey);

    return () => {
      document.removeEventListener('keydown', handleKey);
    };
  }, [isOpen, onClose]);

  const modalRoot = ensureModalRoot();
  if (!isOpen || !modalRoot) {
    return null;
  }

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/80 backdrop-blur-sm">
      <div className="relative w-full max-w-2xl rounded-3xl border border-white/20 bg-gradient-to-br from-slate-900/90 via-slate-900/80 to-slate-800/70 p-8 shadow-[0_40px_120px_rgba(15,23,42,0.65)]">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs uppercase tracking-[0.3em] text-slate-200 transition hover:bg-white/10"
        >
          {closeLabel}
        </button>

        {title ? (
          <h2 className="text-2xl font-semibold text-white">{title}</h2>
        ) : null}

        <div className="mt-6 max-h-[70vh] overflow-y-auto pr-2">
          {children}
        </div>
      </div>
    </div>,
    modalRoot
  );
};

export default Modal;
