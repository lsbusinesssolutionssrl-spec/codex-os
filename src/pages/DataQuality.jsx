import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  AlertTriangle, CheckCircle2, XCircle, AlertCircle, 
  FileText, Image, Calendar, Users, Package, TrendingUp,
  BarChart2, Zap, Target, Eye, Shield, AlertOctagon
} from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export default function DataQuality() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [qualityScore, setQualityScore] = useState(100);
  const [issues, setIssues] = useState([]);
  const [metrics, setMetrics] = useState({
    missingProjectManager: 0,
    missingCosts: 0,
    incompleteEstimates: 0,
    missingPhotos: 0,
    orphanDocuments: 0,
    invalidDates: 0,
    duplicateClients: 0,
    duplicateProperties: 0,
    missingWarranties: 0,
    incompleteHomePassports: 0,
  });

  useEffect(() => {
    loadDataQuality();
  }, []);

  const loadDataQuality = async () => {
    try {
      const [projects, estimates, clients, properties, documents, equipment] = await Promise.all([
        base44.entities.Project.list(),
        base44.entities.Estimate.list(),
        base44.entities.Client.list(),
        base44.entities.Property.list(),
        base44.entities.Document.list(),
        base44.entities.PropertyEquipment.list().catch(() => []),
      ]);

      const issues = [];
      let score = 100;

      // Missing project manager
      const missingPM = projects.filter(p => !p.project_manager);
      if (missingPM.length > 0) {
        issues.push({
          type: 'warning',
          category: 'Project',
          message: `${missingPM.length} progetti senza PM`,
          count: missingPM.length,
          fix: 'Assegna un project manager',
        });
        score -= Math.min(10, missingPM.length);
      }

      // Missing costs
      const missingCosts = projects.filter(p => 
        !p.material_costs || !p.labor_costs || !p.other_costs
      );
      if (missingCosts.length > 0) {
        issues.push({
          type: 'critical',
          category: 'Financial',
          message: `${missingCosts.length} progetti senza costi completi`,
          count: missingCosts.length,
          fix: 'Completa i costi del progetto',
        });
        score -= Math.min(15, missingCosts.length * 2);
      }

      // Incomplete estimates
      const incompleteEstimates = estimates.filter(e => 
        e.status === 'Draft' && (!e.revenue || !e.total_costs)
      );
      if (incompleteEstimates.length > 0) {
        issues.push({
          type: 'warning',
          category: 'Estimates',
          message: `${incompleteEstimates.length} preventivi incompleti`,
          count: incompleteEstimates.length,
          fix: 'Completa i preventivi in bozza',
        });
        score -= Math.min(8, incompleteEstimates.length);
      }

      // Missing photos
      const missingPhotos = projects.filter(p => 
        !p.photos_before || p.photos_before.length === 0
      );
      if (missingPhotos.length > 0) {
        issues.push({
          type: 'info',
          category: 'Documentation',
          message: `${missingPhotos.length} progetti senza foto`,
          count: missingPhotos.length,
          fix: 'Carica foto del progetto',
        });
        score -= Math.min(5, missingPhotos.length);
      }

      // Orphan documents
      const orphanDocs = documents.filter(d => 
        !d.project_id && !d.client_id && !d.property_id
      );
      if (orphanDocs.length > 0) {
        issues.push({
          type: 'warning',
          category: 'Documents',
          message: `${orphanDocs.length} documenti orfani`,
          count: orphanDocs.length,
          fix: 'Collega i documenti a entità',
        });
        score -= Math.min(8, orphanDocs.length);
      }

      // Invalid dates
      const invalidDates = projects.filter(p => {
        if (!p.start_date || !p.expected_end_date) return false;
        const start = new Date(p.start_date);
        const end = new Date(p.expected_end_date);
        return start > end;
      });
      if (invalidDates.length > 0) {
        issues.push({
          type: 'critical',
          category: 'Data',
          message: `${invalidDates.length} progetti con date invalide`,
          count: invalidDates.length,
          fix: 'Correggi le date del progetto',
        });
        score -= Math.min(10, invalidDates.length * 2);
      }

      // Duplicate clients
      const clientMap = {};
      clients.forEach(c => {
        const key = (c.email || c.tax_id || '').toLowerCase();
        if (key) {
          clientMap[key] = (clientMap[key] || 0) + 1;
        }
      });
      const duplicateClients = Object.values(clientMap).filter(count => count > 1).length;
      if (duplicateClients > 0) {
        issues.push({
          type: 'warning',
          category: 'Clients',
          message: `${duplicateClients} clienti duplicati`,
          count: duplicateClients,
          fix: 'Unisci i clienti duplicati',
        });
        score -= Math.min(8, duplicateClients * 2);
      }

      // Duplicate properties
      const propMap = {};
      properties.forEach(p => {
        const key = (p.address + p.property_name).toLowerCase();
        propMap[key] = (propMap[key] || 0) + 1;
      });
      const duplicateProperties = Object.values(propMap).filter(count => count > 1).length;
      if (duplicateProperties > 0) {
        issues.push({
          type: 'warning',
          category: 'Properties',
          message: `${duplicateProperties} proprietà duplicate`,
          count: duplicateProperties,
          fix: 'Unisci le proprietà duplicate',
        });
        score -= Math.min(8, duplicateProperties * 2);
      }

      // Missing warranties
      const missingWarranties = equipment.filter(e => !e.warranty_expiration);
      if (missingWarranties.length > 0) {
        issues.push({
          type: 'info',
          category: 'Equipment',
          message: `${missingWarranties.length} equipaggiamenti senza garanzia`,
          count: missingWarranties.length,
          fix: 'Aggiungi scadenze garanzia',
        });
        score -= Math.min(5, missingWarranties);
      }

      score = Math.max(0, Math.min(100, score));

      setQualityScore(score);
      setIssues(issues);
      setMetrics({
        missingProjectManager: missingPM.length,
        missingCosts: missingCosts.length,
        incompleteEstimates: incompleteEstimates.length,
        missingPhotos: missingPhotos.length,
        orphanDocuments: orphanDocs.length,
        invalidDates: invalidDates.length,
        duplicateClients,
        duplicateProperties,
        missingWarranties: missingWarranties.length,
        incompleteHomePassports: properties.filter(p => !p.year_built || !p.type).length,
      });

    } catch (error) {
      console.error('Error loading data quality:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-6 text-center text-gray-400">Caricamento...</div>;

  const scoreColor = qualityScore >= 80 ? '#10B981' : qualityScore >= 60 ? '#F59E0B' : '#EF4444';
  const scoreLabel = qualityScore >= 80 ? 'Eccellente' : qualityScore >= 60 ? 'Buono' : qualityScore >= 40 ? 'Mediocre' : 'Critico';

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Target className="w-6 h-6 text-blue-600" />
            Data Quality Engine
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">Monitoraggio qualità dati operativi</p>
        </div>
        <button 
          onClick={loadDataQuality}
          className="flex items-center gap-2 px-3 py-1.5 text-sm border border-gray-200 rounded-lg hover:bg-gray-50"
        >
          <Zap className="w-3.5 h-3.5" />
          Refresh
        </button>
      </div>

      {/* Quality Score */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <div className="flex items-center gap-6">
          <div className="relative w-32 h-32">
            <svg className="w-32 h-32 transform -rotate-90">
              <circle cx="64" cy="64" r="56" stroke="#E5E7EB" strokeWidth="16" fill="none" />
              <circle
                cx="64"
                cy="64"
                r="56"
                stroke={scoreColor}
                strokeWidth="16"
                fill="none"
                strokeDasharray={`${(qualityScore / 100) * 351.68} 351.68`}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <span className="text-3xl font-bold" style={{ color: scoreColor }}>{qualityScore}</span>
                <p className="text-xs text-gray-500 mt-0.5">/ 100</p>
              </div>
            </div>
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-bold text-gray-900 mb-2">Data Quality Score</h2>
            <p className="text-sm text-gray-600 mb-4">Qualità complessiva dei dati operativi</p>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: scoreColor }} />
              <span className="text-sm font-semibold" style={{ color: scoreColor }}>{scoreLabel}</span>
            </div>
            <div className="grid grid-cols-5 gap-3 text-sm">
              <MetricItem label="PM Mancanti" value={metrics.missingProjectManager} />
              <MetricItem label="Costi Mancanti" value={metrics.missingCosts} />
              <MetricItem label="Preventivi" value={metrics.incompleteEstimates} />
              <MetricItem label="Foto Mancanti" value={metrics.missingPhotos} />
              <MetricItem label="Doc Orfani" value={metrics.orphanDocuments} />
            </div>
          </div>
          <div className="w-px h-32 bg-gray-200" />
          <div className="space-y-3">
            <IssueBadge type="critical" count={issues.filter(i => i.type === 'critical').length} label="Critici" />
            <IssueBadge type="warning" count={issues.filter(i => i.type === 'warning').length} label="Warning" />
            <IssueBadge type="info" count={issues.filter(i => i.type === 'info').length} label="Info" />
          </div>
        </div>
      </div>

      {/* Issues List */}
      {issues.length > 0 ? (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-gray-900">Problemi Rilevati ({issues.length})</h3>
          {issues.map((issue, idx) => (
            <div
              key={idx}
              className={`flex items-start gap-3 p-4 rounded-xl border ${
                issue.type === 'critical' ? 'bg-red-50 border-red-200' :
                issue.type === 'warning' ? 'bg-amber-50 border-amber-200' :
                'bg-blue-50 border-blue-200'
              }`}
            >
              {issue.type === 'critical' ? <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" /> :
               issue.type === 'warning' ? <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" /> :
               <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />}
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                    issue.type === 'critical' ? 'bg-red-200 text-red-700' :
                    issue.type === 'warning' ? 'bg-amber-200 text-amber-700' :
                    'bg-blue-200 text-blue-700'
                  }`}>
                    {issue.category}
                  </span>
                  <span className="text-xs font-bold text-gray-500">{issue.count}</span>
                </div>
                <p className={`text-sm font-medium ${
                  issue.type === 'critical' ? 'text-red-700' :
                  issue.type === 'warning' ? 'text-amber-700' :
                  'text-blue-700'
                }`}>{issue.message}</p>
                <p className="text-xs text-gray-500 mt-1">Fix: {issue.fix}</p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-center">
          <CheckCircle2 className="w-12 h-12 text-green-600 mx-auto mb-3" />
          <p className="text-green-700 font-semibold">Nessun problema rilevato</p>
          <p className="text-sm text-green-600 mt-1">Qualità dati ottimale</p>
        </div>
      )}

      {/* Additional Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <MetricCard label="Date Inv." value={metrics.invalidDates} icon={Calendar} color="#EF4444" />
        <MetricCard label="Clienti Dup." value={metrics.duplicateClients} icon={Users} color="#F59E0B" />
        <MetricCard label="Prop. Dup." value={metrics.duplicateProperties} icon={Package} color="#F59E0B" />
        <MetricCard label="Senza Garanzia" value={metrics.missingWarranties} icon={Shield} color="#3B82F6" />
        <MetricCard label="Home Passport Inc." value={metrics.incompleteHomePassports} icon={FileText} color="#8B5CF6" />
      </div>
    </div>
  );
}

function MetricItem({ label, value }) {
  return (
    <div>
      <p className="text-gray-500">{label}</p>
      <p className="font-bold text-gray-900">{value}</p>
    </div>
  );
}

function IssueBadge({ type, count, label }) {
  const colors = {
    critical: { bg: 'bg-red-100', text: 'text-red-700', dot: '#EF4444' },
    warning: { bg: 'bg-amber-100', text: 'text-amber-700', dot: '#F59E0B' },
    info: { bg: 'bg-blue-100', text: 'text-blue-700', dot: '#3B82F6' },
  }[type];

  return (
    <div className={`flex items-center justify-between px-3 py-2 rounded-lg ${colors.bg}`}>
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: colors.dot }} />
        <span className={`text-xs font-medium ${colors.text}`}>{label}</span>
      </div>
      <span className={`text-xs font-bold ${colors.text}`}>{count}</span>
    </div>
  );
}

function MetricCard({ label, value, icon: Icon, color }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <div className="flex items-center gap-2 mb-2">
        <Icon className="w-4 h-4 flex-shrink-0" style={{ color }} />
        <span className="text-xs text-gray-500 font-medium">{label}</span>
      </div>
      <p className="text-xl font-bold text-gray-900">{value}</p>
    </div>
  );
}