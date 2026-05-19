import { TrendingUp, TrendingDown } from 'lucide-react';

export default function KpiCard({ title, value, change, changeType = 'positive', icon: Icon, color = 'purple', subtitle }) {
  const colors = {
    purple: 'from-purple-500/20 to-purple-600/10 border-purple-500/20',
    blue: 'from-blue-500/20 to-blue-600/10 border-blue-500/20',
    green: 'from-green-500/20 to-green-600/10 border-green-500/20',
    red: 'from-red-500/20 to-red-600/10 border-red-500/20',
    amber: 'from-amber-500/20 to-amber-600/10 border-amber-500/20',
  };
  const iconColors = {
    purple: 'text-purple-400', blue: 'text-blue-400', green: 'text-green-400',
    red: 'text-red-400', amber: 'text-amber-400',
  };

  return (
    <div className={`rounded-xl p-5 bg-gradient-to-br ${colors[color]} border slide-in`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">{title}</p>
          <p className="text-2xl font-bold text-white mt-1">{value}</p>
          {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
        </div>
        {Icon && (
          <div className={`w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center ${iconColors[color]}`}>
            <Icon size={20} />
          </div>
        )}
      </div>
      {change && (
        <div className={`flex items-center gap-1 mt-3 text-xs font-medium ${changeType === 'positive' ? 'text-green-400' : 'text-red-400'}`}>
          {changeType === 'positive' ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
          <span>{change} vs yesterday</span>
        </div>
      )}
    </div>
  );
}
