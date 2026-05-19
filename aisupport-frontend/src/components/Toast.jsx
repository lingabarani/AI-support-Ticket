export default function Toast({ message, type = 'info', onClose }) {
  if (!message) return null;
  const colors = {
    info: 'border-blue-400/30 bg-blue-500/10 text-blue-100',
    success: 'border-emerald-400/30 bg-emerald-500/10 text-emerald-100',
    warning: 'border-amber-400/30 bg-amber-500/10 text-amber-100',
  };
  return (
    <div className={`fixed right-5 top-5 z-50 rounded-xl border px-4 py-3 text-sm shadow-2xl ${colors[type] || colors.info}`}>
      <div className="flex items-center gap-3">
        <span>{message}</span>
        {onClose && <button type="button" onClick={onClose} className="text-xs opacity-70 hover:opacity-100">Close</button>}
      </div>
    </div>
  );
}
