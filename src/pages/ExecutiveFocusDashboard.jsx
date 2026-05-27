import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, TrendingDown, Clock, DollarSign, Users, Shield, Brain, ChevronRight, CheckCircle, X } from 'lucide-react';
import { base44 } from '@/api/base44Client';

export default function ExecutiveFocusDashboard() {
  const navigate = useNavigate();
  const [criticalIssues, setCriticalIssues] = useState([]);
  const [atRiskProjects, setAtRiskProjects] = useState([]);
  const [financialRisks, setFinancialRisks] = useState([]);
  const [customerSituations, setCustomerSituations] = useState([]);
  const [bottlenecks, setBottlenecks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadExecutiveFocus();
  }, []);

  const loadExecutiveFocus = async () => {
    try {
      const [projects, estimates, tickets, insights] = await Promise.all([
        base44.entities.Project.list(),
        base44.entities.Estimate.list(),
        base44.entities.SupportTicket.list(),
        base44.entities.IntelligenceInsight.list(),
      ]);

      // Critical Issues (high severity, unresolved)
      const critical = insights.filter(i => 
        i.severity === 'Critical' && !i.is_resolved
      ).slice(0, 5);
      setCriticalIssues(critical);

      // At-Risk Projects (delayed, low margin)
      const atRisk = projects.filter(p => 
        p.status === 'delayed' || 
        (p.gross_margin_pct && p.gross_margin_pct < 20) ||
        p.is_at_risk
      ).slice(0, 5);
      setAtRiskProjects(atRisk);

      // Financial Risks
      const financial = [
        ...estimates.filter(e => e.status === 'Draft' && new Date() - new Date(e.created_date) > 7 * 24 * 60 * 60 * 1000),
        ...projects.filter(p => p.total_collected < p.contract_value * 0.5 && p.status === 'In Progress'),
      ].slice(0, 5);
      setFinancialRisks(financial);

      // Customer Situations
      const customer = tickets.filter(t => 
        t.priority === 'Critical' && t.status !== 'Resolved'
      ).slice(0, 5);
      setCustomerSituations(customer);

      // Bottlenecks
      const bottlenecks = [
        ...projects.filter(p => !p.project_manager),
        ...estimates.filter(e => e.status === 'To Review'),
      ].slice(0, 5);
      setBottlenecks(bottlenecks);
    } catch (error) {
      console.error('Load error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 text-center text-gray-400">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin mx-auto mb-2" />
        <p className="text-sm">Loading Executive Focus...</p>
      </div>
    );
  }

  const totalCritical = criticalIssues.length + atRiskProjects.length + financialRisks.length;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Brain className="w-6 h-6 text-purple-600" />
            Executive Focus
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {totalCritical} critical issues requiring attention
          </p>
        </div>
      </div>

      {/* Critical Summary */}
      {totalCritical > 0 ? (
        <>
          {/* Critical Operational Issues */}
          {criticalIssues.length > 0 && (
            <Section
              title="Critical Operational Issues"
              icon={AlertTriangle}
              color="#EF4444"
              items={criticalIssues}
              render={(item) => (
                <IssueCard
                  title={item.title}
                  description={item.description}
                  severity={item.severity}
                  recommendation={item.recommendation}
                />
              )}
            />
          )}

          {/* Projects Requiring Intervention */}
          {atRiskProjects.length > 0 && (
            <Section
              title="Projects Requiring Intervention"
              icon={TrendingDown}
              color="#F97316"
              items={atRiskProjects}
              render={(item) => (
                <ProjectCard
                  project={item}
                  onClick={() => navigate(`/projects/${item.id}`)}
                />
              )}
            />
          )}

          {/* Financial Risks */}
          {financialRisks.length > 0 && (
            <Section
              title="Financial Risks"
              icon={DollarSign}
              color="#F59E0B"
              items={financialRisks}
              render={(item) => (
                <FinancialCard
                  entity={item}
                  onClick={() => navigate(item.title ? `/estimates/${item.id}` : `/projects/${item.id}`)}
                />
              )}
            />
          )}

          {/* Urgent Customer Situations */}
          {customerSituations.length > 0 && (
            <Section
              title="Urgent Customer Situations"
              icon={Users}
              color="#8B5CF6"
              items={customerSituations}
              render={(item) => (
                <TicketCard
                  ticket={item}
                  onClick={() => navigate(`/tickets/${item.id}`)}
                />
              )}
            />
          )}

          {/* High-Impact Bottlenecks */}
          {bottlenecks.length > 0 && (
            <Section
              title="High-Impact Bottlenecks"
              icon={Clock}
              color="#06B6D4"
              items={bottlenecks}
              render={(item) => (
                <BottleneckCard
                  entity={item}
                />
              )}
            />
          )}
        </>
      ) : (
        <div className="bg-green-50 border border-green-200 rounded-xl p-8 text-center">
          <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-3" />
          <h2 className="text-lg font-semibold text-green-900 mb-1">All Operations Normal</h2>
          <p className="text-sm text-green-700">No critical issues requiring executive attention.</p>
        </div>
      )}
    </div>
  );
}

