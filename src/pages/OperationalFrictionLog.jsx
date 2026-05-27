import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  AlertTriangle, MessageSquare, Clock, Zap, 
  ThumbsDown, TrendingUp, BarChart2, Flag,
  AlertCircle, CheckCircle, X, ChevronRight,
  Activity, Users, FileText, Target
} from 'lucide-react';
import { base44 } from '@/api/base44Client';

export default function OperationalFrictionLog() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [frictionData, setFrictionData] = useState({
    totalReports: 0,
    criticalIssues: 0,
    avgSeverity: 0,
    topFrictions: [],
    byCategory: {},
    byFrequency: {},
    unresolvedCount: 0,
  });
  const [showForm, setShowForm] = useState(false);
  const [newReport, setNewReport] = useState({
    type: 'confusing_workflow',
    description: '',
    workflow: '',
    severity: 'medium',
    frequency: 'sometimes',
  });

  const frictionTypes = [
    { value: 'confusing_workflow', label: 'Workflow Confuso', icon: AlertCircle },
    { value: 'slow_operation', label: 'Operazione Lenta', icon: Clock },
    { value: 'repetitive_task', label: 'Task Ripetitivo', icon: Activity },
    { value: 'unnecessary_field', label: 'Campo Inutile', icon: FileText },
    { value: 'missing_tool', label: 'Strumento Mancante', icon: Zap },
    { value: 'ux_problem', label: 'Problema UX', icon: AlertTriangle },
  ];

  useEffect(() => {
    loadFrictionData();
  }, []);

  const loadFrictionData = async () => {
    try {
      // In production, this would fetch from a FrictionLog entity
      // For now, simulate with sample data
      const sampleReports = [
        {
          id: 1,
          type: 'confusing_workflow',
          description: 'Troppo passaggi per chiudere un progetto',
          workflow: 'Project Delivery',
          severity: 'high',
          frequency: 'often',
          reports: 12,
          status: 'open',
        },
        {
          id: 2,
          type: 'slow_operation',
          description: 'Upload foto molto lento su mobile',
          workflow: 'Photo Upload',
          severity: 'high',
          frequency: 'always',
          reports: 8,
          status: 'open',
        },
        {
          id: 3,
          type: 'repetitive_task',
          description: 'Inserimento dati duplicato in preventivi',
          workflow: 'Estimate Creation',
          severity: 'medium',
          frequency: 'always',
          reports: 15,
          status: 'reviewing',
        },
      ];

      const totalReports = sampleReports.reduce((sum, r) => sum + r.reports, 0);
      const criticalIssues = sampleReports.filter(r => r.severity === 'high').length;
      const unresolvedCount = sampleReports.filter(r => r.status === 'open').length;

      const severityScores = { high: 3, medium: 2, low: 1 };
      const avgSeverity = sampleReports.length > 0
        ? sampleReports.reduce((sum, r) => sum + severityScores[r.severity], 0) / sampleReports.length
        : 0;

      const byCategory = sampleReports.reduce((acc, r) => {
        acc[r.type] = (acc[r.type] || 0) + 1;
        return acc;
      }, {});

      setFrictionData({
        totalReports,
        criticalIssues,
        avgSeverity: avgSeverity.toFixed(1),
        topFrictions: sampleReports.sort((a, b) => b.reports - a.reports),
        byCategory,
        byFrequency: {},
        unresolvedCount,
      });

    } catch (error) {
      console.error('Error loading friction data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitReport = async () => {
    // In production, create entity record
    console.log('New friction report:', newReport);
    setShowForm(false);
    setNewReport({
      type: 'confusing_workflow',
      description: '',
      workflow: '',
      severity: 'medium',
      frequency: 'sometimes',
    });
    loadFrictionData();
  };

  if (loading) return <div className="p-6 text-center text-gray-400">Caricamento...</div>;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Flag className="w-6 h-6 text-amber-600" />
            Operational Friction Log
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">Segnala problemi operativi e UX</p>
        </div>
        <button 
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 text-sm text-white rounded-lg font-medium"
          style={{ backgroundColor: '#F58020' }}
        >
          <AlertTriangle className="w-4 h-4" />
          Segnala Problema
        </button>
      </div>

      {/* Summary Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <MetricCard label="Total Reports" value={frictionData.totalReports} icon={MessageSquare} color="#3B82F6" />
        <MetricCard label="Critical Issues" value={frictionData.criticalIssues} icon={AlertTriangle} color="#EF4444" />
        <MetricCard label="Avg Severity" value={frictionData.avgSeverity} icon={BarChart2} color="#F59E0B" />
        <MetricCard label="Unresolved" value={frictionData.unresolvedCount} icon={Clock} color="#EF4444" />
        <MetricCard label="Categories" value={Object.keys(frictionData.byCategory).length} icon={Activity} color="#8B5CF6" />
      </div>

      {/* Top Frictions */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h2 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-red-500" />
          Top Friction Points
        </h2>
        <div className="space-y-3">
          {frictionData.topFrictions.map((friction, idx) => (
            <div key={friction.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg border border-gray-100">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                friction.severity === 'high' ? 'bg-red-100 text-red-600' :
                friction.severity === 'medium' ? 'bg-amber-100 text-amber-600' :
                'bg-blue-100 text-blue-600'
              }`}>
                <AlertTriangle className="w-4 h-4" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-gray-900">{friction.workflow}</p>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                    friction.severity === 'high' ? 'bg-red-100 text-red-700' :
                    friction.severity === 'medium' ? 'bg-amber-100 text-amber-700' :
                    'bg-blue-100 text-blue-700'
                  }`}>
                    {friction.severity}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mt-1">{friction.description}</p>
                <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                  <span className="flex items-center gap-1">
                    <Users className="w-3 h-3" /> {friction.reports} segnalazioni
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" /> {friction.frequency}
                  </span>
                  <span className={`px-2 py-0.5 rounded-full ${
                    friction.status === 'open' ? 'bg-red-100 text-red-700' :
                    friction.status === 'reviewing' ? 'bg-amber-100 text-amber-700' :
                    'bg-green-100 text-green-700'
                  }`}>
                    {friction.status}
                  </span>
                </div>
              </div>
              <button className="text-gray-400 hover:text-gray-600">
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Friction by Category */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h2 className="text-sm font-semibold text-gray-900 mb-4">Friction by Category</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {frictionTypes.map(type => {
            const count = frictionData.byCategory[type.value] || 0;
            return (
              <div key={type.value} className="p-3 bg-gray-50 rounded-lg border border-gray-100 text-center">
                <type.icon className="w-5 h-5 mx-auto mb-2 text-gray-400" />
                <p className="text-xs text-gray-500 mb-1">{type.label}</p>
                <p className="text-lg font-bold text-gray-900">{count}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Report Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900">Segnala Friction</h2>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Tipo di Problema</label>
                <div className="grid grid-cols-2 gap-2">
                  {frictionTypes.map(type => (
                    <button
                      key={type.value}
                      onClick={() => setNewReport({ ...newReport, type: type.value })}
                      className={`p-3 rounded-lg border text-left transition-all ${
                        newReport.type === type.value
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <type.icon className="w-4 h-4 mb-1 text-gray-400" />
                      <p className="text-xs font-medium text-gray-900">{type.label}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Workflow Affetto</label>
                <input
                  type="text"
                  value={newReport.workflow}
                  onChange={(e) => setNewReport({ ...newReport, workflow: e.target.value })}
                  placeholder="Es. Project Delivery, Estimate Creation..."
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Descrizione</label>
                <textarea
                  value={newReport.description}
                  onChange={(e) => setNewReport({ ...newReport, description: e.target.value })}
                  placeholder="Descrivi il problema in dettaglio..."
                  rows={4}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Severità</label>
                  <select
                    value={newReport.severity}
                    onChange={(e) => setNewReport({ ...newReport, severity: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg"
                  >
                    <option value="low">Bassa</option>
                    <option value="medium">Media</option>
                    <option value="high">Alta</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Frequenza</label>
                  <select
                    value={newReport.frequency}
                    onChange={(e) => setNewReport({ ...newReport, frequency: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg"
                  >
                    <option value="rarely">Raramente</option>
                    <option value="sometimes">Qualche volta</option>
                    <option value="often">Spesso</option>
                    <option value="always">Sempre</option>
                  </select>
                </div>
              </div>

              <button
                onClick={handleSubmitReport}
                className="w-full py-3 text-sm text-white font-semibold rounded-lg"
                style={{ backgroundColor: '#F58020' }}
              >
                Invia Segnalazione
              </button>
            </div>
          </div>
        </div>
      )}
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
      <p className="text-2xl font-bold text-gray-900">{value}</p>
    </div>
  );
}