import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  BarChart2, TrendingUp, TrendingDown, DollarSign,
  Clock, Target, Users, Activity,
  Zap, Award, AlertTriangle, CheckCircle
} from 'lucide-react';
import { base44 } from '@/api/base44Client';

export default function OperationalKPISystem() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [kpis, setKpis] = useState({
    avgProjectDelay: 0,
    avgMargin: 0,
    estimateAccuracy: 0,
    taskCompletionSpeed: 0,
    ticketResolutionTime: 0,
    technicianProductivity: 0,
    customerSatisfaction: 0,
    guardianRetention: 0,
    homePassportCompletion: 0,
    trends: {},
  });

  useEffect(() => {
    loadKPIs();
  }, []);

  const loadKPIs = async () => {
    try {
      const [projects, estimates, tasks, tickets, clients, subscriptions, properties] = await Promise.all([
        base44.entities.Project.list(),
        base44.entities.Estimate.list(),
        base44.entities.Task.list(),
        base44.entities.SupportTicket.list(),
        base44.entities.Client.list(),
        base44.entities.GuardianSubscription.list(),
        base44.entities.Property.list(),
      ]);

      // 1. Average Project Delay (days)
      const delayedProjects = projects.filter(p => {
        const endDate = p.expected_end_date ? new Date(p.expected_end_date) : null;
        return endDate && endDate < new Date() && !['Delivered', 'Archived'].includes(p.status);
      });
      const totalDelayDays = delayedProjects.reduce((sum, p) => {
        const endDate = new Date(p.expected_end_date);
        return sum + Math.floor((new Date() - endDate) / (1000 * 60 * 60 * 24));
      }, 0);
      const avgProjectDelay = delayedProjects.length > 0
        ? Math.round(totalDelayDays / delayedProjects.length)
        : 0;

      // 2. Average Margin (%)
      const projectsWithMargins = projects.filter(p => p.contract_value && p.total_costs);
      const totalMargin = projectsWithMargins.reduce((sum, p) => {
        const margin = ((p.contract_value - p.total_costs) / p.contract_value) * 100;
        return sum + margin;
      }, 0);
      const avgMargin = projectsWithMargins.length > 0
        ? Math.round(totalMargin / projectsWithMargins.length)
        : 0;

      // 3. Estimate Accuracy (%)
      const convertedEstimates = estimates.filter(e => e.status === 'Converted to Project');
      const accurateEstimates = convertedEstimates.filter(e => {
        const project = projects.find(p => p.estimate_id === e.id);
        if (!project) return false;
        const variance = Math.abs((e.revenue - project.contract_value) / e.revenue) * 100;
        return variance < 15; // Within 15% is accurate
      }).length;
      const estimateAccuracy = convertedEstimates.length > 0
        ? Math.round((accurateEstimates / convertedEstimates.length) * 100)
        : 0;

      // 4. Task Completion Speed (hours avg)
      const completedTasks = tasks.filter(t => t.status === 'Completed' && t.completed_date);
      const completionTimes = completedTasks.map(t => {
        const created = new Date(t.created_date);
        const completed = new Date(t.completed_date);
        return (completed - created) / (1000 * 60 * 60); // hours
      });
      const taskCompletionSpeed = completionTimes.length > 0
        ? Math.round(completionTimes.reduce((a, b) => a + b, 0) / completionTimes.length)
        : 0;

      // 5. Ticket Resolution Time (hours avg)
      const resolvedTickets = tickets.filter(t => ['Resolved', 'Closed'].includes(t.status));
      const resolutionTimes = resolvedTickets.map(t => {
        const created = new Date(t.created_date);
        const resolved = new Date(t.updated_date);
        return (resolved - created) / (1000 * 60 * 60); // hours
      });
      const ticketResolutionTime = resolutionTimes.length > 0
        ? Math.round(resolutionTimes.reduce((a, b) => a + b, 0) / resolutionTimes.length)
        : 0;

      // 6. Technician Productivity (tasks per tech per day)
      const technicians = {};
      completedTasks.forEach(t => {
        if (t.completed_by) {
          technicians[t.completed_by] = (technicians[t.completed_by] || 0) + 1;
        }
      });
      const techCount = Object.keys(technicians).length || 1;
      const totalCompleted = completedTasks.length;
      const days = 30; // Last 30 days
      const technicianProductivity = Math.round((totalCompleted / techCount) / days * 10) / 10;

      // 7. Customer Satisfaction (simplified)
      const resolvedCount = resolvedTickets.length;
      const totalTickets = tickets.length;
      const customerSatisfaction = totalTickets > 0
        ? Math.round((resolvedCount / totalTickets) * 100)
        : 0;

      // 8. Guardian Retention (%)
      const activeGuardians = subscriptions.filter(s => s.status === 'Active').length;
      const totalGuardians = subscriptions.length;
      const guardianRetention = totalGuardians > 0
        ? Math.round((activeGuardians / totalGuardians) * 100)
        : 0;

      // 9. Home Passport Completion (%)
      const completedPassports = properties.filter(p => 
        p.property_documents && p.property_documents.length > 0
      ).length;
      const homePassportCompletion = properties.length > 0
        ? Math.round((completedPassports / properties.length) * 100)
        : 0;

      setKpis({
        avgProjectDelay,
        avgMargin,
        estimateAccuracy,
        taskCompletionSpeed,
        ticketResolutionTime,
        technicianProductivity,
        customerSatisfaction,
        guardianRetention,
        homePassportCompletion,
      });

    } catch (error) {
      console.error('Error loading KPIs:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-6 text-center text-gray-400">Caricamento...</div>;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <BarChart2 className="w-6 h-6 text-blue-600" />
            Operational KPI System
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">Metriche operative critiche</p>
        </div>
        <button 
          onClick={loadKPIs}
          className="flex items-center gap-2 px-3 py-1.5 text-sm border border-gray-200 rounded-lg hover:bg-gray-50"
        >
          <Zap className="w-3.5 h-3.5" />
          Refresh
        </button>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <KpiCard 
          label="Average Project Delay" 
          value={`${kpis.avgProjectDelay} giorni`}
          target="< 3 giorni"
          score={kpis.avgProjectDelay <= 3 ? 100 : kpis.avgProjectDelay <= 7 ? 60 : 30}
          icon={Clock}
          trend={kpis.avgProjectDelay <= 3 ? 'up' : 'down'}
        />
        <KpiCard 
          label="Average Margin" 
          value={`${kpis.avgMargin}%`}
          target="> 30%"
          score={kpis.avgMargin >= 30 ? 100 : kpis.avgMargin >= 20 ? 60 : 30}
          icon={DollarSign}
          trend={kpis.avgMargin >= 30 ? 'up' : 'down'}
        />
        <KpiCard 
          label="Estimate Accuracy" 
          value={`${kpis.estimateAccuracy}%`}
          target="> 85%"
          score={kpis.estimateAccuracy}
          icon={Target}
          trend={kpis.estimateAccuracy >= 85 ? 'up' : 'down'}
        />
        <KpiCard 
          label="Task Completion Speed" 
          value={`${kpis.taskCompletionSpeed}h`}
          target="< 24h"
          score={kpis.taskCompletionSpeed <= 24 ? 100 : kpis.taskCompletionSpeed <= 48 ? 60 : 30}
          icon={Activity}
          trend={kpis.taskCompletionSpeed <= 24 ? 'up' : 'down'}
        />
        <KpiCard 
          label="Ticket Resolution Time" 
          value={`${kpis.ticketResolutionTime}h`}
          target="< 48h"
          score={kpis.ticketResolutionTime <= 48 ? 100 : kpis.ticketResolutionTime <= 72 ? 60 : 30}
          icon={Clock}
          trend={kpis.ticketResolutionTime <= 48 ? 'up' : 'down'}
        />
        <KpiCard 
          label="Technician Productivity" 
          value={`${kpis.technicianProductivity} task/gg`}
          target="> 3 task/gg"
          score={kpis.technicianProductivity >= 3 ? 100 : kpis.technicianProductivity >= 2 ? 60 : 30}
          icon={Users}
          trend={kpis.technicianProductivity >= 3 ? 'up' : 'down'}
        />
        <KpiCard 
          label="Customer Satisfaction" 
          value={`${kpis.customerSatisfaction}%`}
          target="> 80%"
          score={kpis.customerSatisfaction}
          icon={Award}
          trend={kpis.customerSatisfaction >= 80 ? 'up' : 'down'}
        />
        <KpiCard 
          label="Guardian Retention" 
          value={`${kpis.guardianRetention}%`}
          target="> 90%"
          score={kpis.guardianRetention}
          icon={CheckCircle}
          trend={kpis.guardianRetention >= 90 ? 'up' : 'down'}
        />
        <KpiCard 
          label="Home Passport Completion" 
          value={`${kpis.homePassportCompletion}%`}
          target="> 95%"
          score={kpis.homePassportCompletion}
          icon={BarChart2}
          trend={kpis.homePassportCompletion >= 95 ? 'up' : 'down'}
        />
      </div>

      {/* Summary */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h2 className="text-sm font-semibold text-gray-900 mb-4">Riepilogo Operativo</h2>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <p className="text-xs text-gray-500 mb-1">KPI Verdi</p>
            <p className="text-2xl font-bold text-green-600">
              {Object.values(kpis).filter((v, i) => i < 9 && v >= 70).length}
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs text-gray-500 mb-1">KPI Gialli</p>
            <p className="text-2xl font-bold text-amber-600">
              {Object.values(kpis).filter((v, i) => i < 9 && v >= 40 && v < 70).length}
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs text-gray-500 mb-1">KPI Rossi</p>
            <p className="text-2xl font-bold text-red-600">
              {Object.values(kpis).filter((v, i) => i < 9 && v < 40).length}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function KpiCard({ label, value, target, score, icon: Icon, trend }) {
  const isGood = score >= 70;
  const isWarning = score >= 40 && score < 70;
  
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="flex items-center gap-2 mb-3">
        <Icon className={`w-5 h-5 ${isGood ? 'text-green-600' : isWarning ? 'text-amber-600' : 'text-red-600'}`} />
        <span className="text-sm font-semibold text-gray-900">{label}</span>
      </div>
      <div className="flex items-end justify-between mb-2">
        <p className={`text-3xl font-bold ${isGood ? 'text-green-600' : isWarning ? 'text-amber-600' : 'text-red-600'}`}>
          {value}
        </p>
        {trend === 'up' ? (
          <TrendingUp className="w-5 h-5 text-green-600 mb-1" />
        ) : (
          <TrendingDown className="w-5 h-5 text-red-600 mb-1" />
        )}
      </div>
      <p className="text-xs text-gray-500 mb-2">Target: {target}</p>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div 
          className={`h-full rounded-full ${isGood ? 'bg-green-600' : isWarning ? 'bg-amber-600' : 'bg-red-600'}`}
          style={{ width: `${score}%` }}
        />
      </div>
    </div>
  );
}