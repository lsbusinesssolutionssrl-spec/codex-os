import { useState, useEffect } from 'react';
import { TrendingUp, AlertTriangle, TrendingDown, Minus, Brain, ChevronRight } from 'lucide-react';

export default function SignalBadge({ signal }) {
  const severityConfig = {
    critical: { color: '#EF4444', bg: 'bg-red-50', border: 'border-red-200', icon: AlertTriangle },
    high: { color: '#F97316', bg: 'bg-orange-50', border: 'border-orange-200', icon: TrendingDown },
    medium: { color: '#F59E0B', bg: 'bg-yellow-50', border: 'border-yellow-200', icon: Minus },
    low: { color: '#10B981', bg: 'bg-green-50', border: 'border-green-200', icon: TrendingUp },
  };

  const config = severityConfig[signal.severity] || severityConfig.medium;
  const Icon = config.icon;

  return (
    <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${config.bg} ${config.border}`}>
      <Icon className="w-4 h-4" style={{ color: config.color }} />
      <div className="flex-1">
        <p className="text-xs font-semibold" style={{ color: config.color }}>{signal.type}</p>
        <p className="text-[10px] text-gray-600">{signal.title}</p>
      </div>
      <ChevronRight className="w-4 h-4 text-gray-400" />
    </div>
  );
}