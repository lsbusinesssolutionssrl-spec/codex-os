import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Puzzle, Webhook, Key, Building2, Wifi, Activity, 
  ArrowRight, Shield, Zap, Database, Cloud, 
  CheckCircle2, AlertCircle, Clock, TrendingUp
} from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { hasRole } from '@/lib/roleUtils';

export default function PlatformCore() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    integrations: { total: 0, active: 0 },
    extensions: { total: 0, installed: 0 },
    webhooks: { total: 0, active: 0 },
    apiKeys: { total: 0, active: 0 },
    brands: { total: 0 },
    iotDevices: { total: 0, online: 0 },
  });
  const [loading, setLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    hasRole(['admin']).then(auth => {
      if (!auth) {
        navigate('/');
        return;
      }
      setIsAuthorized(true);
    });
  }, []);

  useEffect(() => {
    if (!isAuthorized) return;
    
    const load = async () => {
      const [integrations, extensions, webhooks, apiKeys, brands, iotDevices] = await Promise.all([
        base44.entities.PlatformIntegration.list(),
        base44.entities.Extension.list(),
        base44.entities.WebhookSubscription.list(),
        base44.entities.APIKey.list(),
        base44.entities.Brand.list(),
        base44.entities.IoTDevice.list(),
      ]);

      setStats({
        integrations: { 
          total: integrations.length, 
          active: integrations.filter(i => i.status === 'Active').length 
        },
        extensions: { 
          total: extensions.length, 
          installed: extensions.filter(e => e.status === 'Installed').length 
        },
        webhooks: { 
          total: webhooks.length, 
          active: webhooks.filter(w => w.status === 'Active').length 
        },
        apiKeys: { 
          total: apiKeys.length, 
          active: apiKeys.filter(k => k.status === 'Active').length 
        },
        brands: { total: brands.length },
        iotDevices: { 
          total: iotDevices.length, 
          online: iotDevices.filter(d => d.status === 'Online').length 
        },
      });

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
          <h1 className="text-2xl font-bold text-gray-900">Platform Core</h1>
          <p className="text-sm text-gray-500 mt-0.5">Gestione ecosistema e servizi platform</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => navigate('/integrations')} className="flex items-center gap-2 px-3 py-1.5 text-sm border border-gray-200 rounded-lg hover:bg-gray-50">
            <Puzzle className="w-3.5 h-3.5" /> Integration Hub
          </button>
          <button onClick={() => navigate('/developer')} className="flex items-center gap-2 px-3 py-1.5 text-sm border border-gray-200 rounded-lg hover:bg-gray-50">
            <Key className="w-3.5 h-3.5" /> Developer
          </button>
          <button onClick={() => navigate('/system-status')} className="flex items-center gap-2 px-3 py-1.5 text-sm border border-gray-200 rounded-lg hover:bg-gray-50">
            <Activity className="w-3.5 h-3.5" /> System Status
          </button>
        </div>
      </div>

      {/* Platform Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <PlatformCard
          icon={Puzzle}
          title="Integration Hub"
          description="Connessioni a sistemi esterni"
          stats={`${stats.integrations.active}/${stats.integrations.total} attive`}
          color="#1147FF"
          onClick={() => navigate('/integrations')}
        />
        <PlatformCard
          icon={Cloud}
          title="Extensions"
          description="Moduli installabili"
          stats={`${stats.extensions.installed}/${stats.extensions.total} installate`}
          color="#10B981"
          onClick={() => navigate('/developer')}
        />
        <PlatformCard
          icon={Webhook}
          title="Webhooks"
          description="Notifiche event-driven"
          stats={`${stats.webhooks.active}/${stats.webhooks.total} attivi`}
          color="#F59E0B"
          onClick={() => navigate('/notification-settings')}
        />
        <PlatformCard
          icon={Key}
          title="API Keys"
          description="Autenticazione API"
          stats={`${stats.apiKeys.active}/${stats.apiKeys.total} attive`}
          color="#8B5CF6"
          onClick={() => navigate('/developer')}
        />
        <PlatformCard
          icon={Building2}
          title="Brands"
          description="Multi-brand & white-label"
          stats={`${stats.brands.total} brand configurati`}
          color="#EC4899"
          onClick={() => navigate('/company-settings')}
        />
        <PlatformCard
          icon={Wifi}
          title="IoT Devices"
          description="Dispositivi smart property"
          stats={`${stats.iotDevices.online}/${stats.iotDevices.total} online`}
          color="#06B6D4"
          onClick={() => navigate('/properties')}
        />
      </div>

      {/* Platform Capabilities */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* API-First Architecture */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-2 mb-4">
            <Shield className="w-5 h-5 text-blue-600" />
            <h2 className="font-semibold text-gray-900">API-First Architecture</h2>
          </div>
          <div className="space-y-3">
            <CapabilityItem 
              label="RESTful Endpoints" 
              status="ready"
              description="Tutte le entità core sono API-ready"
            />
            <CapabilityItem 
              label="Authentication" 
              status="ready"
              description="API key authentication con rate limiting"
            />
            <CapabilityItem 
              label="Tenant Isolation" 
              status="ready"
              description="Scoped by company_id"
            />
            <CapabilityItem 
              label="Audit Logging" 
              status="ready"
              description="Tracciamento completo chiamate API"
            />
          </div>
        </div>

        {/* Event Bus */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-2 mb-4">
            <Zap className="w-5 h-5 text-amber-600" />
            <h2 className="font-semibold text-gray-900">Event Bus</h2>
          </div>
          <div className="space-y-3">
            <CapabilityItem 
              label="30+ Event Types" 
              status="ready"
              description="estimate, project, ticket, guardian, IoT"
            />
            <CapabilityItem 
              label="Async Processing" 
              status="ready"
              description="Elaborazione asincrona eventi"
            />
            <CapabilityItem 
              label="Cross-Module" 
              status="ready"
              description="Comunicazione moduli disaccoppiata"
            />
            <CapabilityItem 
              label="Retry Logic" 
              status="ready"
              description="Retry con exponential backoff"
            />
          </div>
        </div>

        {/* Marketplace Ready */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-2 mb-4">
            <Cloud className="w-5 h-5 text-purple-600" />
            <h2 className="font-semibold text-gray-900">Marketplace Architecture</h2>
          </div>
          <div className="space-y-3">
            <CapabilityItem 
              label="10 Extension Categories" 
              status="ready"
              description="AI, Accounting, IoT, Analytics, etc."
            />
            <CapabilityItem 
              label="Lifecycle Management" 
              status="ready"
              description="Install, update, uninstall"
            />
            <CapabilityItem 
              label="Permission System" 
              status="ready"
              description="Entity e function permissions"
            />
            <CapabilityItem 
              label="13 Integrations" 
              status="ready"
              description="Google, Microsoft, Stripe, Zapier"
            />
          </div>
        </div>

        {/* Enterprise Security */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-2 mb-4">
            <Shield className="w-5 h-5 text-green-600" />
            <h2 className="font-semibold text-gray-900">Enterprise Security</h2>
          </div>
          <div className="space-y-3">
            <CapabilityItem 
              label="RBAC" 
              status="ready"
              description="Role-based access control"
            />
            <CapabilityItem 
              label="API Key Hashing" 
              status="ready"
              description="Sicurezza chiavi API"
            />
            <CapabilityItem 
              label="IP Whitelisting" 
              status="ready"
              description="Restrizione IP per API keys"
            />
            <CapabilityItem 
              label="SSO/MFA Ready" 
              status="placeholder"
              description="Placeholder per SAML, OIDC, MFA"
            />
          </div>
        </div>
      </div>

      {/* Platform Events */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-blue-600" />
            <h2 className="font-semibold text-gray-900">Platform Events</h2>
          </div>
          <span className="text-xs text-gray-400">30+ event types</span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
          <EventBadge event="estimate.accepted" />
          <EventBadge event="estimate.rejected" />
          <EventBadge event="project.created" />
          <EventBadge event="project.delivered" />
          <EventBadge event="ticket.created" />
          <EventBadge event="ticket.closed" />
          <EventBadge event="guardian.renewed" />
          <EventBadge event="workflow.executed" />
          <EventBadge event="payment.received" />
          <EventBadge event="iot.device_online" />
          <EventBadge event="integration.synced" />
          <EventBadge event="extension.installed" />
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <QuickActionCard
          icon={Puzzle}
          title="Gestisci Integrazioni"
          description="Configura connessioni a sistemi esterni"
          action="Vai a Integration Hub"
          onClick={() => navigate('/integrations')}
        />
        <QuickActionCard
          icon={Key}
          title="API & Webhooks"
          description="Gestisci chiavi API e sottoscrizioni webhook"
          action="Vai a Developer Settings"
          onClick={() => navigate('/developer')}
        />
        <QuickActionCard
          icon={Activity}
          title="Monitora Sistema"
          description="Verifica stato integrazioni e performance"
          action="Vai a System Status"
          onClick={() => navigate('/system-status')}
        />
      </div>
    </div>
  );
}

function PlatformCard({ icon: Icon, title, description, stats, color, onClick }) {
  return (
    <div 
      onClick={onClick}
      className="bg-white rounded-xl border border-gray-200 p-5 hover:border-gray-300 hover:shadow-md transition-all cursor-pointer"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: color + '15' }}>
          <Icon className="w-5 h-5" style={{ color }} />
        </div>
        <ArrowRight className="w-4 h-4 text-gray-300" />
      </div>
      <h3 className="font-semibold text-gray-900 mb-1">{title}</h3>
      <p className="text-xs text-gray-500 mb-3">{description}</p>
      <div className="flex items-center gap-2">
        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
        <span className="text-xs font-medium text-gray-700">{stats}</span>
      </div>
    </div>
  );
}

function CapabilityItem({ label, status, description }) {
  const statusColors = {
    ready: 'text-emerald-600 bg-emerald-50 border-emerald-200',
    placeholder: 'text-amber-600 bg-amber-50 border-amber-200',
  };
  
  return (
    <div className="flex items-start gap-3">
      <div className={`text-[10px] px-1.5 py-0.5 rounded border font-medium ${statusColors[status]}`}>
        {status === 'ready' ? '✓' : '◌'}
      </div>
      <div className="flex-1">
        <p className="text-sm font-medium text-gray-900">{label}</p>
        <p className="text-xs text-gray-500">{description}</p>
      </div>
    </div>
  );
}

function EventBadge({ event }) {
  return (
    <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-md text-[11px] text-slate-600">
      <Zap className="w-2.5 h-2.5 text-blue-400" />
      <span className="truncate">{event}</span>
    </div>
  );
}

function QuickActionCard({ icon: Icon, title, description, action, onClick }) {
  return (
    <div onClick={onClick} className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-100 p-5 hover:shadow-md transition-all cursor-pointer">
      <div className="flex items-center gap-2 mb-3">
        <Icon className="w-5 h-5 text-blue-600" />
        <h3 className="font-semibold text-gray-900">{title}</h3>
      </div>
      <p className="text-sm text-gray-600 mb-4">{description}</p>
      <button className="flex items-center gap-2 text-xs font-medium text-blue-700 hover:text-blue-900">
        {action} <ArrowRight className="w-3 h-3" />
      </button>
    </div>
  );
}