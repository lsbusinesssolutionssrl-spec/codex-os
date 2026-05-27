import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Palette, Globe, FileText, Monitor, Mail, Upload, Save, RefreshCw } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { hasRole } from '@/lib/roleUtils';
import { toast } from 'sonner';

const SECTIONS = [
  { id: 'branding', label: 'Branding', icon: Palette },
  { id: 'domains', label: 'Custom Domains', icon: Globe },
  { id: 'login', label: 'Login Page', icon: Monitor },
  { id: 'pdf', label: 'PDF Templates', icon: FileText },
  { id: 'portal', label: 'Client Portal', icon: Monitor },
  { id: 'email', label: 'Email Templates', icon: Mail },
];

export default function WhiteLabelSettings() {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState('branding');
  const [brand, setBrand] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    hasRole(['admin', 'company_admin']).then(auth => {
      if (!auth) {
        navigate('/');
        return;
      }
      setIsAuthorized(true);
    });
  }, []);

  useEffect(() => {
    if (!isAuthorized) return;
    
    const load = async () => {
      const brands = await base44.entities.Brand.list();
      setBrand(brands[0] || {
        company_id: '',
        name: '',
        slug: '',
        logo_url: '',
        favicon_url: '',
        primary_color: '#1147FF',
        secondary_color: '#0B2341',
        accent_color: '#F58020',
        custom_domain: '',
        is_default: true,
        login_page_config: {},
        portal_config: {}
      });
      setLoading(false);
    };
    load();
  }, [isAuthorized]);

  const handleSave = async () => {
    setSaving(true);
    try {
      if (brand.id) {
        await base44.entities.Brand.update(brand.id, brand);
      } else {
        const company = await base44.functions.invoke('getCurrentCompany');
        await base44.entities.Brand.create({ ...brand, company_id: company.id });
      }
      toast.success('Branding saved successfully');
    } catch (error) {
      console.error('Save error:', error);
      toast.error('Failed to save branding');
    } finally {
      setSaving(false);
    }
  };

  const handleLogoUpload = async (file, field) => {
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setBrand({ ...brand, [field]: file_url });
      toast.success('Logo uploaded');
    } catch (error) {
      toast.error('Upload failed');
    }
  };

  if (!isAuthorized) return null;
  if (loading) return <div className="p-6 text-center text-gray-400">Loading...</div>;
  if (!brand) return null;

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">White Label Settings</h1>
          <p className="text-sm text-gray-500 mt-0.5">Customize your platform branding</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-4 py-2 text-sm text-white rounded-lg font-medium disabled:opacity-40"
          style={{ backgroundColor: '#1147FF' }}
        >
          <Save className="w-4 h-4" />
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      {/* Section Tabs */}
      <div className="bg-white rounded-xl border border-gray-200 p-2">
        <div className="flex gap-2 overflow-x-auto">
          {SECTIONS.map(section => {
            const Icon = section.icon;
            return (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={`flex items-center gap-2 px-4 py-2 text-sm rounded-lg whitespace-nowrap transition-all ${
                  activeSection === section.id
                    ? 'bg-blue-50 text-blue-700 border border-blue-200'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <Icon className="w-4 h-4" />
                {section.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Branding Section */}
      {activeSection === 'branding' && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-6">
          <h2 className="text-lg font-semibold text-gray-900">Brand Identity</h2>
          
          {/* Logo Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Company Logo</label>
            <div className="flex items-center gap-4">
              {brand.logo_url ? (
                <img src={brand.logo_url} alt="Logo" className="h-16 w-auto border rounded-lg" />
              ) : (
                <div className="h-16 w-32 bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center">
                  <span className="text-xs text-gray-400">No logo</span>
                </div>
              )}
              <label className="px-4 py-2 text-sm text-white rounded-lg cursor-pointer hover:opacity-90" style={{ backgroundColor: '#1147FF' }}>
                Upload Logo
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handleLogoUpload(e.target.files[0], 'logo_url')}
                />
              </label>
            </div>
          </div>

          {/* Favicon Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Favicon</label>
            <div className="flex items-center gap-4">
              {brand.favicon_url ? (
                <img src={brand.favicon_url} alt="Favicon" className="h-8 w-8" />
              ) : (
                <div className="h-8 w-8 bg-gray-100 border-2 border-dashed border-gray-300 rounded flex items-center justify-center">
                  <span className="text-xs text-gray-400">No favicon</span>
                </div>
              )}
              <label className="px-4 py-2 text-sm text-white rounded-lg cursor-pointer hover:opacity-90" style={{ backgroundColor: '#1147FF' }}>
                Upload Favicon
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handleLogoUpload(e.target.files[0], 'favicon_url')}
                />
              </label>
            </div>
          </div>

          {/* Colors */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Primary Color</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={brand.primary_color}
                  onChange={(e) => setBrand({ ...brand, primary_color: e.target.value })}
                  className="w-10 h-10 border rounded cursor-pointer"
                />
                <input
                  type="text"
                  value={brand.primary_color}
                  onChange={(e) => setBrand({ ...brand, primary_color: e.target.value })}
                  className="flex-1 px-3 py-2 text-sm border rounded-lg"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Secondary Color</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={brand.secondary_color}
                  onChange={(e) => setBrand({ ...brand, secondary_color: e.target.value })}
                  className="w-10 h-10 border rounded cursor-pointer"
                />
                <input
                  type="text"
                  value={brand.secondary_color}
                  onChange={(e) => setBrand({ ...brand, secondary_color: e.target.value })}
                  className="flex-1 px-3 py-2 text-sm border rounded-lg"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Accent Color</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={brand.accent_color}
                  onChange={(e) => setBrand({ ...brand, accent_color: e.target.value })}
                  className="w-10 h-10 border rounded cursor-pointer"
                />
                <input
                  type="text"
                  value={brand.accent_color}
                  onChange={(e) => setBrand({ ...brand, accent_color: e.target.value })}
                  className="flex-1 px-3 py-2 text-sm border rounded-lg"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Custom Domains Section */}
      {activeSection === 'domains' && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-6">
          <h2 className="text-lg font-semibold text-gray-900">Custom Domains</h2>
          
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
            <h3 className="text-sm font-semibold text-blue-900 mb-2">DNS Configuration</h3>
            <p className="text-xs text-blue-700 mb-3">
              To connect your custom domain, add the following DNS records at your domain registrar:
            </p>
            <div className="bg-white rounded-lg p-3 font-mono text-xs">
              <div className="flex justify-between py-2 border-b">
                <span>Type: CNAME</span>
                <span>Name: app</span>
                <span>Value: app.codex.com</span>
              </div>
              <div className="flex justify-between py-2">
                <span>Type: A</span>
                <span>Name: @</span>
                <span>Value: 76.76.21.21</span>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Your Custom Domain</label>
            <input
              type="text"
              value={brand.custom_domain || ''}
              onChange={(e) => setBrand({ ...brand, custom_domain: e.target.value })}
              placeholder="app.yourcompany.com"
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg"
            />
            <p className="text-xs text-gray-500 mt-1">SSL certificate will be automatically provisioned</p>
          </div>
        </div>
      )}

      {/* Login Page Section */}
      {activeSection === 'login' && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-6">
          <h2 className="text-lg font-semibold text-gray-900">Login Page Customization</h2>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Welcome Message</label>
            <input
              type="text"
              value={brand.login_page_config?.welcome_message || ''}
              onChange={(e) => setBrand({ 
                ...brand, 
                login_page_config: { ...brand.login_page_config, welcome_message: e.target.value }
              })}
              placeholder="Welcome to Your Company Portal"
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Background Image URL</label>
            <input
              type="text"
              value={brand.login_page_config?.background_image || ''}
              onChange={(e) => setBrand({ 
                ...brand, 
                login_page_config: { ...brand.login_page_config, background_image: e.target.value }
              })}
              placeholder="https://cdn.yourcompany.com/background.jpg"
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg"
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="show_logo"
              checked={brand.login_page_config?.show_logo !== false}
              onChange={(e) => setBrand({ 
                ...brand, 
                login_page_config: { ...brand.login_page_config, show_logo: e.target.checked }
              })}
              className="w-4 h-4 text-blue-600 rounded"
            />
            <label htmlFor="show_logo" className="text-sm text-gray-700">Show logo on login page</label>
          </div>
        </div>
      )}

      {/* PDF Templates Section */}
      {activeSection === 'pdf' && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-6">
          <h2 className="text-lg font-semibold text-gray-900">PDF Template Settings</h2>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 border border-gray-200 rounded-xl hover:border-blue-300 cursor-pointer">
              <h3 className="text-sm font-semibold text-gray-900 mb-2">Modern Blue</h3>
              <p className="text-xs text-gray-500">Clean, professional design with blue accents</p>
            </div>
            <div className="p-4 border border-gray-200 rounded-xl hover:border-blue-300 cursor-pointer">
              <h3 className="text-sm font-semibold text-gray-900 mb-2">Classic</h3>
              <p className="text-xs text-gray-500">Traditional layout with serif fonts</p>
            </div>
            <div className="p-4 border border-gray-200 rounded-xl hover:border-blue-300 cursor-pointer">
              <h3 className="text-sm font-semibold text-gray-900 mb-2">Minimal</h3>
              <p className="text-xs text-gray-500">Simple, clean design with lots of whitespace</p>
            </div>
            <div className="p-4 border border-gray-200 rounded-xl hover:border-blue-300 cursor-pointer">
              <h3 className="text-sm font-semibold text-gray-900 mb-2">Corporate</h3>
              <p className="text-xs text-gray-500">Professional design for enterprise</p>
            </div>
          </div>

          <p className="text-xs text-gray-500">
            PDF templates will be available in Estimate, Invoice, and Report pages
          </p>
        </div>
      )}

      {/* Client Portal Section */}
      {activeSection === 'portal' && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-6">
          <h2 className="text-lg font-semibold text-gray-900">Client Portal Settings</h2>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Portal Welcome Message</label>
            <input
              type="text"
              value={brand.portal_config?.custom_welcome || ''}
              onChange={(e) => setBrand({ 
                ...brand, 
                portal_config: { ...brand.portal_config, custom_welcome: e.target.value }
              })}
              placeholder="Welcome to Your Client Portal"
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg"
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="show_branding"
              checked={brand.portal_config?.show_branding !== false}
              onChange={(e) => setBrand({ 
                ...brand, 
                portal_config: { ...brand.portal_config, show_branding: e.target.checked }
              })}
              className="w-4 h-4 text-blue-600 rounded"
            />
            <label htmlFor="show_branding" className="text-sm text-gray-700">Show company branding in portal</label>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Custom CSS</label>
            <textarea
              value={brand.portal_config?.custom_css || ''}
              onChange={(e) => setBrand({ 
                ...brand, 
                portal_config: { ...brand.portal_config, custom_css: e.target.value }
              })}
              placeholder=".header { background: #1147FF; }"
              rows={4}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg font-mono"
            />
          </div>
        </div>
      )}

      {/* Email Templates Section */}
      {activeSection === 'email' && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-6">
          <h2 className="text-lg font-semibold text-gray-900">Email Template Settings</h2>
          
          <div className="space-y-4">
            <div className="p-4 border border-gray-200 rounded-xl">
              <h3 className="text-sm font-semibold text-gray-900 mb-2">Welcome Email</h3>
              <p className="text-xs text-gray-500 mb-3">Sent when a new user is invited</p>
              <button className="text-xs px-3 py-1.5 text-white rounded-lg" style={{ backgroundColor: '#1147FF' }}>
                Customize Template
              </button>
            </div>
            <div className="p-4 border border-gray-200 rounded-xl">
              <h3 className="text-sm font-semibold text-gray-900 mb-2">Estimate Sent</h3>
              <p className="text-xs text-gray-500 mb-3">Sent when estimate is shared with client</p>
              <button className="text-xs px-3 py-1.5 text-white rounded-lg" style={{ backgroundColor: '#1147FF' }}>
                Customize Template
              </button>
            </div>
            <div className="p-4 border border-gray-200 rounded-xl">
              <h3 className="text-sm font-semibold text-gray-900 mb-2">Project Update</h3>
              <p className="text-xs text-gray-500 mb-3">Sent when project status changes</p>
              <button className="text-xs px-3 py-1.5 text-white rounded-lg" style={{ backgroundColor: '#1147FF' }}>
                Customize Template
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}