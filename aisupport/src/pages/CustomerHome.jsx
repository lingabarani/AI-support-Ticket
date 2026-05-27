import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  BookOpen,
  CheckCircle,
  Clock,
  Headphones,
  LifeBuoy,
  MapPin,
  PlusCircle,
  Search,
  Star,
  Ticket,
} from 'lucide-react';
import Layout from '../components/Layout';
import StatusBadge from '../components/StatusBadge';
import PriorityBadge from '../components/PriorityBadge';
import { useAuth } from '../context/AuthContext';
import { listCustomerTickets } from '../services/ticketService';
import GlassCard from '../components/premium/GlassCard';
import GlowButton from '../components/premium/GlowButton';

const articles = [
  { title: 'Reset your password securely', desc: 'Account recovery steps and MFA tips', icon: LifeBuoy },
  { title: 'Track a refund or invoice', desc: 'Where to find payment and refund updates', icon: BookOpen },
  { title: 'Understand ticket priority', desc: 'How SLA and urgency are calculated', icon: Star },
  { title: 'Contact support effectively', desc: 'What details help agents resolve faster', icon: Headphones },
];

const isResolved = (status) => ['Resolved', 'Closed'].includes(status);
const getTicketId = (ticket) => ticket.ticket_id || ticket.ticketId || ticket.id;
const getSubject = (ticket) => ticket.subject || ticket.issue_category || ticket.category || 'Support request';

