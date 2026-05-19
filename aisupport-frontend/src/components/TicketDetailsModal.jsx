import { X } from 'lucide-react';
import PriorityBadge from './PriorityBadge';
import StatusBadge from './StatusBadge';

export default function TicketDetailsModal({ ticket, onClose, onStatusChange, onAddNote }) {
  if (!ticket) return null;

  const id = ticket.ticket_id || ticket.id;
  const subject = ticket.ticket_description || ticket.subject;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="card-glass w-full max-w-3xl rounded-xl border border-purple-400/20">
        <div className="flex items-center justify-between border-b border-white/10 p-5">
          <div>
            <p className="font-mono text-xs text-purple-300">{id}</p>
            <h3 className="text-lg font-semibold text-white">{ticket.issue_category || ticket.category}</h3>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-2 text-slate-400 hover:bg-white/10 hover:text-white" aria-label="Close ticket details">
            <X size={18} />
          </button>
        </div>

        <div className="grid gap-5 p-5 md:grid-cols-2">
          <div className="space-y-3">
            <p className="text-sm text-slate-300">{subject}</p>
            <div className="flex gap-2"><PriorityBadge priority={ticket.priority} /><StatusBadge status={ticket.status} /></div>
            <div className="text-sm text-slate-400">
              <p>Customer: {ticket.customer_name || ticket.customer}</p>
              <p>Email: {ticket.customer_email}</p>
              <p>Product: {ticket.product}</p>
              <p>Assigned: {ticket.assigned_agent || ticket.agent}</p>
            </div>
          </div>

          <div className="space-y-3 rounded-xl bg-white/5 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-purple-200">Support Intelligence</p>
            <p className="text-sm text-slate-300">{ticket.ai_summary}</p>
            <p className="text-sm text-slate-400">Root cause: {ticket.ai_root_cause}</p>
            <p className="text-sm text-slate-400">Suggested resolution: {ticket.ai_suggested_resolution || ticket.resolution_summary}</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 border-t border-white/10 p-5">
          <select
            value={ticket.status}
            onChange={(event) => onStatusChange?.(ticket, event.target.value)}
            className="rounded-lg px-3 py-2 text-sm"
          >
            {['Open', 'In Progress', 'Pending Customer', 'Resolved', 'Closed'].map((status) => <option key={status}>{status}</option>)}
          </select>
          <button type="button" onClick={() => onAddNote?.(ticket)} className="btn-primary rounded-lg px-4 py-2 text-sm font-semibold">Add Internal Note</button>
          <button type="button" onClick={onClose} className="rounded-lg border border-white/10 px-4 py-2 text-sm text-slate-300 hover:bg-white/10">Done</button>
        </div>
      </div>
    </div>
  );
}
