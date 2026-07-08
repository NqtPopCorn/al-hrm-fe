import {
  createContext,
  useCallback,
  useContext,
  useId,
  useRef,
  useState,
} from 'react';
import type { JSX, ReactNode } from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastOptions {
  type: ToastType;
  message: string;
  /** Auto-dismiss after this many ms. Default 4000. Pass 0 to never auto-dismiss. */
  duration?: number;
}

interface ToastItem extends ToastOptions {
  id: string;
  /** When true, the exit animation plays before the item is removed from DOM */
  exiting: boolean;
}

interface ToastContextValue {
  showToast: (options: ToastOptions) => void;
}

// ─── Context ──────────────────────────────────────────────────────────────────

const ToastContext = createContext<ToastContextValue | null>(null);

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToast must be used inside <ToastProvider>');
  }
  return ctx;
}

// ─── Provider ─────────────────────────────────────────────────────────────────

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const baseId = useId();
  const counterRef = useRef(0);

  const dismiss = useCallback((id: string) => {
    // Start exit animation
    setToasts(prev =>
      prev.map(t => (t.id === id ? { ...t, exiting: true } : t)),
    );
    // Remove after animation completes (350ms)
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 350);
  }, []);

  const showToast = useCallback(
    ({ type, message, duration = 4000 }: ToastOptions) => {
      const id = `${baseId}-${++counterRef.current}`;
      const item: ToastItem = { id, type, message, duration, exiting: false };

      setToasts(prev => [...prev, item]);

      if (duration > 0) {
        setTimeout(() => dismiss(id), duration);
      }
    },
    [baseId, dismiss],
  );

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <ToastContainer toasts={toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  );
}

// ─── Icons ────────────────────────────────────────────────────────────────────

function SuccessIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden>
      <circle cx="10" cy="10" r="9" fill="#22c55e" />
      <path
        d="M6 10l3 3 5-5"
        stroke="#fff"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ErrorIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden>
      <circle cx="10" cy="10" r="9" fill="#ef4444" />
      <path
        d="M7 7l6 6M13 7l-6 6"
        stroke="#fff"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function WarningIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden>
      <path
        d="M10 2L18.66 17H1.34L10 2z"
        fill="#f59e0b"
        stroke="#f59e0b"
        strokeWidth="0.5"
      />
      <path
        d="M10 8v4M10 14.5v.5"
        stroke="#fff"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function InfoIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden>
      <circle cx="10" cy="10" r="9" fill="#3b82f6" />
      <path
        d="M10 9v5M10 6.5v.5"
        stroke="#fff"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
      <path
        d="M2 2l10 10M12 2L2 12"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

const TYPE_ICON: Record<ToastType, () => JSX.Element> = {
  success: SuccessIcon,
  error: ErrorIcon,
  warning: WarningIcon,
  info: InfoIcon,
};

const TYPE_ACCENT: Record<ToastType, string> = {
  success: '#22c55e',
  error:   '#ef4444',
  warning: '#f59e0b',
  info:    '#3b82f6',
};

// ─── Container + individual Toast ─────────────────────────────────────────────

interface ToastContainerProps {
  toasts: ToastItem[];
  onDismiss: (id: string) => void;
}

function ToastContainer({ toasts, onDismiss }: ToastContainerProps) {
  if (toasts.length === 0) return null;

  return (
    <>
      <style>{TOAST_STYLES}</style>
      <div
        aria-live="polite"
        aria-label="Notifications"
        style={{
          position: 'fixed',
          bottom: '1.25rem',
          right: '1.25rem',
          zIndex: 9999,
          display: 'flex',
          flexDirection: 'column',
          gap: '0.625rem',
          pointerEvents: 'none',
        }}
      >
        {toasts.map(toast => (
          <ToastCard key={toast.id} toast={toast} onDismiss={onDismiss} />
        ))}
      </div>
    </>
  );
}

interface ToastCardProps {
  toast: ToastItem;
  onDismiss: (id: string) => void;
}

function ToastCard({ toast, onDismiss }: ToastCardProps) {
  const Icon = TYPE_ICON[toast.type];
  const accent = TYPE_ACCENT[toast.type];

  return (
    <div
      role="alert"
      className={toast.exiting ? 'toast-exit' : 'toast-enter'}
      style={{
        pointerEvents: 'auto',
        display: 'flex',
        alignItems: 'flex-start',
        gap: '0.625rem',
        minWidth: '280px',
        maxWidth: '400px',
        background: '#ffffff',
        borderRadius: '0.625rem',
        boxShadow:
          '0 4px 16px rgba(0,0,0,0.10), 0 1px 4px rgba(0,0,0,0.06)',
        borderLeft: `4px solid ${accent}`,
        padding: '0.75rem 0.875rem',
        position: 'relative',
      }}
    >
      <span style={{ flexShrink: 0, marginTop: '1px' }}>
        <Icon />
      </span>
      <span
        style={{
          fontSize: '0.8125rem',
          lineHeight: '1.45',
          color: '#1e293b',
          fontWeight: 500,
          flex: 1,
          wordBreak: 'break-word',
        }}
      >
        {toast.message}
      </span>
      <button
        type="button"
        aria-label="Đóng thông báo"
        onClick={() => onDismiss(toast.id)}
        style={{
          flexShrink: 0,
          marginTop: '1px',
          color: '#94a3b8',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          padding: '2px',
          borderRadius: '4px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'color 0.15s',
        }}
        onMouseEnter={e =>
          ((e.currentTarget as HTMLElement).style.color = '#475569')
        }
        onMouseLeave={e =>
          ((e.currentTarget as HTMLElement).style.color = '#94a3b8')
        }
      >
        <CloseIcon />
      </button>
    </div>
  );
}

// ─── CSS keyframes (injected once) ────────────────────────────────────────────

const TOAST_STYLES = `
@keyframes toast-slide-in {
  from {
    opacity: 0;
    transform: translateX(calc(100% + 1.25rem));
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes toast-slide-out {
  from {
    opacity: 1;
    transform: translateX(0);
    max-height: 120px;
    margin-bottom: 0;
  }
  to {
    opacity: 0;
    transform: translateX(calc(100% + 1.25rem));
    max-height: 0;
    margin-bottom: -0.625rem;
  }
}

.toast-enter {
  animation: toast-slide-in 0.32s cubic-bezier(0.22, 1, 0.36, 1) both;
}

.toast-exit {
  animation: toast-slide-out 0.32s cubic-bezier(0.55, 0, 1, 0.45) both;
}
`;
