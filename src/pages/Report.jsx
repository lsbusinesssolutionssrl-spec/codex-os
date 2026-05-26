import { useState, useEffect } from 'react';
import { FileDown, TrendingUp, FolderKanban, FileText, Ticket } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const MONTHS_IT = ['Gennaio','Febbraio','Marzo','Aprile','Maggio','Giugno','Luglio','Agosto','Settembre','Ottobre','Novembre','Dicembre'];

function KpiCard({ icon: Icon, label, value, color }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 flex items-center gap-4">
      <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: color + '15' }}>
        <Icon className="w-5 h-5" style={{ color }} />
      </div>
      <div>
        <p className="text-xs text-gray-500">{label}</p>
        <p className="text-xl font-bold text-gray-900 mt-0.5">{value}</p>
      </div>
    </div>
  );
}

export default function Report() {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [data, setData] = useState(null);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    const load = async () => {
      const [projects, estimates, tickets, checklists] = await Promise.all([
        base44.entities.Project.list(),
        base44.entities.Estimate.list(),
        base44.entities.SupportTicket.list(),
        base44.entities.ChecklistItem.list(),
      ]);

      const inMonth = (dateStr) => {
        if (!dateStr) return false;
        const d = new Date(dateStr);
        return d.getFullYear() === year && d.getMonth() === month;
      };

      const monthProjects = projects.filter(p => inMonth(p.start_date) || inMonth(p.created_date));
      const monthEstimates = estimates.filter(e => inMonth(e.created_date));
      const monthTickets = tickets.filter(t => inMonth(t.created_date));
      const monthChecklists = checklists.filter(c => inMonth(c.created_date));

      const totalRevenue = monthEstimates.reduce((s, e) => s + (e.revenue || 0), 0);
      const totalMargin = monthEstimates.reduce((s, e) => s + (e.gross_margin || 0), 0);
      const avgMarginPct = monthEstimates.length
        ? Math.round(monthEstimates.reduce((s, e) => s + (e.gross_margin_pct || 0), 0) / monthEstimates.length)
        : 0;

      // Bar chart: last 6 months revenue
      const chartData = Array.from({ length: 6 }).map((_, i) => {
        const d = new Date(year, month - 5 + i, 1);
        const y = d.getFullYear(), m = d.getMonth();
        const rev = estimates
          .filter(e => { const ed = new Date(e.created_date); return ed.getFullYear() === y && ed.getMonth() === m; })
          .reduce((s, e) => s + (e.revenue || 0), 0);
        return { name: MONTHS_IT[m].slice(0, 3), value: rev, current: i === 5 };
      });

      setData({ monthProjects, monthEstimates, monthTickets, monthChecklists, totalRevenue, totalMargin, avgMarginPct, chartData });
    };
    load();
  }, [year, month]);

  const exportPdf = async () => {
    if (!data) return;
    setExporting(true);
    const { jsPDF } = await import('jspdf');
    const doc = new jsPDF();

    doc.setFontSize(20);
    doc.setTextColor(11, 35, 65);
    doc.text('Codex OS — Report Mensile', 20, 20);
    doc.setFontSize(12);
    doc.setTextColor(100, 100, 100);
    doc.text(`${MONTHS_IT[month]} ${year}`, 20, 30);

    doc.setDrawColor(220, 220, 220);
    doc.line(20, 35, 190, 35);

    doc.setFontSize(11);
    doc.setTextColor(30, 30, 30);
    let y = 45;

    // KPIs
    doc.setFontSize(13);
    doc.text('KPI del Mese', 20, y); y += 10;
    doc.setFontSize(10);
    doc.setTextColor(80, 80, 80);
    doc.text(`Ricavi Preventivi: €${data.totalRevenue.toLocaleString('it-IT')}`, 25, y); y += 7;
    doc.text(`Margine Lordo: €${data.totalMargin.toLocaleString('it-IT')} (${data.avgMarginPct}%)`, 25, y); y += 7;
    doc.text(`Progetti avviati: ${data.monthProjects.length}`, 25, y); y += 7;
    doc.text(`Preventivi emessi: ${data.monthEstimates.length}`, 25, y); y += 7;
    doc.text(`Ticket aperti: ${data.monthTickets.length}`, 25, y); y += 10;

    // Projects
    if (data.monthProjects.length > 0) {
      doc.setFontSize(13); doc.setTextColor(30, 30, 30);
      doc.text('Progetti del Mese', 20, y); y += 8;
      doc.setFontSize(10); doc.setTextColor(80, 80, 80);
      data.monthProjects.forEach(p => {
        if (y > 270) { doc.addPage(); y = 20; }
        doc.text(`• ${p.title} — ${p.status}${p.budget ? ` — Budget: €${p.budget.toLocaleString('it-IT')}` : ''}`, 25, y); y += 6;
      });
      y += 4;
    }

    // Estimates
    if (data.monthEstimates.length > 0) {
      doc.setFontSize(13); doc.setTextColor(30, 30, 30);
      doc.text('Preventivi del Mese', 20, y); y += 8;
      doc.setFontSize(10); doc.setTextColor(80, 80, 80);
      data.monthEstimates.forEach(e => {
        if (y > 270) { doc.addPage(); y = 20; }
        doc.text(`• ${e.title} — ${e.status}${e.revenue ? ` — €${e.revenue.toLocaleString('it-IT')}` : ''}`, 25, y); y += 6;
      });
    }

    doc.save(`report-${year}-${String(month + 1).padStart(2, '0')}.pdf`);
    setExporting(false);
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Report Mensile</h1>
          <p className="text-sm text-gray-500">Panoramica operativa del mese</p>
        </div>
        <div className="flex items-center gap-3">
          <select value={month} onChange={e => setMonth(Number(e.target.value))} className="px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none">
            {MONTHS_IT.map((m, i) => <option key={i} value={i}>{m}</option>)}
          </select>
          <select value={year} onChange={e => setYear(Number(e.target.value))} className="px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none">
            {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          <button onClick={exportPdf} disabled={exporting || !data} className="flex items-center gap-2 px-4 py-2 text-sm text-white rounded-lg font-medium disabled:opacity-50" style={{ backgroundColor: '#1147FF' }}>
            <FileDown className="w-4 h-4" /> {exporting ? 'Esportazione...' : 'Esporta PDF'}
          </button>
        </div>
      </div>

      {!data ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <KpiCard icon={TrendingUp} label="Ricavi Preventivi" value={`€${data.totalRevenue.toLocaleString('it-IT')}`} color="#1147FF" />
            <KpiCard icon={TrendingUp} label={`Margine Lordo (${data.avgMarginPct}%)`} value={`€${data.totalMargin.toLocaleString('it-IT')}`} color="#10B981" />
            <KpiCard icon={FolderKanban} label="Progetti Avviati" value={data.monthProjects.length} color="#8B5CF6" />
            <KpiCard icon={Ticket} label="Ticket Aperti" value={data.monthTickets.length} color="#F59E0B" />
          </div>

          {/* Revenue chart */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="font-semibold text-gray-900 mb-4">Ricavi Ultimi 6 Mesi</h2>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={data.chartData}>
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} tickFormatter={v => `€${(v/1000).toFixed(0)}k`} />
                <Tooltip formatter={v => [`€${v.toLocaleString('it-IT')}`, 'Ricavi']} contentStyle={{ borderRadius: '8px', border: '1px solid #E5E7EB', fontSize: 12 }} />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {data.chartData.map((entry, i) => (
                    <Cell key={i} fill={entry.current ? '#1147FF' : '#E0E7FF'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Tables */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="px-5 py-3 border-b border-gray-100 flex items-center gap-2">
                <FolderKanban className="w-4 h-4 text-purple-500" />
                <h2 className="font-semibold text-gray-900 text-sm">Progetti del Mese</h2>
                <span className="ml-auto text-xs text-gray-400">{data.monthProjects.length}</span>
              </div>
              {data.monthProjects.length === 0 ? (
                <p className="py-8 text-center text-sm text-gray-400">Nessun progetto</p>
              ) : (
                <div className="divide-y divide-gray-50">
                  {data.monthProjects.map(p => (
                    <div key={p.id} className="px-5 py-3 flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-800">{p.title}</p>
                        <p className="text-xs text-gray-400">{p.status}</p>
                      </div>
                      {p.budget && <span className="text-sm font-semibold text-gray-700">€{p.budget.toLocaleString('it-IT')}</span>}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="px-5 py-3 border-b border-gray-100 flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-500" />
                <h2 className="font-semibold text-gray-900 text-sm">Preventivi del Mese</h2>
                <span className="ml-auto text-xs text-gray-400">{data.monthEstimates.length}</span>
              </div>
              {data.monthEstimates.length === 0 ? (
                <p className="py-8 text-center text-sm text-gray-400">Nessun preventivo</p>
              ) : (
                <div className="divide-y divide-gray-50">
                  {data.monthEstimates.map(e => (
                    <div key={e.id} className="px-5 py-3 flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-800">{e.title}</p>
                        <p className="text-xs text-gray-400">{e.status}</p>
                      </div>
                      {e.revenue && <span className="text-sm font-semibold text-gray-700">€{e.revenue.toLocaleString('it-IT')}</span>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}