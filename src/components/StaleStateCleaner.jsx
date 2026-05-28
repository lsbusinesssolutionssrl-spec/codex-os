import { useState } from 'react';
import { useGlobalContext } from '@/lib/GlobalContextEngine';
import { Trash2, AlertTriangle, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

/**
 * STALE STATE CLEANER
 * Manual tool for platform owners to clear stale tenant/impersonation state
 */

export default function StaleStateCleaner() {
  const [cleaning, setCleaning] = useState(false);
  const [result, setResult] = useState(null);
  const globalContext = useGlobalContext();
  const { isPlatformMode, platformRole } = globalContext;

  // Only show to platform users
  if (!isPlatformMode || !['super_admin', 'developer', 'platform_owner', 'admin'].includes(platformRole)) {
    return null;
  }

  const cleanStaleState = () => {
    setCleaning(true);
    setResult(null);

    const staleKeys = [
      'impersonate_tenant_id',
      'selectedTenantId',
      'activeTenantId',
      'tenant_preview_mode',
      'active_membership_id',
      'impersonated_user_email',
      'lastTenantId',
      'preferredTenantId',
    ];

    const cleared = [];
    staleKeys.forEach(key => {
      const val = localStorage.getItem(key);
      if (val) {
        localStorage.removeItem(key);
        cleared.push({ key, previous_value: val });
      }
    });

    setResult({
      success: true,
      cleared_keys: cleared,
      remaining_keys: staleKeys.filter(k => !cleared.find(c => c.key === k)),
    });

    setCleaning(false);

    if (cleared.length > 0) {
      toast.success(`Cleared ${cleared.length} stale keys`);
      setTimeout(() => window.location.reload(), 1500);
    } else {
      toast.info('No stale keys found');
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-3">
      <div className="flex items-center gap-2 mb-2">
        <AlertTriangle className="w-4 h-4 text-orange-600" />
        <h3 className="text-sm font-bold text-gray-900">Stale State Cleaner</h3>
      </div>
      <p className="text-xs text-gray-600 mb-3">
        Clear all stale tenant/impersonation localStorage keys. Use this if platform mode is not loading correctly.
      </p>
      <button
        onClick={cleanStaleState}
        disabled={cleaning}
        className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50"
      >
        <Trash2 className="w-3 h-3" />
        {cleaning ? 'Cleaning...' : 'Clear Stale State'}
      </button>
      {result && (
        <div className="mt-3 p-2 bg-green-50 border border-green-200 rounded text-xs">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="w-3 h-3 text-green-600" />
            <span className="font-medium text-green-800">Cleanup Complete</span>
          </div>
          <div className="text-green-700">
            <div>Cleared: {result.cleared_keys.length} keys</div>
            {result.cleared_keys.length > 0 && (
              <div className="mt-1 font-mono text-[10px]">
                {result.cleared_keys.map(k => (
                  <div key={k.key}>{k.key}: {k.previous_value}</div>
                ))}
              </div>
            )}
            <div className="mt-1 text-green-600">
              Remaining: {result.remaining_keys.length} keys (all null)
            </div>
          </div>
        </div>
      )}
    </div>
  );
}