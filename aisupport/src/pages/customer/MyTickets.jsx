import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CalendarDays, Filter, PlusCircle, Search, Ticket, Timer, XCircle } from 'lucide-react';
import Layout from '../../components/Layout';
import StatusBadge from '../../components/StatusBadge';
import PriorityBadge from '../../components/PriorityBadge';
import { useAuth } from '../../context/AuthContext';
import { listCustomerTickets } from '../../services/ticketService';
import GlassCard from '../../components/premium/GlassCard';
import GlowButton from '../../components/premium/GlowButton';

const isResolved = (status) => ['Resolved', 'Closed'].includes(status);
const getTicketId = (ticket) => ticket.ticket_id || ticket.ticketId || ticket.id;
const getSubject = (ticket) => ticket.subject || ticket.issue_category || ticket.category || 'Support request';
const getCategory = (ticket) => ticket.issue_category || ticket.category || 'General Support';
const getCreatedTime = (ticket) => new Date(ticket.ticket_created_date || ticket.created_at || ticket.createdAt || 0).getTime();

export default function MyTickets() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: '',
    status: 'All',
    priority: 'All',
    category: 'All',
    date: 'All',
  });

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    listCustomerTickets(user?.email)
      .then((response) => {
        if (mounted) setTickets(response.tickets || []);
      })
      .catch(() => {
        if (mounted) setTickets([]);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => { mounted = false; };
  }, [user?.email]);

  const categories = useMemo(() => [...new Set(tickets.map(getCategory).filter(Boolean))], [tickets]);

  const filtered = useMemo(() => {
    const now = Date.now();
    const dayMs = 24 * 60 * 60 * 1000;
    return tickets.filter((ticket) => {
      const query = filters.search.trim().toLowerCase();
      const haystack = [
        getTicketId(ticket),
        getSubject(ticket),
        getCategory(ticket),
        ticket.status,
        ticket.priority,
      ].filter(Boolean).join(' ').toLowerCase();
      const age = now - getCreatedTime(ticket);
      return (!query || haystack.includes(query))
        && (filters.status === 'All' || ticket.status === filters.status)
        && (filters.priority === 'All' || ticket.priority === filters.priority)
        && (filters.category === 'All' || getCategory(ticket) === filters.category)
        && (filters.date === 'All'
          || (filters.date === '7d' && age <= 7 * dayMs)
          || (filters.date === '30d' && age <= 30 * dayMs)
          || (filters.date === '90d' && age <= 90 * dayMs));
    });
  }, [filters, tickets]);

  const activeCases = tickets.filter((ticket) => !isResolved(ticket.status));
  const closedCases = tickets.filter((ticket) => isResolved(ticket.status));

  const setFilter = (key, value) => setFilters((current) => ({ ...current, [key]: value }));

  return (
    <Layout title="My Tickets">
      <div className="mx-auto max-w-7xl space-y-6 overflow-x-hidden">
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-cyan-200">Customer Cases</p>
            <h1 className="mt-3 text-3xl font-black tracking-tight text-white">My Tickets</h1>
            <p className="mt-2 text-sm leading-6 text-slate-400">Search, filter, and open your support cases linked to {user?.email || 'your customer profile'}.</p>
          </div>
          <Link to="/customer/raise-ticket" className="inline-flex items-center justify-center gap-2 rounded-xl bg-cyan-500 px-5 py-3 text-sm font-bold text-white hover:bg-cyan-400">
            <PlusCircle size={17} /> Raise Ticket
          </Link>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <GlassCard className="p-5"><Ticket className="text-cyan-200" size={21} /><p className="mt-4 text-3xl font-black text-white">{tickets.length}</p><p className="text-sm text-slate-400">Total tickets</p></GlassCard>
          <GlassCard className="p-5"><Timer className="text-amber-200" size={21} /><p className="mt-4 text-3xl font-black text-white">{activeCases.length}</p><p className="text-sm text-slate-400">Active cases</p></GlassCard>
          <GlassCard className="p-5"><XCircle className="text-emerald-200" size={21} /><p className="mt-4 text-3xl font-black text-white">{closedCases.length}</p><p className="text-sm text-slate-400">Closed or resolved</p></GlassCard>
        </div>

        <GlassCard className="p-4">
          <div className="grid gap-3 lg:grid-cols-[minmax(220px,1fr)_repeat(4,minmax(130px,170px))]">
            <div className="relative min-w-0">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                value={filters.search}
                onChange={(event) => setFilter('search', event.target.value)}
                className="w-full rounded-xl border border-white/10 bg-black/20 py-3 pl-9 pr-3 text-sm text-white outline-none focus:border-cyan-300/50"
                placeholder="Search ticket ID or subject"
              />
            </div>
            <SelectFilter icon={Filter} value={filters.status} onChange={(value) => setFilter('status', value)} options={['All', 'Open', 'In Progress', 'Pending Customer', 'On Hold', 'Resolved', 'Closed']} />
            <SelectFilter icon={Filter} value={filters.priority} onChange={(value) => setFilter('priority', value)} options={['All', 'Urgent', 'High', 'Medium', 'Low']} />
            <SelectFilter icon={Filter} value={filters.category} onChange={(value) => setFilter('category', value)} options={['All', ...categories]} />
            <SelectFilter icon={CalendarDays} value={filters.date} onChange={(value) => setFilter('date', value)} options={[['All', 'All dates'], ['7d', 'Last 7 days'], ['30d', 'Last 30 days'], ['90d', 'Last 90 days']]} />
          </div>
        </GlassCard>

        <GlassCard className="overflow-hidden">
          {loading ? (
            <div className="p-10 text-center text-sm text-slate-400">Loading your tickets...</div>
          ) : filtered.length ? (
            <div className="overflow-x-auto">
              <table className="min-w-[920px]">
                <thead><tr><th>Ticket</th><th>Subject</th><th>Status</th><th>Priority</th><th>Category</th><th>Assigned Team</th><th>SLA</th></tr></thead>
                <tbody>
                  {filtered.map((ticket) => (
                    <tr key={getTicketId(ticket)} className="cursor-pointer hover:bg-white/[0.035]" onClick={() => navigate(`/customer/tickets/${getTicketId(ticket)}`)}>
                      <td className="font-mono text-xs text-cyan-200">{getTicketId(ticket)}</td>
                      <td className="max-w-xs truncate text-slate-300">{getSubject(ticket)}</td>
                      <td><StatusBadge status={ticket.status} /></td>
                      <td><PriorityBadge priority={ticket.priority} /></td>
                      <td className="text-sm text-slate-400">{getCategory(ticket)}</td>
                      <td className="text-sm text-slate-400">{ticket.assigned_team || 'Customer Support'}</td>
                      <td className="text-sm text-slate-400">{ticket.sla_due_at ? new Date(ticket.sla_due_at).toLocaleDateString() : '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-10 text-center">
              <Ticket className="mx-auto text-slate-600" size={34} />
              <h2 className="mt-4 text-lg font-bold text-white">No tickets found</h2>
              <p className="mt-2 text-sm text-slate-500">No tickets found. Raise your first support request.</p>
              <GlowButton onClick={() => navigate('/customer/raise-ticket')} className="mt-6">Raise Ticket</GlowButton>
            </div>
          )}
        </GlassCard>
      </div>
    </Layout>
  );
}

function SelectFilter({ icon: Icon, value, onChange, options }) {
  return (
    <div className="relative min-w-0">
      <Icon size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full appearance-none rounded-xl border border-white/10 bg-black/20 py-3 pl-9 pr-3 text-sm text-white outline-none focus:border-cyan-300/50"
      >
        {options.map((option) => {
          const [optionValue, label] = Array.isArray(option) ? option : [option, option === 'All' ? 'All' : option];
          return <option key={optionValue} value={optionValue}>{label}</option>;
        })}
      </select>
    </div>
  );
}
