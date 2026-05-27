import { useState, useEffect } from 'react';
import { Shield, Building2, Users, CreditCard, Zap, Brain, Globe, Database, Key, Activity, Webhook, Cpu, Lock, FileText, Palette } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';

export default function PlatformSettings() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [platformStats, setPlatformStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
      
      // Load platform stats
      try {
        const [companies, subscriptions, users] = await Promise.all([
          base44.entities.Company.list(),
          base44.entities.CompanySubscription.list(),
          base44.entities.User.list(),
        ]);
        
        const mrr = subscriptions.reduce((sum, s) => sum + (s.mrr || 0), 0);
        setPlatformStats({
          totalTenants: companies.length,
          totalUsers: users.length,
          mrr,
          activeSubscriptions: subscriptions.filter(s => s.status === 'active').length,
        });
      } catch (error) {
        console.error('Error loading platform stats:', error);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) return <div className="p-6 text-center text-gray-400">Caricamento...</div>;

  const isSuperAdmin = user?.role === 'admin';

  const platformModules = [
    { 
      title: 'Gestione Tenant', 
      description: 'Crea e gestisci le company tenant',
      icon: Building2, 
      path: '/super-admin',
      color: '#7C3AED'
    },
    { 
      title: 'Piani SaaS', 
      description: 'Configura piani e funzionalità',
      icon: CreditCard, 
      path: '/subscription-plans',
      color: '#F59E0B'
    },
    { 
      title: 'Feature Flags', 
      description: 'Controlla accesso funzionalità per piano',
      icon: Zap, 
      path: '/developer',
      color: '#1147FF'
    },
    { 
      title: 'AI Providers', 
      description: 'Configura modelli e provider AI',
      icon: Brain, 
      path: '/ai-foundation',
      color: '#10B981'
    },
    { 
      title: 'Integrazioni', 
      description: 'Integrazioni platform-wide',
      icon: Globe, 
      path: '/integrations',
      color: '#06B6D4'
    },
    { 
      title: 'API Keys', 
      description: 'Gestisci accesso API',
      icon: Key, 
      path: '/api-keys',
      color: '#8B5CF6'
    },
    { 
      title: 'Webhooks', 
      description: 'Configura endpoint webhook',
      icon: Webhook, 
      path: '/developer',
      color: '#EC4899'
    },
    { 
      title: 'System Health', 
      description: 'Monitora performance platform',
      icon: Cpu, 
      path: '/system-status',
      color: '#EF4444'
    },
    { 
      title: 'Audit Logs', 
      description: 'Log attività platform',
      icon: FileText, 
      path: '/platform-health',
      color: '#6B7280'
    },
    { 
      title: 'White Label', 
      description: 'Coda approvazione brand',
      icon: Palette, 
      path: '/brand-approval',
      color: '#F58020'
    },
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#7C3AED' }}>
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Impostazioni Platform</h1>
              <p className="text-sm text-gray-500">Configurazione enterprise-wide</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="px-3 py-1.5 text-xs font-medium text-white rounded-lg" style={{ backgroundColor: '#7C3AED' }}>
            {user?.role === 'admin' ? 'Super Admin' : 'Developer'}
          </div>
        </div>
      </div>

      {/* Platform Stats */}
      {platformStats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard label="Tenant Totali" value={platformStats.totalTenants} icon={Building2} color="#7C3AED" />
          <StatCard label="Utenti Totali" value={platformStats.totalUsers} icon={Users} color="#1147FF" />
          <StatCard label="MRR" value={`€${platformStats.mrr.toLocaleString('it-IT')}`} icon={CreditCard} color="#F59E0B" />
          <StatCard label="Subscription Attive" value={platformStats.activeSubscriptions} icon={Activity} color="#10B981" />
        </div>
      )}

      {/* Platform Modules */}
      <div>
        <h2 className="text-sm font-semibold text-gray-900 mb-4">Moduli Platform</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {platformModules.map((module, i) => (
            <button
              key={i}
              onClick={() => navigate(module.path)}
              className="flex items-start gap-4 p-4 bg-white rounded-xl border border-gray-200 hover:shadow-lg hover:border-gray-300 transition-all text-left"
            >
              <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${module.color}15` }}>
                <module.icon className="w-5 h-5" style={{ color: module.color }} />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">{module.title}</h3>
                <p className="text-sm text-gray-500 mt-0.5">{module.description}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Security Notice */}
      <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
        <div className="flex items-start gap-3">
          <Lock className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-sm font-semibold text-amber-800">Accesso Platform</h3>
            <p className="text-xs text-amber-700 mt-1">
              Hai accesso platform-level come {user?.role}. Puoi configurare tutte le impostazioni platform senza bisogno di una company tenant.
              Usa il selettore tenant nell'header per passare al contesto tenant quando necessario.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon: Icon, color }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <div className="flex items-center gap-2 mb-2">
        <Icon className="w-4 h-4 flex-shrink-0" style={{ color }} />
        <span className="text-xs text-gray-500 font-medium">{label}</span>
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
    </div>
  );
}

function ModuleCard({ title, description, icon: Icon, path, color }) {
  return (
    <button
      onClick={() => window.location.href = path}
      className="flex items-start gap-4 p-4 bg-white rounded-xl border border-gray-200 hover:shadow-lg hover:border-gray-300 transition-all text-left"
    >
      <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${color}15` }}>
        <Icon className="w-5 h-5" style={{ color: color }} />
      </div>
      <div>
        <h3 className="font-semibold text-gray-900">{title}</h3>
        <p className="text-sm text-gray-500 mt-0.5">{description}</p>
      </div>
    </button>
  );
}