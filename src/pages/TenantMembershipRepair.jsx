import { useState, useEffect } from 'react';
import { Wrench, CheckCircle, AlertTriangle, Users, Building2, Shield } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useGlobalContext } from '@/lib/GlobalContextEngine';
import { toast } from 'sonner';

export default function TenantMembershipRepair() {
  const { activeTenant, refreshContext } = useGlobalContext();
  const [repairing, setRepairing] = useState(false);
  const [repairResult, setRepairResult] = useState(null);
  const [diagnostics, setDiagnostics] = useState(null);

  useEffect(() => {
    runDiagnostics();
  }, []);

  const runDiagnostics = async () => {
    try {
      const user = await base44.auth.me();
      const memberships = await base44.functions.invoke('loadUserMemberships', {});
      
      setDiagnostics({
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          company_id: user.company_id,
        },
        memberships: memberships.data.memberships || [],
        membershipCount: (memberships.data.memberships || []).length,
        hasActiveMembership: (memberships.data.memberships || []).some(m => m.status === 'active'),
      });
    } catch (error) {
      console.error('Diagnostics error:', error);
    }
  };

  const handleRepair = async () => {
    setRepairing(true);
    try {
      const result = await base44.functions.invoke('resolveOrRepairTenantMembership', {});
      setRepairResult(result.data);
      
      if (result.data.success) {
        toast.success('Membership riparata con successo!');
        refreshContext();
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      } else {
        toast.error('Riparazione fallita: ' + result.data.reason);
      }
    } catch (error) {
      toast.error('Errore riparazione: ' + error.message);
    } finally {
      setRepairing(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <Wrench className="w-8 h-8 text-blue-600" />
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Riparazione Tenant Membership</h1>
          <p className="text-sm text-gray-500">Diagnostica e riparazione automatica delle membership</p>
        </div>
      </div>

      {/* Diagnostics */}
      {diagnostics && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Diagnostica</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <DiagnosticCard
              label="User Email"
              value={diagnostics.user.email}
              icon={Users}
            />
            <DiagnosticCard
              label="User Role"
              value={diagnostics.user.role}
              icon={Shield}
            />
            <DiagnosticCard
              label="Company ID"
              value={diagnostics.user.company_id?.slice(0, 8) + '...' || 'None'}
              icon={Building2}
            />
            <DiagnosticCard
              label="Memberships"
              value={diagnostics.membershipCount}
              icon={Users}
              color={diagnostics.membershipCount > 0 ? 'green' : 'red'}
            />
          </div>

          {diagnostics.hasActiveMembership ? (
            <div className="flex items-center gap-2 p-4 bg-green-50 border border-green-200 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <span className="text-sm font-medium text-green-800">
                Membership attiva trovata - Nessun problema rilevato
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-2 p-4 bg-orange-50 border border-orange-200 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-orange-600" />
              <span className="text-sm font-medium text-orange-800">
                Nessuna membership attiva - Riparazione consigliata
              </span>
            </div>
          )}
        </div>
      )}

      {/* Repair Action */}
      {!diagnostics?.hasActiveMembership && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Azione di Riparazione</h2>
          <p className="text-sm text-gray-600 mb-4">
            Il sistema tenterà di creare o riparare la tua TenantMembership usando queste condizioni sicure:
          </p>
          <ul className="list-disc list-inside text-sm text-gray-600 mb-6 space-y-1">
            <li>Corrispondenza email admin tenant</li>
            <li>Binding legacy company_id</li>
            <li>Inviti pendenti</li>
          </ul>
          <button
            onClick={handleRepair}
            disabled={repairing}
            className="flex items-center gap-2 px-6 py-3 text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Wrench className="w-5 h-5" />
            {repairing ? 'Riparazione in corso...' : 'Ripara Membership'}
          </button>
        </div>
      )}

      {/* Repair Result */}
      {repairResult && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            {repairResult.success ? '✅ Riparazione Completata' : '❌ Riparazione Fallita'}
          </h2>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Azione:</span>
              <span className="font-medium">{repairResult.action || 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Motivo:</span>
              <span className="font-medium">{repairResult.reason || 'N/A'}</span>
            </div>
            {repairResult.membership && (
              <>
                <div className="flex justify-between">
                  <span className="text-gray-600">Membership ID:</span>
                  <span className="font-mono text-xs">{repairResult.membership.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Tenant Role:</span>
                  <span className="font-medium">{repairResult.membership.tenant_role}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Status:</span>
                  <span className="font-medium">{repairResult.membership.status}</span>
                </div>
              </>
            )}
            {repairResult.tenant && (
              <>
                <div className="flex justify-between">
                  <span className="text-gray-600">Tenant:</span>
                  <span className="font-medium">{repairResult.tenant.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Tenant ID:</span>
                  <span className="font-mono text-xs">{repairResult.tenant.id}</span>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function DiagnosticCard({ label, value, icon: Icon, color }) {
  const colorClasses = {
    green: 'text-green-600',
    red: 'text-red-600',
    blue: 'text-blue-600',
    gray: 'text-gray-600',
  };

  return (
    <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
      <div className="flex items-center gap-2 mb-2">
        <Icon className={`w-4 h-4 ${color ? colorClasses[color] : 'text-gray-600'}`} />
        <span className="text-xs text-gray-500">{label}</span>
      </div>
      <p className="text-lg font-semibold text-gray-900 truncate">{value}</p>
    </div>
  );
}