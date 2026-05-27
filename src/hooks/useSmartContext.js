import { useState, useEffect } from 'react';
import { Clock, RotateCcw, TrendingUp, Brain, Zap } from 'lucide-react';

export function useSmartContext() {
  const [context, setContext] = useState({
    recentEntities: [],
    activeWorkflows: [],
    pendingTasks: [],
    lastViewed: null,
    aiInteractions: [],
  });

  useEffect(() => {
    const saved = localStorage.getItem('codex_context');
    if (saved) {
      try {
        setContext(JSON.parse(saved));
      } catch (error) {
        console.error('Context load error:', error);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('codex_context', JSON.stringify(context));
  }, [context]);

  const updateContext = (updates) => {
    setContext(prev => ({ ...prev, ...updates }));
  };

  const trackView = (entityType, entityId, entityData) => {
    updateContext({
      lastViewed: { type: entityType, id: entityId, data: entityData, timestamp: new Date().toISOString() },
      recentEntities: [
        { type: entityType, id: entityId, data: entityData, timestamp: new Date().toISOString() },
        ...context.recentEntities.slice(0, 9)
      ]
    });
  };

  const trackWorkflow = (workflowType, step) => {
    updateContext({
      activeWorkflows: [
        { type: workflowType, step, timestamp: new Date().toISOString() },
        ...context.activeWorkflows.filter(w => w.type !== workflowType).slice(0, 4)
      ]
    });
  };

  const trackAIInteraction = (action, result) => {
    updateContext({
      aiInteractions: [
        { action, result, timestamp: new Date().toISOString() },
        ...context.aiInteractions.slice(0, 19)
      ]
    });
  };

  const getContextSuggestions = () => {
    const suggestions = [];
    
    if (context.lastViewed) {
      suggestions.push({
        type: 'resume',
        label: `Riprendi ${context.lastViewed.type}`,
        data: context.lastViewed
      });
    }
    
    if (context.activeWorkflows.length > 0) {
      const workflow = context.activeWorkflows[0];
      suggestions.push({
        type: 'continue',
        label: `Completa ${workflow.type}`,
        data: workflow
      });
    }
    
    return suggestions;
  };

  const clearContext = () => {
    setContext({
      recentEntities: [],
      activeWorkflows: [],
      pendingTasks: [],
      lastViewed: null,
      aiInteractions: [],
    });
    localStorage.removeItem('codex_context');
  };

  return { 
    context, 
    updateContext, 
    trackView, 
    trackWorkflow, 
    trackAIInteraction,
    getContextSuggestions,
    clearContext 
  };
}