import { useState, useEffect } from 'react';
import { Play, Plus, Trash2, Edit2, Save, X, Clock, CheckCircle2, AlertTriangle, Mail, Users, Calendar, TrendingUp, Zap, Shield, FileText, MessageSquare, ArrowRight } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

const STEP_TYPES = [
  { value: 'action', label: 'Azione', icon: Zap, color: '#3B82F6' },
  { value: 'approval', label: 'Approvazione', icon: Shield, color: '#F59E0B' },
  { value: 'delay', label: 'Attesa', icon: Clock, color: '#8B5CF6' },
  { value: 'notification', label: 'Notifica', icon: Mail, color: '#10B981' },
  { value: 'escalation', label: 'Escalation', icon: AlertTriangle, color: '#EF4444' },
  { value: 'condition', label: 'Condizione', icon: TrendingUp, color: '#06b6d4' },
];

const ACTION_TYPES = [
  { value: 'create_task', label: 'Crea Task' },
  { value: 'create_checklist', label: 'Crea Checklist' },
  { value: 'update_entity', label: 'Aggiorna Entità' },
  { value: 'send_email', label: 'Invia Email' },
];

export default function WorkflowBuilder() {
  const [workflows, setWorkflows] = useState([]);
  const [selectedWorkflow, setSelectedWorkflow] = useState(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    name: '',
    description: '',
    category: 'Custom',
    trigger_type: 'entity_event',
    steps: [],
    is_active: true,
    risk_level: 'Medium',
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadWorkflows();
  }, []);

  const loadWorkflows = async () => {
    const list = await base44.entities.Workflow.list();
    setWorkflows(list);
  };

  const createNewWorkflow = () => {
    setSelectedWorkflow(null);
    setForm({
      name: '',
      description: '',
      category: 'Custom',
      trigger_type: 'entity_event',
      steps: [],
      is_active: true,
      risk_level: 'Medium',
    });
    setEditing(true);
  };

  const editWorkflow = (workflow) => {
    setSelectedWorkflow(workflow);
    setForm(workflow);
    setEditing(true);
  };

  const saveWorkflow = async () => {
    setLoading(true);
    try {
      if (selectedWorkflow) {
        await base44.entities.Workflow.update(selectedWorkflow.id, form);
        toast.success('Workflow aggiornato');
      } else {
        await base44.entities.Workflow.create(form);
        toast.success('Workflow creato');
      }
      setEditing(false);
      loadWorkflows();
    } catch (error) {
      toast.error(`Errore: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const addStep = () => {
    const newStep = {
      id: `step_${Date.now()}`,
      type: 'action',
      action_type: 'create_task',
      config: {},
      order: form.steps.length,
    };
    setForm(f => ({ ...f, steps: [...f.steps, newStep] }));
  };

  const updateStep = (index, updates) => {
    const newSteps = [...form.steps];
    newSteps[index] = { ...newSteps[index], ...updates };
    setForm(f => ({ ...f, steps: newSteps }));
  };

  const deleteStep = (index) => {
    const newSteps = form.steps.filter((_, i) => i !== index);
    setForm(f => ({ ...f, steps: newSteps }));
  };

  const runWorkflow = async (workflow) => {
    try {
      await base44.functions.invoke('executeWorkflow', {
        workflow_id: workflow.id,
        manual_execution: true,
      });
      toast.success('Workflow eseguito');
      loadWorkflows();
    } catch (error) {
      toast.error(`Errore: ${error.message}`);
    }
  };

  if (editing) {
    return (
      <div className="p-6 max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {selectedWorkflow ? 'Modifica Workflow' : 'Nuovo Workflow'}
            </h1>
            <p className="text-sm text-gray-500 mt-1">Workflow Builder - Drag & drop style</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setEditing(false)}
              className="flex items-center gap-2 px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50"
            >
              <X className="w-4 h-4" /> Annulla
            </button>
            <button
              onClick={saveWorkflow}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 text-sm text-white rounded-lg disabled:opacity-40"
              style={{ background: 'linear-gradient(135deg, #1147FF 0%, #0B2341 100%)' }}
            >
              <Save className="w-4 h-4" /> {loading ? 'Salvataggio...' : 'Salva'}
            </button>
          </div>
        </div>

        {/* Basic Info */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Nome Workflow</label>
            <input
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none"
              placeholder="Es: Onboarding Nuovo Progetto"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Categoria</label>
            <select
              value={form.category}
              onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none"
            >
              <option>Project Management</option>
              <option>Estimate</option>
              <option>Ticket</option>
              <option>Guardian</option>
              <option>Financial</option>
              <option>Maintenance</option>
              <option>Client Communication</option>
              <option>Quality Control</option>
              <option>Custom</option>
            </select>
          </div>
          <div className="col-span-2">
            <label className="block text-xs font-medium text-gray-500 mb-1">Descrizione</label>
            <textarea
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              rows={2}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none resize-none"
              placeholder="Descrivi lo scopo del workflow..."
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Trigger Type</label>
            <select
              value={form.trigger_type}
              onChange={e => setForm(f => ({ ...f, trigger_type: e.target.value }))}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none"
            >
              <option value="entity_event">Evento Entità</option>
              <option value="scheduled">Schedulato</option>
              <option value="manual">Manuale</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Risk Level</label>
            <select
              value={form.risk_level}
              onChange={e => setForm(f => ({ ...f, risk_level: e.target.value }))}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none"
            >
              <option>Low</option>
              <option>Medium</option>
              <option>High</option>
              <option>Critical</option>
            </select>
          </div>
        </div>

        {/* Workflow Steps */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2">
              <Zap className="w-4 h-4 text-blue-500" />
              Step del Workflow
            </h2>
            <button
              onClick={addStep}
              className="flex items-center gap-2 px-3 py-1.5 text-sm text-white rounded-lg"
              style={{ background: 'linear-gradient(135deg, #1147FF 0%, #0B2341 100%)' }}
            >
              <Plus className="w-4 h-4" /> Aggiungi Step
            </button>
          </div>

          {form.steps.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <Zap className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="text-sm">Nessuno step configurato</p>
              <p className="text-xs mt-1">Aggiungi il primo step per iniziare</p>
            </div>
          ) : (
            <div className="space-y-3">
              {form.steps.map((step, index) => (
                <StepEditor
                  key={step.id}
                  step={step}
                  index={index}
                  onUpdate={(updates) => updateStep(index, updates)}
                  onDelete={() => deleteStep(index)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Workflow List View
  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Zap className="w-6 h-6 text-blue-500" />
            Workflow Builder
          </h1>
          <p className="text-sm text-gray-500 mt-1">Crea e gestisci automazioni workflow-driven</p>
        </div>
        <button
          onClick={createNewWorkflow}
          className="flex items-center gap-2 px-4 py-2 text-sm text-white rounded-lg"
          style={{ background: 'linear-gradient(135deg, #1147FF 0%, #0B2341 100%)' }}
        >
          <Plus className="w-4 h-4" /> Nuovo Workflow
        </button>
      </div>

      {/* Workflows Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {workflows.map(workflow => (
          <div
            key={workflow.id}
            className="bg-white rounded-xl border border-gray-200 p-5 hover:border-blue-300 transition-all cursor-pointer"
            onClick={() => editWorkflow(workflow)}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-gray-900">{workflow.name}</h3>
                <p className="text-xs text-gray-500 mt-1 line-clamp-2">{workflow.description}</p>
              </div>
              <span className={`text-[10px] px-2 py-0.5 rounded-full ${workflow.is_active ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-gray-50 text-gray-600 border border-gray-200'}`}>
                {workflow.is_active ? 'Attivo' : 'Inattivo'}
              </span>
            </div>

            <div className="flex items-center gap-2 text-xs text-gray-500 mb-3">
              <span className="flex items-center gap-1">
                <Play className="w-3 h-3" /> {workflow.trigger_type}
              </span>
              <span>·</span>
              <span className="flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> {workflow.execution_count || 0} esecuzioni
              </span>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-gray-100">
              <span className="text-[10px] text-gray-400">{workflow.category}</span>
              <div className="flex gap-2">
                <button
                  onClick={(e) => { e.stopPropagation(); runWorkflow(workflow); }}
                  className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-600"
                  title="Esegui manualmente"
                >
                  <Play className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); editWorkflow(workflow); }}
                  className="p-1.5 rounded-lg hover:bg-gray-50 text-gray-600"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {workflows.length === 0 && (
        <div className="text-center py-20">
          <Zap className="w-16 h-16 text-gray-200 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-700 mb-2">Nessun workflow</h3>
          <p className="text-sm text-gray-500 mb-6">Crea il tuo primo workflow per automatizzare i processi</p>
          <button
            onClick={createNewWorkflow}
            className="flex items-center gap-2 px-6 py-3 text-sm text-white rounded-lg"
            style={{ background: 'linear-gradient(135deg, #1147FF 0%, #0B2341 100%)' }}
          >
            <Plus className="w-4 h-4" /> Crea Workflow
          </button>
        </div>
      )}
    </div>
  );
}

