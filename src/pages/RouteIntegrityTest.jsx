import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, XCircle, AlertCircle, Shield, Lock, Zap } from 'lucide-react';
import { useGlobalContext } from '@/lib/GlobalContextEngine';
import { base44 } from '@/api/base44Client';

const TENANT_ROUTES = [
  { path: '/', label: 'Command Center', module: 'core', requiresFinancial: false },
  { path: '/clients', label: 'Clienti', module: 'core', requiresFinancial: false },
  { path: '/projects', label: 'Progetti', module: 'core', requiresFinancial: false },
  { path: '/properties', label: 'Home Passport', module: 'core', requiresFinancial: false },
  { path: '/estimates', label: 'Preventivi', module: 'core', requiresFinancial: false },
  { path: '/documents', label: 'Documenti', module: 'core', requiresFinancial: false },
  { path: '/guardian', label: 'Guardian', module: 'guardian', requiresFinancial: false },
  { path: '/financial-control', label: 'Controllo Finanziario', module: 'financial_control', requiresFinancial: true },
  { path: '/ai', label: 'AI Copilot', module: 'ai_copilot', requiresFinancial: false },
  { path: '/intelligence', label: 'Intelligence', module: 'intelligence', requiresFinancial: false },
  { path: '/workflows', label: 'Workflows', module: 'workflows', requiresFinancial: false },
  { path: '/company-settings', label: 'Impostazioni', module: 'core', requiresFinancial: false },
];

export default function RouteIntegrityTest() {
  const navigate = useNavigate();
  const globalContext = useGlobalContext();
  const [results, setResults] = useState([]);
  const [testing, setTesting] = useState(false);

  const {
    isContextResolved,
    contextType,
    enabledModules,
    permissions,
    activeTenantRole,
    activeTenant,
    failedChecks,
  } = globalContext;

  const runTests = async () => {
    setTesting(true);
    const testResults = [];

    for (const route of TENANT_ROUTES) {
      const result = {
        path: route.path,
        label: route.label,
        module: route.module,
        moduleEnabled: route.module === 'core' || enabledModules.includes(route.module),
        hasPermission: true,
        roleAllowed: true,
        accessible: false,
        issues: [],
      };

      // Check module enabled
      if (route.module !== 'core' && !enabledModules.includes(route.module)) {
        result.issues.push('Module not enabled');
      }

      // Check role-based access
      if (route.path === '/financial-control') {
        const allowedRoles = ['tenant_admin', 'project_manager'];
        if (!allowedRoles.includes(activeTenantRole)) {
          result.roleAllowed = false;
          result.issues.push(`Role ${activeTenantRole} not allowed`);
        }
        
        // Check financial permissions
        if (!permissions.includes('financials:read')) {
          result.hasPermission = false;
          result.issues.push('Missing permission: financials:read');
        }
      }

      // Determine if accessible
      result.accessible = result.moduleEnabled && result.hasPermission && result.roleAllowed && isContextResolved;

      testResults.push(result);
    }

    setResults(testResults);
    setTesting(false);
  };

  useEffect(() => {
    if (isContextResolved) {
      runTests();
    }
  }, [isContextResolved, enabledModules, permissions, activeTenantRole]);

  const passedCount = results.filter(r => r.accessible).length;
  const failedCount = results.filter(r => !r.accessible).length;

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Route Integrity Test</h1>
          <p className="text-sm text-gray-500 mt-0.5">Developer diagnostic tool for tenant routing</p>
        </div>
        <button
          onClick={runTests}
          disabled={testing || !isContextResolved}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg disabled:opacity-50"
        >
          <Zap className="w-4 h-4" />
          {testing ? 'Testing...' : 'Run Tests'}
        </button>
      </div>

      {/* Context Status */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h2 className="text-sm font-semibold text-gray-900 mb-3">Tenant Context Status</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatusRow label="Context" value={contextType} icon={isContextResolved ? CheckCircle2 : AlertCircle} success={isContextResolved} />
          <StatusRow label="Tenant" value={activeTenant?.name || 'None'} icon={activeTenant ? CheckCircle2 : AlertCircle} success={!!activeTenant} />
          <StatusRow label="Role" value={activeTenantRole || 'None'} icon={Shield} />
          <StatusRow label="Enabled Modules" value={enabledModules.length} icon={Zap} />
        </div>
      </div>

      {/* Test Results */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-900">Route Tests</h2>
          <div className="flex gap-3 text-sm">
            <span className="text-green-600 font-medium">{passedCount} Passed</span>
            <span className="text-red-600 font-medium">{failedCount} Failed</span>
          </div>
        </div>
        <div className="divide-y divide-gray-50">
          {results.map((result, idx) => (
            <div key={idx} className="p-4 hover:bg-gray-50">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    {result.accessible ? (
                      <CheckCircle2 className="w-4 h-4 text-green-600" />
                    ) : (
                      <XCircle className="w-4 h-4 text-red-600" />
                    )}
                    <span className="font-medium text-gray-900">{result.label}</span>
                    <span className="text-xs text-gray-400 font-mono">{result.path}</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-gray-500 ml-6">
                    <span>Module: <strong className={result.moduleEnabled ? 'text-green-600' : 'text-red-600'}>{result.module}</strong></span>
                    <span>Role: <strong className={result.roleAllowed ? 'text-green-600' : 'text-red-600'}>{result.roleAllowed ? 'OK' : 'Denied'}</strong></span>
                    <span>Permissions: <strong className={result.hasPermission ? 'text-green-600' : 'text-red-600'}>{result.hasPermission ? 'OK' : 'Missing'}</strong></span>
                  </div>
                  {result.issues.length > 0 && (
                    <div className="mt-2 ml-6 flex items-center gap-1 text-xs text-red-600">
                      <AlertCircle className="w-3 h-3" />
                      <span>{result.issues.join(', ')}</span>
                    </div>
                  )}
                </div>
                <button
                  onClick={() => navigate(result.path)}
                  disabled={!result.accessible}
                  className="px-3 py-1.5 text-xs font-medium border border-gray-200 rounded-lg disabled:opacity-50 hover:bg-gray-100"
                >
                  Test Route
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Enabled Modules */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h2 className="text-sm font-semibold text-gray-900 mb-3">Enabled Modules</h2>
        <div className="flex flex-wrap gap-2">
          {enabledModules.map(mod => (
            <span key={mod} className="px-3 py-1 text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200 rounded-lg">
              {mod}
            </span>
          ))}
          {enabledModules.length === 0 && (
            <span className="text-sm text-gray-400">No modules enabled - check tenant subscription</span>
          )}
        </div>
      </div>

      {/* Failed Checks */}
      {failedChecks.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-red-900 mb-3 flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            Context Failed Checks
          </h2>
          <div className="space-y-2">
            {failedChecks.map((check, idx) => (
              <div key={idx} className="text-sm text-red-700">
                <strong className="font-semibold">{check.check}:</strong> {check.message}
                {check.repairable && <span className="ml-2 text-xs bg-red-100 px-2 py-0.5 rounded">Repairable</span>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function StatusRow({ label, value, icon: Icon, success }) {
  return (
    <div className="flex items-center gap-2">
      <Icon className={`w-4 h-4 ${success === true ? 'text-green-600' : success === false ? 'text-red-600' : 'text-gray-400'}`} />
      <div>
        <p className="text-xs text-gray-500">{label}</p>
        <p className="text-sm font-medium text-gray-900">{value}</p>
      </div>
    </div>
  );
}