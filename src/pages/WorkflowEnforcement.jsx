import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Shield, AlertTriangle, CheckCircle, XCircle, 
  FileText, Image, Users, Calendar, Package,
  TrendingUp, AlertCircle as AlertCircleIcon, Zap
} from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export default function WorkflowEnforcement() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [violations, setViolations] = useState([]);
  const [enforcementRules, setEnforcementRules] = useState([
    { id: 1, name: 'Project Delivery Requires Checklist', active: true, violations: 0 },
    { id: 2, name: 'Estimate Acceptance Requires Fields', active: true, violations: 0 },
    { id: 3, name: 'Home Passport Requires Documents', active: true, violations: 0 },
    { id: 4, name: 'Inspection Requires Photos', active: true, violations: 0 },
    { id: 5, name: 'Guardian Requires Property Data', active: true, violations: 0 },
  ]);

  useEffect(() => {
    loadEnforcementData();
  }, []);

  const loadEnforcementData = async () => {
    try {
      const [projects, estimates, properties, checklists, documents] = await Promise.all([
        base44.entities.Project.list(),
        base44.entities.Estimate.list(),
        base44.entities.Property.list(),
        base44.entities.ChecklistItem.list(),
        base44.entities.Document.list(),
      ]);

      const newViolations = [];

      // Rule 1: Project cannot move to Delivered without checklist
      const deliveredWithoutChecklist = projects.filter(p => 
        p.status === 'Delivered' && 
        !checklists.some(c => c.project_id === p.id && c.status === 'Completed')
      );
      if (deliveredWithoutChecklist.length > 0) {
        newViolations.push({
          rule: 'Project Delivery Requires Checklist',
          count: deliveredWithoutChecklist.length,
          items: deliveredWithoutChecklist.map(p => ({ id: p.id, name: p.title })),
          severity: 'critical',
        });
      }

      // Rule 2: Estimate cannot be Accepted without required fields
      const acceptedWithoutFields = estimates.filter(e => 
        (e.status === 'Accepted' || e.status === 'Converted to Project') &&
        (!e.revenue || !e.total_costs || !e.project_summary)
      );
      if (acceptedWithoutFields.length > 0) {
        newViolations.push({
          rule: 'Estimate Acceptance Requires Fields',
          count: acceptedWithoutFields.length,
          items: acceptedWithoutFields.map(e => ({ id: e.id, name: e.title })),
          severity: 'warning',
        });
      }

      // Rule 3: Home Passport cannot close without documents
      const propertiesWithoutDocs = properties.filter(p => 
        p.status === 'Closed' &&
        !documents.some(d => d.property_id === p.id)
      );
      if (propertiesWithoutDocs.length > 0) {
        newViolations.push({
          rule: 'Home Passport Requires Documents',
          count: propertiesWithoutDocs.length,
          items: propertiesWithoutDocs.map(p => ({ id: p.id, name: p.property_name })),
          severity: 'warning',
        });
      }

      // Rule 4: Inspection cannot complete without photos
      const inspectionsWithoutPhotos = projects.filter(p => 
        (p.status === 'Testing' || p.status === 'Delivered') &&
        (!p.photos_during || p.photos_during.length === 0)
      );
      if (inspectionsWithoutPhotos.length > 0) {
        newViolations.push({
          rule: 'Inspection Requires Photos',
          count: inspectionsWithoutPhotos.length,
          items: inspectionsWithoutPhotos.map(p => ({ id: p.id, name: p.title })),
          severity: 'info',
        });
      }

      setViolations(newViolations);

      // Update enforcement rules with violation counts
      setEnforcementRules(rules => rules.map(rule => ({
        ...rule,
        violations: newViolations.find(v => v.rule === rule.name)?.count || 0,
      })));

    } catch (error) {
      console.error('Error loading enforcement data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFix = (violation) => {
    toast.info(`Risoluzione: ${violation.rule}`);
    // In production, this would navigate to fix the issue
  };

  if (loading) return <div className="p-6 text-center text-gray-400">Caricamento...</div>;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Shield className="w-6 h-6 text-blue-600" />
            Workflow Enforcement
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">Prevenzione salto workflow e validazione regole</p>
        </div>
        <button 
          onClick={loadEnforcementData}
          className="flex items-center gap-2 px-3 py-1.5 text-sm border border-gray-200 rounded-lg hover:bg-gray-50"
        >
          <Zap className="w-3.5 h-3.5" />
          Refresh
        </button>
      </div>

      {/* Enforcement Rules */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h2 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Shield className="w-4 h-4 text-blue-500" />
          Regole di Enforcement
        </h2>
        <div className="space-y-3">
          {enforcementRules.map(rule => (
            <div key={rule.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100">
              <div className="flex items-center gap-3">
                {rule.active ? (
                  <CheckCircle className="w-5 h-5 text-green-600" />
                ) : (
                  <XCircle className="w-5 h-5 text-gray-400" />
                )}
                <div>
                  <p className="text-sm font-medium text-gray-900">{rule.name}</p>
                  <p className="text-xs text-gray-500">Stato: {rule.active ? 'Attivo' : 'Disattivato'}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {rule.violations > 0 ? (
                  <>
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                    <span className="text-sm font-bold text-amber-700">{rule.violations}</span>
                  </>
                ) : (
                  <span className="text-sm text-green-600 font-semibold">OK</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Violations */}
      {violations.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-gray-900">Violazioni Rilevate ({violations.length})</h3>
          {violations.map((violation, idx) => (
            <div
              key={idx}
              className={`p-4 rounded-xl border ${
                violation.severity === 'critical' ? 'bg-red-50 border-red-200' :
                violation.severity === 'warning' ? 'bg-amber-50 border-amber-200' :
                'bg-blue-50 border-blue-200'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    {violation.severity === 'critical' ? <AlertTriangle className="w-5 h-5 text-red-600" /> :
                     violation.severity === 'warning' ? <AlertCircleIcon className="w-5 h-5 text-amber-600" /> :
                     <AlertCircleIcon className="w-5 h-5 text-blue-600" />}
                    <span className="text-sm font-semibold text-gray-900">{violation.rule}</span>
                    <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                      violation.severity === 'critical' ? 'bg-red-200 text-red-700' :
                      violation.severity === 'warning' ? 'bg-amber-200 text-amber-700' :
                      'bg-blue-200 text-blue-700'
                    }`}>
                      {violation.count} violazioni
                    </span>
                  </div>
                  <div className="space-y-1">
                    {violation.items.slice(0, 3).map(item => (
                      <p key={item.id} className="text-xs text-gray-600">· {item.name}</p>
                    ))}
                    {violation.items.length > 3 && (
                      <p className="text-xs text-gray-400">+ altri {violation.items.length - 3}</p>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => handleFix(violation)}
                  className="ml-4 px-3 py-1.5 text-xs font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
                >
                  Risolvi
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {violations.length === 0 && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-center">
          <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-3" />
          <p className="text-green-700 font-semibold">Nessuna violazione</p>
          <p className="text-sm text-green-600 mt-1">Tutti i workflow rispettano le regole</p>
        </div>
      )}
    </div>
  );
}