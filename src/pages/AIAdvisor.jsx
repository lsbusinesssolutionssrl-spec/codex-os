import { useState, useEffect, useRef } from 'react';
import { Send, Bot, User, Sparkles, TrendingUp, DollarSign, Users, Package, AlertCircle, CheckCircle } from 'lucide-react';
import { base44 } from '@/api/base44Client';

export default function AIAdvisor() {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Ciao! Sono Codex AI Advisor. Posso aiutarti ad analizzare dati su:\n\n• **Margini e profitabilità**\n• **Performance progetti**\n• **Fornitori e team**\n• **Trend e previsioni**\n\nFammi una domanda sui tuoi dati aziendali!' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const suggestedQuestions = [
    "Qual è il margine medio dei progetti bathroom?",
    "Quale fornitore ha il rating più alto?",
    "Quanti progetti sono in ritardo?",
    "Qual è il nostro MRR attuale?",
    "Mostra i progetti sotto il 25% di margine",
    "Qual è la soddisfazione media clienti?"
  ];

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setLoading(true);

    try {
      // Fetch all data for analysis
      const [projects, costs, suppliers, timesheets, knowledgeBase, guardians] = await Promise.all([
        base44.entities.Project.list(),
        base44.entities.ProjectCost.list(),
        base44.entities.Supplier.list(),
        base44.entities.Timesheet.list(),
        base44.entities.KnowledgeBase.list(),
        base44.entities.GuardianSubscription.list(),
      ]);

      // Build context
      const context = {
        projects,
        costs,
        suppliers,
        timesheets,
        knowledgeBase,
        guardians,
      };

      // Analyze query and generate response
      const response = analyzeQuery(userMessage, context);

      setMessages(prev => [...prev, { role: 'assistant', content: response }]);
    } catch (error) {
      console.error('Error:', error);
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: 'Mi dispiace, ho riscontrato un errore nell\'analisi dei dati. Riprova tra un momento.' 
      }]);
    } finally {
      setLoading(false);
    }
  };

  const analyzeQuery = (query, ctx) => {
    const q = query.toLowerCase();

    // Margin analysis
    if (q.includes('margine') || q.includes('margin')) {
      const completed = ctx.projects.filter(p => p.status === 'Delivered');
      const avgMargin = completed.length > 0 
        ? completed.reduce((sum, p) => sum + (p.gross_margin_pct || 0), 0) / completed.length 
        : 0;
      
      const byType = {};
      completed.forEach(p => {
        const type = p.estimate_type || 'Generic';
        if (!byType[type]) byType[type] = [];
        byType[type].push(p.gross_margin_pct || 0);
      });

      let bestType = '', bestAvg = -100;
      Object.entries(byType).forEach(([type, margins]) => {
        const avg = margins.reduce((a, b) => a + b, 0) / margins.length;
        if (avg > bestAvg) { bestAvg = avg; bestType = type; }
      });

      const highMargin = completed.filter(p => (p.gross_margin_pct || 0) >= 35).length;
      const lowMargin = completed.filter(p => (p.gross_margin_pct || 0) < 25).length;

      return `📊 **Analisi Margini**\n\n` +
        `• Margine medio: **${avgMargin.toFixed(1)}%**\n` +
        `• Progetti completati: **${completed.length}**\n` +
        `• Sopra 35%: **${highMargin} progetti**\n` +
        `• Sotto 25%: **${lowMargin} progetti**\n\n` +
        `🏆 Tipo migliore: **${bestType}** (${bestAvg.toFixed(1)}%)\n\n` +
        `💡 **Consiglio**: ${avgMargin >= 35 ? 'Ottima performance! Continua così.' : 'Focus su progetti ad alto margine per migliorare.'}`;
    }

    // Suppliers
    if (q.includes('fornitore') || q.includes('supplier')) {
      const topSuppliers = ctx.suppliers.sort((a, b) => (b.rating || 0) - (a.rating || 0)).slice(0, 3);
      const totalSpend = ctx.costs.reduce((sum, c) => sum + (c.total_cost || 0), 0);
      
      return `📦 **Intelligence Fornitori**\n\n` +
        `• Totale fornitori: **${ctx.suppliers.length}**\n` +
        `• Spesa totale: **€${totalSpend.toLocaleString('it-IT')}**\n\n` +
        `🏆 **Top 3 Fornitori:**\n` +
        topSuppliers.map((s, i) => `**${i+1}. ${s.name}** - Rating: ${s.rating}/5 ⭐\nCategoria: ${s.category}`).join('\n') +
        `\n\n💡 **Consiglio**: Prioritizza i fornitori con rating ≥4.5 per qualità superiore.`;
    }

    // Projects status
    if (q.includes('progetti') || q.includes('project')) {
      const byStatus = {};
      ctx.projects.forEach(p => {
        byStatus[p.status] = (byStatus[p.status] || 0) + 1;
      });

      const delayed = ctx.projects.filter(p => 
        p.expected_end_date && new Date(p.expected_end_date) < new Date() && !['Delivered', 'Guardian Active'].includes(p.status)
      ).length;

      const totalValue = ctx.projects.reduce((sum, p) => sum + (p.contract_value || 0), 0);

      return `📋 **Panoramica Progetti**\n\n` +
        `• Totale: **${ctx.projects.length}**\n` +
        `• Valore complessivo: **€${totalValue.toLocaleString('it-IT')}**\n` +
        `• In ritardo: **${delayed}**\n\n` +
        `📊 **Per Stato:**\n` +
        Object.entries(byStatus).map(([status, count]) => `• ${status}: **${count}**`).join('\n') +
        `\n\n${delayed > 0 ? `⚠️ **Attenzione**: ${delayed} progetti sono in ritardo.` : '✅ Tutti i progetti in tempo.'}`;
    }

    // MRR/ARR
    if (q.includes('mrr') || q.includes('arr') || q.includes('guardian')) {
      const mrr = ctx.guardians.reduce((sum, g) => sum + (g.monthly_price || 0), 0);
      const arr = mrr * 12;
      const active = ctx.guardians.filter(g => g.status === 'Active').length;

      return `💰 **Guardian MRR/ARR**\n\n` +
        `• MRR (Mensile): **€${mrr.toLocaleString('it-IT')}**\n` +
        `• ARR (Annuo): **€${arr.toLocaleString('it-IT')}**\n` +
        `• Subscription attive: **${active}**\n\n` +
        `📈 **Obiettivo**: Raddoppia MRR entro 12 mesi aggiungendo ${active} nuovi Guardian.`;
    }

    // Team performance
    if (q.includes('team') || q.includes('ore') || q.includes('hours') || q.includes('performance')) {
      const totalHours = ctx.timesheets.reduce((sum, t) => sum + (t.hours || 0), 0);
      const byProject = {};
      ctx.timesheets.forEach(t => {
        byProject[t.project_id] = (byProject[t.project_id] || 0) + (t.hours || 0);
      });

      const topProject = Object.entries(byProject).sort((a, b) => b[1] - a[1])[0];
      const topProjectName = topProject ? ctx.projects.find(p => p.id === topProject[0])?.title : 'N/A';

      return `👥 **Performance Team**\n\n` +
        `• Ore totali lavorate: **${totalHours}**\n` +
        `• Timesheet registrati: **${ctx.timesheets.length}**\n\n` +
        `🏆 Progetto con più ore: **${topProjectName || '—'}** (${topProject?.[1] || 0}h)\n\n` +
        `💡 **Consiglio**: Monitora ore vs budget per ottimizzare la produttività.`;
    }

    // Default
    return `🤔 **Domanda interessante!**\n\n` +
      `Posso aiutarti con:\n\n` +
      `• **Margini**: "Qual è il margine medio?"\n` +
      `• **Fornitori**: "Quale fornitore è il migliore?"\n` +
      `• **Progetti**: "Quanti progetti sono in ritardo?"\n` +
      `• **MRR**: "Qual è il nostro MRR?"\n` +
      `• **Team**: "Quante ore abbiamo lavorato?"\n\n` +
      `Fammi una domanda specifica sui tuoi dati!`;
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#0B2341' }}>
            <Bot className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Codex AI Advisor</h1>
            <p className="text-xs text-gray-500">Business Intelligence Assistant</p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${
              msg.role === 'user' 
                ? 'bg-[#1147FF] text-white' 
                : 'bg-white border border-gray-200 text-gray-800'
            }`}>
              {msg.role === 'assistant' && (
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="w-4 h-4 text-[#F58220]" />
                  <span className="text-xs font-semibold text-gray-600">AI Advisor</span>
                </div>
              )}
              <div className="text-sm whitespace-pre-wrap">{msg.content}</div>
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-white border border-gray-200 rounded-2xl px-4 py-3">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Questions */}
      {messages.length === 1 && (
        <div className="px-6 py-3">
          <p className="text-xs text-gray-500 mb-2">Domande suggerite:</p>
          <div className="flex flex-wrap gap-2">
            {suggestedQuestions.map((q, idx) => (
              <button 
                key={idx}
                onClick={() => setInput(q)}
                className="px-3 py-1.5 text-xs bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="bg-white border-t border-gray-200 px-6 py-4">
        <div className="flex items-center gap-3">
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSend()}
            placeholder="Chiedi a Codex AI Advisor..."
            className="flex-1 px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1147FF]"
          />
          <button 
            onClick={handleSend}
            disabled={loading || !input.trim()}
            className="p-2.5 rounded-xl text-white disabled:opacity-40"
            style={{ backgroundColor: '#1147FF' }}
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}