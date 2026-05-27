import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, AlertTriangle, Lock } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useGlobalContext } from '@/lib/GlobalContextEngine';

export default function TeamPerformance() {
  const navigate = useNavigate();
  const { activeTenant, enabledModules } = useGlobalContext();
  const [status, setStatus] = useState('loading');

  useEffect(() => {
    // Check if financial_control module is enabled (required for team performance)
    if (!enabledModules.includes('financial_control')) {
      setStatus('disabled');
      return;
    }

    // Check data readiness
    const checkReadiness = async () => {
      try {
        const [timesheets, users] = await Promise.all([
          base44.entities.Timesheet.filter({ company_id: activeTenant.id }),
          base44.entities.User.list(),
        ]);

        const stats = {
          timesheets: timesheets.length,
          users: users.length,
        };

        if (stats.timesheets === 0 || stats.users === 0) {
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
          <h2 className="text-xl font-bold text-gray-900 mb-2">Performance Team Non Abilitata</h2>
          <p className="text-gray-500 mb-6">
            Il modulo Performance Team richiede il piano Professional.
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
            Per visualizzare la Performance Team sono necessari:
          </p>
          <ul className="text-sm text-gray-600 space-y-2 mb-6">
            <li>• Utenti registrati nel team</li>
            <li>• Timesheet compilati</li>
          </ul>
          <div className="space-y-2">
            <button
              onClick={() => navigate('/team')}
              className="w-full px-6 py-2.5 text-sm font-semibold text-white rounded-xl"
              style={{ backgroundColor: '#1147FF' }}
            >
              Gestisci Team
            </button>
            <button
              onClick={() => navigate('/timesheets')}
              className="w-full px-6 py-2.5 text-sm font-semibold text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200"
            >
              Compila Timesheet
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Active state - redirect to Timesheets (where team performance is shown)
  useEffect(() => {
    if (status === 'active') {
      navigate('/timesheets');
    }
  }, [status, navigate]);

  return <div className="p-6 text-center text-gray-400">Reindirizzamento...</div>;
}