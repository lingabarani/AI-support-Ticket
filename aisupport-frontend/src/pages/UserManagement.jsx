import { useState } from 'react';
import Layout from '../components/Layout';
import { Plus, Edit, Trash2, Search } from 'lucide-react';
import { users } from '../data/dummyData';

export default function UserManagement() {
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const filtered = users.filter(u => u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase()));

  return (
    <Layout title="User Management">
      <div className="space-y-5 slide-in">
        <div className="flex items-center justify-between">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search users..." className="pl-9 pr-3 py-2 text-sm rounded-lg w-64" />
          </div>
          <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold">
            <Plus size={15} /> Add User
          </button>
        </div>

        <div className="card-glass rounded-xl overflow-hidden">
          <table>
            <thead>
              <tr><th>Name</th><th>Email</th><th>Role</th><th>Status</th><th>Created</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {filtered.map(u => (
                <tr key={u.id}>
                  <td>
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-purple-400 to-blue-400 flex items-center justify-center text-xs text-white">{u.name[0]}</div>
                      <span className="text-slate-300 text-sm font-medium">{u.name}</span>
                    </div>
                  </td>
                  <td className="text-slate-400 text-sm">{u.email}</td>
                  <td>
                    <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(139,92,246,0.15)', color: '#a78bfa', border: '1px solid rgba(139,92,246,0.2)' }}>{u.role}</span>
                  </td>
                  <td>
                    <span className={`badge-${u.status === 'Active' ? 'resolved' : 'medium'}`}>{u.status}</span>
                  </td>
                  <td className="text-slate-500 text-xs">{u.created}</td>
                  <td>
                    <div className="flex items-center gap-2">
                      <button className="p-1.5 rounded card-glass text-blue-400 hover:text-blue-300 transition-colors"><Edit size={13} /></button>
                      <button className="p-1.5 rounded card-glass text-red-400 hover:text-red-300 transition-colors"><Trash2 size={13} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Add User Modal */}
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.6)' }}>
            <div className="card-glass rounded-2xl p-6 w-full max-w-md mx-4">
              <h2 className="font-bold text-white mb-4">Add New User</h2>
              <div className="space-y-3">
                <input placeholder="Full Name" className="w-full px-3 py-2.5 text-sm rounded-lg" />
                <input placeholder="Email Address" type="email" className="w-full px-3 py-2.5 text-sm rounded-lg" />
                <select className="w-full px-3 py-2.5 text-sm rounded-lg">
                  <option>Select Role</option>
                  <option>Support Agent</option>
                  <option>Team Manager</option>
                  <option>Business Executive</option>
                  <option>System Admin</option>
                </select>
                <input placeholder="Temporary Password" type="password" className="w-full px-3 py-2.5 text-sm rounded-lg" />
              </div>
              <div className="flex gap-3 mt-5">
                <button onClick={() => setShowModal(false)} className="flex-1 py-2.5 rounded-xl text-sm card-glass text-slate-400">Cancel</button>
                <button onClick={() => setShowModal(false)} className="flex-1 py-2.5 rounded-xl text-sm btn-primary font-semibold">Create User</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
