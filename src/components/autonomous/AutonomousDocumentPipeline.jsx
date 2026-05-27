import { useState, useEffect } from 'react';
import { FileText, Brain, Zap, CheckCircle, AlertTriangle, ChevronRight } from 'lucide-react';
import { base44 } from '@/api/base44Client';

export default function AutonomousDocumentPipeline() {
  const [pipeline, setPipeline] = useState({
    classified: 0,
    extracted: 0,
    connected: 0,
    expiring: 0,
    suggestions: [],
  });

  useEffect(() => {
    processDocuments();
  }, []);

  const processDocuments = async () => {
    try {
      const [documents, projects, properties, clients] = await Promise.all([
        base44.entities.Document.list(),
        base44.entities.Project.list(),
        base44.entities.Property.list(),
        base44.entities.Client.list(),
      ]);

      let classified = 0;
      let extracted = 0;
      let connected = 0;
      let expiring = 0;
      const suggestions = [];

      // Auto-classify documents
      documents.forEach(doc => {
        if (!doc.document_type) {
          classified++;
          suggestions.push({
            type: 'classification',
            document_id: doc.id,
            title: doc.title,
            suggestion: 'Auto-classify based on content',
            confidence: 85
          });
        }

        // Detect expiring documents
        if (doc.expiry_date) {
          const daysUntilExpiry = (new Date(doc.expiry_date) - new Date()) / (1000 * 60 * 60 * 24);
          if (daysUntilExpiry > 0 && daysUntilExpiry <= 30) {
            expiring++;
            suggestions.push({
              type: 'expiration_alert',
              document_id: doc.id,
              title: doc.title,
              days_left: Math.round(daysUntilExpiry),
              urgency: daysUntilExpiry <= 7 ? 'high' : 'medium'
            });
          }
        }

        // Check entity connections
        if (!doc.project_id && !doc.property_id && !doc.client_id) {
          connected++;
          suggestions.push({
            type: 'entity_connection',
            document_id: doc.id,
            title: doc.title,
            suggestion: 'Connect to related project/property/client',
            confidence: 75
          });
        }

        // Extract data suggestions
        if (doc.file_url && !doc.extracted_data) {
          extracted++;
          suggestions.push({
            type: 'data_extraction',
            document_id: doc.id,
            title: doc.title,
            suggestion: 'Extract structured data from document',
            confidence: 80
          });
        }
      });

      // Home Passport update suggestions
      const propertiesWithRecentProjects = properties.filter(p => 
        projects.some(proj => proj.property_id === p.id && proj.status === 'Delivered')
      );
      if (propertiesWithRecentProjects.length > 0) {
        suggestions.push({
          type: 'home_passport_update',
          count: propertiesWithRecentProjects.length,
          description: `${propertiesWithRecentProjects.length} properties have completed projects. Update Home Passport with as-built data.`,
          confidence: 88
        });
      }

      setPipeline({ classified, extracted, connected, expiring, suggestions });
    } catch (error) {
      console.error('Pipeline error:', error);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="flex items-center gap-2 mb-4">
        <FileText className="w-4 h-4 text-blue-600" />
        <h2 className="text-sm font-semibold text-gray-900">Autonomous Document Pipeline</h2>
      </div>

      {/* Pipeline Stats */}
      <div className="grid grid-cols-4 gap-3 mb-4">
        <PipelineStat label="To Classify" value={pipeline.classified} color="#1147FF" />
        <PipelineStat label="To Extract" value={pipeline.extracted} color="#8B5CF6" />
        <PipelineStat label="To Connect" value={pipeline.connected} color="#F59E0B" />
        <PipelineStat label="Expiring" value={pipeline.expiring} color="#EF4444" />
      </div>

      {/* Suggestions */}
      {pipeline.suggestions.length > 0 ? (
        <div>
          <h3 className="text-xs font-semibold text-gray-700 mb-2">Processing Suggestions</h3>
          <div className="space-y-2">
            {pipeline.suggestions.slice(0, 5).map((suggestion, idx) => (
              <SuggestionCard key={idx} suggestion={suggestion} />
            ))}
          </div>
        </div>
      ) : (
        <div className="text-center py-8 text-gray-400">
          <CheckCircle className="w-8 h-8 mx-auto mb-2 text-green-600" />
          <p className="text-sm">All documents processed.</p>
        </div>
      )}
    </div>
  );
}

function PipelineStat({ label, value, color }) {
  return (
    <div className="bg-gray-50 rounded-lg p-3 text-center">
      <p className="text-lg font-bold" style={{ color }}>{value}</p>
      <p className="text-[10px] text-gray-500">{label}</p>
    </div>
  );
}

function SuggestionCard({ suggestion }) {
  const typeConfig = {
    classification: { icon: FileText, color: '#1147FF', label: 'Classification' },
    expiration_alert: { icon: AlertTriangle, color: '#EF4444', label: 'Expiration Alert' },
    entity_connection: { icon: Zap, color: '#8B5CF6', label: 'Entity Connection' },
    data_extraction: { icon: Brain, color: '#10B981', label: 'Data Extraction' },
    home_passport_update: { icon: CheckCircle, color: '#06B6D4', label: 'Home Passport Update' },
  };

  const config = typeConfig[suggestion.type] || typeConfig.classification;
  const Icon = config.icon;

  return (
    <div className="bg-gray-50 rounded-lg p-2 border border-gray-200 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <Icon className="w-3 h-3" style={{ color: config.color }} />
        <div>
          <p className="text-xs font-semibold text-gray-900">{suggestion.title || config.label}</p>
          <p className="text-xs text-gray-600">{suggestion.suggestion || suggestion.description}</p>
        </div>
      </div>
      {suggestion.days_left && (
        <span className={`text-xs font-bold px-2 py-1 rounded-full ${
          suggestion.urgency === 'high' ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'
        }`}>
          {suggestion.days_left} days
        </span>
      )}
      {suggestion.confidence && (
        <span className="text-xs text-gray-500">{suggestion.confidence}%</span>
      )}
      <ChevronRight className="w-3 h-3 text-gray-400" />
    </div>
  );
}