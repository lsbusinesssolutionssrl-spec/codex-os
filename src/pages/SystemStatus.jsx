import { useState, useEffect } from 'react';
import { Activity, Zap, Globe, Shield, Database, TrendingUp, TrendingDown, AlertTriangle, CheckCircle2, Clock, Server, Wifi, AlertCircle } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { hasRole } from '@/lib/roleUtils';

export default function SystemStatus() {
  const [stats, setStats] = useState({
    apiCalls: 0,
    webhookDeliveries: 0,
    activeIntegrations: 0,
    installedExtensions: 0,
    workflowExecutions: 0,
    aiQueries: 0,
  });
  const [health, setHealth] = useState({
    api: 'operational',
    webhooks: 'operational',
    integrations: 'operational',
    workflows: 'operational',
    ai: 'operational',
    database: 'operational',
  });
  const [recentEvents, setRecentEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    hasRole(['admin', 'company_admin']).then(auth => {
      if (!auth) return;
      setIsAuthorized(true);
    });
  }, []);

  useEffect(() => {
    if (!isAuthorized) return;
    
    const load = async () => {
      const [integrations, extensions, webhooks, events, workflows] = await Promise.all([
        base44.entities.PlatformIntegration.list(),
        base44.entities.Extension.list(),
        base44.entities.WebhookSubscription.list(),
        base44.entities.PlatformEvent.filter({ processed: false }),
        base44.entities.WorkflowExecution.list(),
      ]);

      setStats({
        apiCalls: 1247, // Placeholder - would come from usage logs
        webhookDeliveries: webhooks.reduce((sum, w) => sum + (w.success_count || 0), 0),
        activeIntegrations: integrations.filter(i => i.status === 'Active').length,
        installedExtensions: extensions.filter(e => e.status === 'Installed').length,
        workflowExecutions: workflows.length,
        aiQueries: 523, // Placeholder
      });

      // Calculate health based on error rates
      const errorRate = webhooks.reduce((sum, w) => sum + (w.failure_count || 0), 0);
      setHealth(prev => ({
        ...prev,
        webhooks: errorRate > 10 ? 'degraded' : 'operational',
      }));

      setRecentEvents(events.slice(0, 10));
      setLoading(false);
    };
    load();
  }, [isAuthorized]);

  if (!isAuthorized) return null;
  if (loading) return <div className="p-6 text-center text-gray-400">Caricamento...</div>;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">System Status</h1>
          <p className="text-sm text-gray-500 mt-0.5">Panoramica operativa del platform</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 border border-green-200 rounded-lg">
          <CheckCircle2 className="w-4 h-4 text-green-600" />
          <span className="text-sm font-medium text-green-700">All Systems Operational</span>
        </div>
      </div>

      {/* Health Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <HealthCard label="API" status={health.api} icon={Globe} />
        <HealthCard label="Webhooks" status={health.webhooks} icon={Zap} />
        <HealthCard label="Integrations" status={health.integrations} icon={Server} />
        <HealthCard label="Workflows" status={health.workflows} icon={Activity} />
        <HealthCard label="AI Services" status={health.ai} icon={Database} />
        <HealthCard label="Database" status={health.database} icon={Shield} />
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <MetricCard label="API Calls (24h)" value={stats.apiCalls.toLocaleString()} trend="+12%" positive icon={Globe} />
        <MetricCard label="Webhook Deliveries" value={stats.webhookDeliveries.toLocaleString()} trend="+5%" positive icon={Zap} />
        <MetricCard label="Active Integrations" value={stats.activeIntegrations} trend="+2" positive icon={Server} />
        <MetricCard label="Installed Extensions" value={stats.installedExtensions} trend="0" positive icon={Database} />
        <MetricCard label="Workflow Executions" value={stats.workflowExecutions.toLocaleString()} trend="+18%" positive icon={Activity} />
        <MetricCard label="AI Queries (24h)" value={stats.aiQueries.toLocaleString()} trend="+25%" positive icon={Shield} />
      </div>

      {/* Recent Events */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-900">Eventi Recenti</h2>
          <span className="text-xs text-gray-400">{recentEvents.length} non processati</span>
        </div>
        
        {recentEvents.length === 0 ? (
          <div className="py-12 text-center">
            <CheckCircle2 className="w-12 h-12 text-green-400 mx-auto mb-3" />
            <p className="text-sm text-gray-500">Nessun evento critico</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {recentEvents.map(event => {
              const Icon = event.severity === 'Error' || event.severity === 'Critical' ? AlertTriangle : Activity;
              const color = event.severity === 'Error' || event.severity === 'Critical' ? 'text-red-600' : 'text-blue-600';
              const bgColor = event.severity === 'Error' || event.severity === 'Critical' ? 'bg-red-50' : 'bg-blue-50';
              
              return (
                <div key={event.id} className="p-4 flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-lg ${bgColor} flex items-center justify-center`}>
                    <Icon className={`w-5 h-5 ${color}`} />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm font-semibold text-gray-900">{event.event_type}</h3>
                    <p className="text-xs text-gray-500 mt-0.5">{event.source} · {new Date(event.created_date).toLocaleString('it-IT')}</p>
                  </div>
                  <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                    event.severity === 'Critical' ? 'bg-red-100 text-red-700' :
                    event.severity === 'Error' ? 'bg-orange-100 text-orange-700' :
                    event.severity === 'Warning' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-blue-100 text-blue-700'
                  }`}>
                    {event.severity}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Platform Info */}
      <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-xl p-6 text-white">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-lg font-bold mb-2">Codex Platform Ecosystem</h2>
            <p className="text-blue-100 text-sm mb-4">Enterprise-grade modular platform</p>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-blue-200 text-xs">API Version</div>
                <div className="font-semibold">v1.0.0</div>
              </div>
              <div>
                <div className="text-blue-200 text-xs">Platform Version</div>
                <div className="font-semibold">5.0.0</div>
              </div>
              <div>
                <div className="text-blue-200 text-xs">Uptime</div>
                <div className="font-semibold">99.9%</div>
              </div>
              <div>
                <div className="text-blue-200 text-xs">Last Update</div>
                <div className="font-semibold">2026-05-27</div>
              </div>
            </div>
          </div>
          <Server className="w-24 h-24 text-blue-400 opacity-20" />
        </div>
      </div>
    </div>
  );
}

function HealthCard({ label, status, icon: Icon }) {
  const statusConfig = {
    operational: { color: '#10B981', bg: 'bg-green-50', text: 'Operational' },
    degraded: { color: '#F59E0B', bg: 'bg-amber-50', text: 'Degraded' },
    error: { color: '#EF4444', bg: 'bg-red-50', text: 'Error' },
  }[status] || { color: '#10B981', bg: 'bg-green-50', text: 'Operational' };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <div className="flex items-center gap-2 mb-2">
        <Icon className="w-4 h-4" style={{ color: statusConfig.color }} />
        <span className="text-xs text-gray-500 font-medium">{label}</span>
      </div>
      <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-lg ${statusConfig.bg}`}>
        <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: statusConfig.color }} />
        <span className="text-xs font-semibold" style={{ color: statusConfig.color }}>{statusConfig.text}</span>
      </div>
    </div>
  );
}

function MetricCard({ label, value, trend, positive, icon: Icon }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-2">
        <Icon className="w-4 h-4 text-gray-400" />
        <div className={`flex items-center gap-1 text-xs font-medium ${positive ? 'text-green-600' : 'text-red-600'}`}>
          {positive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
          {trend}
        </div>
      </div>
      <p className="text-xl font-bold text-gray-900">{value}</p>
      <p className="text-xs text-gray-500 mt-0.5">{label}</p>
    </div>
  );
}