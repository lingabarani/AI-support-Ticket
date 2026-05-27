import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import Layout from '../../components/Layout';
import { getTicket } from '../../services/ticketService';

export default function TicketDetails() {
  const { id, ticketId } = useParams();
  const resolvedTicketId = ticketId || id;
  const [ticket, setTicket] = useState(null);

  useEffect(() => {
    if (resolvedTicketId) getTicket(resolvedTicketId).then((response) => setTicket(response.ticket));
  }, [resolvedTicketId]);

  return (
    <Layout title="Ticket Details">
      <div className="card-glass mx-auto max-w-4xl rounded-xl p-6">
        {!ticket ? <p className="text-slate-400">Loading ticket...</p> : (
          <div className="space-y-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div><p className="font-mono text-purple-300">{ticket.ticket_id}</p><h1 className="text-2xl font-bold text-white">{ticket.subject}</h1></div>
              <div className="rounded-full border border-blue-400/30 px-3 py-1 text-sm text-blue-200">{ticket.status}</div>
            </div>
            <p className="text-slate-300">{ticket.description || ticket.ticket_description}</p>
            <div className="grid gap-3 md:grid-cols-2">
              <Info label="Assigned Team" value={ticket.assigned_team || 'Customer Support'} />
              <Info label="Latest Update" value={ticket.resolution_summary || ticket.ai_summary || 'Support review in progress'} />
              <Info label="SLA Due" value={ticket.sla_due_at ? new Date(ticket.sla_due_at).toLocaleString() : 'Within 48 hours'} />
              <Info label="AI Sentiment" value={ticket.ai_sentiment || ticket.sentiment || 'Neutral'} />
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}

function Info({ label, value }) {
  return <div className="rounded-xl border border-white/10 p-4"><p className="text-xs text-slate-500">{label}</p><p className="mt-1 text-sm text-slate-200">{value}</p></div>;
}
