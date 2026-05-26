import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Database, GitBranch, AlertTriangle, CheckCircle, XCircle, TrendingUp, Layers, Zap, Target, Shield, AlertCircle, FileText, Box, Link2, AlertOctagon } from 'lucide-react';
import { base44 } from '@/api/base44Client';

export default function ArchitectureReview() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [audit, setAudit] = useState(null);

  useEffect(() => {
    runAudit();
  }, []);

  const runAudit = async () => {
    const entities = await Promise.all([
      base44.entities.Estimate.list(),
      base44.entities.Project.list(),
      base44.entities.Client.list(),
      base44.entities.Property.list(),
      base44.entities.ProjectCost.list(),
      base44.entities.Timesheet.list(),
      base44.entities.PurchaseOrder.list(),
      base44.entities.Supplier.list(),
      base44.entities.SupportTicket.list(),
      base44.entities.GuardianSubscription.list(),
      base44.entities.ChecklistItem.list(),
      base44.entities.Document.list(),
      base44.entities.SOPTemplate.list(),
      base44.entities.EstimatePreset.list(),
      base44.entities.EstimateTemplate.list(),
      base44.entities.FinancialAlert.list(),
      base44.entities.KnowledgeBase.list(),
      base44.entities.ProjectLearning.list(),
      base44.entities.IntelligenceInsight.list(),
    ]);

    const [
      estimates, projects, clients, properties, projectCosts, timesheets, 
      purchaseOrders, suppliers, tickets, guardians, checklists, documents,
      sopTemplates, estimatePresets, estimateTemplates, financialAlerts,
      knowledgeBase, projectLearning, intelligenceInsights
    ] = entities;

    // ANALYSIS
    const issues = [];
    const duplicatedFields = [];
    const duplicatedLogic = [];
    const inconsistentNaming = [];
    const brokenWorkflows = [];
    const unusedTables = [];
    const permissionIssues = [];
    const navigationIssues = [];
    const optimizationOpportunities = [];

    // 1. DUPLICATED FIELDS
    // Estimate vs Project: contract_value/revenue, costs
    if (estimates.length > 0 && projects.length > 0) {
      duplicatedFields.push({
        severity: 'Medium',
        field: 'contract_value / revenue',
        entities: ['Estimate', 'Project'],
        recommendation: 'Unificare in "contract_value" o usare relazione Estimate → Project',
      });

      duplicatedFields.push({
        severity: 'Medium',
        field: 'material_costs, labor_costs, other_costs',
        entities: ['Estimate', 'Project'],
        recommendation: 'Project dovrebbe ereditare da Estimate accettato, non duplicare',
      });

      duplicatedFields.push({
        severity: 'Medium',
        field: 'gross_margin, gross_margin_pct',
        entities: ['Estimate', 'Project'],
        recommendation: 'Calcolare automaticamente, non memorizzare',
      });
    }

    // 2. INCONSISTENT NAMING
    const fieldNames = new Set();
    [...estimates, ...projects].forEach(e => {
      Object.keys(e).forEach(k => fieldNames.add(k));
    });

    if (fieldNames.has('payment_collected') && fieldNames.has('total_collected')) {
      inconsistentNaming.push({
        severity: 'Low',
        issue: 'payment_collected vs total_collected',
        entities: ['Project'],
        recommendation: 'Usare solo "total_collected"',
      });
    }

    // 3. BROKEN WORKFLOWS
    const estimatesWithoutConversion = estimates.filter(e => 
      e.status === 'Accepted' && !e.converted_to_project
    );
    
    if (estimatesWithoutConversion.length > 0) {
      brokenWorkflows.push({
        severity: 'High',
        workflow: 'Estimate → Project Conversion',
        issue: `${estimatesWithoutConversion.length} preventivi accettati non convertiti in progetti`,
        recommendation: 'Aggiungere automazione o button "Converti in Progetto"',
      });
    }

    // Check for projects without estimate reference
    const projectsWithoutEstimate = projects.filter(p => !p.estimate_id);
    if (projectsWithoutEstimate.length > 0) {
      brokenWorkflows.push({
        severity: 'Medium',
        workflow: 'Project ← Estimate Link',
        issue: `${projectsWithoutEstimate.length} progetti senza riferimento al preventivo`,
        recommendation: 'Aggiungere campo estimate_id a Project',
      });
    }

    // 4. UNUSED TABLES
    if (sopTemplates.length === 0) {
      unusedTables.push({
        table: 'SOPTemplate',
        reason: '0 record. Valutare se rimuovere o incentivare uso',
      });
    }

    if (estimateTemplates.length === 0) {
      unusedTables.push({
        table: 'EstimateTemplate',
        reason: '0 record. Duplicato con EstimatePreset?',
      });
    }

    // 5. PERMISSION ISSUES
    permissionIssues.push({
      severity: 'Medium',
      issue: 'Clienti possono vedere tutti i progetti?',
      recommendation: 'Implementare RLS (Row Level Security) per client portal',
    });

    permissionIssues.push({
      severity: 'High',
      issue: 'Technician possono modificare margini?',
      recommendation: 'Limitare edit campi finanziari a admin/PM',
    });

    // 6. NAVIGATION ISSUES
    navigationIssues.push({
      severity: 'Low',
      issue: 'Nessun breadcrumb nelle pagine dettaglio',
      recommendation: 'Aggiungere breadcrumb navigation',
    });

    navigationIssues.push({
      severity: 'Medium',
      issue: 'Client Portal isolato senza link a Dashboard',
      recommendation: 'Aggiungere "Torna alla Dashboard" per admin che testano',
    });

    // 7. OPTIMIZATION OPPORTUNITIES
    optimizationOpportunities.push({
      impact: 'High',
      opportunity: 'Calcoli on-the-fly',
      description: 'Rimuovere gross_margin, gross_margin_pct dalle entità. Calcolare in frontend o con funzione dedicata',
      benefit: 'Riduzione duplicazione dati, consistenza garantita',
    });

    optimizationOpportunities.push({
      impact: 'High',
      opportunity: 'Relazioni esplicite',
      description: 'Aggiungere estimate_id a Project, project_id a GuardianSubscription',
      benefit: 'Traceability completa del flusso Estimate → Project → Guardian',
    });

    optimizationOpportunities.push({
      impact: 'Medium',
      opportunity: 'Unificare EstimatePreset ed EstimateTemplate',
      description: 'Due entità simili per templating preventivi',
      benefit: 'Semplificazione UX, meno confusione',
    });

    optimizationOpportunities.push({
      impact: 'Medium',
      opportunity: 'Aggiungere stato "Archived"',
      description: 'Nessuno stato per progetti/archiviati. Tutto rimane attivo',
      benefit: 'Migliore organizzazione, performance queries',
    });

    optimizationOpportunities.push({
      impact: 'Low',
      opportunity: 'Indicizzazione',
      description: 'Aggiungere indici su client_id, project_id, status per performance',
      benefit: 'Query più veloci su grandi dataset',
    });

    // ENTITY RELATIONSHIPS
    const relationships = [
      { from: 'Client', to: 'Property', type: '1:N', desc: 'Cliente → Proprietà' },
      { from: 'Client', to: 'Estimate', type: '1:N', desc: 'Cliente → Preventivi' },
      { from: 'Client', to: 'Project', type: '1:N', desc: 'Cliente → Progetti' },
      { from: 'Client', to: 'GuardianSubscription', type: '1:N', desc: 'Cliente → Guardian' },
      { from: 'Client', to: 'SupportTicket', type: '1:N', desc: 'Cliente → Ticket' },
      { from: 'Property', to: 'Project', type: '1:N', desc: 'Proprietà → Progetti' },
      { from: 'Property', to: 'SupportTicket', type: '1:N', desc: 'Proprietà → Ticket' },
      { from: 'Estimate', to: 'Project', type: '1:1?', desc: 'Preventivo → Progetto (MANCANTE estimate_id)' },
      { from: 'Project', to: 'ChecklistItem', type: '1:N', desc: 'Progetto → Checklist' },
      { from: 'Project', to: 'ProjectCost', type: '1:N', desc: 'Progetto → Costi' },
      { from: 'Project', to: 'Timesheet', type: '1:N', desc: 'Progetto → Ore' },
      { from: 'Project', to: 'PurchaseOrder', type: '1:N', desc: 'Progetto → Ordini' },
      { from: 'Project', to: 'KnowledgeBase', type: '1:N', desc: 'Progetto → Lessons Learned' },
      { from: 'Project', to: 'ProjectLearning', type: '1:1', desc: 'Progetto → Learning' },
      { from: 'Project', to: 'IntelligenceInsight', type: '1:N', desc: 'Progetto → Insights' },
      { from: 'Supplier', to: 'ProjectCost', type: '1:N', desc: 'Fornitore → Costi' },
      { from: 'Supplier', to: 'PurchaseOrder', type: '1:N', desc: 'Fornitore → Ordini' },
      { from: 'GuardianSubscription', to: 'SupportTicket', type: '1:N', desc: 'Guardian → Ticket' },
    ];

    const auditResult = {
      summary: {
        totalEntities: 19,
        totalRecords: entities.reduce((sum, e) => sum + e.length, 0),
        criticalIssues: issues.filter(i => i.severity === 'High').length,
        mediumIssues: issues.filter(i => i.severity === 'Medium').length,
        lowIssues: issues.filter(i => i.severity === 'Low').length,
      },
      duplicatedFields,
      duplicatedLogic,
      inconsistentNaming,
      brokenWorkflows,
      unusedTables,
      permissionIssues,
      navigationIssues,
      optimizationOpportunities,
      relationships,
      entityHealth: {
        Estimate: { records: estimates.length, fields: 38, issues: 3 },
        Project: { records: projects.length, fields: 32, issues: 2 },
        Client: { records: clients.length, fields: 8, issues: 0 },
        Property: { records: properties.length, fields: 14, issues: 0 },
        ProjectCost: { records: projectCosts.length, fields: 12, issues: 0 },
        GuardianSubscription: { records: guardians.length, fields: 7, issues: 1 },
      },
    };

    setAudit(auditResult);
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="p-6 text-center text-gray-400">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin mx-auto mb-4" />
        Esecuzione Audit Architettura...
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Architecture Review</h1>
          <p className="text-sm text-gray-500 mt-0.5">Audit completo dell'applicazione - Productization Phase</p>
        </div>
        <button 
          onClick={runAudit}
          className="px-4 py-2 text-sm text-white rounded-lg"
          style={{ backgroundColor: '#1147FF' }}
        >
          Rilancia Audit
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <SummaryCard label="Entità Totali" value={audit.summary.totalEntities} icon={Database} color="#1147FF" />
        <SummaryCard label="Record Totali" value={audit.summary.totalRecords} icon={Layers} color="#10B981" />
        <SummaryCard label="Criticità" value={audit.summary.criticalIssues} icon={AlertOctagon} color="#EF4444" />
        <SummaryCard label="Problemi Media" value={audit.summary.mediumIssues} icon={AlertTriangle} color="#F59E0B" />
        <SummaryCard label="Problemi Low" value={audit.summary.lowIssues} icon={AlertCircle} color="#6B7280" />
      </div>

      {/* Critical Issues */}
      {audit.brokenWorkflows.length > 0 && (
        <div className="bg-red-50 border-2 border-red-200 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <XCircle className="w-5 h-5 text-red-600" />
            <h2 className="font-bold text-red-900">Broken Workflows</h2>
          </div>
          <div className="space-y-3">
            {audit.brokenWorkflows.map((issue, idx) => (
              <IssueRow key={idx} issue={issue} />
            ))}
          </div>
        </div>
      )}

      {/* Duplicated Fields */}
      {audit.duplicatedFields.length > 0 && (
        <div className="bg-orange-50 border-2 border-orange-200 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <GitBranch className="w-5 h-5 text-orange-600" />
            <h2 className="font-bold text-orange-900">Duplicated Fields</h2>
          </div>
          <div className="space-y-3">
            {audit.duplicatedFields.map((issue, idx) => (
              <IssueRow key={idx} issue={issue} />
            ))}
          </div>
        </div>
      )}

      {/* Optimization Opportunities */}
      <div className="bg-green-50 border-2 border-green-200 rounded-xl p-5">
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp className="w-5 h-5 text-green-600" />
          <h2 className="font-bold text-green-900">Optimization Opportunities</h2>
        </div>
        <div className="space-y-3">
          {audit.optimizationOpportunities.map((opp, idx) => (
            <div key={idx} className="bg-white rounded-lg p-3 border border-green-100">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-gray-900">{opp.opportunity}</h3>
                <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                  opp.impact === 'High' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                }`}>
                  {opp.impact} Impact
                </span>
              </div>
              <p className="text-sm text-gray-600 mb-1">{opp.description}</p>
              <p className="text-xs text-green-700 font-medium">Benefit: {opp.benefit}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Entity Relationships */}
      <div className="bg-white rounded-xl border-2 border-gray-200 p-5">
        <div className="flex items-center gap-2 mb-4">
          <Link2 className="w-5 h-5 text-gray-600" />
          <h2 className="font-bold text-gray-900">Entity Relationships</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {audit.relationships.map((rel, idx) => (
            <div key={idx} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
              <span className="text-xs font-semibold text-gray-700">{rel.from}</span>
              <span className="text-gray-400">→</span>
              <span className="text-xs font-semibold text-gray-700">{rel.to}</span>
              <span className="text-xs text-gray-500 ml-auto">{rel.type}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Permission & Navigation Issues */}
      {(audit.permissionIssues.length > 0 || audit.navigationIssues.length > 0) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {audit.permissionIssues.length > 0 && (
            <div className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <Shield className="w-5 h-5 text-yellow-600" />
                <h2 className="font-bold text-yellow-900">Permission Issues</h2>
              </div>
              <div className="space-y-3">
                {audit.permissionIssues.map((issue, idx) => (
                  <IssueRow key={idx} issue={issue} />
                ))}
              </div>
            </div>
          )}

          {audit.navigationIssues.length > 0 && (
            <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <Target className="w-5 h-5 text-blue-600" />
                <h2 className="font-bold text-blue-900">Navigation Issues</h2>
              </div>
              <div className="space-y-3">
                {audit.navigationIssues.map((issue, idx) => (
                  <IssueRow key={idx} issue={issue} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Unused Tables */}
      {audit.unusedTables.length > 0 && (
        <div className="bg-gray-50 border-2 border-gray-200 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <Box className="w-5 h-5 text-gray-600" />
            <h2 className="font-bold text-gray-900">Unused Tables</h2>
          </div>
          <div className="space-y-3">
            {audit.unusedTables.map((table, idx) => (
              <div key={idx} className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-100">
                <Database className="w-4 h-4 text-gray-400" />
                <div>
                  <p className="text-sm font-semibold text-gray-800">{table.table}</p>
                  <p className="text-xs text-gray-500">{table.reason}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Entity Health */}
      <div className="bg-white rounded-xl border-2 border-gray-200 p-5">
        <div className="flex items-center gap-2 mb-4">
          <FileText className="w-5 h-5 text-gray-600" />
          <h2 className="font-bold text-gray-900">Entity Health</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-2 px-3 font-semibold text-gray-700">Entity</th>
                <th className="text-center py-2 px-3 font-semibold text-gray-700">Records</th>
                <th className="text-center py-2 px-3 font-semibold text-gray-700">Fields</th>
                <th className="text-center py-2 px-3 font-semibold text-gray-700">Issues</th>
                <th className="text-center py-2 px-3 font-semibold text-gray-700">Status</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(audit.entityHealth).map(([name, data]) => (
                <tr key={name} className="border-b border-gray-100">
                  <td className="py-2 px-3 font-medium text-gray-900">{name}</td>
                  <td className="text-center py-2 px-3 text-gray-600">{data.records}</td>
                  <td className="text-center py-2 px-3 text-gray-600">{data.fields}</td>
                  <td className="text-center py-2 px-3">
                    <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                      data.issues === 0 ? 'bg-green-100 text-green-700' :
                      data.issues <= 2 ? 'bg-yellow-100 text-yellow-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {data.issues}
                    </span>
                  </td>
                  <td className="text-center py-2 px-3">
                    {data.issues === 0 ? (
                      <CheckCircle className="w-4 h-4 text-green-500 mx-auto" />
                    ) : data.issues <= 2 ? (
                      <AlertTriangle className="w-4 h-4 text-yellow-500 mx-auto" />
                    ) : (
                      <XCircle className="w-4 h-4 text-red-500 mx-auto" />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function SummaryCard({ label, value, icon: Icon, color }) {
  return (
    <div className="bg-white rounded-xl border-2 border-gray-200 p-4">
      <div className="flex items-center gap-2 mb-2">
        <Icon className="w-4 h-4 flex-shrink-0" style={{ color }} />
        <span className="text-xs text-gray-500 font-medium">{label}</span>
      </div>
      <p className="text-2xl font-bold" style={{ color }}>
        {value}
      </p>
    </div>
  );
}

function IssueRow({ issue }) {
  return (
    <div className="bg-white rounded-lg p-3 border border-gray-100">
      <div className="flex items-center justify-between mb-1">
        <h3 className="font-semibold text-gray-900 text-sm">{issue.workflow || issue.field || issue.issue}</h3>
        <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
          issue.severity === 'High' ? 'bg-red-100 text-red-700' :
          issue.severity === 'Medium' ? 'bg-orange-100 text-orange-700' :
          'bg-blue-100 text-blue-700'
        }`}>
          {issue.severity}
        </span>
      </div>
      {issue.entities && (
        <p className="text-xs text-gray-500 mb-1">Entities: {issue.entities.join(', ')}</p>
      )}
      {issue.recommendation && (
        <p className="text-xs text-blue-700 font-medium">→ {issue.recommendation}</p>
      )}
      {issue.reason && (
        <p className="text-xs text-gray-600">{issue.reason}</p>
      )}
    </div>
  );
}