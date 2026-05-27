import { useState, useEffect } from 'react';
import { Brain, Network, TrendingUp, AlertTriangle, DollarSign, Users, Package, Home, Activity } from 'lucide-react';
import { base44 } from '@/api/base44Client';

export default function OperationalMemoryGraph() {
  const [graphData, setGraphData] = useState({
    nodes: [],
    edges: [],
    patterns: [],
  });

  useEffect(() => {
    buildMemoryGraph();
  }, []);

  const buildMemoryGraph = async () => {
    try {
      const [projects, clients, suppliers, tickets, memories] = await Promise.all([
        base44.entities.Project.list(),
        base44.entities.Client.list(),
        base44.entities.Supplier.list(),
        base44.entities.SupportTicket.list(),
        base44.entities.AIMemory.list(),
      ]);

      // Build nodes
      const nodes = [
        ...projects.map(p => ({ id: p.id, type: 'project', label: p.title })),
        ...clients.map(c => ({ id: c.id, type: 'client', label: c.name })),
        ...suppliers.map(s => ({ id: s.id, type: 'supplier', label: s.name })),
        ...tickets.map(t => ({ id: t.id, type: 'ticket', label: t.subject })),
      ];

      // Build edges (relationships)
      const edges = [];
      projects.forEach(p => {
        if (p.client_id) edges.push({ from: p.id, to: p.client_id, type: 'belongs_to' });
      });

      // Detect patterns
      const patterns = [];
      
      // Pattern: Repeated supplier delays
      const supplierDelays = {};
      projects.forEach(p => {
        if (p.status === 'delayed') {
          // Would need supplier data
        }
      });

      // Pattern: Client issue frequency
      const clientIssues = {};
      tickets.forEach(t => {
        if (t.client_id) {
          clientIssues[t.client_id] = (clientIssues[t.client_id] || 0) + 1;
        }
      });
      
      Object.entries(clientIssues).forEach(([clientId, count]) => {
        if (count > 3) {
          patterns.push({
            type: 'repeated_issues',
            entity_id: clientId,
            description: `Client has ${count} tickets - potential satisfaction risk`,
            severity: 'medium'
          });
        }
      });

      setGraphData({ nodes, edges, patterns });
    } catch (error) {
      console.error('Graph build error:', error);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="flex items-center gap-2 mb-4">
        <Network className="w-4 h-4 text-purple-600" />
        <h2 className="text-sm font-semibold text-gray-900">Operational Memory Graph</h2>
      </div>

      {/* Graph Stats */}
      <div className="grid grid-cols-3 gap-4 mb-4">
        <GraphStat label="Entities" value={graphData.nodes.length} icon={Network} color="#1147FF" />
        <GraphStat label="Relationships" value={graphData.edges.length} icon={Activity} color="#10B981" />
        <GraphStat label="Patterns" value={graphData.patterns.length} icon={Brain} color="#F59E0B" />
      </div>

      {/* Detected Patterns */}
      {graphData.patterns.length > 0 && (
        <div>
          <h3 className="text-xs font-semibold text-gray-700 mb-2">Detected Operational Patterns</h3>
          <div className="space-y-2">
            {graphData.patterns.map((pattern, idx) => (
              <div key={idx} className="flex items-start gap-3 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                <Brain className="w-4 h-4 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-xs font-semibold text-gray-900">{pattern.type}</p>
                  <p className="text-xs text-gray-700 mt-0.5">{pattern.description}</p>
                </div>
                <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                  pattern.severity === 'high' ? 'bg-red-100 text-red-700' :
                  'bg-yellow-100 text-yellow-700'
                }`}>
                  {pattern.severity}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Entity Types */}
      <div className="mt-4">
        <h3 className="text-xs font-semibold text-gray-700 mb-2">Connected Entities</h3>
        <div className="flex flex-wrap gap-2">
          <EntityBadge type="project" count={graphData.nodes.filter(n => n.type === 'project').length} icon={TrendingUp} color="#1147FF" />
          <EntityBadge type="client" count={graphData.nodes.filter(n => n.type === 'client').length} icon={Users} color="#10B981" />
          <EntityBadge type="supplier" count={graphData.nodes.filter(n => n.type === 'supplier').length} icon={Package} color="#F97316" />
          <EntityBadge type="ticket" count={graphData.nodes.filter(n => n.type === 'ticket').length} icon={AlertTriangle} color="#EF4444" />
        </div>
      </div>
    </div>
  );
}

function GraphStat({ label, value, icon: Icon, color }) {
  return (
    <div className="bg-gray-50 rounded-lg p-3 text-center">
      <Icon className="w-4 h-4 mx-auto mb-1" style={{ color }} />
      <p className="text-lg font-bold text-gray-900">{value}</p>
      <p className="text-[10px] text-gray-500">{label}</p>
    </div>
  );
}

function EntityBadge({ type, count, icon: Icon, color }) {
  return (
    <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded-lg border border-gray-200">
      <Icon className="w-3 h-3" style={{ color }} />
      <span className="text-xs font-medium text-gray-700 capitalize">{type}</span>
      <span className="text-xs font-bold text-gray-900">{count}</span>
    </div>
  );
}