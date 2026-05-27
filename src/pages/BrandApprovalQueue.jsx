import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  CheckCircle, X, Eye, Clock, AlertCircle, ArrowLeft,
  FileText, Palette, TrendingUp
} from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import BrandPreviewModal from '@/components/brand/BrandPreviewModal';

export default function BrandApprovalQueue() {
  const navigate = useNavigate();
  const [pendingThemes, setPendingThemes] = useState([]);
  const [selectedTheme, setSelectedTheme] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    loadPendingThemes();
  }, []);

  const loadPendingThemes = async () => {
    try {
      const themes = await base44.entities.BrandTheme.filter({ 
        status: 'Pending Approval' 
      }, '-submitted_at');
      setPendingThemes(themes);
    } catch (error) {
      console.error('Error loading pending themes:', error);
      toast.error('Errore caricamento richieste');
    } finally {
      setLoading(false);
    }
  };

  const approveTheme = async (theme) => {
    setProcessing(true);
    try {
      await base44.entities.BrandTheme.update(theme.id, {
        status: 'Approved',
        approved_by: (await base44.auth.me())?.email || 'admin',
        approved_at: new Date().toISOString()
      });

      await base44.entities.BrandAuditLog.create({
        company_id: theme.company_id,
        brand_theme_id: theme.id,
        event_type: 'theme_approved',
        description: `Brand theme "${theme.theme_name}" approved`,
        performed_by: (await base44.auth.me())?.email || 'admin',
        new_version: theme.version
      });

      toast.success('Tema approvato');
      loadPendingThemes();
      setSelectedTheme(null);
    } catch (error) {
      toast.error('Errore approvazione');
    } finally {
      setProcessing(false);
    }
  };

  const rejectTheme = async (theme, reason = 'Non specificato') => {
    setProcessing(true);
    try {
      await base44.entities.BrandTheme.update(theme.id, {
        status: 'Rejected',
        rejection_reason: reason
      });

      await base44.entities.BrandAuditLog.create({
        company_id: theme.company_id,
        brand_theme_id: theme.id,
        event_type: 'theme_rejected',
        description: `Brand theme "${theme.theme_name}" rejected: ${reason}`,
        performed_by: (await base44.auth.me())?.email || 'admin',
        new_version: theme.version
      });

      toast.success('Tema rifiutato');
      loadPendingThemes();
      setSelectedTheme(null);
    } catch (error) {
      toast.error('Errore rifiuto');
    } finally {
      setProcessing(false);
    }
  };

  const requestRevision = async (theme, reason) => {
    setProcessing(true);
    try {
      await base44.entities.BrandTheme.update(theme.id, {
        status: 'Needs Revision',
        rejection_reason: reason
      });

      await base44.entities.BrandAuditLog.create({
        company_id: theme.company_id,
        brand_theme_id: theme.id,
        event_type: 'theme_revised',
        description: `Brand theme "${theme.theme_name}" sent back for revision: ${reason}`,
        performed_by: (await base44.auth.me())?.email || 'admin',
        new_version: theme.version
      });

      toast.success('Richieste revisioni');
      loadPendingThemes();
      setSelectedTheme(null);
    } catch (error) {
      toast.error('Errore richiesta revisione');
    } finally {
      setProcessing(false);
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
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/super-admin')} className="p-2 rounded-lg hover:bg-gray-100">
          <ArrowLeft className="w-4 h-4 text-gray-600" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Brand Approval Queue</h1>
          <p className="text-sm text-gray-500">{pendingThemes.length} richieste in attesa</p>
        </div>
      </div>

      {pendingThemes.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">All Caught Up!</h2>
          <p className="text-gray-500">No pending brand approval requests</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Theme List */}
          <div className="space-y-4">
            {pendingThemes.map(theme => (
              <div
                key={theme.id}
                onClick={() => setSelectedTheme(theme)}
                className={`p-5 rounded-xl border-2 cursor-pointer transition-all ${
                  selectedTheme?.id === theme.id 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    {theme.logo_url ? (
                      <img src={theme.logo_url} alt="" className="w-12 h-12 object-contain rounded-lg border bg-white" />
                    ) : (
                      <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center">
                        <Palette className="w-6 h-6 text-gray-400" />
                      </div>
                    )}
                    <div>
                      <h3 className="font-semibold text-gray-900">{theme.theme_name}</h3>
                      <p className="text-sm text-gray-500">v{theme.version} · {theme.tier}</p>
                    </div>
                  </div>
                  <Clock className="w-5 h-5 text-amber-500" />
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Submitted by {theme.submitted_by}</span>
                  <span className="text-gray-400">
                    {new Date(theme.submitted_at).toLocaleDateString('it-IT')}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Theme Details */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            {selectedTheme ? (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="font-semibold text-lg">{selectedTheme.theme_name}</h2>
                  <button
                    onClick={() => setShowPreview(true)}
                    className="flex items-center gap-2 px-3 py-1.5 text-sm text-white rounded-lg"
                    style={{ backgroundColor: '#1147FF' }}
                  >
                    <Eye className="w-4 h-4" />
                    Preview
                  </button>
                </div>

                {/* Theme Info */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm text-gray-500">Tier</span>
                    <span className="text-sm font-medium capitalize">{selectedTheme.tier}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm text-gray-500">Submitted</span>
                    <span className="text-sm font-medium">
                      {new Date(selectedTheme.submitted_at).toLocaleString('it-IT')}
                    </span>
                  </div>
                  {selectedTheme.changes && (
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <p className="text-xs font-semibold text-blue-700 mb-2">Changes:</p>
                      <pre className="text-xs text-blue-600 whitespace-pre-wrap">
                        {JSON.stringify(selectedTheme.changes, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>

                {/* Color Tokens */}
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <Palette className="w-4 h-4" />
                    Color Tokens
                  </h3>
                  <div className="grid grid-cols-3 gap-2">
                    {Object.entries(selectedTheme.colors || {}).map(([key, value]) => (
                      <div key={key} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                        <div className="w-6 h-6 rounded border" style={{ backgroundColor: value }} />
                        <span className="text-xs font-mono">{key}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="pt-4 border-t border-gray-200 space-y-3">
                  <button
                    onClick={() => approveTheme(selectedTheme)}
                    disabled={processing}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm text-white rounded-lg font-medium disabled:opacity-40"
                    style={{ backgroundColor: '#10B981' }}
                  >
                    <CheckCircle className="w-4 h-4" />
                    Approve
                  </button>
                  <button
                    onClick={() => {
                      const reason = prompt('Motivazione rifiuto:');
                      if (reason) rejectTheme(selectedTheme, reason);
                    }}
                    disabled={processing}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm text-white rounded-lg font-medium disabled:opacity-40"
                    style={{ backgroundColor: '#EF4444' }}
                  >
                    <X className="w-4 h-4" />
                    Reject
                  </button>
                  <button
                    onClick={() => {
                      const reason = prompt('Motivazione revisione:');
                      if (reason) requestRevision(selectedTheme, reason);
                    }}
                    disabled={processing}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm text-amber-700 border border-amber-200 rounded-lg font-medium hover:bg-amber-50 disabled:opacity-40"
                  >
                    <AlertCircle className="w-4 h-4" />
                    Request Revision
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center text-gray-400 py-12">
                <FileText className="w-12 h-12 mx-auto mb-3" />
                <p>Select a theme to review</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {selectedTheme && showPreview && (
        <BrandPreviewModal 
          form={selectedTheme} 
          onClose={() => setShowPreview(false)} 
        />
      )}
    </div>
  );
}