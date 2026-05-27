import { useState, useEffect } from 'react';
import { Activity, Clock, Users, Brain, TrendingUp, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import PropertyHealthScore from '../components/ai/PropertyHealthScore';
import OperationalTimeline from '../components/ai/OperationalTimeline';
import TechnicianLoadAnalysis from '../components/ai/TechnicianLoadAnalysis';

export default function AICopilotFeatures() {
  const [properties, setProperties] = useState([]);
  const [projects, setProjects] = useState([]);
  const [activeTab, setActiveTab] = useState('health');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const [props, projs] = await Promise.all([
      base44.entities.Property.list(),
      base44.entities.Project.list(),
    ]);
    setProperties(props);
    setProjects(projs);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Brain className="w-6 h-6 text-blue-500" />
            Codex AI Copilot - Funzionalità Avanzate
          </h1>
          <p className="text-sm text-gray-500 mt-1">Dashboard dimostrativa delle nuove capacità AI</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('health')}
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === 'health'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <Activity className="w-4 h-4 inline mr-1.5" />
          Property Health Score
        </button>
        <button
          onClick={() => setActiveTab('timeline')}
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === 'timeline'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <Clock className="w-4 h-4 inline mr-1.5" />
          Operational Timeline
        </button>
        <button
          onClick={() => setActiveTab('technicians')}
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === 'technicians'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <Users className="w-4 h-4 inline mr-1.5" />
          Technician Load Analysis
        </button>
      </div>

      {/* Content */}
      {activeTab === 'health' && (
        <div className="space-y-6">
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-blue-900">Property Health Score Implementato</p>
                <p className="text-xs text-blue-700 mt-1">
                  Analisi automatica di 6 categorie (elettrico, idraulico, HVAC, tetto, sicurezza, networking) con scoring 0-100, 
                  rilevamento problemi critici, e raccomandazioni di manutenzione.
                </p>
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {properties.slice(0, 4).map(property => (
              <PropertyHealthScore key={property.id} propertyId={property.id} />
            ))}
          </div>

          {properties.length === 0 && (
            <div className="text-center py-12">
              <Activity className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-sm text-gray-500">Nessuna proprietà disponibile</p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'timeline' && (
        <div className="space-y-6">
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <TrendingUp className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-amber-900">Operational Timeline Implementato</p>
                <p className="text-xs text-amber-700 mt-1">
                  Generazione automatica di narrative temporali che collegano eventi, identificano relazioni causa-effetto, 
                  e evidenziano insight operativi da progetti, ticket, e interventi.
                </p>
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {projects.slice(0, 2).map((project, idx) => (
              <OperationalTimeline key={`proj-${idx}`} entityType="project" entityId={project.id} />
            ))}
            {properties.slice(0, 2).map((property, idx) => (
              <OperationalTimeline key={`prop-${idx}`} entityType="property" entityId={property.id} />
            ))}
          </div>

          {projects.length === 0 && properties.length === 0 && (
            <div className="text-center py-12">
              <Clock className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-sm text-gray-500">Nessun dato disponibile per la timeline</p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'technicians' && (
        <div className="space-y-6">
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <Users className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-emerald-900">Technician Load Analysis Implementato</p>
                <p className="text-xs text-emerald-700 mt-1">
                  Monitoraggio in tempo reale del carico di lavoro per tecnico, con rilevamento sovraccarichi, 
                  identificazione tecnici disponibili, e raccomandazioni per assegnazioni ottimali.
                </p>
              </div>
            </div>
          </div>

          <TechnicianLoadAnalysis />

          <div className="bg-blue-50 border border-blue-200 rounded-xl p-5">
            <h3 className="text-sm font-semibold text-blue-900 mb-3">Come Funziona</h3>
            <div className="space-y-2 text-xs text-blue-800">
              <p>• <strong>Analisi Progetti:</strong> Conta progetti attivi per ogni tecnico</p>
              <p>• <strong>Analisi Ticket:</strong> Monitora ticket assegnati e non risolti</p>
              <p>• <strong>Timesheet:</strong> Calcola ore lavorate questa settimana</p>
              <p>• <strong>Sovraccarico:</strong> Alert se &gt;40h o &gt;3 progetti o &gt;5 ticket</p>
              <p>• <strong>Disponibilità:</strong> Identifica tecnici con capacità per nuovi task</p>
            </div>
          </div>
        </div>
      )}

      {/* Integration Guide */}
      <div className="bg-gray-50 border border-gray-200 rounded-xl p-5 mt-8">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Integrazione nei Page Esistenti</h3>
        <div className="grid md:grid-cols-2 gap-4 text-xs">
          <div>
            <p className="font-medium text-gray-700 mb-2">Property Detail:</p>
            <code className="bg-white px-2 py-1 rounded border border-gray-200 block mb-1">
              &lt;PropertyHealthScore propertyId={property.id} /&gt;
            </code>
            <code className="bg-white px-2 py-1 rounded border border-gray-200 block">
              &lt;OperationalTimeline entityType="property" entityId={property.id} /&gt;
            </code>
          </div>
          <div>
            <p className="font-medium text-gray-700 mb-2">Project Detail:</p>
            <code className="bg-white px-2 py-1 rounded border border-gray-200 block mb-1">
              &lt;OperationalTimeline entityType="project" entityId={project.id} /&gt;
            </code>
            <code className="bg-white px-2 py-1 rounded border border-gray-200 block">
              &lt;TechnicianLoadAnalysis projectId={project.id} /&gt;
            </code>
          </div>
        </div>
      </div>
    </div>
  );
}