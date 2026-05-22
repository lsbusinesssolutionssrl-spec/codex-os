import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FolderKanban, FileText, Shield, TrendingUp, Home, Users, AlertCircle, Activity } from 'lucide-react';
import { base44 } from '@/api/base44Client';

function KpiCard({ icon: Icon, label, value, color, to }) {
  const card = (
    <div className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500 font-medium">{label}</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{value ?? '—'}</p>
        </div>
        <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: color + '20' }}>
          <Icon className="w-5 h-5" style={{ color }} />
        </div>
      </div>
    </div>
  );
  return to ? <Link to={to}>{card}</Link> : card;
}

export default function Dashboard() {
  const [stats, setStats] = useState({});
  const [activity, setActivity] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const [projects, estimates, tickets, guardian, properties, clients] = await Promise.all([
        base44.entities.Project.list(),
        base44.entities.Estimate.list(),
        base44.entities.SupportTicket.list(),
        base44.entities.GuardianSubscription.list(),
        base44.entities.Property.list(),
        base44.entities.Client.list(),
      ]);

      const activeProjects = projects.filter(p => ['In Progress', 'Approved', 'Testing'].includes(p.status));
      const openEstimates = estimates.filter(e => ['Draft', 'To Review', 'Sent'].includes(e.status));
      const openTickets = tickets.filter(t => ['Open', 'In Progress', 'Waiting Client'].includes(t.status));
      const activeGuardian = guardian.filter(g => g.status === 'Active');
      const monthlyRevenue = activeGuardian.reduce((sum, g) => sum + (g.monthly_price || 0), 0);
      const acceptedEstimates = estimates.filter(e => e.status === 'Accepted');
      const totalRevenue = acceptedEstimates.reduce((s, e) => s + (e.revenue || 0), 0);
      const totalMargin = acceptedEstimates.reduce((s, e) => s + (e.gross_margin || 0), 0);
      const marginPct = totalRevenue > 0 ? ((totalMargin / totalRevenue) * 100).toFixed(1) : 0;

      setStats({
        activeProjects: activeProjects.length,
        openEstimates: openEstimates.length,
        openTickets: openTickets.length,
        monthlyRevenue,
        marginPct,
        activePassports: properties.length,
        activeGuardian: activeGuardian.length,
        clients: clients.length,
      });

      // recent activity
      const recent = [
        ...projects.slice(0, 3).map(p => ({ type: 'project', label: `Progetto: ${p.title}`, status: p.status, date: p.updated_date })),
        ...tickets.slice(0, 3).map(t => ({ type: 'ticket', label: `Ticket: ${t.title}`, status: t.status, date: t.updated_date })),
        ...estimates.slice(0, 3).map(e => ({ type: 'estimate', label: `Preventivo: ${e.title}`, status: e.status, date: e.updated_date })),
      ].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 8);
      setActivity(recent);
      setLoading(false);
    };
    load();
  }, []);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-0.5">Panoramica operativa Codex Solution</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard icon={FolderKanban} label="Progetti Attivi" value={stats.activeProjects} color="#1147FF" to="/projects" />
        <KpiCard icon={FileText} label="Preventivi Aperti" value={stats.openEstimates} color="#F58220" to="/estimates" />
        <KpiCard icon={AlertCircle} label="Ticket Aperti" value={stats.openTickets} color="#ef4444" to="/guardian" />
        <KpiCard icon={TrendingUp} label="Ricavi Guardian/mese" value={stats.monthlyRevenue ? `€${stats.monthlyRevenue.toLocaleString()}` : '€0'} color="#10b981" />
        <KpiCard icon={TrendingUp} label="Margine Lordo %" value={stats.marginPct ? `${stats.marginPct}%` : '0%'} color="#8b5cf6" />
        <KpiCard icon={Home} label="Home Passport" value={stats.activePassports} color="#0B2341" to="/properties" />
        <KpiCard icon={Shield} label="Clienti Guardian" value={stats.activeGuardian} color="#059669" to="/guardian" />
        <KpiCard icon={Users} label="Clienti Totali" value={stats.clients} color="#6366f1" to="/clients" />
      </div>

      <div className="bg-white rounded-xl border border-gray-200">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
          <Activity className="w-4 h-4 text-gray-400" />
          <h2 className="font-semibold text-gray-900 text-sm">Attività Recenti</h2>
        </div>
        {loading ? (
          <div className="py-10 flex justify-center"><div className="w-6 h-6 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin" /></div>
        ) : activity.length === 0 ? (
          <p className="text-center text-sm text-gray-400 py-10">Nessuna attività recente</p>
        ) : (
          <div className="divide-y divide-gray-50">
            {activity.map((a, i) => (
              <div key={i} className="px-5 py-3 flex items-center justify-between">
                <span className="text-sm text-gray-800">{a.label}</span>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-gray-400">{a.date ? new Date(a.date).toLocaleDateString('it-IT') : ''}</span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">{a.status}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}