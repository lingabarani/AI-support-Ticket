import { useState } from 'react';
import Layout from '../components/Layout';
import { Search, Filter, ChevronLeft, ChevronRight } from 'lucide-react';
import { tickets } from '../data/dummyData';
import { useNavigate } from 'react-router-dom';

export default function MyTickets() {
  const [search, setSearch] = useState('');
  const [filterPriority, setFilterPriority] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');
  const [page, setPage] = useState(1);
  const navigate = useNavigate();
  const perPage = 7;

  const filtered = tickets.filter(t =>
    (filterPriority === 'All' || t.priority === filterPriority) &&
    (filterStatus === 'All' || t.status === filterStatus) &&
    (t.subject.toLowerCase().includes(search.toLowerCase()) || t.customer.toLowerCase().includes(search.toLowerCase()) || t.id.toLowerCase().includes(search.toLowerCase()))
  );

  const totalPages = Math.ceil(filtered.length / perPage);
  const paginated = filtered.slice((page - 1) * perPage, page * perPage);

  return (
    <Layout title="My Tickets">
      <div className="space-y-5 slide-in">
        {/* Filters */}
        <div className="card-glass rounded-xl p-4 flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-48">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search tickets..."
              className="pl-9 pr-3 py-2 text-sm w-full rounded-lg"
            />
          </div>
          <select value={filterPriority} onChange={e => { setFilterPriority(e.target.value); setPage(1); }} className="px-3 py-2 text-sm rounded-lg">
            <option value="All">All Priorities</option>
            <option>High</option><option>Medium</option><option>Low</option>
          </select>
          <select value={filterStatus} onChange={e => { setFilterStatus(e.target.value); setPage(1); }} className="px-3 py-2 text-sm rounded-lg">
            <option value="All">All Status</option>
            <option>Open</option><option>In Progress</option><option>Resolved</option><option>On Hold</option>
          </select>
          <div className="ml-auto text-xs text-slate-400">{filtered.length} tickets found</div>
        </div>

        {/* Table */}
        <div className="card-glass rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table>
              <thead>
                <tr>
                  <th>Ticket ID</th><th>Subject</th><th>Customer</th>
                  <th>Priority</th><th>Status</th><th>Category</th><th>Updated At</th>
                </tr>
              </thead>
              <tbody>
                {paginated.map(t => (
                  <tr
                    key={t.id}
                    className="cursor-pointer"
                    onClick={() => navigate(`/agent/tickets/${t.id}`)}
                  >
                    <td className="text-purple-400 font-mono text-xs">{t.id}</td>
                    <td className="text-slate-300 font-medium">{t.subject}</td>
                    <td className="text-slate-400">{t.customer}</td>
                    <td><span className={`badge-${t.priority.toLowerCase()}`}>{t.priority}</span></td>
                    <td><span className={`badge-${t.status === 'In Progress' ? 'progress' : t.status === 'On Hold' ? 'medium' : t.status.toLowerCase()}`}>{t.status}</span></td>
                    <td className="text-slate-500 text-xs">{t.category}</td>
                    <td className="text-slate-500 text-xs">{t.updated}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between px-5 py-4 border-t border-purple-900/20">
            <span className="text-xs text-slate-500">Showing {(page-1)*perPage+1}–{Math.min(page*perPage, filtered.length)} of {filtered.length}</span>
            <div className="flex items-center gap-2">
              <button onClick={() => setPage(p => Math.max(1, p-1))} disabled={page===1} className="w-7 h-7 rounded card-glass flex items-center justify-center text-slate-400 disabled:opacity-30">
                <ChevronLeft size={13} />
              </button>
              {Array.from({length: totalPages}, (_, i) => i+1).slice(Math.max(0,page-2), Math.min(totalPages,page+1)).map(p => (
                <button key={p} onClick={() => setPage(p)} className={`w-7 h-7 rounded text-xs font-medium ${p===page ? 'btn-primary' : 'card-glass text-slate-400'}`}>{p}</button>
              ))}
              <button onClick={() => setPage(p => Math.min(totalPages, p+1))} disabled={page===totalPages} className="w-7 h-7 rounded card-glass flex items-center justify-center text-slate-400 disabled:opacity-30">
                <ChevronRight size={13} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
