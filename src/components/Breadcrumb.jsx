import { Link, useLocation } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';

/**
 * Breadcrumb navigation component
 * @param {Array} items - Array di { label, path }
 */
export default function Breadcrumb({ items = [] }) {
  const location = useLocation();
  
  // Se items non è fornito, provo a generarlo dal path corrente
  const autoItems = items.length === 0 ? generateFromPath(location.pathname) : items;

  return (
    <nav className="flex items-center text-sm text-gray-500 mb-4">
      <Link to="/" className="flex items-center gap-1 hover:text-gray-700 transition-colors">
        <Home className="w-3.5 h-3.5" />
      </Link>
      {autoItems.map((item, idx) => (
        <div key={idx} className="flex items-center gap-1">
          <ChevronRight className="w-3 h-3 text-gray-400" />
          {item.path && idx < autoItems.length - 1 ? (
            <Link to={item.path} className="hover:text-gray-700 transition-colors">
              {item.label}
            </Link>
          ) : (
            <span className="text-gray-900 font-medium">{item.label}</span>
          )}
        </div>
      ))}
    </nav>
  );
}

function generateFromPath(pathname) {
  const segments = pathname.split('/').filter(Boolean);
  const items = [];
  
  const labels = {
    'clients': 'Clienti',
    'properties': 'Proprietà',
    'estimates': 'Preventivi',
    'projects': 'Progetti',
    'checklists': 'Checklist',
    'guardian': 'Guardian',
    'tickets': 'Ticket',
    'documents': 'Documenti',
    'team': 'Team',
    'financial-control': 'Controllo Finanziario',
    'ceo-dashboard': 'CEO Dashboard',
    'suppliers': 'Fornitori',
    'timesheets': 'Timesheet',
    'purchase-orders': 'Ordini Acquisto',
    'cash-flow': 'Cash Flow',
    'intelligence': 'Codex Intelligence',
    'knowledge-base': 'Knowledge Base',
    'ai-advisor': 'AI Advisor',
    'executive-insights': 'Executive Insights',
    'architecture-review': 'Architecture Review',
  };
  
  let currentPath = '';
  segments.forEach((segment, idx) => {
    // Salto gli ID (numeri o stringhe corte alfanumeriche)
    if (segment.match(/^[0-9a-f]{24}$/i) || segment.length < 3) return;
    
    currentPath += '/' + segment;
    const label = labels[segment] || segment.charAt(0).toUpperCase() + segment.slice(1);
    items.push({ label, path: currentPath });
  });
  
  return items;
}