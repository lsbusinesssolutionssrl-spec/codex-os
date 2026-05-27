import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { TrendingUp, AlertTriangle, Lock } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useGlobalContext } from '@/lib/GlobalContextEngine';
import { MODULE_REGISTRY, getModuleReadiness, MODULE_STATUS } from '@/lib/moduleRegistry';

export default function Insights() {
  const navigate = useNavigate();
  const { activeTenant, enabledModules } = useGlobalContext();
  const [status, setStatus] = useState('loading');

  useEffect(() => {
    // Check if intelligence module is enabled
    if (!enabledModules.includes('intelligence')) {
      setStatus('disabled');
      return;
    }

    // Check data readiness
    const checkReadiness = async () => {
      try {
        const [projects, guardians] = await Promise.all([
          base44.entities.Project.filter({ company_id: activeTenant.id }),
          base44.entities.GuardianSubscription.filter({ company_id: activeTenant.id }),
        ]);

        const stats = {
          projects: projects.length,
          guardians: guardians.length,
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

    checkReadiness();
  }, [enabledModules, activeTenant]);

  if (status === 'loading') {
    return <div className="p-6 text-center text-gray-400">Caricamento...</div>;
  }

  if (status === 'disabled') {
    return (
      <div className="p-6 max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl border-2 border-dashed border-amber-200 p-12 text-center">
          <Lock className="w-16 h-16 text-amber-300 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Insight Strategici Non Abilitati</h2>
          <p className="text-gray-500 mb-6">
            Gli Insight Strategici richiedono il piano Enterprise.
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
            Per attivare gli Insight Strategici sono necessari:
          </p>
          <ul className="text-sm text-gray-600 space-y-2 mb-6">
            <li>• Almeno 5 progetti completati</li>
            <li>• Dati finanziari inseriti</li>
          </ul>
          <button
            onClick={() => navigate('/executive-insights')}
            className="px-6 py-2.5 text-sm font-semibold text-white rounded-xl"
            style={{ backgroundColor: '#1147FF' }}
          >
            Vai a Executive Insights
          </button>
        </div>
      </div>
    );
  }

  // Active state - redirect to Executive Insights
  useEffect(() => {
    if (status === 'active') {
      navigate('/executive-insights');
    }
  }, [status, navigate]);

  return <div className="p-6 text-center text-gray-400">Reindirizzamento...</div>;
}