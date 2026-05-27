import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Heart, TrendingUp, TrendingDown, Star, 
  Clock, MessageSquare, CheckCircle, AlertTriangle,
  BarChart2, Activity, Users, Zap,
  ChevronRight
} from 'lucide-react';
import { base44 } from '@/api/base44Client';

export default function CustomerExperienceTracking() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [cxData, setCxData] = useState({
    overallScore: 0,
    responseTimeAvg: 0,
    projectCommunicationScore: 0,
    ticketSatisfaction: 0,
    deliveryPunctuality: 0,
    issueRecurrence: 0,
    maintenanceResponsiveness: 0,
    trendData: [],
    byClient: [],
  });

  useEffect(() => {
    loadCXData();
  }, []);

  const loadCXData = async () => {
    try {
      const [clients, projects, tickets, comments] = await Promise.all([
        base44.entities.Client.list(),
        base44.entities.Project.list(),
        base44.entities.SupportTicket.list(),
        base44.entities.Comment.list(),
      ]);

      // Response Time (average hours to first response on tickets)
      const ticketsWithResponse = tickets.filter(t => t.resolution_notes || t.status !== 'New');
      const responseTimes = ticketsWithResponse.map(t => {
        const created = new Date(t.created_date);
        const responded = new Date(t.updated_date);
        return (responded - created) / (1000 * 60 * 60); // hours
      });
      const responseTimeAvg = responseTimes.length > 0
        ? Math.round(responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length)
        : 0;

      // Project Communication Score (based on comments frequency)
      const projectsWithComments = projects.filter(p => 
        comments.some(c => c.project_id === p.id)
      ).length;
      const projectCommunicationScore = projects.length > 0
        ? Math.round((projectsWithComments / projects.length) * 100)
        : 0;

      // Ticket Satisfaction (simplified - based on resolved vs total)
      const resolvedTickets = tickets.filter(t => ['Resolved', 'Closed'].includes(t.status)).length;
      const ticketSatisfaction = tickets.length > 0
        ? Math.round((resolvedTickets / tickets.length) * 100)
        : 0;

      // Delivery Punctuality (on-time deliveries)
      const deliveredProjects = projects.filter(p => p.status === 'Delivered');
      const onTimeDeliveries = deliveredProjects.filter(p => {
        const endDate = p.expected_end_date ? new Date(p.expected_end_date) : null;
        const actualDate = p.actual_end_date ? new Date(p.actual_end_date) : null;
        return endDate && actualDate && actualDate <= endDate;
      }).length;
      const deliveryPunctuality = deliveredProjects.length > 0
        ? Math.round((onTimeDeliveries / deliveredProjects.length) * 100)
        : 0;

      // Issue Recurrence (clients with multiple tickets)
      const clientTicketCounts = tickets.reduce((acc, t) => {
        acc[t.client_id] = (acc[t.client_id] || 0) + 1;
        return acc;
      }, {});
      const clientsWithMultipleIssues = Object.values(clientTicketCounts).filter(c => c > 2).length;
      const issueRecurrence = clients.length > 0
        ? Math.round(100 - ((clientsWithMultipleIssues / clients.length) * 100))
        : 100;

      // Maintenance Responsiveness (tickets resolved within 48h)
      const maintenanceTickets = tickets.filter(t => t.priority === 'High' || t.priority === 'Urgent');
      const quickResolutions = maintenanceTickets.filter(t => {
        const created = new Date(t.created_date);
        const resolved = new Date(t.updated_date);
        return (resolved - created) < (48 * 60 * 60 * 1000); // 48 hours
      }).length;
      const maintenanceResponsiveness = maintenanceTickets.length > 0
        ? Math.round((quickResolutions / maintenanceTickets.length) * 100)
        : 0;

      // Calculate Overall CX Score
      const scores = [
        responseTimeAvg > 0 ? Math.min(100, Math.max(0, 100 - responseTimeAvg)) : 50,
        projectCommunicationScore,
        ticketSatisfaction,
        deliveryPunctuality,
        issueRecurrence,
        maintenanceResponsiveness,
      ].filter(s => s > 0);
      
      const overallScore = scores.length > 0
        ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
        : 0;

      // By Client breakdown
      const byClient = clients.slice(0, 10).map(client => {
        const clientTickets = tickets.filter(t => t.client_id === client.id);
        const clientProjects = projects.filter(p => p.client_id === client.id);
        const resolvedCount = clientTickets.filter(t => ['Resolved', 'Closed'].includes(t.status)).length;
        
        return {
          id: client.id,
          name: client.client_name,
          ticketCount: clientTickets.length,
          projectCount: clientProjects.length,
          satisfaction: clientTickets.length > 0 ? Math.round((resolvedCount / clientTickets.length) * 100) : 100,
        };
      });

      setCxData({
        overallScore,
        responseTimeAvg,
        projectCommunicationScore,
        ticketSatisfaction,
        deliveryPunctuality,
        issueRecurrence,
        maintenanceResponsiveness,
        trendData: [],
        byClient,
      });

    } catch (error) {
      console.error('Error loading CX data:', error);
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
            <Heart className="w-6 h-6 text-pink-600" />
            Customer Experience Tracking
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">Monitoraggio soddisfazione clienti</p>
        </div>
        <button 
          onClick={loadCXData}
          className="flex items-center gap-2 px-3 py-1.5 text-sm border border-gray-200 rounded-lg hover:bg-gray-50"
        >
          <Zap className="w-3.5 h-3.5" />
          Refresh
        </button>
      </div>

      {/* Overall CX Score */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-semibold text-gray-900">Customer Experience Score</h2>
            <p className="text-xs text-gray-500 mt-0.5">Media soddisfazione clienti</p>
          </div>
          <div className={`text-5xl font-bold ${
            cxData.overallScore >= 80 ? 'text-green-600' :
            cxData.overallScore >= 60 ? 'text-amber-600' :
            'text-red-600'
          }`}>
            {cxData.overallScore}/100
          </div>
        </div>
        <div className="h-4 bg-gray-100 rounded-full overflow-hidden">
          <div 
            className={`h-full rounded-full transition-all ${
              cxData.overallScore >= 80 ? 'bg-green-600' :
              cxData.overallScore >= 60 ? 'bg-amber-600' :
              'bg-red-600'
            }`}
            style={{ width: `${cxData.overallScore}%` }}
          />
        </div>
      </div>

      {/* CX Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <CXMetric 
          label="Tempo Risposta" 
          value={`${cxData.responseTimeAvg}h`} 
          score={Math.min(100, Math.max(0, 100 - cxData.responseTimeAvg))}
          icon={Clock}
        />
        <CXMetric 
          label="Comunicazione" 
          value={`${cxData.projectCommunicationScore}%`} 
          score={cxData.projectCommunicationScore}
          icon={MessageSquare}
        />
        <CXMetric 
          label="Soddisfazione Ticket" 
          value={`${cxData.ticketSatisfaction}%`} 
          score={cxData.ticketSatisfaction}
          icon={Star}
        />
        <CXMetric 
          label="Puntualità" 
          value={`${cxData.deliveryPunctuality}%`} 
          score={cxData.deliveryPunctuality}
          icon={CheckCircle}
        />
        <CXMetric 
          label="Issue Recurrence" 
          value={`${cxData.issueRecurrence}%`} 
          score={cxData.issueRecurrence}
          icon={AlertTriangle}
        />
        <CXMetric 
          label="Manutenzione" 
          value={`${cxData.maintenanceResponsiveness}%`} 
          score={cxData.maintenanceResponsiveness}
          icon={Activity}
        />
      </div>

      {/* By Client */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h2 className="text-sm font-semibold text-gray-900 mb-4">Per Cliente</h2>
        <div className="space-y-3">
          {cxData.byClient.map(client => (
            <div key={client.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100">
              <div>
                <p className="text-sm font-medium text-gray-900">{client.name}</p>
                <p className="text-xs text-gray-500 mt-0.5">{client.projectCount} progetti · {client.ticketCount} ticket</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="text-xs text-gray-500">Soddisfazione</p>
                  <p className={`text-sm font-bold ${
                    client.satisfaction >= 80 ? 'text-green-600' :
                    client.satisfaction >= 60 ? 'text-amber-600' :
                    'text-red-600'
                  }`}>
                    {client.satisfaction}%
                  </p>
                </div>
                <button 
                  onClick={() => navigate(`/clients/${client.id}`)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function CXMetric({ label, value, score, icon: Icon }) {
  const isGood = score >= 70;
  const isWarning = score >= 50 && score < 70;
  
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <div className="flex items-center gap-2 mb-2">
        <Icon className={`w-4 h-4 ${isGood ? 'text-green-600' : isWarning ? 'text-amber-600' : 'text-red-600'}`} />
        <span className="text-xs text-gray-500 font-medium">{label}</span>
      </div>
      <p className={`text-2xl font-bold mb-2 ${isGood ? 'text-green-600' : isWarning ? 'text-amber-600' : 'text-red-600'}`}>
        {value}
      </p>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div 
          className={`h-full rounded-full ${isGood ? 'bg-green-600' : isWarning ? 'bg-amber-600' : 'bg-red-600'}`}
          style={{ width: `${score}%` }}
        />
      </div>
    </div>
  );
}