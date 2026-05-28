import { useState, useEffect } from 'react';
import { Wrench, X } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useGlobalContext } from '@/lib/GlobalContextEngine';
import { toast } from 'sonner';

export default function QuickMembershipRepair() {
  const { refreshContext, isTenantMode } = useGlobalContext();
  const [showPanel, setShowPanel] = useState(false);
  const [repairing, setRepairing] = useState(false);

  // Auto-show panel if context is unresolved
  useEffect(() => {
    const checkContext = () => {
      const unresolved = localStorage.getItem('context_unresolved');
      if (unresolved === 'true' && !isTenantMode) {
        setShowPanel(true);
      }
    };
    checkContext();
  }, [isTenantMode]);

  const handleRepair = async () => {
    setRepairing(true);
    try {
      const result = await base44.functions.invoke('resolveOrRepairTenantMembership', {});
      
      if (result.data.success) {
        toast.success('✅ Membership riparata! Ricaricamento...');
        refreshContext();
        setShowPanel(false);
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      } else {
        toast.error('Riparazione fallita: ' + result.data.reason);
      }
    } catch (error) {
      toast.error('Errore: ' + error.message);
    } finally {
      setRepairing(false);
    }
  };

  if (!showPanel) return null;

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 bg-white rounded-xl shadow-2xl border-2 border-orange-400 p-4 max-w-md w-full mx-4">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <Wrench className="w-5 h-5 text-orange-600" />
          <h3 className="font-semibold text-gray-900">Riparazione Emergenza</h3>
        </div>
        <button onClick={() => setShowPanel(false)} className="text-gray-400 hover:text-gray-600">
          <X className="w-4 h-4" />
        </button>
      </div>
      <p className="text-sm text-gray-600 mb-4">
        Il contesto tenant non è stato risolto. Il sistema può tentare di riparare automaticamente la tua membership.
      </p>
      <div className="flex gap-2">
        <button
          onClick={handleRepair}
          disabled={repairing}
          className="flex-1 px-4 py-2 text-sm text-white bg-orange-600 rounded-lg hover:bg-orange-700 disabled:opacity-50"
        >
          {repairing ? '⏳ Riparazione...' : '🔧 Ripara Ora'}
        </button>
        <button
          onClick={() => setShowPanel(false)}
          className="px-4 py-2 text-sm text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
        >
          Annulla
        </button>
      </div>
    </div>
  );
}