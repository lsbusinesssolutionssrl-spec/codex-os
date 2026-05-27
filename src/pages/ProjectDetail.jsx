import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Edit2, Save, X, Plus, Trash2, Camera, BookOpen, Home, FileCheck, FileText, Download, TrendingUp, Brain, Activity, Clock, Users, Calendar, Mail, Zap } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import StatusBadge from '../components/StatusBadge';
import FinancialSummary from '../components/FinancialSummary';
import PhotoGallery from '../components/PhotoGallery';
import Breadcrumb from '../components/Breadcrumb';
import { hasRole, canEditFinancialFields } from '../lib/roleUtils';
import InternalComments from '../components/InternalComments';
import ContextualAIPanel from '../components/ai/ContextualAIPanel';
import OperationalTimeline from '../components/ai/OperationalTimeline';
import TechnicianLoadAnalysis from '../components/ai/TechnicianLoadAnalysis';
import WarrantyTracker from '../components/ai/WarrantyTracker';
import AICommunicationGenerator from '../components/ai/AICommunicationGenerator';
import AIWorkflowSuggestions from '../components/ai/AIWorkflowSuggestions';

const STATUSES = ['Lead', 'Survey', 'Estimate', 'Approved', 'In Progress', 'Testing', 'Delivered', 'Guardian Active', 'Archived'];
const SOP_CATEGORIES = ['Bathroom', 'Full Home', 'Electrical', 'Networking', 'Security', 'Roofing', 'Handover'];

