import { useState } from 'react';
import { Send, Bot, Sparkles } from 'lucide-react';
import { base44 } from '@/api/base44Client';

export default function AI() {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Ciao! Sono Codex AI, il tuo assistente virtuale per la gestione di progetti, clienti e operazioni. Come posso aiutarti oggi?' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const send = async () => {
    if (!input.trim() || loading) return;
    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setLoading(true);

    try {
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: `Sei Codex AI, un assistente specializzato nella gestione di un'azienda di ristrutturazioni e installazioni (Codex Solution). Rispondi in italiano in modo professionale ma amichevole.

Contesto:
- Gestisci clienti, proprietà, preventivi, progetti, checklist e abbonamenti Guardian
- Aiuti con pianificazione, documentazione e supporto operativo
- Sei competente su preventivazione, gestione cantieri, e assistenza post-vendita

Domanda utente: ${userMsg}

Rispondi in modo chiaro e utile, massimo 150 parole.`,
        add_context_from_internet: false,
      });
      setMessages(prev => [...prev, { role: 'assistant', content: res.data || res }]);
    } catch (e) {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Mi dispiace, ho avuto un problema. Riprova più tardi.' }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#1147FF15' }}>
            <Bot className="w-5 h-5" style={{ color: '#1147FF' }} />
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900">Codex AI</h1>
            <p className="text-xs text-gray-500">Il tuo assistente intelligente per Codex Solution</p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${
              m.role === 'user'
                ? 'text-white'
                : 'bg-white border border-gray-200 text-gray-800'
            }`} style={m.role === 'user' ? { backgroundColor: '#1147FF' } : {}}>
              {m.role === 'assistant' && (
                <div className="flex items-center gap-2 mb-1.5">
                  <Sparkles className="w-3.5 h-3.5" style={{ color: '#F58220' }} />
                  <span className="text-xs font-semibold" style={{ color: '#F58220' }}>Codex AI</span>
                </div>
              )}
              <p className="text-sm leading-relaxed whitespace-pre-wrap">{m.content}</p>
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-white border border-gray-200 rounded-2xl px-4 py-3">
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="bg-white border-t border-gray-200 p-4">
        <div className="flex gap-3 max-w-4xl mx-auto">
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Chiedi qualcosa su progetti, clienti, preventivi..."
            rows={1}
            className="flex-1 px-4 py-3 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            style={{ minHeight: '44px' }}
          />
          <button
            onClick={send}
            disabled={loading || !input.trim()}
            className="px-5 py-3 text-white rounded-xl font-medium flex items-center gap-2 transition-opacity disabled:opacity-50"
            style={{ backgroundColor: '#1147FF' }}
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}