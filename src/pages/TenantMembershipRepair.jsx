import { useState, useEffect } from 'react';
import { 
  Shield, User, Building2, Activity, CheckCircle, 
  AlertTriangle, XCircle, Wrench, Users, CreditCard
} from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

export default function TenantMembershipRepair() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [tenants, setTenants] = useState([]);
  const [memberships, setMemberships] = useState([]);
  const [selectedTenant, setSelectedTenant] = useState('');
  const [selectedRole, setSelectedRole] = useState('tenant_admin');
  const [repairing, setRepairing] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadState();
  }, []);

  const loadState = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);

      if (!['admin', 'developer'].includes(currentUser?.role)) {
        toast.error('Accesso riservato ai Super Admin');
        navigate('/');
        return;
      }

      const [allTenants, allMemberships] = await Promise.all([
        base44.entities.Company.list(),
        base44.entities.TenantMembership.filter({ user_id: currentUser.id }),
      ]);

      setTenants(allTenants);
      setMemberships(allMemberships);
    } catch (error) {
      console.error('Load failed:', error);
      toast.error('Errore nel caricamento');
    } finally {
      setLoading(false);
    }
  };

  const handleRepair = async () => {
    if (!selectedTenant) {
      toast.error('Seleziona un tenant');
      return;
    }

    setRepairing(true);
    try {
      const result = await base44.functions.invoke('repairTenantMembership', {
        action: 'create_membership',
        user_id: user.id,
        tenant_id: selectedTenant,
        tenant_role: selectedRole,
      });

      if (result.success) {
        toast.success('Membership creata con successo!');
        // Clear impersonation and reload
        localStorage.removeItem('impersonate_tenant_id');
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      } else {
        toast.error('Errore nella riparazione: ' + (result.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Repair failed:', error);
      toast.error('Errore: ' + error.message);
    } finally {
      setRepairing(false);
    }
  };

  const handleLinkAdmin = async (tenantId) => {
    setRepairing(true);
    try {
      const result = await base44.functions.invoke('repairTenantMembership', {
        action: 'repair_tenant_admin',
        tenant_id: tenantId,
      });

      if (result.success) {
        toast.success(`Admin collegato al tenant ${result.user_email}`);
        loadState();
      } else {
        toast.error('Errore: ' + (result.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Link failed:', error);
      toast.error('Errore: ' + error.message);
    } finally {
      setRepairing(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="text-center text-gray-400 py-12">Caricamento...</div>
      </div>
    );
  }

  const hasMembership = memberships.length > 0;
  const activeMembership = memberships.find(m => m.is_primary) || memberships[0];

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Wrench className="w-6 h-6" />
            Ripristino Tenant Membership
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Collega il tuo utente a un tenant esistente
          </p>
        </div>
        <button
          onClick={() => navigate('/super-admin')}
          className="px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50"
        >
          Torna al Dashboard
        </button>
      </div>

      {/* Current User Status */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <User className="w-5 h-5" />
          Stato Utente Corrente
        </h2>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-500">Email:</span>
            <p className="font-medium">{user?.email}</p>
          </div>
          <div>
            <span className="text-gray-500">Platform Role:</span>
            <p className="font-medium">{user?.role}</p>
          </div>
          <div>
            <span className="text-gray-500">Memberships:</span>
            <p className={`font-medium ${hasMembership ? 'text-green-600' : 'text-red-600'}`}>
              {memberships.length} {hasMembership ? '(attive)' : '(NESUNA)'}
            </p>
          </div>
          {activeMembership && (
            <>
              <div>
                <span className="text-gray-500">Tenant:</span>
                <p className="font-medium">{activeMembership.tenant_id}</p>
              </div>
              <div>
                <span className="text-gray-500">Tenant Role:</span>
                <p className="font-medium">{activeMembership.tenant_role}</p>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Issue Detection */}
      {!hasMembership && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-5">
          <div className="flex items-start gap-3">
            <XCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-red-900">Nessuna Tenant Membership Trovata</h3>
              <p className="text-sm text-red-700 mt-1">
                Il tuo utente non ha memberships attive. Seleziona un tenant dalla lista sottostante per creare una membership.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Repair Form */}
      {!hasMembership && (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Wrench className="w-5 h-5" />
            Crea Nuova Membership
          </h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Seleziona Tenant
              </label>
              <select
                value={selectedTenant}
                onChange={(e) => setSelectedTenant(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white"
              >
                <option value="">-- Seleziona --</option>
                {tenants.map(t => (
                  <option key={t.id} value={t.id}>
                    {t.name} ({t.email})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ruolo Tenant
              </label>
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white"
              >
                <option value="tenant_admin">Tenant Admin (Full Access)</option>
                <option value="project_manager">Project Manager</option>
                <option value="sales">Sales</option>
                <option value="technician">Technician</option>
              </select>
            </div>

            <button
              onClick={handleRepair}
              disabled={!selectedTenant || repairing}
              className="w-full px-4 py-2 text-sm text-white rounded-lg font-medium disabled:opacity-40"
              style={{ backgroundColor: '#F59E0B' }}
            >
              {repairing ? 'Creazione in corso...' : 'Crea Membership'}
            </button>
          </div>
        </div>
      )}

      {/* Existing Memberships */}
      {hasMembership && (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            Memberships Esistenti
          </h2>
          <div className="space-y-3">
            {memberships.map(m => (
              <div key={m.id} className="p-4 border border-gray-100 rounded-lg bg-gray-50">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">Tenant: {m.tenant_id}</p>
                    <p className="text-sm text-gray-500">Ruolo: {m.tenant_role}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      m.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
                    }`}>
                      {m.status}
                    </span>
                    {m.is_primary && (
                      <span className="px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-700">
                        Primary
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick Link to Tenants Without Admin */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Users className="w-5 h-5" />
          Tenant Senza Admin Collegato
        </h2>
        <p className="text-sm text-gray-500 mb-3">
          Questi tenant hanno utenti ma nessuna membership admin attiva.
        </p>
        <div className="space-y-2">
          {tenants
            .filter(t => !memberships.some(m => m.tenant_id === t.id && m.tenant_role === 'tenant_admin'))
            .slice(0, 5)
            .map(t => (
              <div key={t.id} className="flex items-center justify-between p-3 border border-gray-100 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">{t.name}</p>
                  <p className="text-sm text-gray-500">{t.email}</p>
                </div>
                <button
                  onClick={() => handleLinkAdmin(t.id)}
                  disabled={repairing}
                  className="px-3 py-1.5 text-xs text-white rounded-lg disabled:opacity-40"
                  style={{ backgroundColor: '#10B981' }}
                >
                  {repairing ? '...' : 'Collega Admin'}
                </button>
              </div>
            ))}
          {tenants.filter(t => !memberships.some(m => m.tenant_id === t.id && m.tenant_role === 'tenant_admin')).length === 0 && (
            <p className="text-sm text-green-600 flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              Tutti i tenant hanno admin configurati
            </p>
          )}
        </div>
      </div>
    </div>
  );
}