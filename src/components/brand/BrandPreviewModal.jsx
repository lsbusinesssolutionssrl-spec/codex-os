import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, CheckCircle, Clock, X, Monitor, Smartphone, BookOpen } from 'lucide-react';
import { base44 } from '@/api/base44Client';

const DEFAULT_COLORS = {
  primary: '#1147FF',
  secondary: '#0B2341',
  accent: '#F58020',
  background: '#FFFFFF',
  surface: '#F8FAFC',
  border: '#E2E8F0',
  success: '#10B981',
  warning: '#F59E0B',
  danger: '#EF4444'
};

export default function BrandPreviewModal({ form, onClose }) {
  const [previewMode, setPreviewMode] = useState('dashboard');

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-6">
      <div className="bg-white rounded-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="font-semibold text-lg">Brand Preview</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6">
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => setPreviewMode('dashboard')}
              className={`flex items-center gap-2 px-3 py-2 text-sm rounded-lg ${previewMode === 'dashboard' ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100'}`}
            >
              <Monitor className="w-4 h-4" />
              Dashboard
            </button>
            <button
              onClick={() => setPreviewMode('mobile')}
              className={`flex items-center gap-2 px-3 py-2 text-sm rounded-lg ${previewMode === 'mobile' ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100'}`}
            >
              <Smartphone className="w-4 h-4" />
              Mobile
            </button>
            <button
              onClick={() => setPreviewMode('login')}
              className={`flex items-center gap-2 px-3 py-2 text-sm rounded-lg ${previewMode === 'login' ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100'}`}
            >
              <BookOpen className="w-4 h-4" />
              Login Page
            </button>
          </div>

          <div className="border border-gray-200 rounded-lg p-6 bg-gray-50">
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                {form.logo_url && <img src={form.logo_url} alt="" className="h-8 object-contain" />}
                <h3 className="font-bold text-xl" style={{ color: form.colors?.primary || DEFAULT_COLORS.primary }}>
                  {form.terminology?.platform_name || 'Codex OS'}
                </h3>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="p-4 rounded-lg border" style={{ borderColor: form.colors?.border || DEFAULT_COLORS.border, backgroundColor: form.colors?.surface || DEFAULT_COLORS.surface }}>
                  <p className="text-sm text-gray-500">{form.terminology?.project_label || 'Project'}s</p>
                  <p className="text-2xl font-bold" style={{ color: form.colors?.primary || DEFAULT_COLORS.primary }}>24</p>
                </div>
                <div className="p-4 rounded-lg border" style={{ borderColor: form.colors?.border || DEFAULT_COLORS.border, backgroundColor: form.colors?.surface || DEFAULT_COLORS.surface }}>
                  <p className="text-sm text-gray-500">{form.terminology?.client_label || 'Client'}s</p>
                  <p className="text-2xl font-bold" style={{ color: form.colors?.primary || DEFAULT_COLORS.primary }}>18</p>
                </div>
                <div className="p-4 rounded-lg border" style={{ borderColor: form.colors?.border || DEFAULT_COLORS.border, backgroundColor: form.colors?.surface || DEFAULT_COLORS.surface }}>
                  <p className="text-sm text-gray-500">Revenue</p>
                  <p className="text-2xl font-bold" style={{ color: form.colors?.success || DEFAULT_COLORS.success }}>€428K</p>
                </div>
              </div>
              <div className="mt-4 flex gap-2">
                <button className="px-4 py-2 text-sm text-white rounded-lg" style={{ backgroundColor: form.colors?.primary || DEFAULT_COLORS.primary }}>
                  Primary Action
                </button>
                <button className="px-4 py-2 text-sm text-white rounded-lg" style={{ backgroundColor: form.colors?.accent || DEFAULT_COLORS.accent }}>
                  Accent Action
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}