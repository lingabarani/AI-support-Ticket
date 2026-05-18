import { useState } from 'react';
import Layout from '../components/Layout';
import { Search, BookOpen, ChevronRight } from 'lucide-react';

const articles = [
  { id:1, title:'How to reset customer password', category:'Login Issues', views:1240, updated:'28 May 2024' },
  { id:2, title:'Troubleshooting payment failures', category:'Payment Issues', views:987, updated:'27 May 2024' },
  { id:3, title:'Processing refund requests', category:'Refunds', views:754, updated:'26 May 2024' },
  { id:4, title:'App crash reporting guide', category:'Product Defect', views:632, updated:'25 May 2024' },
  { id:5, title:'Escalation procedures', category:'Process', views:521, updated:'24 May 2024' },
  { id:6, title:'SLA response time guidelines', category:'Process', views:480, updated:'23 May 2024' },
];

export default function KnowledgeBase() {
  const [search, setSearch] = useState('');
  const filtered = articles.filter(a => a.title.toLowerCase().includes(search.toLowerCase()) || a.category.toLowerCase().includes(search.toLowerCase()));

  return (
    <Layout title="Knowledge Base">
      <div className="slide-in space-y-5 max-w-4xl">
        <div className="relative">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search knowledge base articles..." className="pl-12 pr-4 py-3 text-sm w-full rounded-xl" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map(a => (
            <div key={a.id} className="card-glass rounded-xl p-5 hover:border-purple-500/30 transition-all cursor-pointer group">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg bg-purple-600/20 flex items-center justify-center">
                  <BookOpen size={15} className="text-purple-400" />
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-white group-hover:text-purple-300 transition-colors">{a.title}</h3>
                  <div className="flex items-center gap-3 mt-2">
                    <span className="text-xs text-purple-400 px-2 py-0.5 rounded-full" style={{ background: 'rgba(139,92,246,0.15)' }}>{a.category}</span>
                    <span className="text-xs text-slate-500">{a.views} views</span>
                    <span className="text-xs text-slate-500">Updated {a.updated}</span>
                  </div>
                </div>
                <ChevronRight size={15} className="text-slate-600 group-hover:text-purple-400 transition-colors" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </Layout>
  );
}
