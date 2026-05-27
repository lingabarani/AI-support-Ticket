import { useEffect } from 'react';

export default function Toast({ message, type = 'success', onClose }) {
  useEffect(() => {
    if (!message) return undefined;
    const timer = window.setTimeout(() => onClose?.(), 3000);
    return () => window.clearTimeout(timer);
  }, [message, onClose]);

  if (!message) return null;

  const tone = type === 'error'
    ? 'border-red-400/30 bg-red-500/15 text-red-100'
    : 'border-emerald-400/30 bg-emerald-500/15 text-emerald-100';

  return (
    <div className={`fixed bottom-5 right-5 z-50 max-w-sm rounded-lg border px-4 py-3 text-sm shadow-2xl backdrop-blur ${tone}`}>
      {message}
    </div>
  );
}
