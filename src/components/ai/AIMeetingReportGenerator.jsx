import { useState, useEffect } from 'react';
import { FileText, Check, X, Clock, AlertTriangle, ChevronRight, Download } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

/**
 * AI Meeting Report Generator
 * 
 * Generates professional meeting reports using AI based on:
 * - Project status
 * - Recent activities
 * - Team updates
 * - Client communications
 */

export default function AIMeetingReportGenerator({ projectId, onClose }) {
  const [loading, setLoading] = useState(false);
  const [reportType, setReportType] = useState('weekly');
  const [generated, setGenerated] = useState(null);
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(projectId);

  useEffect(() => {
    if (!projectId) {
      loadProjects();
    } else {
      setSelectedProject(projectId);
    }
  }, []);

  const loadProjects = async () => {
    const list = await base44.entities.Project.list();
    setProjects(list.filter(p => p.status !== 'Archived'));
  };

  const generateReport = async () => {
    setLoading(true);
    try {
      const response = await base44.functions.invoke('codexAIChat', {
        message: `Generate a professional ${reportType} meeting report for project ${selectedProject}. Include: executive summary, progress updates, blockers, next steps, and action items.`,
      });

      setGenerated({
        content: response.data.response,
        generated_at: new Date().toISOString(),
        type: reportType,
      });

      toast.success('Report generato con successo');
    } catch (error) {
      toast.error(`Errore: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const downloadReport = () => {
    if (!generated) return;
    
    const blob = new Blob([generated.content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Meeting_Report_${new Date().toISOString().split('T')[0]}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    
    toast.success('Report scaricato');
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-2xl shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-500" />
            <h2 className="text-lg font-bold text-gray-900">Generatore Report AI</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        {!generated ? (
          <div className="space-y-4">
            {/* Project Selection */}
            {!projectId && (
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-2">Progetto</label>
                <select
                  value={selectedProject || ''}
                  onChange={e => setSelectedProject(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none"
                >
                  <option value="">Seleziona progetto...</option>
                  {projects.map(p => (
                    <option key={p.id} value={p.id}>{p.title}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Report Type */}
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-2">Tipo Report</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'weekly', label: 'Settimanale', icon: Clock },
                  { id: 'milestone', label: 'Milestone', icon: Check },
                  { id: 'completion', label: 'Completamento', icon: FileText },
                ].map(type => {
                  const Icon = type.icon;
                  return (
                    <button
                      key={type.id}
                      onClick={() => setReportType(type.id)}
                      className={`p-3 rounded-lg border text-center transition-all ${
                        reportType === type.id
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <Icon className="w-4 h-4 mx-auto mb-1" />
                      <span className="text-xs font-medium">{type.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Generate Button */}
            <button
              onClick={generateReport}
              disabled={loading || !selectedProject}
              className="w-full py-2.5 text-sm text-white rounded-lg font-medium disabled:opacity-40"
              style={{ backgroundColor: '#1147FF' }}
            >
              {loading ? 'Generazione...' : 'Genera Report'}
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Generated Content */}
            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
              <pre className="text-sm text-gray-700 whitespace-pre-wrap font-sans">
                {generated.content}
              </pre>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <button
                onClick={downloadReport}
                className="flex-1 flex items-center justify-center gap-2 py-2 text-sm text-white rounded-lg font-medium"
                style={{ backgroundColor: '#1147FF' }}
              >
                <Download className="w-4 h-4" /> Scarica
              </button>
              <button
                onClick={() => setGenerated(null)}
                className="flex-1 py-2 text-sm border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50"
              >
                Nuovo Report
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}