function StepEditor({ step, index, onUpdate, onDelete }) {
  const StepIcon = STEP_TYPES.find(t => t.value === step.type)?.icon || Zap;
  const stepColor = STEP_TYPES.find(t => t.value === step.type)?.color || '#3B82F6';

  return (
    <div className="border border-gray-200 rounded-xl p-4 bg-gray-50">
      <div className="flex items-center gap-3 mb-3">
        <div className="flex items-center gap-2 flex-1">
          <span className="text-xs font-bold text-gray-400 w-6">#{index + 1}</span>
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: `${stepColor}20` }}
          >
            <StepIcon className="w-4 h-4" style={{ color: stepColor }} />
          </div>
          <select
            value={step.type}
            onChange={e => onUpdate({ type: e.target.value })}
            className="text-sm font-semibold text-gray-900 bg-transparent border-none focus:outline-none"
          >
            {STEP_TYPES.map(t => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>
        <button onClick={onDelete} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600">
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {step.type === 'action' && (
        <div className="space-y-2">
          <select
            value={step.action_type}
            onChange={e => onUpdate({ action_type: e.target.value })}
            className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 w-full"
          >
            {ACTION_TYPES.map(a => (
              <option key={a.value} value={a.value}>{a.label}</option>
            ))}
          </select>
          <input
            value={step.config?.title || ''}
            onChange={e => onUpdate({ config: { ...step.config, title: e.target.value } })}
            placeholder="Titolo"
            className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 w-full"
          />
        </div>
      )}

      {step.type === 'approval' && (
        <div className="space-y-2">
          <input
            value={step.config?.title || ''}
            onChange={e => onUpdate({ config: { ...step.config, title: e.target.value } })}
            placeholder="Titolo approvazione"
            className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 w-full"
          />
          <select
            value={step.required_role || 'admin'}
            onChange={e => onUpdate({ required_role: e.target.value })}
            className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 w-full"
          >
            <option value="admin">Admin</option>
            <option value="project_manager">Project Manager</option>
            <option value="finance">Finance</option>
          </select>
        </div>
      )}

      {step.type === 'notification' && (
        <div className="space-y-2">
          <input
            value={step.config?.title || ''}
            onChange={e => onUpdate({ config: { ...step.config, title: e.target.value } })}
            placeholder="Titolo notifica"
            className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 w-full"
          />
          <textarea
            value={step.config?.message || ''}
            onChange={e => onUpdate({ config: { ...step.config, message: e.target.value } })}
            placeholder="Messaggio"
            rows={2}
            className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 w-full resize-none"
          />
        </div>
      )}

      {step.type === 'delay' && (
        <div>
          <label className="text-xs text-gray-500">Minuti di attesa</label>
          <input
            type="number"
            value={step.delay_minutes || 5}
            onChange={e => onUpdate({ delay_minutes: parseInt(e.target.value) })}
            className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 w-full mt-1"
          />
        </div>
      )}
    </div>
  );
}