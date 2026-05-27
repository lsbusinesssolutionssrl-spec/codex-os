import { useState, useEffect } from 'react';
import { Brain, Zap, Plus, ChevronRight, Lightbulb, CheckCircle2, X } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

/**
 * AI Workflow Suggestions Panel
 * 
 * Analyzes current entity context and suggests relevant workflows.
 * Example: "This project shows delay risk. Create recovery workflow?"
 */

export default function AIWorkflowSuggestions({ entityType, entityId, onClose }) {
  const [loading, setLoading] = useState(true);
  const [suggestions, setSuggestions] = useState([]);
  const [creating, setCreating] = useState(null);

  useEffect(() => {
    if (entityType && entityId) {
      analyzeAndSuggest();
    }
  }, [entityType, entityId]);

  const analyzeAndSuggest = async () => {
    setLoading(true);
    try {
      // Get entity data
      const entityData = await base44.entities[entityType].get(entityId);
      
      // Get available workflows
      const workflows = await base44.entities.WorkflowTemplate.filter({ is_active: true });
      
      const suggestions = [];

      // Analyze based on entity type
      if (entityType === 'Project') {
        // Check for delays
        if (entityData.status === 'In Progress' && entityData.expected_end_date) {
          const daysUntilEnd = Math.ceil(
            (new Date(entityData.expected_end_date) - new Date()) / (1000 * 60 * 60 * 24)
          );
          
          if (daysUntilEnd < 7) {
            suggestions.push({
              type: 'risk',
              title: 'Rischio Ritardo Progetto',
              description: `Il progetto scade tra ${daysUntilEnd} giorni. Suggeriamo di creare un workflow di recupero.`,
              workflow: workflows.find(w => w.category === 'Project Management'),
              confidence: 'high',
              icon: '⚠️',
            });
          }
        }

        // Check for completion
        if (entityData.status === 'Delivered') {
          const completionWorkflow = workflows.find(w => w.category === 'Project Completion');
          if (completionWorkflow) {
            suggestions.push({
              type: 'opportunity',
              title: 'Completamento Progetto',
              description: 'Il progetto è stato consegnato. Attiva il workflow di completamento per la chiusura.',
              workflow: completionWorkflow,
              confidence: 'high',
              icon: '🎉',
            });
          }
        }

        // Check for Guardian upsell
        if (entityData.status === 'Delivered' && !entityData.guardian_subscription_id) {
          suggestions.push({
            type: 'opportunity',
            title: 'Opportunity Guardian',
            description: 'Progetto completato! Suggeriamo di proporre al cliente la subscription Guardian.',
            workflow: workflows.find(w => w.category === 'Guardian Renewal'),
            confidence: 'medium',
            icon: '🛡️',
          });
        }
      }

      if (entityType === 'SupportTicket') {
        // Check for urgent tickets
        if (entityData.priority === 'Urgent' && entityData.status !== 'Resolved') {
          const escalationWorkflow = workflows.find(w => w.category === 'Ticket Escalation');
          if (escalationWorkflow) {
            suggestions.push({
              type: 'risk',
              title: 'Ticket Urgente',
              description: 'Ticket urgente non risolto. Attivare workflow di escalation?',
              workflow: escalationWorkflow,
              confidence: 'high',
              icon: '🚨',
            });
          }
        }
      }

      if (entityType === 'Estimate') {
        // Check for sent estimates
        if (entityData.status === 'Sent') {
          const followupWorkflow = workflows.find(w => w.category === 'Estimate Follow-up');
          if (followupWorkflow) {
            suggestions.push({
              type: 'opportunity',
              title: 'Follow-up Preventivo',
              description: 'Preventivo inviato. Automatizzare il follow-up con il cliente?',
              workflow: followupWorkflow,
              confidence: 'medium',
              icon: '📧',
            });
          }
        }
      }

      if (entityType === 'GuardianSubscription') {
        // Check for expiring subscriptions
        if (entityData.end_date) {
          const daysUntilEnd = Math.ceil(
            (new Date(entityData.end_date) - new Date()) / (1000 * 60 * 60 * 24)
          );
          
          if (daysUntilEnd <= 30 && daysUntilEnd > 0) {
            const renewalWorkflow = workflows.find(w => w.category === 'Guardian Renewal');
            if (renewalWorkflow) {
              suggestions.push({
                type: 'opportunity',
                title: 'Rinnovo in Scadenza',
                description: `Subscription in scadenza tra ${daysUntilEnd} giorni. Attivare workflow di rinnovo?`,
                workflow: renewalWorkflow,
                confidence: 'high',
                icon: '🔄',
              });
            }
          }
        }
      }

      setSuggestions(suggestions);
    } catch (error) {
      console.error('Failed to analyze:', error);
      toast.error('Impossibile analizzare il contesto');
    } finally {
      setLoading(false);
    }
  };

  const createWorkflow = async (suggestion) => {
    if (!suggestion.workflow) return;
    
    setCreating(suggestion.workflow.id);
    try {
      // Create workflow from template
      const workflow = await base44.entities.Workflow.create({
        name: suggestion.workflow.name,
        description: suggestion.workflow.description,
        category: suggestion.workflow.category,
        trigger_type: 'manual', // Start as manual
        steps: suggestion.workflow.steps,
        is_active: true,
        risk_level: suggestion.workflow.risk_level,
        tags: suggestion.workflow.tags,
      });

      toast.success('Workflow creato con successo!');
      
      // Optionally execute immediately
      if (suggestion.confidence === 'high') {
        await base44.functions.invoke('executeWorkflow', {
          workflow_id: workflow.id,
          manual_execution: true,
          trigger_data: {
            entity_type: entityType,
            entity_id: entityId,
          },
        });
        toast.success('Workflow eseguito automaticamente');
      }
      
      onClose();
    } catch (error) {
      toast.error(`Errore: ${error.message}`);
    } finally {
      setCreating(null);
    }
  };

  if (loading) {
    return (
      <div className="w-80 h-full bg-white border-l border-gray-200 flex items-center justify-center">
        <div className="text-center">
          <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <p className="text-xs text-gray-500">Analisi AI in corso...</p>
        </div>
      </div>
    );
  }

  if (suggestions.length === 0) {
    return (
      <div className="w-80 h-full bg-white border-l border-gray-200 flex items-center justify-center">
        <div className="text-center px-4">
          <CheckCircle2 className="w-8 h-8 text-green-400 mx-auto mb-2" />
          <p className="text-xs text-gray-500">Nessun suggerimento workflow</p>
          <p className="text-[10px] text-gray-400 mt-1">Tutto sotto controllo</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-80 h-full bg-gradient-to-b from-blue-50 to-white border-l border-gray-200 flex flex-col">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #1147FF 0%, #0B2341 100%)' }}>
            <Brain className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-900">AI Workflow Suggestions</p>
            <p className="text-[10px] text-gray-500">{suggestions.length} suggerimenti</p>
          </div>
        </div>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Suggestions */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {suggestions.map((suggestion, idx) => (
          <div
            key={idx}
            className={`rounded-xl border p-3 transition-all ${
              suggestion.type === 'risk'
                ? 'bg-red-50 border-red-200'
                : 'bg-emerald-50 border-emerald-200'
            }`}
          >
            <div className="flex items-start gap-2 mb-2">
              <span className="text-lg">{suggestion.icon}</span>
              <div className="flex-1">
                <p className={`text-xs font-semibold ${
                  suggestion.type === 'risk' ? 'text-red-900' : 'text-emerald-900'
                }`}>
                  {suggestion.title}
                </p>
                <p className={`text-[11px] mt-1 ${
                  suggestion.type === 'risk' ? 'text-red-700' : 'text-emerald-700'
                }`}>
                  {suggestion.description}
                </p>
              </div>
            </div>

            {suggestion.workflow && (
              <button
                onClick={() => createWorkflow(suggestion)}
                disabled={creating === suggestion.workflow.id}
                className={`w-full flex items-center justify-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                  suggestion.type === 'risk'
                    ? 'bg-red-100 text-red-700 hover:bg-red-200'
                    : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                } disabled:opacity-50`}
              >
                {creating === suggestion.workflow.id ? (
                  <>
                    <div className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" />
                    Creazione...
                  </>
                ) : (
                  <>
                    <Zap className="w-3 h-3" />
                    Crea Workflow
                  </>
                )}
              </button>
            )}

            <div className="mt-2 flex items-center gap-1">
              <span className={`text-[9px] px-1.5 py-0.5 rounded-full ${
                suggestion.confidence === 'high'
                  ? 'bg-green-100 text-green-700'
                  : 'bg-yellow-100 text-yellow-700'
              }`}>
                Confidenza: {suggestion.confidence}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="px-4 py-2 border-t border-gray-200 bg-white">
        <p className="text-[9px] text-gray-400 text-center">
          AI suggestions based on entity context analysis
        </p>
      </div>
    </div>
  );
}