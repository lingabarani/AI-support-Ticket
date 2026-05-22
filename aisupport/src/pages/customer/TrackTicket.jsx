import { useState } from 'react';
import { Search, ShieldCheck, TicketCheck } from 'lucide-react';
import Layout from '../../components/Layout';
import { getTicket, listCustomerTickets } from '../../services/ticketService';
import GlassCard from '../../components/premium/GlassCard';
import GlowButton from '../../components/premium/GlowButton';
import GradientBadge from '../../components/premium/GradientBadge';

export default function TrackTicket() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);

  const submit = async (event) => {
    event.preventDefault();
    if (query.includes('@')) {
      const response = await listCustomerTickets(query);
      setResults(response.tickets || []);
    } else {
      const response = await getTicket(query);
      setResults(response.ticket ? [response.ticket] : []);
    }
  };

  return (
    <Layout title="Track Ticket">
      <section className="mx-auto max-w-5xl">
        <GlassCard className="overflow-hidden">
          <div className="border-b border-white/10 p-6 lg:p-8">
            <GradientBadge icon={ShieldCheck} tone="emerald">SLA Visibility</GradientBadge>
            <h1 className="mt-4 text-3xl font-black tracking-tight text-white">Track Ticket</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">Search by ticket ID or customer email to review status, routing, SLA timing, and the latest AI-supported update.</p>
          </div>
          <div className="p-6 lg:p-8">
            <form onSubmit={submit} className="flex flex-col gap-3 md:flex-row">
              <div className="relative min-w-0 flex-1">
                <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-cyan-200" />
                <input className="w-full py-4 pl-12 pr-4 text-sm" placeholder="Enter ticket_id or email" value={query} onChange={(e) => setQuery(e.target.value)} required />
              </div>
              <GlowButton icon={TicketCheck}>Track</GlowButton>
            </form>
            <div className="mt-6 grid gap-4">
              {results.map((ticket) => (
                <div key={ticket.ticket_id} className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 shadow-xl shadow-black/10">
                  <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    <div>
                      <div className="font-mono text-sm font-bold text-cyan-200">{ticket.ticket_id}</div>
                      <h2 className="mt-2 text-lg font-bold text-white">{ticket.subject || ticket.issue_category}</h2>
                      <p className="mt-2 text-sm text-slate-300">Status: {ticket.status} | Team: {ticket.assigned_team || 'Customer Support'}</p>
                    </div>
                    <div className="rounded-xl border border-emerald-300/20 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-100">
                      SLA: {ticket.sla_due_at ? new Date(ticket.sla_due_at).toLocaleString() : 'Within 48 hours'}
                    </div>
                  </div>
                  <p className="mt-4 text-sm leading-6 text-slate-400">Latest update: {ticket.resolution_summary || ticket.ai_summary || 'Support team is reviewing your request.'}</p>
                </div>
              ))}
            </div>
          </div>
        </GlassCard>
      </section>
    </Layout>
  );
}
