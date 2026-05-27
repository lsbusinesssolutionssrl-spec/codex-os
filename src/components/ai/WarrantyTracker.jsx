import { useState, useEffect } from 'react';
import { Shield, AlertTriangle, CheckCircle2, Calendar, FileText, TrendingUp, Home, Wrench } from 'lucide-react';
import { base44 } from '@/api/base44Client';

const WARRANTY_TYPES = {
  electrical: { label: 'Impianto Elettrico', duration_months: 24, icon: '⚡' },
  plumbing: { label: 'Impianto Idraulico', duration_months: 24, icon: '💧' },
  hvac: { label: 'HVAC', duration_months: 12, icon: '🌡️' },
  roofing: { label: 'Tetto', duration_months: 60, icon: '🏠' },
  waterproofing: { label: 'Impermeabilizzazione', duration_months: 60, icon: '🛡️' },
  general: { label: 'Garanzia Generale', duration_months: 24, icon: '✅' },
};

export default function WarrantyTracker({ propertyId, projectId }) {
  const [loading, setLoading] = useState(true);
  const [warranties, setWarranties] = useState([]);
  const [expiringSoon, setExpiringSoon] = useState([]);

  useEffect(() => {
    loadWarranties();
  }, [propertyId, projectId]);

  const loadWarranties = async () => {
    setLoading(true);
    try {
      const warrantiesList = [];

      // Load from project if provided
      if (projectId) {
        const project = await base44.entities.Project.get(projectId);
        
        // Create warranty records based on project type and completion date
        const completionDate = project.actual_end_date || project.end_date;
        if (completionDate) {
          const warrantyTypes = [];
          
          if (project.estimate_type === 'Bathroom' || project.estimate_type === 'Full Home') {
            warrantyTypes.push('electrical', 'plumbing', 'general');
          }
          if (project.estimate_type === 'Roofing') {
            warrantyTypes.push('roofing', 'waterproofing');
          }
          if (project.notes?.includes('HVAC') || project.notes?.includes('clima')) {
            warrantyTypes.push('hvac');
          }

          warrantyTypes.forEach(type => {
            const config = WARRANTY_TYPES[type];
            const startDate = new Date(completionDate);
            const endDate = new Date(startDate);
            endDate.setMonth(endDate.getMonth() + config.duration_months);

            const daysUntilExpiry = Math.floor((endDate - new Date()) / (1000 * 60 * 60 * 24));

            warrantiesList.push({
              type,
              label: config.label,
              icon: config.icon,
              start_date: completionDate,
              end_date: endDate.toISOString().split('T')[0],
              days_until_expiry: daysUntilExpiry,
              status: daysUntilExpiry < 0 ? 'expired' : daysUntilExpiry < 60 ? 'expiring_soon' : 'active',
              project_id: projectId,
            });
          });
        }
      }

      // Load from property interventions
      if (propertyId) {
        const property = await base44.entities.Property.get(propertyId);
        const interventions = property.interventions || [];

        interventions.forEach((intervention, idx) => {
          if (intervention.end_date || intervention.actual_end_date) {
            const endDate = new Date(intervention.end_date || intervention.actual_end_date);
            
            // Determine warranty type from intervention category
            let warrantyType = 'general';
            if (intervention.category) {
              const cat = intervention.category.toLowerCase();
              if (cat.includes('electrical')) warrantyType = 'electrical';
              else if (cat.includes('plumbing') || cat.includes('idraul')) warrantyType = 'plumbing';
              else if (cat.includes('hvac') || cat.includes('clima')) warrantyType = 'hvac';
              else if (cat.includes('roof') || cat.includes('tetto')) warrantyType = 'roofing';
            }

            const config = WARRANTY_TYPES[warrantyType];
            const expiryDate = new Date(endDate);
            expiryDate.setMonth(expiryDate.getMonth() + config.duration_months);

            const daysUntilExpiry = Math.floor((expiryDate - new Date()) / (1000 * 60 * 60 * 24));

            warrantiesList.push({
              type: warrantyType,
              label: config.label,
              icon: config.icon,
              start_date: endDate.toISOString().split('T')[0],
              end_date: expiryDate.toISOString().split('T')[0],
              days_until_expiry: daysUntilExpiry,
              status: daysUntilExpiry < 0 ? 'expired' : daysUntilExpiry < 60 ? 'expiring_soon' : 'active',
              intervention_title: intervention.title || `Intervento ${idx + 1}`,
            });
          }
        });
      }

      setWarranties(warrantiesList);
      setExpiringSoon(warrantiesList.filter(w => w.status === 'expiring_soon'));
    } catch (error) {
      console.error('Failed to load warranties:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <p className="text-xs text-gray-500">Caricamento garanzie...</p>
        </div>
      </div>
    );
  }

  if (warranties.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-5 text-center">
        <Shield className="w-8 h-8 text-gray-300 mx-auto mb-2" />
        <p className="text-sm text-gray-500">Nessuna garanzia registrata</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-blue-500" />
          <p className="text-sm font-semibold text-gray-900">Scadenze Garanzie</p>
        </div>
        {expiringSoon.length > 0 && (
          <span className="text-xs font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
            {expiringSoon.length} in scadenza
          </span>
        )}
      </div>

      {/* Warranty Cards */}
      <div className="grid gap-2">
        {warranties.map((warranty, idx) => (
          <div 
            key={idx}
            className={`flex items-center justify-between p-3 rounded-lg border ${
              warranty.status === 'expired' 
                ? 'bg-red-50 border-red-200' 
                : warranty.status === 'expiring_soon'
                ? 'bg-amber-50 border-amber-200'
                : 'bg-emerald-50 border-emerald-200'
            }`}
          >
            <div className="flex items-center gap-3">
              <span className="text-xl">{warranty.icon}</span>
              <div>
                <p className="text-xs font-semibold text-gray-900">{warranty.label}</p>
                <p className="text-[10px] text-gray-500">
                  {warranty.intervention_title || `Progetto ${warranty.project_id?.slice(0, 8)}`}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className={`text-xs font-bold ${
                warranty.status === 'expired' 
                  ? 'text-red-700' 
                  : warranty.status === 'expiring_soon'
                  ? 'text-amber-700'
                  : 'text-emerald-700'
              }`}>
                {warranty.status === 'expired' 
                  ? 'Scaduta' 
                  : warranty.status === 'expiring_soon'
                  ? `${warranty.days_until_expiry} giorni`
                  : 'Attiva'
                }
              </p>
              <p className="text-[10px] text-gray-500">{warranty.end_date}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Alerts */}
      {expiringSoon.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 space-y-2">
          <p className="text-xs font-semibold text-amber-900 flex items-center gap-1.5">
            <AlertTriangle className="w-3 h-3" /> Azioni Raccomandate
          </p>
          {expiringSoon.map((w, idx) => (
            <div key={idx} className="flex items-start gap-2 text-xs text-amber-800">
              <CheckCircle2 className="w-3 h-3 flex-shrink-0 mt-0.5" />
              <span>
                Contattare cliente per ispezione {w.label.toLowerCase()} prima della scadenza
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Stats */}
      <div className="flex gap-4 pt-3 border-t border-gray-100 text-xs text-gray-500">
        <div className="flex items-center gap-1.5">
          <Calendar className="w-3 h-3" />
          <span>{warranties.filter(w => w.status === 'active').length} attive</span>
        </div>
        <div className="flex items-center gap-1.5">
          <AlertTriangle className="w-3 h-3" />
          <span>{expiringSoon.length} in scadenza (60gg)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Wrench className="w-3 h-3" />
          <span>{warranties.filter(w => w.status === 'expired').length} scadute</span>
        </div>
      </div>
    </div>
  );
}