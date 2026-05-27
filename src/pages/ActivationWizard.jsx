import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  CheckCircle, AlertCircle, Clock, Building2, Users, FileText,
  Home, Shield, TrendingUp, Brain, Zap, Settings, Award, Loader2
} from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

const CHECKLIST_ITEMS = [
  { id: 'company_profile', label: 'Company profile completed', icon: Building2, entity: 'Company', field: 'name' },
  { id: 'logo_uploaded', label: 'Logo uploaded', icon: Award, entity: 'Company', field: 'logo_url' },
  { id: 'plan_selected', label: 'Plan selected', icon: CheckCircle, entity: 'CompanySubscription', field: 'plan_id' },
  { id: 'admin_created', label: 'Tenant admin created', icon: Users, entity: 'User', check: 'hasAdmin' },
  { id: 'users_invited', label: 'Users invited', icon: Users, entity: 'User', min: 2 },
  { id: 'modules_enabled', label: 'Modules enabled', icon: Zap, entity: 'TenantFeatureFlag', min: 1 },
  { id: 'estimate_templates', label: 'Estimate templates configured', icon: FileText, entity: 'SOPTemplate', min: 1 },
  { id: 'first_client', label: 'First client created', icon: Users, entity: 'Client', min: 1 },
  { id: 'first_project', label: 'First project created', icon: Home, entity: 'Project', min: 1 },
];

export default function ActivationWizard() {
  const navigate = useNavigate();
  const [companyId, setCompanyId] = useState(null);
  const [checklist, setChecklist] = useState([]);
  const [loading, setLoading] = useState(true);
  const [companyName, setCompanyName] = useState('');

  useEffect(() => {
    loadActivationStatus();
  }, []);

  const loadActivationStatus = async () => {
    try {
      const companyRes = await base44.functions.invoke('getCurrentCompany', {});
      const company = companyRes.data?.company;
      if (!company) {
        toast.error('Company not found');
        return;
      }
      
      setCompanyId(company.id);
      setCompanyName(company.name);

      const [subscription, featureFlags, users, sopTemplates, clients, projects] = await Promise.all([
        base44.entities.CompanySubscription.filter({ company_id: company.id }).then(r => r[0]),
        base44.entities.TenantFeatureFlag.filter({ company_id: company.id }),
        base44.entities.User.filter({ company_id: company.id }),
        base44.entities.SOPTemplate.filter({ company_id: company.id }),
        base44.entities.Client.filter({ company_id: company.id }),
        base44.entities.Project.filter({ company_id: company.id }),
      ]);

      const hasAdmin = users.some(u => u.role === 'company_admin');
      
      const status = CHECKLIST_ITEMS.map(item => {
        let completed = false;
        
        if (item.entity === 'Company') {
          completed = !!company[item.field];
        } else if (item.entity === 'CompanySubscription') {
          completed = !!subscription?.[item.field];
        } else if (item.entity === 'User') {
          if (item.check === 'hasAdmin') {
            completed = hasAdmin;
          } else if (item.min) {
            completed = users.length >= item.min;
          }
        } else if (item.entity === 'TenantFeatureFlag') {
          completed = featureFlags.length >= item.min;
        } else if (item.entity === 'SOPTemplate') {
          completed = sopTemplates.length >= item.min;
        } else if (item.entity === 'Client') {
          completed = clients.length >= item.min;
        } else if (item.entity === 'Project') {
          completed = projects.length >= item.min;
        }

        return { ...item, completed };
      });

      setChecklist(status);
    } catch (error) {
      console.error('Error loading activation status:', error);
      toast.error('Errore nel caricamento stato attivazione');
    } finally {
      setLoading(false);
    }
  };

  const completedCount = checklist.filter(i => i.completed).length;
  const progress = (completedCount / CHECKLIST_ITEMS.length) * 100;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Shield className="w-6 h-6 text-blue-600" />
          <h1 className="text-2xl font-bold text-gray-900">Wizard di Attivazione</h1>
        </div>
        <p className="text-sm text-gray-500">{companyName}</p>
      </div>

      {/* Progresso */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium text-gray-700">Progresso Attivazione</span>
          <span className="text-sm font-bold text-blue-600">{completedCount}/{CHECKLIST_ITEMS.length}</span>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-3">
          <div 
            className="bg-blue-600 h-3 rounded-full transition-all duration-500" 
            style={{ width: `${progress}%` }}
          />
        </div>
        {progress === 100 && (
          <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <p className="text-sm font-medium text-green-800">Tenant completamente attivato! Tutti i sistemi operativi.</p>
          </div>
        )}
      </div>

      {/* Checklist */}
      <div className="space-y-3">
        {checklist.map(item => (
          <div 
            key={item.id}
            className={`flex items-center gap-4 p-4 rounded-xl border transition-all ${
              item.completed 
                ? 'bg-green-50 border-green-200' 
                : 'bg-white border-gray-200'
            }`}
          >
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
              item.completed ? 'bg-green-100' : 'bg-gray-100'
            }`}>
              {item.completed ? (
                <CheckCircle className="w-5 h-5 text-green-600" />
              ) : (
                <item.icon className="w-5 h-5 text-gray-400" />
              )}
            </div>
            <div className="flex-1">
              <p className={`font-medium ${item.completed ? 'text-green-900' : 'text-gray-900'}`}>
                {item.label}
              </p>
              {!item.completed && (
                <p className="text-xs text-gray-500 mt-0.5">Required for full activation</p>
              )}
            </div>
            {item.completed ? (
              <span className="text-xs font-semibold text-green-700 px-2 py-1 bg-green-100 rounded-full">
                Complete
              </span>
            ) : (
              <span className="text-xs font-semibold text-gray-600 px-2 py-1 bg-gray-100 rounded-full">
                Pending
              </span>
            )}
          </div>
        ))}
      </div>

      {/* Azioni Rapide */}
      {progress < 100 && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-5">
          <h3 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
            <Settings className="w-4 h-4" />
            Azioni Configurazione Rapida
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => navigate('/company-settings')}
              className="px-4 py-2 text-sm text-blue-700 bg-white border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
            >
              Impostazioni Company
            </button>
            <button
              onClick={() => navigate('/team')}
              className="px-4 py-2 text-sm text-blue-700 bg-white border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
            >
              Invita Utenti
            </button>
            <button
              onClick={() => navigate('/sop')}
              className="px-4 py-2 text-sm text-blue-700 bg-white border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
            >
              Template SOP
            </button>
            <button
              onClick={() => navigate('/clients')}
              className="px-4 py-2 text-sm text-blue-700 bg-white border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
            >
              Aggiungi Cliente
            </button>
          </div>
        </div>
      )}
    </div>
  );
}