import { useState, useEffect } from 'react';
import { 
  Shield, CheckCircle, XCircle, AlertTriangle, Wrench, 
  Building2, Users, Zap, Activity, RefreshCw
} from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export default function ProvisioningValidator() {
  const [tenants, setTenants] = useState([]);
  const [selectedTenant, setSelectedTenant] = useState('');
  const [validation, setValidation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [repairing, setRepairing] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    loadUserAndTenants();
  }, []);

  const loadUserAndTenants = async () => {
    const currentUser = await base44.auth.me();
    setUser(currentUser);
    
    if (!['admin', 'developer'].includes(currentUser?.role)) {
      toast.error('Accesso riservato ai Super Admin');
      return;
    }

    const allTenants = await base44.entities.Company.list();
    setTenants(allTenants);
  };

  const validateTenant = async () => {
    if (!selectedTenant) {
      toast.error('Seleziona un tenant');
      return;
    }

    setLoading(true);
    try {
      const result = await base44.functions.invoke('provisionTenant', {
        action: 'validate_provisioning',
        tenant_id: selectedTenant,
      });
      setValidation(result.data);
    } catch (error) {
      toast.error('Errore validazione: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const repairTenant = async () => {
    if (!selectedTenant || !validation?.tenant_name) {
      toast.error('Seleziona un tenant valido');
      return;
    }

    setRepairing(true);
    try {
      const tenant = tenants.find(t => t.id === selectedTenant);
      
      const result = await base44.functions.invoke('provisionTenant', {
        action: 'repair_existing_tenant',
        tenant_id: selectedTenant,
        admin_email: tenant?.email || user?.email,
      });

      if (result.success) {
        toast.success('Tenant riparato con successo!');
        await validateTenant();
      } else {
        toast.error('Errore: ' + (result.error || 'Unknown'));
      }
    } catch (error) {
      toast.error('Errore repair: ' + error.message);
    } finally {
      setRepairing(false);
    }
  };

  const needsRepair = validation && !validation.valid;

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Wrench className="w-6 h-6" />
            Provisioning Validator
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Verifica e ripara la configurazione tenant
          </p>
        </div>
        <button
          onClick={loadUserAndTenants}
          className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Building2 className="w-5 h-5" />
          Seleziona Tenant
        </h2>
        <div className="flex gap-3">
          <select
            value={selectedTenant}
            onChange={(e) => setSelectedTenant(e.target.value)}
            className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white"
          >
            <option value="">-- Seleziona Tenant --</option>
            {tenants.map(t => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
          <button
            onClick={validateTenant}
            disabled={!selectedTenant || loading}
            className="px-4 py-2 text-sm text-white rounded-lg disabled:opacity-40"
            style={{ backgroundColor: '#1147FF' }}
          >
            {loading ? 'Validazione...' : 'Valida'}
          </button>
        </div>
      </div>

      {validation && (
        <>
          <div className={`rounded-xl border p-5 ${
            validation.valid 
              ? 'bg-green-50 border-green-200' 
              : 'bg-red-50 border-red-200'
          }`}>
            <div className="flex items-center gap-3 mb-3">
              {validation.valid ? (
                <CheckCircle className="w-6 h-6 text-green-600" />
              ) : (
                <XCircle className="w-6 h-6 text-red-600" />
              )}
              <h2 className="font-bold text-lg">
                {validation.valid ? 'Provisioning Completo' : 'Provisioning Incompleto'}
              </h2>
            </div>
            <p className="text-sm">
              Tenant: <strong>{validation.tenant_name}</strong>
            </p>
            {!validation.valid && (
              <div className="mt-3 space-y-1">
                <p className="text-sm font-semibold text-red-700">Problemi rilevati:</p>
                {validation.issues.map((issue, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-sm text-red-600">
                    <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <span>{issue}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Controlli Dettagliati
            </h2>
            <div className="space-y-3">
              <CheckRow label="Tenant esiste" passed={validation.checks.tenant_exists} />
              <CheckRow label="Admin users collegati" passed={validation.checks.has_admin_users} />
              <CheckRow label="TenantMembership esiste" passed={validation.checks.has_memberships} />
              <CheckRow label="Membership attiva e primaria" passed={validation.checks.has_active_primary_membership} />
              <CheckRow label="Feature flags configurate" passed={validation.checks.has_feature_flags} />
              <CheckRow label="Subscription attiva" passed={validation.checks.has_subscription} />
              <CheckRow label="Brand theme configurato" passed={validation.checks.has_brand_theme} />
              <CheckRow label="Onboarding record" passed={validation.checks.has_onboarding_record} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <StatCard 
              label="Memberships" 
              value={validation.membership_count} 
              icon={Users}
              color="#1147FF"
            />
            <StatCard 
              label="Feature Flags" 
              value={validation.feature_flags_count} 
              icon={Zap}
              color="#F59E0B"
            />
          </div>

          {needsRepair && (
            <div className="bg-orange-50 border border-orange-200 rounded-xl p-5">
              <div className="flex items-start gap-3 mb-4">
                <Wrench className="w-6 h-6 text-orange-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-orange-900">Repair Required</h3>
                  <p className="text-sm text-orange-700 mt-1">
                    Questo tenant ha problemi di provisioning. Clicca sul pulsante per riparare automaticamente.
                  </p>
                </div>
              </div>
              <button
                onClick={repairTenant}
                disabled={repairing}
                className="w-full px-4 py-2 text-sm text-white rounded-lg font-medium disabled:opacity-40"
                style={{ backgroundColor: '#F59E0B' }}
              >
                {repairing ? 'Repair in corso...' : 'Ripara Tenant'}
              </button>
            </div>
          )}
        </>
      )}

      {!validation && !loading && (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
          <Shield className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">Seleziona un tenant e clicca "Valida" per verificare il provisioning</p>
        </div>
      )}
    </div>
  );
}

function CheckRow({ label, passed }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
      <span className="text-sm text-gray-600">{label}</span>
      <div className="flex items-center gap-2">
        {passed ? (
          <CheckCircle className="w-5 h-5 text-green-600" />
        ) : (
          <XCircle className="w-5 h-5 text-red-600" />
        )}
        <span className={`text-sm font-medium ${passed ? 'text-green-600' : 'text-red-600'}`}>
          {passed ? 'OK' : 'FAIL'}
        </span>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon: Icon, color }) {
  const IconComponent = Icon;
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <div className="flex items-center gap-2 mb-2">
        <IconComponent className="w-4 h-4" style={{ color }} />
        <span className="text-xs text-gray-500">{label}</span>
      </div>
      <p className="text-2xl font-bold" style={{ color }}>{value}</p>
    </div>
  );
}