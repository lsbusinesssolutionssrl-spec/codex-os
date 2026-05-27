import { useState, useEffect } from 'react';
import { Bell, Shield, Calendar, Clock, CheckCircle, AlertTriangle, TrendingUp, DollarSign, Mail, Phone, Sparkles } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export default function PredictiveGuardian({ propertyId, clientId }) {
  const [loading, setLoading] = useState(true);
  const [guardianData, setGuardianData] = useState(null);

  useEffect(() => {
    if (propertyId) loadGuardianData();
  }, [propertyId, clientId]);

  const loadGuardianData = async () => {
    setLoading(true);
    try {
      const [property, subscriptions, tickets, maintenance, risks, insights] = await Promise.all([
        base44.entities.Property.get(propertyId),
        base44.entities.GuardianSubscription.filter({ property_id: propertyId }),
        base44.entities.SupportTicket.filter({ property_id: propertyId }),
        base44.entities.PropertyMaintenance.filter({ property_id: propertyId }).catch(() => []),
        base44.entities.PropertyRisk.filter({ property_id: propertyId }).catch(() => []),
        base44.entities.PropertyInsight.filter({ property_id: propertyId }).catch(() => []),
      ]);

      const activeSubscription = subscriptions.find(s => s.status === 'Active');

      // Recurring issues detection
      const issuePatterns = {};
      tickets.forEach(t => {
        const key = t.issue_type || 'Other';
        if (!issuePatterns[key]) issuePatterns[key] = [];
        issuePatterns[key].push(t);
      });

      const recurringIssues = Object.entries(issuePatterns)
        .filter(([, tks]) => tks.length >= 2)
        .map(([type, tks]) => ({
          type,
          count: tks.length,
          lastOccurrence: tks.sort((a, b) => new Date(b.created_date) - new Date(a.created_date))[0].created_date,
        }));

      // Upcoming maintenance (next 30 days)
      const upcomingMaintenance = maintenance.filter(m => {
        const scheduledDate = new Date(m.scheduled_date);
        const now = new Date();
        const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
        return m.status === 'Scheduled' && scheduledDate >= now && scheduledDate <= thirtyDaysFromNow;
      });

      // Guardian opportunities
      const opportunities = [];
      if (!activeSubscription) {
        opportunities.push({
          type: 'new_subscription',
          title: 'Attiva Guardian',
          description: 'Protezione continua per questa proprietà',
          value: '€29/mese',
        });
      }
      if (upcomingMaintenance.length > 0) {
        opportunities.push({
          type: 'maintenance_plan',
          title: 'Piano Manutenzione',
          description: `${upcomingMaintenance.length} manutenzioni programmate`,
          value: `€${upcomingMaintenance.reduce((sum, m) => sum + (m.cost || 0), 0)}`,
        });
      }
      if (recurringIssues.length > 0) {
        opportunities.push({
          type: 'preventive_intervention',
          title: 'Intervento Preventivo',
          description: `${recurringIssues.length} issue ricorrenti da risolvere`,
          value: 'Da definire',
        });
      }

      setGuardianData({
        activeSubscription,
        recurringIssues,
        upcomingMaintenance,
        opportunities,
        totalTickets: tickets.length,
        totalRisks: risks.length,
        totalInsights: insights.length,
      });
    } catch (error) {
      console.error('Error loading Guardian data:', error);
      toast.error('Errore nel caricamento Predictive Guardian');
    } finally {
      setLoading(false);
    }
  };

  const handleActivateGuardian = async () => {
    try {
      const companyRes = await base44.functions.invoke('getCurrentCompany', {}).catch(() => ({ data: { company: null } }));
      const companyId = companyRes.data?.company?.id;

      await base44.entities.GuardianSubscription.create({
        company_id: companyId,
        client_id: clientId,
        property_id: propertyId,
        start_date: new Date().toISOString(),
        monthly_price: 29,
        status: 'Active',
        included_services: 'Monitoraggio continuo, manutenzioni predittive, alert prioritari',
        notes: 'Attivato da Predictive Guardian',
      });

      toast.success('Guardian attivato con successo!');
      loadGuardianData();
    } catch (error) {
      console.error('Error activating Guardian:', error);
      toast.error('Errore nell\'attivazione Guardian');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <p className="text-xs text-gray-500">Caricamento Guardian...</p>
        </div>
      </div>
    );
  }

  if (!guardianData) return null;

  const { activeSubscription, recurringIssues, upcomingMaintenance, opportunities } = guardianData;

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
            <Shield className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-purple-500" />
              Predictive Guardian
            </h3>
            <p className="text-xs text-gray-500">Manutenzione predittiva e protezione continua</p>
          </div>
        </div>
        {activeSubscription ? (
          <span className="text-xs font-semibold px-2 py-1 rounded-full bg-emerald-100 text-emerald-700">
            Attivo · €{activeSubscription.monthly_price}/mese
          </span>
        ) : (
          <button
            onClick={handleActivateGuardian}
            className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-white rounded-lg"
            style={{ backgroundColor: '#10B981' }}
          >
            <Shield className="w-3.5 h-3.5" />
            Attiva Guardian
          </button>
        )}
      </div>

      {/* Recurring Issues */}
      {recurringIssues.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <p className="text-xs font-semibold text-red-900 mb-3 flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5" />
            Issue Ricorrenti ({recurringIssues.length})
          </p>
          <div className="space-y-2">
            {recurringIssues.map((issue, idx) => (
              <div key={idx} className="flex items-start gap-2 text-xs">
                <div className="w-2 h-2 rounded-full bg-red-500 flex-shrink-0 mt-1" />
                <div className="flex-1">
                  <p className="text-gray-900 font-medium">{issue.type} · {issue.count} volte</p>
                  <p className="text-gray-500">Ultima: {new Date(issue.lastOccurrence).toLocaleDateString('it-IT')}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upcoming Maintenance */}
      {upcomingMaintenance.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <p className="text-xs font-semibold text-blue-900 mb-3 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5" />
            Manutenzioni in Scadenza (30 giorni)
          </p>
          <div className="space-y-2">
            {upcomingMaintenance.map((m, idx) => (
              <div key={idx} className="flex items-center justify-between text-xs">
                <div>
                  <p className="text-gray-900 font-medium">{m.title}</p>
                  <p className="text-gray-500">{new Date(m.scheduled_date).toLocaleDateString('it-IT')}</p>
                </div>
                <span className="text-xs font-medium text-blue-700">{new Date(m.scheduled_date).toLocaleDateString('it-IT')}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Opportunities */}
      {opportunities.length > 0 && (
        <div className="bg-gradient-to-r from-emerald-50 to-blue-50 border border-emerald-200 rounded-xl p-4">
          <p className="text-xs font-semibold text-emerald-900 mb-3 flex items-center gap-1.5">
            <TrendingUp className="w-3.5 h-3.5" />
            Opportunità Guardian
          </p>
          <div className="space-y-2">
            {opportunities.map((opp, idx) => (
              <div key={idx} className="flex items-center justify-between text-xs">
                <div>
                  <p className="text-gray-900 font-medium">{opp.title}</p>
                  <p className="text-gray-500">{opp.description}</p>
                </div>
                <span className="text-emerald-700 font-semibold">{opp.value}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-3 pt-3 border-t border-gray-100">
        <div className="text-center">
          <p className="text-lg font-bold text-gray-900">{guardianData.totalTickets}</p>
          <p className="text-[10px] text-gray-500 uppercase">Ticket</p>
        </div>
        <div className="text-center">
          <p className="text-lg font-bold text-gray-900">{guardianData.totalRisks}</p>
          <p className="text-[10px] text-gray-500 uppercase">Rischi</p>
        </div>
        <div className="text-center">
          <p className="text-lg font-bold text-gray-900">{guardianData.totalInsights}</p>
          <p className="text-[10px] text-gray-500 uppercase">Insight AI</p>
        </div>
      </div>
    </div>
  );
}