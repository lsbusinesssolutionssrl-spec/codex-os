import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, AlertTriangle, CheckCircle, Database, Wrench, Trash2, Home } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export default function TenantIntegrityAudit() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [audit, setAudit] = useState(null);
  const [fixing, setFixing] = useState(false);

  useEffect(() => {
    runAudit();
  }, []);

  const runAudit = async () => {
    setLoading(true);
    try {
      const res = await base44.functions.invoke('auditTenantIsolation', {});
      setAudit(res.data);
    } catch (error) {
      toast.error('Audit failed: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const fixIssue = async (action, entityName, recordIds) => {
    setFixing(true);
    try {
      const res = await base44.functions.invoke('fixTenantIsolation', {
        action,
        entity_name: entityName,
        record_ids: recordIds
      });
      toast.success(`Fixed ${res.data.fixed_count} records`);
      runAudit();
    } catch (error) {
      toast.error('Fix failed: ' + error.message);
    } finally {
      setFixing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#1147FF' }}>
              <Shield className="w-4 h-4 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Tenant Isolation Audit</h1>
          </div>
          <p className="text-sm text-gray-500">Data integrity and security verification</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => navigate('/super-admin')}
            className="flex items-center gap-2 px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50"
          >
            <Home className="w-4 h-4" />
            Back
          </button>
          <button
            onClick={runAudit}
            className="flex items-center gap-2 px-4 py-2 text-sm text-white rounded-lg font-medium"
            style={{ backgroundColor: '#1147FF' }}
          >
            <Wrench className="w-4 h-4" />
            Re-run Audit
          </button>
        </div>
      </div>

      {/* Summary */}
      {audit && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <SummaryCard label="Records Checked" value={audit.summary.total_records_checked} icon={Database} color="#1147FF" />
            <SummaryCard label="Missing Tenant ID" value={audit.summary.missing_tenant_id} icon={AlertTriangle} color="#F59E0B" />
            <SummaryCard label="Sample in Real Tenants" value={audit.summary.sample_in_real_tenants} icon={AlertTriangle} color="#EF4444" />
            <SummaryCard label="Orphan Records" value={audit.summary.orphan_records} icon={AlertTriangle} color="#6B7280" />
            <SummaryCard label="Issues Fixed" value={audit.summary.fixed} icon={CheckCircle} color="#10B981" />
          </div>

          {/* Issues List */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900">Issues Found ({audit.issues.length})</h2>
            </div>
            
            {audit.issues.length === 0 ? (
              <div className="py-16 text-center">
                <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                <p className="text-gray-600 font-medium">No issues found!</p>
                <p className="text-sm text-gray-500 mt-1">All records have proper tenant isolation</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50 max-h-[600px] overflow-y-auto">
                {audit.issues.slice(0, 100).map((issue, idx) => (
                  <div key={idx} className="p-4 hover:bg-gray-50">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-mono bg-gray-100 px-2 py-0.5 rounded text-gray-600">
                            {issue.entity}
                          </span>
                          <span className="font-medium text-gray-900">{issue.record_title}</span>
                          {issue.issues.map(i => (
                            <span key={i} className={`text-xs px-2 py-0.5 rounded-full ${
                              i === 'missing_company_id' ? 'bg-red-100 text-red-700' :
                              i === 'sample_in_real_tenant' ? 'bg-orange-100 text-orange-700' :
                              'bg-gray-100 text-gray-700'
                            }`}>
                              {i.replace(/_/g, ' ')}
                            </span>
                          ))}
                        </div>
                        <div className="text-xs text-gray-500">
                          ID: {issue.record_id} • Company: {issue.company_id || 'NULL'} • Sample: {issue.is_sample ? 'Yes' : 'No'}
                        </div>
                      </div>
                      <div className="flex gap-1">
                        {issue.issues.includes('missing_company_id') && (
                          <button
                            onClick={() => fixIssue('assign_to_demo', issue.entity, [issue.record_id])}
                            disabled={fixing}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg"
                            title="Move to Demo Tenant"
                          >
                            <Home className="w-4 h-4" />
                          </button>
                        )}
                        {issue.issues.includes('sample_in_real_tenant') && (
                          <>
                            <button
                              onClick={() => fixIssue('assign_to_demo', issue.entity, [issue.record_id])}
                              disabled={fixing}
                              className="p-1.5 text-orange-600 hover:bg-orange-50 rounded-lg"
                              title="Move to Demo"
                            >
                              <Home className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => fixIssue('delete', issue.entity, [issue.record_id])}
                              disabled={fixing}
                              className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Global Sample Records */}
          {audit.global_sample_records.length > 0 && (
            <div className="bg-white rounded-xl border border-orange-200 overflow-hidden">
              <div className="px-5 py-4 border-b border-orange-100 bg-orange-50">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-orange-600" />
                  <h2 className="font-semibold text-orange-900">Global Sample Records (No Tenant)</h2>
                </div>
              </div>
              <div className="p-4 space-y-2">
                {audit.global_sample_records.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2 bg-white rounded border border-orange-200">
                    <div>
                      <span className="font-medium text-gray-900">{item.entity}</span>
                      <span className="text-sm text-gray-500 ml-2">{item.count} records</span>
                    </div>
                    <button
                      onClick={() => fixIssue('assign_to_demo', item.entity, item.record_ids)}
                      disabled={fixing}
                      className="flex items-center gap-2 px-3 py-1.5 text-sm text-white rounded-lg"
                      style={{ backgroundColor: '#F59E0B' }}
                    >
                      <Home className="w-3 h-3" />
                      Move to Demo
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recommendations */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="font-semibold text-gray-900 mb-3">Recommendations</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              {audit.recommendations.map((rec, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  {rec}
                </li>
              ))}
            </ul>
          </div>
        </>
      )}
    </div>
  );
}

function SummaryCard({ label, value, icon: Icon, color }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <div className="flex items-center gap-2 mb-2">
        {Icon && <Icon className="w-4 h-4 flex-shrink-0" style={{ color }} />}
        <span className="text-xs text-gray-500 font-medium">{label}</span>
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
    </div>
  );
}