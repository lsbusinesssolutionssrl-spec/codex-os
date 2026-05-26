import { TrendingUp, TrendingDown, Euro, Wallet, PieChart } from 'lucide-react';

export default function FinancialSummary({ project }) {
  const contractValue = project.contract_value || 0;
  const approvedVariations = project.approved_variations || 0;
  const totalRevenue = contractValue + approvedVariations;
  const materialCosts = project.material_costs || 0;
  const laborCosts = project.labor_costs || 0;
  const otherCosts = project.other_costs || 0;
  const totalCosts = materialCosts + laborCosts + otherCosts;
  const grossMargin = totalRevenue - totalCosts;
  const grossMarginPct = totalRevenue > 0 ? (grossMargin / totalRevenue) * 100 : 0;
  const paymentCollected = project.payment_collected || 0;
  const remainingBalance = totalRevenue - paymentCollected;

  const marginColor = grossMarginPct >= 35 ? 'text-green-600' : grossMarginPct >= 25 ? 'text-orange-500' : 'text-red-500';
  const marginBg = grossMarginPct >= 25 ? 'bg-orange-50' : 'bg-red-50';
  const marginIcon = grossMarginPct >= 35 ? TrendingUp : TrendingDown;

  const cards = [
    { label: 'Valore Contratto', value: contractValue, prefix: '€', icon: Euro, color: '#1147FF' },
    { label: 'Variazioni', value: approvedVariations, prefix: '€', icon: TrendingUp, color: '#10B981' },
    { label: 'Costi Totali', value: totalCosts, prefix: '€', icon: Wallet, color: '#EF4444' },
    { label: 'Margine Lordo', value: grossMargin, prefix: '€', suffix: ` (${grossMarginPct.toFixed(1)}%)`, icon: PieChart, color: grossMarginPct >= 35 ? '#10B981' : grossMarginPct >= 25 ? '#F59E0B' : '#EF4444' },
    { label: 'Saldo Residuo', value: remainingBalance, prefix: '€', icon: Euro, color: '#0D9488' },
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {cards.map(({ label, value, prefix, suffix, icon: Icon, color }) => (
          <div key={label} className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: color + '15' }}>
                <Icon className="w-4 h-4" style={{ color }} />
              </div>
              <span className="text-xs text-gray-500 font-medium">{label}</span>
            </div>
            <div className="text-lg font-bold text-gray-900">
              {prefix}{value.toLocaleString('it-IT')}{suffix || ''}
            </div>
          </div>
        ))}
      </div>

      {/* Breakdown */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Dettaglio Costi</h3>
        <div className="space-y-2">
          {[
            { label: 'Materiali', value: materialCosts, color: '#EF4444' },
            { label: 'Manodopera', value: laborCosts, color: '#F59E0B' },
            { label: 'Altri Costi', value: otherCosts, color: '#6B7280' },
          ].map(({ label, value, color }) => (
            <div key={label} className="flex items-center justify-between">
              <span className="text-sm text-gray-600">{label}</span>
              <span className="text-sm font-medium text-gray-900">€{value.toLocaleString('it-IT')}</span>
            </div>
          ))}
          <div className="border-t border-gray-100 pt-2 mt-2 flex items-center justify-between">
            <span className="text-sm font-semibold text-gray-900">Totale Costi</span>
            <span className="text-base font-bold text-gray-900">€{totalCosts.toLocaleString('it-IT')}</span>
          </div>
        </div>

        {/* Margin Alert */}
        {grossMarginPct < 35 && (
          <div className={`mt-4 p-3 rounded-lg ${marginBg} border ${grossMarginPct >= 25 ? 'border-orange-200' : 'border-red-200'}`}>
            <div className="flex items-center gap-2">
              {(() => {
                const IconComponent = grossMarginPct >= 35 ? TrendingUp : TrendingDown;
                return <IconComponent className={`w-4 h-4 ${marginColor}`} />;
              })()}
              <span className={`text-xs font-medium ${marginColor}`}>
                {grossMarginPct < 25
                  ? `Attenzione: margine critico (${grossMarginPct.toFixed(1)}%). Rivedi i costi.`
                  : `Margine nella norma (${grossMarginPct.toFixed(1)}%). Obiettivo: 35%+.`}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}