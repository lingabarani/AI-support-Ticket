import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { PlusCircle, Ticket, Timer, TrendingUp } from 'lucide-react';
import Layout from '../../components/Layout';
import StatusBadge from '../../components/StatusBadge';
import PriorityBadge from '../../components/PriorityBadge';
import { useAuth } from '../../context/AuthContext';
import { listCustomerTickets } from '../../services/ticketService';
import GlassCard from '../../components/premium/GlassCard';
import GradientBadge from '../../components/premium/GradientBadge';

export default function MyTickets() {
  const { user } = useAuth();
  const [tickets, setTickets] = useState([]);

  useEffect(() => {
    if (user?.email) listCustomerTickets(user.email).then((response) => setTickets(response.tickets || []));
  }, [user?.email]);

  return (
    <Layout title="My Tickets">
      <div className="space-y-6">
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
          <div>
            <GradientBadge icon={Ticket} tone="blue">Customer Support Command Center</GradientBadge>
            <h1 className="mt-4 text-3xl font-black tracking-tight text-white">My Tickets</h1>
            <p className="mt-2 text-sm leading-6 text-slate-400">Monitor active cases, SLA commitments, support ownership, and AI-assisted updates.</p>
          </div>
          <Link to="/customer/raise-ticket" className="btn-primary inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-bold"><PlusCircle size={17} /> Raise Ticket</Link>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <GlassCard className="p-5"><Ticket className="text-cyan-200" size={21} /><p className="mt-4 text-3xl font-black text-white">{tickets.length}</p><p className="text-sm text-slate-400">Total tickets</p></GlassCard>
          <GlassCard className="p-5"><Timer className="text-emerald-200" size={21} /><p className="mt-4 text-3xl font-black text-white">{tickets.filter((ticket) => ticket.status !== 'Resolved').length}</p><p className="text-sm text-slate-400">Active cases</p></GlassCard>
          <GlassCard className="p-5"><TrendingUp className="text-amber-200" size={21} /><p className="mt-4 text-3xl font-black text-white">AI</p><p className="text-sm text-slate-400">Smart routing enabled</p></GlassCard>
        </div>

        <GlassCard className="overflow-hidden">
          <div className="overflow-x-auto">
            <table>
              <thead><tr><th>Ticket</th><th>Subject</th><th>Status</th><th>Priority</th><th>Assigned Team</th><th>SLA</th></tr></thead>
              <tbody>
                {tickets.map((ticket) => (
                  <tr key={ticket.ticket_id}>
                    <td><Link className="font-mono text-cyan-200" to={`/customer/tickets/${ticket.ticket_id}`}>{ticket.ticket_id}</Link></td>
                    <td className="text-slate-300">{ticket.subject}</td>
                    <td><StatusBadge status={ticket.status} /></td>
                    <td><PriorityBadge priority={ticket.priority} /></td>
                    <td className="text-slate-400">{ticket.assigned_team || 'Customer Support'}</td>
                    <td className="text-slate-400">{ticket.sla_due_at ? new Date(ticket.sla_due_at).toLocaleString() : '-'}</td>
                  </tr>
                ))}
                {!tickets.length && <tr><td colSpan="6" className="py-10 text-center text-slate-500">No tickets found for this customer.</td></tr>}
              </tbody>
            </table>
          </div>
        </GlassCard>
      </div>
    </Layout>
  );
}
