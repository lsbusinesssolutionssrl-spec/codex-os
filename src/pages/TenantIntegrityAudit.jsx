import { useState, useEffect } from 'react';
import { Shield, AlertTriangle, CheckCircle, X, Building2, Users, Database } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export default function TenantIntegrityAudit() {
  const [audit, setAudit] = useState(null);
  const [loading, setLoading] = useState(true);
  const [fixing, setFixing] = useState(false);

  useEffect(() => {
    runAudit();
  }, []);

  const runAudit = async () => {
    try {
      const [users, companies, subscriptions] = await Promise.all([
        base44.entities.User.list(),
        base44.entities.Company.list(),
        base44.entities.CompanySubscription.list(),
      ]);

      const issues = [];
      const stats = {
        totalUsers: users.length,
        usersWithCompany: users.filter(u => u.company_id).length,
        usersWithoutCompany: users.filter(u => !u.company_id && u.role !== 'admin').length,
        totalCompanies: companies.length,
        activeSubscriptions: subscriptions.filter(s => s.status === 'active').length,
        orphanedData: 0,
      };

      // Check users without company_id (except admin)
      users.forEach(u => {
        if (!u.company_id && !['admin', 'developer'].includes(u.role)) {
          issues.push({
            type: 'user_missing_company',
            severity: 'critical',
            message: `User ${u.email} (${u.role}) has no company_id`,
            user_id: u.id,
            user_email: u.email,
          });
        }
      });

      // Check companies without subscription
      companies.forEach(c => {
        const hasSub = subscriptions.some(s => s.company_id === c.id);
        if (!hasSub) {
          issues.push({
            type: 'company_missing_subscription',
            severity: 'warning',
            message: `Company "${c.name}" has no subscription`,
            company_id: c.id,
            company_name: c.name,
          });
        }
      });

      // Check for orphaned data (data with invalid company_id)
      const entities = ['Project', 'Client', 'Property', 'Estimate'];
      for (const entity of entities) {
        const records = await base44.entities[entity].list();
        records.forEach(r => {
          if (r.company_id && !companies.find(c => c.id === r.company_id)) {
            stats.orphanedData++;
            issues.push({
              type: 'orphaned_data',
              severity: 'critical',
              message: `${entity} "${r.title || r.id}" references non-existent company ${r.company_id}`,
              entity,
              record_id: r.id,
            });
          }
        });
      }

      setAudit({
        stats,
        issues,
        criticalCount: issues.filter(i => i.severity === 'critical').length,
        warningCount: issues.filter(i => i.severity === 'warning').length,
      });
    } catch (error) {
      console.error('Audit error:', error);
      toast.error('Errore durante audit tenant');
    } finally {
      setLoading(false);
    }
  };

  const fixUserCompany = async (userId, email) => {
    setFixing(true);
    try {
      // Try to infer company from user's data
      const projects = await base44.entities.Project.filter({ created_by: email });
      if (projects.length > 0) {
        const companyId = projects[0].company_id;
        await base44.entities.User.update(userId, { company_id: companyId });
        toast.success(`User ${email} assigned to company`);
        runAudit();
        return;
      }

      const clients = await base44.entities.Client.filter({ email });
      if (clients.length > 0) {
        const companyId = clients[0].company_id;
        await base44.entities.User.update(userId, { company_id: companyId });
        toast.success(`User ${email} assigned to company`);
        runAudit();
        return;
      }

      toast.error(`Cannot infer company for ${email} - manual fix required`);
    } catch (error) {
      toast.error(`Error fixing user: ${error.message}`);
    } finally {
      setFixing(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 text-center text-gray-400">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin mx-auto" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Database className="w-6 h-6 text-blue-600" />
            Tenant Integrity Audit
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">Verifica isolamento e integrità dati multi-tenant</p>
        </div>
        <button
          onClick={runAudit}
          className="px-4 py-2 text-sm text-white rounded-lg font-medium"
          style={{ backgroundColor: '#1147FF' }}
        >
          Re-run Audit
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Utenti Totali" value={audit.stats.totalUsers} icon={Users} color="#1147FF" />
        <StatCard label="Utenti con Company" value={audit.stats.usersWithCompany} icon={CheckCircle} color="#10B981" />
        <StatCard label="Aziende" value={audit.stats.totalCompanies} icon={Building2} color="#F59E0B" />
        <StatCard label="Subscription Attive" value={audit.stats.activeSubscriptions} icon={Shield} color="#8B5CF6" />
      </div>

      {/* Issues Summary */}
      <div className="grid grid-cols-2 gap-4">
        <div className={`p-4 rounded-xl border ${
          audit.criticalCount > 0 
            ? 'bg-red-50 border-red-200' 
            : 'bg-green-50 border-green-200'
        }`}>
          <div className="flex items-center gap-2 mb-1">
            {audit.criticalCount > 0 ? (
              <AlertTriangle className="w-5 h-5 text-red-600" />
            ) : (
              <CheckCircle className="w-5 h-5 text-green-600" />
            )}
            <span className="font-semibold">
              {audit.criticalCount > 0 ? 'Critical Issues' : 'No Critical Issues'}
            </span>
          </div>
          <p className="text-2xl font-bold text-red-700">{audit.criticalCount}</p>
        </div>

        <div className={`p-4 rounded-xl border ${
          audit.warningCount > 0 
            ? 'bg-orange-50 border-orange-200' 
            : 'bg-green-50 border-green-200'
        }`}>
          <div className="flex items-center gap-2 mb-1">
            {audit.warningCount > 0 ? (
              <AlertTriangle className="w-5 h-5 text-orange-600" />
            ) : (
              <CheckCircle className="w-5 h-5 text-green-600" />
            )}
            <span className="font-semibold">Warnings</span>
          </div>
          <p className="text-2xl font-bold text-orange-700">{audit.warningCount}</p>
        </div>
      </div>

      {/* Issues List */}
      {audit.issues.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">Issues Found</h2>
          </div>
          <div className="divide-y divide-gray-50 max-h-96 overflow-y-auto">
            {audit.issues.map((issue, idx) => (
              <div key={idx} className="p-4 flex items-start gap-3">
                {issue.severity === 'critical' ? (
                  <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
                )}
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{issue.message}</p>
                  <p className="text-xs text-gray-500 mt-0.5">Type: {issue.type}</p>
                  
                  {issue.type === 'user_missing_company' && (
                    <button
                      onClick={() => fixUserCompany(issue.user_id, issue.user_email)}
                      disabled={fixing}
                      className="mt-2 text-xs text-white px-3 py-1 rounded bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
                    >
                      {fixing ? 'Fixing...' : 'Auto-fix'}
                    </button>
                  )}
                </div>
                <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                  issue.severity === 'critical' 
                    ? 'bg-red-100 text-red-700' 
                    : 'bg-orange-100 text-orange-700'
                }`}>
                  {issue.severity.toUpperCase()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {audit.issues.length === 0 && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-center">
          <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-3" />
          <p className="text-lg font-semibold text-green-900">All Clear!</p>
          <p className="text-sm text-green-700 mt-1">No tenant integrity issues found</p>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, icon: Icon, color }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <div className="flex items-center gap-2 mb-2">
        <Icon className="w-4 h-4" style={{ color }} />
        <span className="text-xs text-gray-500 font-medium">{label}</span>
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
    </div>
  );
}