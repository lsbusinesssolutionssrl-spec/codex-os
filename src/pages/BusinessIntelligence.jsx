import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { TrendingUp, AlertTriangle, Lock } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useGlobalContext } from '@/lib/GlobalContextEngine';
import { MODULE_REGISTRY, getModuleReadiness, MODULE_STATUS } from '@/lib/moduleRegistry';

export default function BusinessIntelligence() {
  const navigate = useNavigate();
  const { activeTenant, enabledModules } = useGlobalContext();
  const [status, setStatus] = useState('loading');

  useEffect(() => {
    const checkModule = async () => {
      // Check if module is enabled
      if (!enabledModules.includes('intelligence')) {
        setStatus('disabled');
        return;
      }

      // Check data readiness
      try {
        const [projects, costs, timesheets] = await Promise.all([
          base44.entities.Project.filter({ company_id: activeTenant.id }),
          base44.entities.ProjectCost.filter({ company_id: activeTenant.id }),
          base44.entities.Timesheet.filter({ company_id: activeTenant.id }),
        ]);

        const stats = {
          projects: projects.length,
          project_costs: costs.length,
          timesheets: timesheets.length,
        };

        const moduleConfig = MODULE_REGISTRY.intelligence;
        const readiness = getModuleReadiness(moduleConfig, stats);

        if (readiness === MODULE_STATUS.ONBOARDING) {
          setStatus('onboarding');
        } else {
          setStatus('active');
        }
      } catch (error) {
        setStatus('error');
      }
    };

    if (status === 'loading') {
      checkModule();
    }
  }, [enabledModules, activeTenant, status]);

  // Redirect when active
  useEffect(() => {
    if (status === 'active') {
      navigate('/intelligence');
    }
  }, [status, navigate]);

  if (status === 'loading') {
    return <div className="p-6 text-center text-gray-400">Caricamento...</div>;
  }

  if (status === 'disabled') {
    return (
      <div className="p-6 max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl border-2 border-dashed border-amber-200 p-12 text-center">
          <Lock className="w-16 h-16 text-amber-300 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Business Intelligence Non Abilitata</h2>
          <p className="text-gray-500 mb-6">
            Il modulo Business Intelligence richiede il piano Enterprise.
          </p>
          <button
            onClick={() => navigate('/company-settings')}
            className="px-6 py-2.5 text-sm font-semibold text-white rounded-xl"
            style={{ backgroundColor: '#1147FF' }}
          >
            Vai su Impostazioni
          </button>
        </div>
      </div>
    );
  }

  if (status === 'onboarding') {
    return (
      <div className="p-6 max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl border-2 border-dashed border-orange-200 p-12 text-center">
          <AlertTriangle className="w-16 h-16 text-orange-300 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Dati Insufficienti</h2>
          <p className="text-gray-500 mb-6">
            Per attivare la Business Intelligence sono necessari:
          </p>
          <ul className="text-sm text-gray-600 space-y-2 mb-6">
            <li>• Almeno 5 progetti completati</li>
            <li>• Timesheet abilitati e compilati</li>
            <li>• Costi progetto inseriti</li>
          </ul>
          <button
            onClick={() => navigate('/projects')}
            className="px-6 py-2.5 text-sm font-semibold text-white rounded-xl"
            style={{ backgroundColor: '#1147FF' }}
          >
            Crea Progetti
          </button>
        </div>
      </div>
    );
  }

  return <div className="p-6 text-center text-gray-400">Reindirizzamento...</div>;
}