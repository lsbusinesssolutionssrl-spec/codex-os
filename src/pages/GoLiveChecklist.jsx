import { useState } from 'react';
import { CheckSquare, Square, Shield, Database, FileText, Users, TrendingUp, Download, Server } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

const CHECKLIST_ITEMS = [
  {
    category: 'Security & Permissions',
    items: [
      { id: 'permissions_tested', label: 'Permissions tested for all roles', icon: Shield },
      { id: 'rls_verified', label: 'Row-level security verified', icon: Shield },
      { id: 'client_portal_isolated', label: 'Client portal isolation tested', icon: Shield },
      { id: 'technician_access', label: 'Technician access restricted correctly', icon: Shield },
    ]
  },
  {
    category: 'Data Integrity',
    items: [
      { id: 'relationships_validated', label: 'All entity relationships validated', icon: Database },
      { id: 'no_orphan_records', label: 'No orphan records found', icon: Database },
      { id: 'duplicates_resolved', label: 'Duplicate clients/properties resolved', icon: Database },
    ]
  },
  {
    category: 'Workflows',
    items: [
      { id: 'estimate_to_project', label: 'Estimate → Project conversion tested', icon: FileText },
      { id: 'project_to_passport', label: 'Project → Home Passport tested', icon: FileText },
      { id: 'guardian_to_ticket', label: 'Guardian → Ticket workflow tested', icon: FileText },
      { id: 'financial_formulas', label: 'Financial formulas calculated correctly', icon: TrendingUp },
    ]
  },
  {
    category: 'Data Management',
    items: [
      { id: 'csv_export_tested', label: 'CSV export tested', icon: Download },
      { id: 'sample_data_hidden', label: 'Sample data removed or hidden', icon: Users },
      { id: 'backup_completed', label: 'Backup/export completed', icon: Server },
    ]
  },
];

export default function GoLiveChecklist() {
  const [checkedItems, setCheckedItems] = useState({});

  const toggle = (id) => {
    setCheckedItems(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const totalItems = CHECKLIST_ITEMS.reduce((sum, cat) => sum + cat.items.length, 0);
  const checkedCount = Object.values(checkedItems).filter(v => v).length;
  const progress = (checkedCount / totalItems) * 100;

  const exportChecklist = () => {
    const csv = [
      'Item,Status,Category',
      ...CHECKLIST_ITEMS.flatMap(cat => 
        cat.items.map(item => `${item.label},${checkedItems[item.id] ? 'Complete' : 'Pending'},"${cat.category}"`)
      )
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `go-live-checklist-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Checklist exported');
  };

  const allComplete = checkedCount === totalItems;

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <CheckSquare className="w-8 h-8 text-blue-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Go Live Checklist</h1>
            <p className="text-sm text-gray-500">
              {checkedCount}/{totalItems} items complete ({Math.round(progress)}%)
            </p>
          </div>
        </div>
        <button
          onClick={exportChecklist}
          className="flex items-center gap-2 px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50"
        >
          <Download className="w-4 h-4" /> Export CSV
        </button>
      </div>

      {/* Progress Bar */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="w-full bg-gray-100 rounded-full h-3">
          <div 
            className={`h-3 rounded-full transition-all ${allComplete ? 'bg-green-500' : 'bg-blue-600'}`}
            style={{ width: `${progress}%` }}
          />
        </div>
        {allComplete && (
          <p className="text-center text-green-600 font-semibold mt-3">
            🎉 Ready for Production!
          </p>
        )}
      </div>

      {/* Checklist Categories */}
      {CHECKLIST_ITEMS.map(category => (
        <div key={category.category} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-100 bg-gray-50">
            <h2 className="font-semibold text-gray-900">{category.category}</h2>
          </div>
          <div className="divide-y divide-gray-50">
            {category.items.map(item => (
              <div
                key={item.id}
                onClick={() => toggle(item.id)}
                className="px-5 py-3 flex items-center gap-3 hover:bg-gray-50 cursor-pointer transition-colors"
              >
                {checkedItems[item.id] ? (
                  <CheckSquare className="w-5 h-5 text-green-500 flex-shrink-0" />
                ) : (
                  <Square className="w-5 h-5 text-gray-400 flex-shrink-0" />
                )}
                <item.icon className={`w-4 h-4 flex-shrink-0 ${checkedItems[item.id] ? 'text-green-500' : 'text-gray-400'}`} />
                <span className={`text-sm flex-1 ${checkedItems[item.id] ? 'text-gray-900 line-through' : 'text-gray-700'}`}>
                  {item.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Notes Section */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h3 className="font-semibold text-gray-900 mb-3">Notes</h3>
        <textarea
          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none resize-none"
          rows={4}
          placeholder="Add notes about production readiness..."
        />
      </div>
    </div>
  );
}