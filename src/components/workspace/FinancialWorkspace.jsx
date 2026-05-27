import { useNavigate } from 'react-router-dom';
import { DollarSign, TrendingUp, AlertTriangle, CreditCard, FileText, Calculator, PieChart, Clock } from 'lucide-react';
import { useGlobalContext } from '@/lib/GlobalContextEngine';

const quickActions = [
  { label: 'Financial Control', icon: DollarSign, path: '/financial-control' },
  { label: 'Cash Flow', icon: TrendingUp, path: '/cash-flow' },
  { label: 'Project Margins', icon: PieChart, path: '/financial-control' },
  { label: 'Invoices', icon: FileText, path: '/financial-control' },
  { label: 'Supplier Costs', icon: CreditCard, path: '/purchase-orders' },
  { label: 'Timesheets', icon: Calculator, path: '/timesheets' },
  { label: 'Alerts', icon: AlertTriangle, path: '/financial-control' },
  { label: 'Forecast', icon: Clock, path: '/cash-flow' },
];

export default function FinancialWorkspace() {
  const navigate = useNavigate();
  const { activeTenant } = useGlobalContext();

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-white to-blue-50">
      {/* Hero */}
      <div className="bg-gradient-to-r from-cyan-700 via-cyan-600 to-blue-700 text-white">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-white/10 backdrop-blur-sm flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Financial Operations</h1>
              <p className="text-cyan-100 text-sm">Profitability, cashflow, and financial intelligence</p>
            </div>
          </div>
          
          {/* Quick Stats */}
          <div className="grid grid-cols-4 gap-4 mt-8">
            <Stat label="Monthly Revenue" value="—" />
            <Stat label="Avg Margin" value="—" />
            <Stat label="Outstanding" value="—" />
            <Stat label="Cash Flow" value="—" />
          </div>
        </div>
      </div>

      {/* Quick Actions Grid */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <h2 className="text-sm font-semibold text-gray-900 mb-4">Financial Tools</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
          {quickActions.map((action, i) => (
            <button
              key={i}
              onClick={() => navigate(action.path)}
              className="flex flex-col items-center gap-2 p-3 bg-white rounded-xl border border-gray-200 hover:shadow-lg hover:border-cyan-200 transition-all"
            >
              <action.icon className="w-5 h-5 text-cyan-600" />
              <span className="text-xs font-medium text-gray-700 text-center">{action.label}</span>
            </button>
          ))}
        </div>

        {/* Financial Modules */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
          <ModuleCard
            title="Profitability Analysis"
            description="Project margins, cost tracking, revenue recognition, profitability trends"
            icon={TrendingUp}
            color="#06B6D4"
          />
          <ModuleCard
            title="Cash Flow Management"
            description="Payment tracking, outstanding invoices, forecast intelligence, liquidity monitoring"
            icon={Clock}
            color="#10B981"
          />
          <ModuleCard
            title="Financial Alerts"
            description="Margin erosion, budget overruns, overdue payments, risk detection"
            icon={AlertTriangle}
            color="#EF4444"
          />
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3">
      <p className="text-cyan-100 text-xs mb-1">{label}</p>
      <p className="text-xl font-bold">{value}</p>
    </div>
  );
}

function ModuleCard({ title, description, icon: Icon, color }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-lg transition-all">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${color}15` }}>
          <Icon className="w-5 h-5" style={{ color }} />
        </div>
        <h3 className="font-semibold text-gray-900">{title}</h3>
      </div>
      <p className="text-sm text-gray-500">{description}</p>
    </div>
  );
}