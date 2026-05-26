import { useState, useEffect } from 'react';
import { Shield, CheckCircle2, XCircle, Eye, EyeOff } from 'lucide-react';
import { base44 } from '@/api/base44Client';

const ROLES = ['admin', 'company_admin', 'project_manager', 'technician', 'sales', 'client'];

const ENTITIES = [
  'Client', 'Property', 'Estimate', 'Project', 'Document', 
  'SupportTicket', 'GuardianSubscription', 'ChecklistItem', 
  'ProjectCost', 'Timesheet', 'PurchaseOrder', 'Supplier',
  'KnowledgeBase', 'FinancialAlert', 'IntelligenceInsight'
];

export default function PermissionsTest() {
  const [selectedRole, setSelectedRole] = useState('technician');
  const [testResults, setTestResults] = useState(null);
  const [testing, setTesting] = useState(false);

  const runTest = async () => {
    setTesting(true);
    try {
      // Simulate role by temporarily changing user role
      const user = await base44.auth.me();
      const originalRole = user.role;
      
      // Update user role for testing
      await base44.entities.User.update(user.id, { role: selectedRole });
      
      // Get filters for this role
      const filtersRes = await base44.functions.invoke('getUserFilters', {});
      const filters = filtersRes.data.filters;
      const restricted = filtersRes.data.restricted_entities || [];
      
      // Test access to each entity
      const results = {};
      for (const entity of ENTITIES) {
        try {
          const count = await base44.entities[entity].filter(filters[entity] || {}).then(d => d.length);
          results[entity] = {
            canAccess: !restricted.includes(entity),
            count,
            filter: filters[entity] || null
          };
        } catch (error) {
          results[entity] = {
            canAccess: false,
            error: error.message
          };
        }
      }
      
      // Restore original role
      await base44.entities.User.update(user.id, { role: originalRole });
      
      setTestResults(results);
    } catch (error) {
      console.error('Permission test failed:', error);
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Shield className="w-8 h-8 text-blue-600" />
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Permissions Test</h1>
          <p className="text-sm text-gray-500">Simulate roles and verify data access</p>
        </div>
      </div>

      {/* Role Selector */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <label className="block text-sm font-medium text-gray-700 mb-3">Select Role to Test</label>
        <div className="flex flex-wrap gap-2">
          {ROLES.map(role => (
            <button
              key={role}
              onClick={() => setSelectedRole(role)}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                selectedRole === role
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {role.replace('_', ' ').toUpperCase()}
            </button>
          ))}
        </div>
        <button
          onClick={runTest}
          disabled={testing}
          className="mt-4 px-6 py-2 text-sm text-white rounded-lg font-medium disabled:opacity-40"
          style={{ backgroundColor: '#1147FF' }}
        >
          {testing ? 'Testing...' : 'Run Permission Test'}
        </button>
      </div>

      {/* Results */}
      {testResults && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">Access Matrix - {selectedRole.toUpperCase()}</h2>
          </div>
          <div className="divide-y divide-gray-50">
            {ENTITIES.map(entity => {
              const result = testResults[entity];
              const canAccess = result?.canAccess;
              
              return (
                <div key={entity} className="px-5 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {canAccess ? (
                      <CheckCircle2 className="w-5 h-5 text-green-500" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-500" />
                    )}
                    <span className="text-sm font-medium text-gray-900">{entity}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    {canAccess ? (
                      <span className="text-sm text-gray-500">
                        {result.count} records visible
                      </span>
                    ) : (
                      <span className="text-sm text-red-600 font-medium">
                        {result.error || 'No Access'}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Role Descriptions */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h3 className="font-semibold text-gray-900 mb-4">Role Permissions Reference</h3>
        <div className="space-y-3 text-sm">
          <RoleDesc role="admin" desc="Full access to all entities and settings" />
          <RoleDesc role="company_admin" desc="Full company access, can manage company settings" />
          <RoleDesc role="project_manager" desc="Full project access, can view project financials, NO company settings" />
          <RoleDesc role="technician" desc="ONLY assigned projects/tasks/tickets, NO financial data, NO clients" />
          <RoleDesc role="sales" desc="Clients, Properties, Estimates, NO project financials" />
          <RoleDesc role="client" desc="ONLY own data via portal, NO internal data" />
        </div>
      </div>
    </div>
  );
}

function RoleDesc({ role, desc }) {
  return (
    <div className="flex gap-3">
      <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">{role}</span>
      <span className="text-gray-600">{desc}</span>
    </div>
  );
}