import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useGlobalContext } from '@/lib/GlobalContextEngine';
import { CheckCircle, XCircle, AlertCircle, Loader2 } from 'lucide-react';

/**
 * REGRESSION TEST RUNNER
 * Executes all regression tests from docs/REGRESSION_TEST_SUITE.md
 * Shows real-time test results in development mode
 */

export default function RegressionTestRunner() {
  const [tests, setTests] = useState([]);
  const [running, setRunning] = useState(false);
  const [summary, setSummary] = useState({ pass: 0, fail: 0, total: 0 });
  const globalContext = useGlobalContext();
  const { 
    user,
    platformRole,
    isPlatformMode,
    isImpersonating,
    contextType, 
    activeTenant, 
    activeTenantRole, 
    enabledModules, 
    permissions,
    tenantMemberships,
    isTenantMode,
    forceReload,
  } = globalContext;

  // CRITICAL: Show ONLY to platform users (admin/developer/platform_owner) in platform mode
  const isInternalUser = ['super_admin', 'developer', 'platform_owner', 'admin'].includes(platformRole) && isPlatformMode;
  
  // In platform mode: only run tenant tests when impersonating, otherwise show platform status
  const showPlatformMode = isPlatformMode && !isImpersonating;
  
  // Check if current user is platform owner (not tenant admin)
  const isPlatformOwner = user?.email === 'lsbusiness.solutions.srl@gmail.com';

  const runTests = async () => {
    setRunning(true);
    const results = [];
    let passCount = 0;
    let failCount = 0;

    // TEST A — TENANT CONTEXT
    const testA = {
      name: 'Test A: Tenant Context',
      checks: [
        { 
          name: 'context_type = tenant', 
          pass: contextType === 'tenant',
          expected: 'tenant',
          actual: contextType,
        },
        { 
          name: 'tenant_role = tenant_admin', 
          pass: activeTenantRole === 'tenant_admin',
          expected: 'tenant_admin',
          actual: activeTenantRole,
        },
        { 
          name: 'isTenantMode = true', 
          pass: isTenantMode,
          expected: 'true',
          actual: isTenantMode ? '✓' : '✗',
        },
        { 
          name: 'activeTenant exists', 
          pass: !!activeTenant?.id,
          expected: 'exists',
          actual: activeTenant?.id ? '✓' : '✗',
        },
        { 
          name: 'enabledModules >= 21', 
          pass: enabledModules.length >= 21,
          expected: '>= 21',
          actual: enabledModules.length,
        },
        { 
          name: 'permissions >= 80', 
          pass: permissions.length >= 80,
          expected: '>= 80',
          actual: permissions.length,
        },
      ],
    };
    const testAPass = testA.checks.every(c => c.pass);
    testA.pass = testAPass;
    if (testAPass) passCount++; else failCount++;
    results.push(testA);

    // TEST B — TEAM & MEMBERSHIP
    const testB = {
      name: 'Test B: Team & Membership',
      checks: [
        { 
          name: 'TenantMembership.count >= 1', 
          pass: tenantMemberships.length >= 1,
          expected: '>= 1',
          actual: tenantMemberships.length,
        },
        { 
          name: 'current user has membership', 
          pass: tenantMemberships.length > 0,
          expected: 'exists',
          actual: tenantMemberships.length > 0 ? '✓' : '✗',
        },
        { 
          name: 'membership.status = active', 
          pass: tenantMemberships.some(m => m.status === 'active'),
          expected: 'at least 1 active',
          actual: tenantMemberships.find(m => m.status === 'active') ? '✓' : '✗',
        },
      ],
    };
    const testBPass = testB.checks.every(c => c.pass);
    testB.pass = testBPass;
    if (testBPass) passCount++; else failCount++;
    results.push(testB);

    // TEST C — PLATFORM ISOLATION
    const testC = {
      name: 'Test C: Platform Isolation',
      checks: [
        { 
          name: 'isPlatformMode = false', 
          pass: !isPlatformMode,
          expected: 'false',
          actual: isPlatformMode ? 'true (FAIL)' : 'false',
        },
        { 
          name: 'isTenantMode = true', 
          pass: isTenantMode,
          expected: 'true',
          actual: isTenantMode ? '✓' : '✗',
        },
      ],
    };
    const testCPass = testC.checks.every(c => c.pass);
    testC.pass = testCPass;
    if (testCPass) passCount++; else failCount++;
    results.push(testC);

    // TEST D — TENANT ROUTES (basic check)
    const testD = {
      name: 'Test D: Tenant Routes Available',
      checks: [
        { 
          name: 'context resolved', 
          pass: globalContext.isContextResolved,
          expected: 'true',
          actual: globalContext.isContextResolved ? '✓' : '✗',
        },
        { 
          name: 'workspaceType set', 
          pass: !!globalContext.workspaceType,
          expected: 'set',
          actual: globalContext.workspaceType || '✗',
        },
      ],
    };
    const testDPass = testD.checks.every(c => c.pass);
    testD.pass = testDPass;
    if (testDPass) passCount++; else failCount++;
    results.push(testD);

    setTests(results);
    setSummary({ pass: passCount, fail: failCount, total: passCount + failCount });
    setRunning(false);
  };

  // Auto-run tests on mount (only when in tenant mode)
  useEffect(() => {
    if (!showPlatformMode && !isPlatformOwner) {
      runTests();
    }
  }, []);

  // Don't render if not internal user
  if (!isInternalUser) return null;
  
  // Show platform mode message for platform owner or when in platform mode
  if (showPlatformMode || isPlatformOwner) {
    return (
      <div className="fixed bottom-4 left-4 z-50 bg-white rounded-lg shadow-xl border-2 border-blue-200 max-w-md px-4 py-3">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-sm font-bold text-blue-700">🏢 Platform Mode</span>
          <span className="text-xs px-2 py-0.5 rounded bg-blue-100 text-blue-600 font-medium">ACTIVE</span>
        </div>
        <p className="text-xs text-gray-500 mb-2">
          Logged in as: <strong className="text-gray-700">{user?.email}</strong>
        </p>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-2">
          <p className="text-xs text-yellow-800">
            <strong>⚠️ Regression tests require tenant admin login.</strong>
          </p>
          <p className="text-xs text-yellow-700 mt-1">
            Please login as <strong>amministrazione@lsbusiness.it</strong> to run tenant regression tests.
          </p>
        </div>
      </div>
    );
  }

  const allPass = summary.fail === 0;

  return (
    <div className="fixed bottom-4 left-4 z-50 bg-white rounded-lg shadow-xl border-2 border-gray-200 max-w-md max-h-96 overflow-auto">
      <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
        <h3 className="font-bold text-gray-900">🧪 Regression Tests</h3>
        <div className="flex items-center gap-2">
          <span className={`text-xs font-bold px-2 py-1 rounded ${
            allPass ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
          }`}>
            {summary.pass}/{summary.total} PASS
          </span>
          <button
            onClick={runTests}
            disabled={running}
            className="p-1.5 text-gray-600 hover:bg-gray-100 rounded"
            title="Re-run tests"
          >
            {running ? <Loader2 className="w-4 h-4 animate-spin" /> : '🔄'}
          </button>
          <button
            onClick={forceReload}
            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"
            title="Force reload context"
          >
            🔄
          </button>
        </div>
      </div>
      
      <div className="p-3 space-y-3">
        {tests.map(test => (
          <div key={test.name} className="border border-gray-200 rounded-lg">
            <div className={`px-3 py-2 flex items-center justify-between ${
              test.pass ? 'bg-green-50' : 'bg-red-50'
            }`}>
              <span className={`text-sm font-bold ${
                test.pass ? 'text-green-700' : 'text-red-700'
              }`}>
                {test.pass ? '✓' : '✗'} {test.name}
              </span>
            </div>
            {!test.pass && (
              <div className="p-2 bg-white">
                {test.checks.filter(c => !c.pass).map((check, i) => (
                  <div key={i} className="text-xs text-red-600 mb-1">
                    <AlertCircle className="w-3 h-3 inline mr-1" />
                    {check.name}: expected <strong>{check.expected}</strong>, got <strong>{check.actual}</strong>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {allPass && (
        <div className="px-4 py-2 bg-green-50 border-t border-green-200">
          <p className="text-xs text-green-700 font-medium flex items-center gap-1">
            <CheckCircle className="w-3 h-3" />
            All regression tests passed - system stable
          </p>
        </div>
      )}

      {!allPass && (
        <div className="px-4 py-2 bg-red-50 border-t border-red-200">
          <p className="text-xs text-red-700 font-medium flex items-center gap-1">
            <XCircle className="w-3 h-3" />
            Regression detected - DO NOT DEPLOY
          </p>
          <p className="text-xs text-red-600 mt-1">
            {summary.fail} test(s) failed. Rollback required.
          </p>
        </div>
      )}
    </div>
  );
}