function Section({ title, icon: Icon, color, items, render }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="flex items-center gap-2 px-5 py-3 border-b border-gray-100" style={{ backgroundColor: `${color}10` }}>
        <Icon className="w-4 h-4" style={{ color }} />
        <h2 className="text-sm font-semibold text-gray-900">{title}</h2>
        <span className="text-xs text-gray-500 ml-auto">{items.length} items</span>
      </div>
      <div className="divide-y divide-gray-50">
        {items.map((item, idx) => (
          <div key={idx} className="p-4 hover:bg-gray-50 transition-colors">
            {render(item)}
          </div>
        ))}
      </div>
    </div>
  );
}

function IssueCard({ title, description, severity, recommendation }) {
  return (
    <div>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <p className="text-sm font-semibold text-gray-900">{title}</p>
          <p className="text-xs text-gray-600 mt-0.5">{description}</p>
        </div>
        <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
          severity === 'Critical' ? 'bg-red-100 text-red-700' :
          severity === 'High' ? 'bg-orange-100 text-orange-700' :
          'bg-yellow-100 text-yellow-700'
        }`}>
          {severity}
        </span>
      </div>
      {recommendation && (
        <div className="mt-2 flex items-start gap-2">
          <Brain className="w-3 h-3 text-purple-600 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-gray-700">{recommendation}</p>
        </div>
      )}
    </div>
  );
}

function ProjectCard({ project, onClick }) {
  return (
    <div onClick={onClick} className="cursor-pointer">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <p className="text-sm font-semibold text-gray-900">{project.title}</p>
          <p className="text-xs text-gray-500 mt-0.5">
            {project.client_id} · {project.status}
          </p>
        </div>
        {project.gross_margin_pct && project.gross_margin_pct < 20 && (
          <span className="text-xs font-semibold px-2 py-1 rounded-full bg-red-100 text-red-700">
            Margin: {project.gross_margin_pct}%
          </span>
        )}
        {project.status === 'delayed' && (
          <span className="text-xs font-semibold px-2 py-1 rounded-full bg-orange-100 text-orange-700">
            Delayed
          </span>
        )}
      </div>
    </div>
  );
}

function FinancialCard({ entity, onClick }) {
  return (
    <div onClick={onClick} className="cursor-pointer">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <p className="text-sm font-semibold text-gray-900">{entity.title || 'Project'}</p>
          <p className="text-xs text-gray-500 mt-0.5">
            {entity.contract_value ? `€${entity.contract_value.toLocaleString()}` : 'Draft'} · 
            {entity.status}
          </p>
        </div>
        <DollarSign className="w-4 h-4 text-yellow-600" />
      </div>
    </div>
  );
}

function TicketCard({ ticket, onClick }) {
  return (
    <div onClick={onClick} className="cursor-pointer">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <p className="text-sm font-semibold text-gray-900">{ticket.subject}</p>
          <p className="text-xs text-gray-500 mt-0.5">
            {ticket.priority} · {ticket.status}
          </p>
        </div>
        <Users className="w-4 h-4 text-purple-600" />
      </div>
    </div>
  );
}

function BottleneckCard({ entity }) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex-1">
        <p className="text-sm font-semibold text-gray-900">{entity.title || 'Project'}</p>
        <p className="text-xs text-gray-500 mt-0.5">
          {!entity.project_manager ? 'Missing PM' : 'Pending Review'}
        </p>
      </div>
      <Clock className="w-4 h-4 text-cyan-600" />
    </div>
  );
}