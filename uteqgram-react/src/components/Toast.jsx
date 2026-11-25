import { useEffect } from 'react';

export default function Toast({ toast, onHide }) {
  useEffect(() => {
    if (!toast) {
      return undefined;
    }
    const timer = setTimeout(onHide, 3000);
    return () => clearTimeout(timer);
  }, [toast, onHide]);

  return (
    <div className={`toast ${toast ? 'visible' : ''}`} role="status" aria-live="polite">
      {toast ? toast.message : ''}
    </div>
  );
}