export default function CustomerHome() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);

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

  const metrics = useMemo(() => {
    const resolved = tickets.filter((ticket) => isResolved(ticket.status));
    const active = tickets.filter((ticket) => !isResolved(ticket.status));
    const responseTimes = tickets
      .map((ticket) => Number(ticket.first_response_minutes || ticket.response_time_minutes || ticket.resolution_time_hours))
      .filter(Number.isFinite);
    const satisfaction = tickets
      .map((ticket) => Number(ticket.customer_satisfaction || ticket.customer_rating || ticket.avg_csat))
      .filter(Number.isFinite);
    return {
      open: active.length,
      resolved: resolved.length,
      avgResponse: responseTimes.length ? `${Math.round(responseTimes.reduce((sum, value) => sum + value, 0) / responseTimes.length)} min` : '-',
      satisfaction: satisfaction.length ? `${(satisfaction.reduce((sum, value) => sum + value, 0) / satisfaction.length).toFixed(1)} / 5` : '-',
    };
  }, [tickets]);

  const recentTickets = tickets.slice(0, 5);

  return (
    <Layout title="Customer Dashboard">
      <div className="mx-auto max-w-7xl space-y-6 overflow-x-hidden">
        <section className="rounded-2xl border border-cyan-300/15 bg-gradient-to-br from-cyan-400/10 via-purple-500/10 to-transparent p-5 lg:p-7">
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-center">
            <div className="min-w-0">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-cyan-200">Customer Portal</p>
              <h1 className="mt-3 text-3xl font-black tracking-tight text-white">Welcome{user?.name ? `, ${user.name}` : ''}</h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">Search help articles, raise requests, and track support progress from one customer workspace.</p>
              <div className="relative mt-5 max-w-2xl">
                <Search size={17} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                <input className="w-full rounded-2xl border border-white/10 bg-white/[0.045] py-4 pl-11 pr-28 text-sm text-white outline-none placeholder:text-slate-500 focus:border-cyan-300/50" placeholder="Search support articles..." />
                <button className="absolute right-2 top-1/2 -translate-y-1/2 rounded-xl bg-cyan-500 px-5 py-2.5 text-sm font-bold text-white">Search</button>
              </div>
            </div>
            <GlassCard className="p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-cyan-400/10 text-cyan-200">
                  <Ticket size={22} />
                </div>
                <div>
                  <p className="font-bold text-white">Support status</p>
                  <p className="text-xs text-slate-500">{loading ? 'Loading your workspace' : `${tickets.length} ticket${tickets.length === 1 ? '' : 's'} found`}</p>
                </div>
              </div>
              <p className="mt-4 text-sm leading-6 text-slate-400">Your dashboard is calculated from tickets linked to {user?.email || 'your customer account'}.</p>
            </GlassCard>
          </div>
        </section>

        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[
            { label: 'Open Tickets', value: metrics.open, icon: Ticket, tone: 'text-cyan-200' },
            { label: 'Resolved Tickets', value: metrics.resolved, icon: CheckCircle, tone: 'text-emerald-200' },
            { label: 'Avg Response Time', value: metrics.avgResponse, icon: Clock, tone: 'text-amber-200' },
            { label: 'Satisfaction Score', value: metrics.satisfaction, icon: Star, tone: 'text-purple-200' },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <GlassCard key={item.label} className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm text-slate-400">{item.label}</p>
                    <p className="mt-2 text-3xl font-black text-white">{item.value}</p>
                  </div>
                  <div className={`flex h-11 w-11 items-center justify-center rounded-xl bg-white/[0.06] ${item.tone}`}>
                    <Icon size={21} />
                  </div>
                </div>
              </GlassCard>
            );
          })}
        </section>

        <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          {[
            { label: 'Raise Ticket', desc: 'Submit a new support request', icon: PlusCircle, path: '/customer/raise-ticket', primary: true },
            { label: 'My Tickets', desc: 'Review all your cases', icon: Ticket, path: '/customer/my-tickets' },
            { label: 'Track Request', desc: 'Search by ticket ID', icon: MapPin, path: '/customer/track-ticket' },
            { label: 'Contact Support', desc: 'Open help resources', icon: Headphones, path: '/customer/track-ticket' },
          ].map((action) => {
            const Icon = action.icon;
            return (
              <button
                key={action.label}
                onClick={() => navigate(action.path)}
                className={`rounded-2xl border p-4 text-left transition hover:-translate-y-0.5 hover:border-cyan-300/35 ${action.primary ? 'border-cyan-300/30 bg-cyan-500/15' : 'border-white/10 bg-white/[0.035]'}`}
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/[0.07] text-cyan-100">
                    <Icon size={20} />
                  </div>
                  <div>
                    <p className="font-bold text-white">{action.label}</p>
                    <p className="mt-0.5 text-xs text-slate-400">{action.desc}</p>
                  </div>
                </div>
              </button>
            );
          })}
        </section>

        <section className="grid grid-cols-1 gap-5 xl:grid-cols-[1.15fr_0.95fr_0.8fr]">
          <GlassCard className="overflow-hidden">
            <div className="flex items-center justify-between border-b border-white/10 p-5">
              <h2 className="font-bold text-white">Recent Tickets</h2>
              <Link className="text-sm font-semibold text-cyan-200" to="/customer/my-tickets">View all</Link>
            </div>
            {recentTickets.length ? (
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead><tr><th>Ticket</th><th>Subject</th><th>Priority</th><th>Status</th></tr></thead>
                  <tbody>
                    {recentTickets.map((ticket) => (
                      <tr key={getTicketId(ticket)} className="cursor-pointer" onClick={() => navigate(`/customer/tickets/${getTicketId(ticket)}`)}>
                        <td className="font-mono text-xs text-cyan-200">{getTicketId(ticket)}</td>
                        <td className="text-sm text-slate-300">{getSubject(ticket)}</td>
                        <td><PriorityBadge priority={ticket.priority} /></td>
                        <td><StatusBadge status={ticket.status} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-8 text-center">
                <p className="text-sm font-semibold text-white">No recent tickets</p>
                <p className="mt-1 text-sm text-slate-500">Raise your first support request when you need help.</p>
                <GlowButton onClick={() => navigate('/customer/raise-ticket')} className="mt-5">Raise Ticket</GlowButton>
              </div>
            )}
          </GlassCard>

          <GlassCard className="p-5">
            <h2 className="font-bold text-white">Recommended Help Articles</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
              {articles.map((article) => {
                const Icon = article.icon;
                return (
                  <div key={article.title} className="rounded-xl border border-white/10 bg-white/[0.035] p-4">
                    <Icon size={18} className="text-cyan-200" />
                    <p className="mt-3 text-sm font-bold text-white">{article.title}</p>
                    <p className="mt-1 text-xs leading-5 text-slate-500">{article.desc}</p>
                  </div>
                );
              })}
            </div>
          </GlassCard>

          <GlassCard className="p-5">
            <h2 className="font-bold text-white">Ticket Resolution Flow</h2>
            <div className="mt-5 space-y-4">
              {['Ticket Created', 'AI Triage', 'Assigned to Agent', 'Resolution'].map((step, index) => (
                <div key={step} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${index < 2 ? 'bg-emerald-500 text-white' : 'bg-white/10 text-slate-300'}`}>{index + 1}</div>
                    {index < 3 && <div className="mt-2 h-8 w-px bg-white/10" />}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">{step}</p>
                    <p className="text-xs text-slate-500">{index < 2 ? 'Automated' : 'Support workflow'}</p>
                  </div>
                </div>
              ))}
            </div>
          </GlassCard>
        </section>
      </div>
    </Layout>
  );
}
