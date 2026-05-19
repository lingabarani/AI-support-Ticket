import Layout from '../components/Layout';
import { Bot, Cloud, Key, Database, Save } from 'lucide-react';

export default function AdminSettings() {
  return (
    <Layout title="Platform Settings & API Configuration">
      <div className="space-y-6 slide-in max-w-3xl">
        {/* Bedrock Config */}
        <div className="card-glass rounded-xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <Bot size={16} className="text-purple-400" />
            <h3 className="font-semibold text-white">Amazon Bedrock Configuration</h3>
          </div>
          <div className="space-y-3">
            <div>
              <label className="text-xs text-slate-400 mb-1.5 block">AWS Region</label>
              <select className="w-full px-3 py-2.5 text-sm rounded-lg">
                <option>us-east-1</option><option>us-west-2</option><option>ap-southeast-1</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1.5 block">Model ID</label>
              <input defaultValue="anthropic.claude-3-sonnet-20240229-v1:0" className="w-full px-3 py-2.5 text-sm rounded-lg" />
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1.5 block">AWS Access Key ID</label>
              <input type="password" placeholder="••••••••••••••••" className="w-full px-3 py-2.5 text-sm rounded-lg" />
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1.5 block">AWS Secret Access Key</label>
              <input type="password" placeholder="••••••••••••••••" className="w-full px-3 py-2.5 text-sm rounded-lg" />
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-400" />
              <span className="text-xs text-green-400">Connection verified</span>
            </div>
          </div>
        </div>

        {/* QuickSight Config */}
        <div className="card-glass rounded-xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <Cloud size={16} className="text-blue-400" />
            <h3 className="font-semibold text-white">Amazon QuickSight Embedding</h3>
          </div>
          <div className="space-y-3">
            <div>
              <label className="text-xs text-slate-400 mb-1.5 block">QuickSight Account ID</label>
              <input placeholder="123456789012" className="w-full px-3 py-2.5 text-sm rounded-lg" />
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1.5 block">Dashboard URL</label>
              <input placeholder="https://us-east-1.quicksight.aws.amazon.com/sn/embed/..." className="w-full px-3 py-2.5 text-sm rounded-lg" />
            </div>
          </div>
        </div>

        {/* API Endpoints */}
        <div className="card-glass rounded-xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <Key size={16} className="text-amber-400" />
            <h3 className="font-semibold text-white">AI API Endpoints</h3>
          </div>
          <div className="space-y-2">
            {[
              { endpoint: '/api/ai/analyze-ticket', status: 'Active' },
              { endpoint: '/api/ai/summarize', status: 'Active' },
              { endpoint: '/api/ai/sentiment', status: 'Active' },
              { endpoint: '/api/ai/recommendation', status: 'Active' },
              { endpoint: '/api/ai/churn-predict', status: 'Inactive' },
            ].map(api => (
              <div key={api.endpoint} className="flex items-center justify-between p-3 rounded-lg" style={{ background: 'rgba(255,255,255,0.03)' }}>
                <code className="text-xs text-purple-300">{api.endpoint}</code>
                <span className={`badge-${api.status === 'Active' ? 'resolved' : 'medium'}`}>{api.status}</span>
              </div>
            ))}
          </div>
        </div>

        {/* MongoDB */}
        <div className="card-glass rounded-xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <Database size={16} className="text-green-400" />
            <h3 className="font-semibold text-white">MongoDB Configuration</h3>
          </div>
          <div className="space-y-3">
            <div>
              <label className="text-xs text-slate-400 mb-1.5 block">Connection URI</label>
              <input type="password" placeholder="mongodb+srv://..." className="w-full px-3 py-2.5 text-sm rounded-lg" />
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1.5 block">Database Name</label>
              <input defaultValue="aisupport_db" className="w-full px-3 py-2.5 text-sm rounded-lg" />
            </div>
          </div>
        </div>

        <button className="btn-primary flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm">
          <Save size={15} /> Save All Settings
        </button>
      </div>
    </Layout>
  );
}
