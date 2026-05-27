import { useState, useEffect } from 'react';
import { Network, TrendingUp, AlertTriangle, DollarSign, Users, Package, Zap } from 'lucide-react';
import { base44 } from '@/api/base44Client';

export default function OperationalPatternDiscovery() {
  const [patterns, setPatterns] = useState([]);

  useEffect(() => {
    discoverPatterns();
  }, []);

  const discoverPatterns = async () => {
    try {
      const [projects, clients, suppliers, tickets] = await Promise.all([
        base44.entities.Project.list(),
        base44.entities.Client.list(),
        base44.entities.Supplier.list(),
        base44.entities.SupportTicket.list(),
      ]);

      const discovered = [];

      // Pattern: Suppliers linked to delays
      const supplierDelays = {};
      projects.forEach(p => {
        if (p.is_delayed && p.supplier_id) {
          supplierDelays[p.supplier_id] = (supplierDelays[p.supplier_id] || 0) + 1;
        }
      });
      Object.entries(supplierDelays).forEach(([supplierId, count]) => {
        if (count >= 2) {
          const supplier = suppliers.find(s => s.id === supplierId);
          discovered.push({
            type: 'supplier_delays',
            entity: supplier?.name || supplierId,
            description: `Supplier linked to ${count} delayed projects`,
            severity: count > 3 ? 'high' : 'medium',
            confidence: 80
          });
        }
      });

      // Pattern: Technicians linked to quality
      const techQuality = {};
      projects.forEach(p => {
        if (p.project_manager) {
          const margin = p.gross_margin_pct || 0;
          techQuality[p.project_manager] = techQuality[p.project_manager] || { count: 0, avgMargin: 0 };
          techQuality[p.project_manager].count++;
          techQuality[p.project_manager].avgMargin += margin;
        }
      });
      Object.entries(techQuality).forEach(([pm, data]) => {
        const avgMargin = data.avgMargin / data.count;
        if (avgMargin > 35 && data.count >= 3) {
          discovered.push({
            type: 'high_performer',
            entity: pm,
            description: `PM consistently delivers ${Math.round(avgMargin)}% margins`,
            severity: 'low',
            confidence: 85
          });
        }
      });

      // Pattern: Project categories with low margins
      const categoryMargins = {};
      projects.forEach(p => {
        if (p.estimate_type) {
          categoryMargins[p.estimate_type] = categoryMargins[p.estimate_type] || { total: 0, count: 0 };
          categoryMargins[p.estimate_type].total += p.gross_margin_pct || 0;
          categoryMargins[p.estimate_type].count++;
        }
      });
      Object.entries(categoryMargins).forEach(([category, data]) => {
        const avg = data.total / data.count;
        if (avg < 20 && data.count >= 2) {
          discovered.push({
            type: 'low_margin_category',
            entity: category,
            description: `Category averaging ${Math.round(avg)}% margin`,
            severity: 'high',
            confidence: 90
          });
        }
      });

      // Pattern: Recurring customer issues
      const customerIssues = {};
      tickets.forEach(t => {
        if (t.client_id) {
          customerIssues[t.client_id] = (customerIssues[t.client_id] || 0) + 1;
        }
      });
      Object.entries(customerIssues).forEach(([clientId, count]) => {
        if (count >= 3) {
          const client = clients.find(c => c.id === clientId);
          discovered.push({
            type: 'recurring_customer_issues',
            entity: client?.name || clientId,
            description: `${count} tickets from same customer`,
            severity: count > 5 ? 'high' : 'medium',
            confidence: 75
          });
        }
      });

      setPatterns(discovered);
    } catch (error) {
      console.error('Pattern discovery error:', error);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="flex items-center gap-2 mb-4">
        <Network className="w-4 h-4 text-purple-600" />
        <h2 className="text-sm font-semibold text-gray-900">Operational Pattern Discovery</h2>
      </div>

      {patterns.length === 0 ? (
        <div className="text-center py-8 text-gray-400">
          <p className="text-sm">No significant patterns detected yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {patterns.map((pattern, idx) => (
            <PatternCard key={idx} pattern={pattern} />
          ))}
        </div>
      )}
    </div>
  );
}

function PatternCard({ pattern }) {
  const typeConfig = {
    supplier_delays: { icon: AlertTriangle, color: '#EF4444', label: 'Supplier Delays' },
    high_performer: { icon: TrendingUp, color: '#10B981', label: 'High Performer' },
    low_margin_category: { icon: DollarSign, color: '#F97316', label: 'Low Margin Category' },
    recurring_customer_issues: { icon: Users, color: '#8B5CF6', label: 'Customer Issues' },
    material_failures: { icon: Package, color: '#F59E0B', label: 'Material Failures' },
  };

  const config = typeConfig[pattern.type] || typeConfig.supplier_delays;
  const Icon = config.icon;

  return (
    <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
      <div className="flex items-start gap-3">
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0`} style={{ backgroundColor: `${config.color}15` }}>
          <Icon className="w-4 h-4" style={{ color: config.color }} />
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-semibold text-gray-900">{config.label}</span>
            <span className={`text-xs font-bold px-2 py-1 rounded-full ${
              pattern.severity === 'high' ? 'bg-red-100 text-red-700' :
              pattern.severity === 'medium' ? 'bg-orange-100 text-orange-700' :
              'bg-green-100 text-green-700'
            }`}>
              {pattern.severity}
            </span>
          </div>
          <p className="text-xs text-gray-700 mb-1">{pattern.description}</p>
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500">{pattern.entity}</span>
            <span className="text-xs text-gray-400">{pattern.confidence}% confidence</span>
          </div>
        </div>
      </div>
    </div>
  );
}