export default function ProjectDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [client, setClient] = useState(null);
  const [property, setProperty] = useState(null);
  const [clients, setClients] = useState([]);
  const [users, setUsers] = useState([]);
  const [checklists, setChecklists] = useState([]);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({});
  const [newTask, setNewTask] = useState('');
  const [addingTask, setAddingTask] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [newMilestone, setNewMilestone] = useState({ title: '', due_date: '' });
  const [addingMilestone, setAddingMilestone] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [sopModal, setSopModal] = useState(false);
  const [sopTemplates, setSopTemplates] = useState([]);
  const [applyingTemplate, setApplyingTemplate] = useState(false);
  const [activePhotoTab, setActivePhotoTab] = useState('before');
  const [reportModal, setReportModal] = useState(false);
  const [selectedReport, setSelectedReport] = useState('progress');
  const [generatingReport, setGeneratingReport] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const [canEditFinancial, setCanEditFinancial] = useState(false);
  const [showAIPanel, setShowAIPanel] = useState(false);
  const [showTimeline, setShowTimeline] = useState(false);
  const [showTechAnalysis, setShowTechAnalysis] = useState(false);
  const [showWarranties, setShowWarranties] = useState(false);
  const [showCommunication, setShowCommunication] = useState(false);
  const [showWorkflowSuggestions, setShowWorkflowSuggestions] = useState(false);

  useEffect(() => {
    Promise.all([hasRole(['admin', 'project_manager']), canEditFinancialFields()]).then(([hasRoleRes, canEdit]) => {
      setCanEditFinancial(canEdit);
    });
  }, []);

  useEffect(() => {
    const load = async () => {
      const [projs, cls, checks, usrs] = await Promise.all([
        base44.entities.Project.filter({ id }),
        base44.entities.Client.list(),
        base44.entities.ChecklistItem.filter({ project_id: id }),
        base44.entities.User.list(),
      ]);
      
      // SECURITY: Verify user has access to this project
      if (projs.length === 0) {
        navigate('/projects');
        return;
      }
      
      const project = projs[0];
      
      // Additional check: for technicians, verify they're assigned
      const user = await base44.auth.me();
      if (user && user.role === 'technician') {
        const isAssigned = project.team_members?.includes(user.email) || project.created_by === user.email;
        if (!isAssigned) {
          navigate('/projects');
          return;
        }
      }
      
      setProject(project);
      setForm(project);
      const c = cls.find(c => c.id === project.client_id);
      setClient(c);
      if (project.property_id) {
        const props = await base44.entities.Property.filter({ id: project.property_id });
        setProperty(props[0]);
      }
      setClients(cls);
      setUsers(usrs);
      setChecklists(checks);
    };
    load();
  }, [id]);

  const openSOPModal = async () => {
    if (sopTemplates.length === 0) {
      const templates = await base44.entities.SOPTemplate.list();
      setSopTemplates(templates);
    }
    setSopModal(true);
  };

  const applySOPTemplate = async (template) => {
    setApplyingTemplate(true);
    const items = template.items || [];
    const newItems = await Promise.all(
      items.map(item => base44.entities.ChecklistItem.create({
        title: item.title || item.name || 'Attività',
        description: item.description || '',
        project_id: id,
        category: template.category,
        status: 'To Do',
      }))
    );
    setChecklists(prev => [...prev, ...newItems]);
    setSopModal(false);
    setApplyingTemplate(false);
  };

  const deleteRecord = async () => {
    await base44.entities.Project.delete(id);
    navigate('/projects');
  };

  const addChecklist = async () => {
    if (!newTask.trim()) return;
    const created = await base44.entities.ChecklistItem.create({ title: newTask.trim(), project_id: id, status: 'To Do' });
    setChecklists(prev => [...prev, created]);
    setNewTask('');
    setAddingTask(false);
  };

  const addMilestone = async () => {
    if (!newMilestone.title.trim()) return;
    const milestones = [...(form.milestones || []), { ...newMilestone, id: Date.now().toString(), done: false }];
    const updated = await base44.entities.Project.update(id, { milestones });
    setProject(updated);
    setForm(updated);
    setNewMilestone({ title: '', due_date: '' });
    setAddingMilestone(false);
  };

  const toggleMilestone = async (mId) => {
    const milestones = (form.milestones || []).map(m => m.id === mId ? { ...m, done: !m.done } : m);
    const updated = await base44.entities.Project.update(id, { milestones });
    setProject(updated);
    setForm(updated);
  };

  const deleteMilestone = async (mId) => {
    const milestones = (form.milestones || []).filter(m => m.id !== mId);
    const updated = await base44.entities.Project.update(id, { milestones });
    setProject(updated);
    setForm(updated);
  };

  const save = async () => {
    const updated = await base44.entities.Project.update(id, form);
    setProject(updated);
    setEditing(false);
  };

  const handlePhotoUpload = async (file, category) => {
    setUploadingPhoto(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    const key = `photos_${category}`;
    const current = project[key] || [];
    const updated = await base44.entities.Project.update(id, { [key]: [...current, { url: file_url, title: file.name, date: new Date().toISOString() }] });
    setProject(updated);
    setForm(updated);
    setUploadingPhoto(false);
  };

  const handlePhotoRemove = async (url, category) => {
    const key = `photos_${category}`;
    const updated = await base44.entities.Project.update(id, { [key]: (project[key] || []).filter(p => p.url !== url) });
    setProject(updated);
    setForm(updated);
  };

  const generateHomePassport = async () => {
    if (!property) return;
    // Ensure actual_end_date is set when generating Home Passport
    const endDate = project.actual_end_date || new Date().toISOString().split('T')[0];
    if (!project.actual_end_date) {
      await base44.entities.Project.update(id, { actual_end_date: endDate });
    }
    const projectSummary = {
      title: project.title,
      start_date: project.start_date,
      end_date: endDate,
      status: project.status,
      contract_value: project.contract_value,
      estimate_type: project.estimate_type,
      quality_level: project.quality_level,
      photos_before: project.photos_before || [],
      photos_during: project.photos_during || [],
      photos_after: project.photos_after || [],
      documents: project.documents || [],
      notes: project.notes,
      project_id: project.id,
      recorded_at: new Date().toISOString(),
    };
    const interventions = [...(property.interventions || []), projectSummary];
    const updated = await base44.entities.Property.update(property.id, { interventions });
    setProperty(updated);
    navigate(`/properties/${property.id}`);
  };

  const generateReport = async () => {
    setGeneratingReport(true);
    try {
      const response = await base44.functions.invoke('generateProjectReport', {
        project_id: id,
        report_type: selectedReport
      });
      
      // Create blob and download
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Report_${project.title.replace(/[^a-z0-9]/gi, '_')}_${selectedReport}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      
      setReportModal(false);
    } catch (error) {
      console.error('Error generating report:', error);
    } finally {
      setGeneratingReport(false);
    }
  };

  const field = (k, label, type = 'text', options = null) => (
    <div key={k}>
      <label className="block text-xs font-medium text-gray-500 mb-1">{label}</label>
      {options ? (
        <select value={form[k] || ''} onChange={e => setForm(f => ({ ...f, [k]: e.target.value }))} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none">
          <option value="">—</option>
          {options.map(o => <option key={o}>{o}</option>)}
        </select>
      ) : (
        <input type={type} value={form[k] || ''} onChange={e => setForm(f => ({ ...f, [k]: e.target.value }))} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none" />
      )}
    </div>
  );

  if (!project) return <div className="p-6 text-center text-gray-400">Caricamento...</div>;

  if (confirmDelete) return (
    <div className="p-6 max-w-sm mx-auto mt-20 bg-white rounded-2xl border border-gray-200 shadow-lg text-center space-y-4">
      <Trash2 className="w-10 h-10 text-red-400 mx-auto" />
      <h2 className="font-bold text-gray-900">Elimina progetto?</h2>
      <p className="text-sm text-gray-500">Questa azione è irreversibile.</p>
      <div className="flex gap-2">
        <button onClick={deleteRecord} className="flex-1 py-2 text-sm text-white bg-red-500 rounded-lg font-medium hover:bg-red-600">Elimina</button>
        <button onClick={() => setConfirmDelete(false)} className="flex-1 py-2 text-sm border border-gray-200 rounded-lg text-gray-600">Annulla</button>
      </div>
    </div>
  );

  const doneCount = checklists.filter(c => c.status === 'Done').length;
  const progress = checklists.length > 0 ? Math.round((doneCount / checklists.length) * 100) : 0;

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-5">
      {/* Breadcrumb */}
      <Breadcrumb items={[
        { label: 'Progetti', path: '/projects' },
        { label: project.title }
      ]} />

      {/* AI Features Toggle */}
      <div className="flex gap-2">
        <button
          onClick={() => setShowTimeline(!showTimeline)}
          className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
            showTimeline ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          Timeline AI
        </button>
        <button
          onClick={() => setShowWarranties(!showWarranties)}
          className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
            showWarranties ? 'bg-amber-50 text-amber-700 border border-amber-200' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
          }`}
        >
          <Calendar className="w-3.5 h-3.5" />
          Garanzie
        </button>
        <button
          onClick={() => setShowTechAnalysis(!showTechAnalysis)}
          className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
            showTechAnalysis ? 'bg-purple-50 text-purple-700 border border-purple-200' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          Team Analysis
        </button>
        <button
          onClick={() => setShowCommunication(!showCommunication)}
          className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
            showCommunication ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
          }`}
        >
          <Mail className="w-3.5 h-3.5" />
          Email AI
        </button>
        <button
          onClick={() => setShowWorkflowSuggestions(!showWorkflowSuggestions)}
          className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
            showWorkflowSuggestions ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
          }`}
        >
          <Zap className="w-3.5 h-3.5" />
          Workflow AI
        </button>
        <button
          onClick={() => setShowAIPanel(!showAIPanel)}
          className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
            showAIPanel ? 'bg-purple-50 text-purple-700 border border-purple-200' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
          }`}
        >
          <Brain className="w-3.5 h-3.5" />
          AI Copilot
        </button>
      </div>

      {/* Operational Timeline */}
      {showTimeline && <OperationalTimeline entityType="project" entityId={id} />}

      {/* Warranty Tracker */}
      {showWarranties && <WarrantyTracker projectId={id} />}

      {/* Technician Load Analysis */}
      {showTechAnalysis && <TechnicianLoadAnalysis projectId={id} />}

      {/* AI Communication Generator */}
      {showCommunication && <AICommunicationGenerator entityType="project" entityId={id} onClose={() => setShowCommunication(false)} />}

      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 flex-1">
          <button onClick={() => navigate('/projects')} className="p-2 rounded-lg hover:bg-gray-100">
            <ArrowLeft className="w-4 h-4 text-gray-600" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-gray-900">{project.title}</h1>
            <div className="flex items-center gap-2 mt-0.5">
              <StatusBadge status={project.status} />
              {client && <span className="text-xs text-gray-400">{client.name}</span>}
              {property && <span className="text-xs text-gray-400">· {property.property_name}</span>}
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          {!editing ? (
            <>
              <button onClick={() => navigate(`/projects/${id}/financial`)} className="flex items-center gap-2 px-3 py-1.5 text-sm text-white rounded-lg" style={{ backgroundColor: '#0B2341' }}>
                <TrendingUp className="w-3.5 h-3.5" /> Finanziario
              </button>
              <button onClick={() => setReportModal(true)} className="flex items-center gap-2 px-3 py-1.5 text-sm border border-gray-200 rounded-lg hover:bg-gray-50">
                <FileText className="w-3.5 h-3.5" /> Report
              </button>
              <button onClick={() => setShowAIPanel(!showAIPanel)} className={`flex items-center gap-2 px-3 py-1.5 text-sm border rounded-lg transition-all ${showAIPanel ? 'bg-blue-50 border-blue-300 text-blue-700' : 'border-gray-200 hover:bg-gray-50'}`}>
                <Brain className="w-3.5 h-3.5" /> AI Copilot
              </button>
              <button onClick={() => setEditing(true)} className="flex items-center gap-2 px-3 py-1.5 text-sm border border-gray-200 rounded-lg hover:bg-gray-50">
                <Edit2 className="w-3.5 h-3.5" /> Modifica
              </button>
              {project.status === 'Delivered' && property && (
                <button onClick={generateHomePassport} className="flex items-center gap-2 px-3 py-1.5 text-sm text-white rounded-lg" style={{ backgroundColor: '#0B2341' }}>
                  <Home className="w-3.5 h-3.5" /> Home Passport
                </button>
              )}
              <button onClick={() => setConfirmDelete(true)} className="p-1.5 rounded-lg hover:bg-red-50 text-red-400 hover:text-red-600">
                <Trash2 className="w-4 h-4" />
              </button>
            </>
          ) : (
            <>
              <button onClick={save} className="flex items-center gap-2 px-3 py-1.5 text-sm text-white rounded-lg" style={{ backgroundColor: '#1147FF' }}>
                <Save className="w-3.5 h-3.5" /> Salva
              </button>
              <button onClick={() => setEditing(false)} className="p-1.5 rounded-lg hover:bg-gray-100"><X className="w-4 h-4" /></button>
            </>
          )}
        </div>
      </div>

      {/* Financial Summary */}
      {!editing && <FinancialSummary project={project} />}

      {/* Edit Form */}
      {editing && (
        <div className="bg-white rounded-xl border border-gray-200 p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {field('title', 'Titolo')}
          {field('status', 'Stato', 'text', STATUSES)}
          {!canEditFinancial && (
            <>
              <div className="sm:col-span-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-xs text-yellow-800 font-medium">⚠️ Solo admin può modificare i campi finanziari</p>
              </div>
            </>
          )}
          {canEditFinancial && (
            <>
              {field('contract_value', 'Valore Contratto (€)', 'number')}
              {field('approved_variations', 'Variazioni Approvate (€)', 'number')}
              {field('material_costs', 'Costo Materiali (€)', 'number')}
              {field('labor_costs', 'Costo Manodopera (€)', 'number')}
              {field('other_costs', 'Altri Costi (€)', 'number')}
              {field('payment_collected', 'Pagamenti Ricevuti (€)', 'number')}
            </>
          )}
          {field('project_manager', 'Project Manager')}
          {field('start_date', 'Data Inizio', 'date')}
          {field('expected_end_date', 'Data Fine Prevista', 'date')}
          <div className="sm:col-span-2">
            <label className="block text-xs font-medium text-gray-500 mb-1">Note</label>
            <textarea value={form.notes || ''} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={3} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none resize-none" />
          </div>
        </div>
      )}

      {/* Checklist */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-gray-900 flex items-center gap-2">
            <FileCheck className="w-4 h-4 text-blue-600" /> Checklist
          </h2>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">{doneCount}/{checklists.length} completate</span>
            <button onClick={openSOPModal} className="flex items-center gap-1 px-2 py-1 text-xs border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50">
              <BookOpen className="w-3 h-3" /> Template
            </button>
            <button onClick={() => setAddingTask(true)} className="flex items-center gap-1 px-2 py-1 text-xs text-white rounded-lg" style={{ backgroundColor: '#1147FF' }}>
              <Plus className="w-3 h-3" /> Aggiungi
            </button>
          </div>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-2 mb-4">
          <div className="h-2 rounded-full transition-all" style={{ width: `${progress}%`, backgroundColor: '#1147FF' }} />
        </div>
        <div className="space-y-2">
          {checklists.slice(0, 8).map(c => (
            <div key={c.id} onClick={() => navigate(`/checklists/${c.id}`)} className="flex items-center gap-3 py-2 px-3 rounded-lg hover:bg-gray-50 cursor-pointer">
              <div className={`w-2 h-2 rounded-full flex-shrink-0 ${c.status === 'Done' ? 'bg-green-500' : c.status === 'Blocked' ? 'bg-red-400' : c.status === 'In Progress' ? 'bg-blue-500' : 'bg-gray-300'}`} />
              <span className={`text-sm flex-1 ${c.status === 'Done' ? 'text-gray-400 line-through' : 'text-gray-700'}`}>{c.title}</span>
              <StatusBadge status={c.status} />
            </div>
          ))}
          {checklists.length === 0 && !addingTask && <p className="text-sm text-gray-400 text-center py-4">Nessuna attività</p>}
          {addingTask && (
            <div className="flex items-center gap-2 py-2 px-3">
              <input autoFocus value={newTask} onChange={e => setNewTask(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') addChecklist(); if (e.key === 'Escape') setAddingTask(false); }} placeholder="Titolo..." className="flex-1 px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none" />
              <button onClick={addChecklist} className="px-3 py-1.5 text-xs text-white rounded-lg" style={{ backgroundColor: '#1147FF' }}>Aggiungi</button>
              <button onClick={() => setAddingTask(false)} className="p-1.5 rounded-lg hover:bg-gray-100"><X className="w-3.5 h-3.5" /></button>
            </div>
          )}
        </div>
      </div>

      {/* Photo Galleries */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {['before', 'during', 'after'].map(cat => (
          <PhotoGallery
            key={cat}
            category={cat}
            photos={project[`photos_${cat}`] || []}
            onUpload={handlePhotoUpload}
            onRemove={handlePhotoRemove}
            uploading={uploadingPhoto}
          />
        ))}
      </div>

      {/* Milestones */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-900">Milestone</h2>
          <button onClick={() => setAddingMilestone(true)} className="flex items-center gap-1 px-2 py-1 text-xs text-white rounded-lg" style={{ backgroundColor: '#1147FF' }}>
            <Plus className="w-3 h-3" /> Aggiungi
          </button>
        </div>
        {(!form.milestones || form.milestones.length === 0) && !addingMilestone ? (
          <p className="text-sm text-gray-400 text-center py-4">Nessuna milestone</p>
        ) : (
          <div className="space-y-0">
            {(form.milestones || []).map((m, idx) => (
              <div key={m.id} className="flex items-start gap-3 py-3">
                <div className="flex flex-col items-center">
                  <button onClick={() => toggleMilestone(m.id)} className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${m.done ? 'bg-green-500 border-green-500' : 'border-gray-300 hover:border-blue-400'}`}>
                    {m.done && <div className="w-2 h-2 rounded-full bg-white" />}
                  </button>
                  {idx < (form.milestones.length - 1) && <div className="w-0.5 h-8 bg-gray-100 mt-1" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium ${m.done ? 'line-through text-gray-400' : 'text-gray-800'}`}>{m.title}</p>
                  {m.due_date && <p className={`text-xs mt-0.5 ${!m.done && new Date(m.due_date) < new Date() ? 'text-red-500 font-medium' : 'text-gray-400'}`}>{new Date(m.due_date).toLocaleDateString('it-IT')}</p>}
                </div>
                <button onClick={() => deleteMilestone(m.id)} className="p-1 rounded hover:bg-red-50 text-gray-300 hover:text-red-400 flex-shrink-0">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
        {addingMilestone && (
          <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100">
            <input autoFocus value={newMilestone.title} onChange={e => setNewMilestone(m => ({ ...m, title: e.target.value }))} onKeyDown={e => { if (e.key === 'Enter') addMilestone(); if (e.key === 'Escape') setAddingMilestone(false); }} placeholder="Titolo..." className="flex-1 px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none" />
            <input type="date" value={newMilestone.due_date} onChange={e => setNewMilestone(m => ({ ...m, due_date: e.target.value }))} className="px-2 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none" />
            <button onClick={addMilestone} className="px-3 py-1.5 text-xs text-white rounded-lg" style={{ backgroundColor: '#1147FF' }}>Aggiungi</button>
            <button onClick={() => setAddingMilestone(false)} className="p-1.5 rounded-lg hover:bg-gray-100"><X className="w-3.5 h-3.5" /></button>
          </div>
        )}
      </div>

      {/* SOP Modal */}
      {sopModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-gray-900">Applica SOP Template</h2>
              <button onClick={() => setSopModal(false)}><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            {sopTemplates.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-8">Nessun template</p>
            ) : (
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {sopTemplates.map(t => (
                  <div key={t.id} className="flex items-center justify-between p-3 border border-gray-100 rounded-xl hover:border-blue-200 hover:bg-blue-50/30 transition-colors">
                    <div>
                      <p className="text-sm font-semibold text-gray-800">{t.title}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{t.category} · {(t.items || []).length} voci</p>
                    </div>
                    <button onClick={() => applySOPTemplate(t)} disabled={applyingTemplate} className="px-3 py-1.5 text-xs text-white rounded-lg font-medium disabled:opacity-40" style={{ backgroundColor: '#1147FF' }}>
                      {applyingTemplate ? '...' : 'Applica'}
                    </button>
                  </div>
                ))}
              </div>
            )}
            <button onClick={() => setSopModal(false)} className="mt-4 w-full py-2 text-sm border border-gray-200 rounded-lg text-gray-600">Chiudi</button>
          </div>
        </div>
      )}

      {project.notes && (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="font-semibold text-gray-900 mb-2">Note</h2>
          <p className="text-sm text-gray-600 whitespace-pre-wrap">{project.notes}</p>
        </div>
      )}

      {/* Internal Comments */}
      <InternalComments entityType="project" entityId={id} />

      {/* AI Workflow Suggestions */}
      {showWorkflowSuggestions && <AIWorkflowSuggestions entityType="project" entityId={id} onClose={() => setShowWorkflowSuggestions(false)} />}

      {/* AI Copilot Panel */}
      {showAIPanel && <ContextualAIPanel entityType="project" entityId={id} onClose={() => setShowAIPanel(false)} />}

      {/* Report Modal */}
      {reportModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-gray-900 flex items-center gap-2">
                <Download className="w-5 h-5" /> Genera Report
              </h2>
              <button onClick={() => setReportModal(false)}><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-2">Tipo Report</label>
              <div className="space-y-2">
                {[
                  { value: 'progress', label: 'Stato Avanzamento Lavori', desc: 'Progresso, milestone e attività' },
                  { value: 'financial', label: 'Riepilogo Costi', desc: 'Valore, costi e margini' },
                  { value: 'completion', label: 'Relazione di Conclusione', desc: 'Dettagli finali e documentazione' },
                  { value: 'checklist', label: 'Checklist Completa', desc: 'Tutte le attività dettagliate' }
                ].map(option => (
                  <div
                    key={option.value}
                    onClick={() => setSelectedReport(option.value)}
                    className={`p-3 border rounded-xl cursor-pointer transition-all ${
                      selectedReport === option.value
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <p className={`text-sm font-semibold ${selectedReport === option.value ? 'text-blue-700' : 'text-gray-800'}`}>
                      {option.label}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">{option.desc}</p>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="flex gap-2 pt-2">
              <button
                onClick={generateReport}
                disabled={generatingReport}
                className="flex-1 flex items-center justify-center gap-2 py-2 text-sm text-white rounded-lg font-medium disabled:opacity-40"
                style={{ backgroundColor: '#1147FF' }}
              >
                <Download className="w-4 h-4" />
                {generatingReport ? 'Generazione...' : 'Scarica PDF'}
              </button>
              <button
                onClick={() => setReportModal(false)}
                className="flex-1 py-2 text-sm border border-gray-200 rounded-lg text-gray-600"
              >
                Annulla
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}