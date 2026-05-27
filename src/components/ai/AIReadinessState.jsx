import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Brain, Database, TrendingUp, CheckCircle2, Clock, AlertCircle } from 'lucide-react';

/**
 * AIReadinessState
 * 
 * Shows the current AI readiness level based on indexed tenant data.
 * States: Empty, Learning, Operational, Advanced
 */
export default function AIReadinessState() {
  const [readiness, setReadiness] = useState({
    state: 'loading',
    score: 0,
    totalRecords: 0,
    breakdown: {},
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkReadiness = async () => {
      try {
        // Query all relevant entities
        const [projects, clients, estimates, tickets, knowledge, memories, learnings, documents] = await Promise.all([
          base44.entities.Project.list('-created_date', 1).catch(() => []),
          base44.entities.Client.list('-created_date', 1).catch(() => []),
          base44.entities.Estimate.list('-created_date', 1).catch(() => []),
          base44.entities.SupportTicket?.list('-created_date', 1).catch(() => []) || [],
          base44.entities.KnowledgeBase.list('-created_date', 1).catch(() => []),
          base44.entities.AIMemory.list('-created_date', 1).catch(() => []),
          base44.entities.ProjectLearning.list('-created_date', 1).catch(() => []),
          base44.entities.RAGDocument?.list('-created_date', 1).catch(() => []) || [],
        ]);

        const counts = {
          projects: projects.length,
          clients: clients.length,
          estimates: estimates.length,
          tickets: tickets.length,
          knowledge: knowledge.length,
          memories: memories.length,
          learnings: learnings.length,
          documents: documents.length,
        };

        const total = Object.values(counts).reduce((sum, count) => sum + count, 0);

        // Calculate weighted score
        const weights = {
          projects: 3,
          clients: 2,
          estimates: 2,
          tickets: 2,
          knowledge: 4,
          memories: 5,
          learnings: 5,
          documents: 3,
        };

        let weightedSum = 0;
        let maxPossible = 0;

        Object.entries(counts).forEach(([key, count]) => {
          const weight = weights[key];
          const saturation = Math.min(count / 20, 1); // Saturates at 20 records
          weightedSum += weight * 5 * saturation;
          maxPossible += weight * 5;
        });

        const score = Math.round((weightedSum / maxPossible) * 100);

        // Determine state
        let state = 'empty';
        if (score >= 85) state = 'advanced';
        else if (score >= 65) state = 'operational';
        else if (score >= 20) state = 'learning';
        else if (total > 0) state = 'initial';

        setReadiness({
          state,
          score,
          totalRecords: total,
          breakdown: counts,
        });
      } catch (error) {
        console.error('Error checking AI readiness:', error);
        setReadiness({ state: 'error', score: 0, totalRecords: 0, breakdown: {} });
      } finally {
        setLoading(false);
      }
    };

    checkReadiness();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-xs text-slate-400">
        <Clock className="w-3 h-3 animate-spin" />
        Verifica contesto AI...
      </div>
    );
  }

  const stateConfig = {
    empty: {
      label: 'Iniziale',
      color: '#94a3b8',
      icon: AlertCircle,
      desc: 'Nessun dato indicizzato. Inizia creando progetti e clienti.',
    },
    initial: {
      label: 'In crescita',
      color: '#f59e0b',
      icon: Clock,
      desc: 'Dati base presenti. Aggiungi progetti per migliorare il contesto.',
    },
    learning: {
      label: 'Apprendimento',
      color: '#3b82f6',
      icon: Brain,
      desc: 'L\'AI sta apprendendo dai tuoi dati operativi.',
    },
    operational: {
      label: 'Operativo',
      color: '#10b981',
      icon: CheckCircle2,
      desc: 'AI pienamente operativa con contesto sufficiente.',
    },
    advanced: {
      label: 'Avanzato',
      color: '#8b5cf6',
      icon: TrendingUp,
      desc: 'AI avanzata con pattern recognition e suggerimenti predittivi.',
    },
    error: {
      label: 'Errore',
      color: '#ef4444',
      icon: AlertCircle,
      desc: 'Impossibile verificare il contesto AI.',
    },
  };

  const config = stateConfig[readiness.state] || stateConfig.empty;
  const Icon = config.icon;

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-3 space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon className="w-4 h-4" style={{ color: config.color }} />
          <span className="text-xs font-semibold text-slate-700">{config.label}</span>
        </div>
        <span className="text-xs font-bold text-slate-900">{readiness.score}/100</span>
      </div>
      
      <p className="text-[11px] text-slate-500 leading-relaxed">{config.desc}</p>
      
      {readiness.totalRecords > 0 && (
        <div className="flex items-center gap-2 text-[10px] text-slate-400">
          <Database className="w-2.5 h-2.5" />
          <span>{readiness.totalRecords} record indicizzati</span>
        </div>
      )}
    </div>
  );
}