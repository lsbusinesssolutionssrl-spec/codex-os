import { useState, useEffect } from 'react';
import { Building2, Users, FolderKanban, FileText, Archive, Shield, TrendingUp, Brain, Zap, Bot, Plus, CheckCircle, AlertCircle, Clock, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useGlobalContext } from '@/lib/GlobalContextEngine';
import { toast } from 'sonner';

export default function TenantAdminDashboard() {
  const navigate = useNavigate();
  const { activeTenant, activeTenantRole, enabledModules, refreshContext } = useGlobalContext();
  const [stats, setStats] = useState(null);
  const [onboardingSteps, setOnboardingSteps] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const [clients, projects, estimates, documents, memberships, company] = await Promise.all([
        base44.entities.Client.filter({ company_id: activeTenant.id }),
        base44.entities.Project.filter({ company_id: activeTenant.id }),
        base44.entities.Estimate.filter({ company_id: activeTenant.id }),
        base44.entities.Document.filter({ company_id: activeTenant.id }),
        base44.entities.TenantMembership.filter({ tenant_id: activeTenant.id }),
        base44.entities.Company.get(activeTenant.id),
      ]);

      const activeProjects = projects.filter(p => ['Approved', 'In Progress', 'Testing'].includes(p.status));
      const openEstimates = estimates.filter(e => ['Draft', 'To Review', 'Sent'].includes(e.status));
      
      // Count only active/pending/invited memberships (same as Team page)
      const activeMembers = memberships.filter(m => m.status === 'active');
      const pendingInvites = memberships.filter(m => ['invited', 'pending'].includes(m.status));

      setStats({
        clients: clients.length,
        projects: activeProjects.length,
        estimates: estimates.length,
        activeProjects: activeProjects.length,
        documents: documents.length,
        team: activeMembers.length,
        openEstimates: openEstimates.length,
        pendingInvites: pendingInvites.length,
        totalMemberships: memberships.length,
      });

      // Calculate onboarding steps
      const steps = [
        { id: 'company', label: 'Dati Aziendali', completed: !!(company?.name && company?.tax_id), icon: Building2 },
        { id: 'logo', label: 'Logo & Branding', completed: !!company?.logo_url, icon: Shield },
        { id: 'team', label: 'Team (min 2)', completed: activeMembers.length >= 2, icon: Users },
        { id: 'client', label: 'Primo Cliente', completed: clients.length >= 1, icon: Users },
        { id: 'project', label: 'Primo Progetto', completed: projects.length >= 1, icon: FolderKanban },
        { id: 'estimate', label: 'Primo Preventivo', completed: estimates.length >= 1, icon: FileText },
      ];

      setOnboardingSteps(steps);
    } catch (error) {
      console.error('Error loading dashboard:', error);
      toast.error('Errore nel caricamento dashboard');
    } finally {
      setLoading(false);
    }
  };

  const quickActions = [
    { label: 'Crea Cliente', icon: Users, path: '/clients', color: '#1147FF' },
    { label: 'Crea Progetto', icon: FolderKanban, path: '/projects', color: '#10B981' },
    { label: 'Crea Preventivo', icon: FileText, path: '/estimates', color: '#F59E0B' },
    { label: 'Invita Utente', icon: Plus, path: '/team', color: '#7C3AED' },
    { label: 'Carica Documento', icon: Archive, path: '/documents', color: '#06B6D4' },
    { label: 'Configura Azienda', icon: Building2, path: '/company-settings', color: '#EF4444' },
  ];

  const moduleCards = [
    { label: 'Progetti', icon: FolderKanban, enabled: true, path: '/projects' },
    { label: 'Preventivi', icon: FileText, enabled: true, path: '/estimates' },
    { label: 'Clienti', icon: Users, enabled: true, path: '/clients' },
    { label: 'Documenti', icon: Archive, enabled: true, path: '/documents' },
    { label: 'Guardian', icon: Shield, enabled: enabledModules.includes('guardian'), path: '/guardian' },
    { label: 'Controllo Finanziario', icon: TrendingUp, enabled: enabledModules.includes('financial_control'), path: '/financial-control' },
    { label: 'Intelligence', icon: Brain, enabled: enabledModules.includes('intelligence'), path: '/intelligence' },
    { label: 'Workflows', icon: Zap, enabled: enabledModules.includes('workflows'), path: '/workflows' },
    { label: 'AI Copilot', icon: Bot, enabled: enabledModules.includes('ai_copilot'), path: '/ai' },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin" />
      </div>
    );
  }

  const onboardingComplete = onboardingSteps.every(s => s.completed);
  const onboardingProgress = Math.round((onboardingSteps.filter(s => s.completed).length / onboardingSteps.length) * 100);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard Aziendale</h1>
          <p className="text-sm text-gray-500 mt-0.5">{activeTenant?.name}</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="px-3 py-1.5 text-xs font-medium text-white rounded-lg bg-blue-600">
            Tenant Admin
          </div>
        </div>
      </div>

      {/* Onboarding Progress */}
      {!onboardingComplete && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-gray-900">Configurazione Iniziale</h2>
            <span className="text-sm font-medium text-blue-600">{onboardingProgress}%</span>
          </div>
          <div className="w-full bg-white rounded-full h-2 mb-4">
            <div className="bg-blue-600 h-2 rounded-full transition-all" style={{ width: `${onboardingProgress}%` }} />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
            {onboardingSteps.map(step => (
              <div
                key={step.id}
                className={`flex items-center gap-2 p-2 rounded-lg border ${
                  step.completed 
                    ? 'bg-green-50 border-green-200' 
                    : 'bg-white border-gray-200'
                }`}
              >
                <step.icon className={`w-4 h-4 ${step.completed ? 'text-green-600' : 'text-gray-400'}`} />
                <span className={`text-xs font-medium ${step.completed ? 'text-green-700' : 'text-gray-600'}`}>
                  {step.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <StatCard label="Clienti" value={stats?.clients || 0} icon={Users} color="#1147FF" />
        <StatCard label="Progetti Attivi" value={stats?.activeProjects || 0} icon={FolderKanban} color="#10B981" />
        <StatCard label="Preventivi" value={stats?.openEstimates || 0} icon={FileText} color="#F59E0B" />
        <StatCard label="Documenti" value={stats?.documents || 0} icon={Archive} color="#06B6D4" />
        <StatCard label="Team" value={stats?.team || 0} icon={Users} color="#7C3AED" subtitle={stats?.pendingInvites > 0 ? `${stats.pendingInvites} inviti` : undefined} />
        <StatCard label="Moduli" value={enabledModules.length} icon={Zap} color="#EF4444" />
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-sm font-semibold text-gray-900 mb-3">Azioni Rapide</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {quickActions.map((action, i) => (
            <button
              key={i}
              onClick={() => navigate(action.path)}
              className="flex flex-col items-center gap-2 p-4 bg-white rounded-xl border border-gray-200 hover:shadow-lg hover:border-gray-300 transition-all"
            >
              <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${action.color}15` }}>
                <action.icon className="w-5 h-5" style={{ color: action.color }} />
              </div>
              <span className="text-xs font-medium text-gray-700">{action.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Modules */}
      <div>
        <h2 className="text-sm font-semibold text-gray-900 mb-3">Moduli Disponibili</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {moduleCards.map((module, i) => (
            <button
              key={i}
              onClick={() => module.enabled ? navigate(module.path) : null}
              className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                module.enabled 
                  ? 'bg-white border-gray-200 hover:shadow-lg hover:border-gray-300 cursor-pointer' 
                  : 'bg-gray-50 border-gray-200 opacity-60 cursor-not-allowed'
              }`}
            >
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                module.enabled ? 'bg-blue-100' : 'bg-gray-200'
              }`}>
                <module.icon className={`w-4 h-4 ${module.enabled ? 'text-blue-600' : 'text-gray-400'}`} />
              </div>
              <div className="text-left">
                <p className={`text-sm font-medium ${module.enabled ? 'text-gray-900' : 'text-gray-500'}`}>
                  {module.label}
                </p>
                <p className="text-xs text-gray-500">
                  {module.enabled ? 'Attivo' : 'Non incluso'}
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Empty State */}
      {stats?.clients === 0 && stats?.projects === 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
          <Building2 className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Inizia a utilizzare Codex OS</h3>
          <p className="text-sm text-gray-500 mb-4">
            Completa la configurazione e crea i primi dati per iniziare a gestire la tua azienda.
          </p>
          <div className="flex gap-2 justify-center">
            <button
              onClick={() => navigate('/clients')}
              className="px-4 py-2 text-sm text-white rounded-lg font-medium bg-blue-600 hover:bg-blue-700"
            >
              Crea Primo Cliente
            </button>
            <button
              onClick={() => navigate('/company-settings')}
              className="px-4 py-2 text-sm text-gray-700 bg-gray-100 rounded-lg font-medium hover:bg-gray-200"
            >
              Configura Azienda
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, icon: Icon, color, subtitle }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <div className="flex items-center gap-2 mb-2">
        <Icon className="w-4 h-4 flex-shrink-0" style={{ color }} />
        <span className="text-xs text-gray-500 font-medium">{label}</span>
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      {subtitle && <p className="text-xs text-orange-600 mt-1">{subtitle}</p>}
    </div>
  );
}