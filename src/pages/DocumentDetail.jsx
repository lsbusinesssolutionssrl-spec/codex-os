import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Upload, ExternalLink, X, Trash2, Clock, Download } from 'lucide-react';
import { base44 } from '@/api/base44Client';

const TYPES = ['Contratto', 'Preventivo', 'Fattura', 'Certificazione', 'Garanzia', 'Planimetria', 'Foto', 'Altro'];

export default function DocumentDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [doc, setDoc] = useState(null);
  const [clients, setClients] = useState([]);
  const [properties, setProperties] = useState([]);
  const [projects, setProjects] = useState([]);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [signedUrl, setSignedUrl] = useState(null);
  const [generatingUrl, setGeneratingUrl] = useState(false);

  useEffect(() => {
    const load = async () => {
      const [docs, cls, props, projs] = await Promise.all([
        base44.entities.Document.filter({ id }),
        base44.entities.Client.list(),
        base44.entities.Property.list(),
        base44.entities.Project.list(),
      ]);
      if (docs[0]) { setDoc(docs[0]); setForm(docs[0]); }
      setClients(cls);
      setProperties(props);
      setProjects(projs);
    };
    load();
  }, [id]);

  const save = async () => {
    setSaving(true);
    const updated = await base44.entities.Document.update(id, form);
    setDoc(updated);
    setForm(updated);
    setSaving(false);
  };

  const deleteRecord = async () => {
    await base44.entities.Document.delete(id);
    navigate('/documents');
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setForm(f => ({ ...f, file_url }));
    setSignedUrl(null); // Reset signed URL when file changes
    setUploading(false);
  };

  const generateSignedUrl = async () => {
    if (!doc?.id || generatingUrl) return;
    setGeneratingUrl(true);
    try {
      const res = await base44.functions.invoke('getDocumentSignedUrl', { 
        document_id: doc.id 
      });
      const { signed_url, expires_at } = res.data;
      setSignedUrl(signed_url);
    } catch (error) {
      console.error('Failed to generate signed URL:', error);
    } finally {
      setGeneratingUrl(false);
    }
  };

  const handleDownload = async () => {
    if (!form.file_url) return;
    try {
      const url = signedUrl || form.file_url;
      const res = await fetch(url);
      const blob = await res.blob();
      const downloadUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = form.title || 'documento';
      a.click();
      URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error('Download failed:', error);
    }
  };

  if (!doc) return <div className="p-6 text-center text-gray-400">Caricamento...</div>;

  if (confirmDelete) return (
    <div className="p-6 max-w-sm mx-auto mt-20 bg-white rounded-2xl border border-gray-200 shadow-lg text-center space-y-4">
      <Trash2 className="w-10 h-10 text-red-400 mx-auto" />
      <h2 className="font-bold text-gray-900">Elimina documento?</h2>
      <p className="text-sm text-gray-500">Questa azione è irreversibile.</p>
      <div className="flex gap-2">
        <button onClick={deleteRecord} className="flex-1 py-2 text-sm text-white bg-red-500 rounded-lg font-medium hover:bg-red-600">Elimina</button>
        <button onClick={() => setConfirmDelete(false)} className="flex-1 py-2 text-sm border border-gray-200 rounded-lg text-gray-600">Annulla</button>
      </div>
    </div>
  );

  const isImage = form.file_url && /\.(jpg|jpeg|png|gif|webp)$/i.test(form.file_url);

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-5">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/documents')} className="p-2 rounded-lg hover:bg-gray-100">
          <ArrowLeft className="w-4 h-4 text-gray-600" />
        </button>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-gray-900">{doc.title}</h1>
          <p className="text-xs text-gray-400 mt-0.5">{doc.type}</p>
        </div>
        <button onClick={save} disabled={saving} className="flex items-center gap-2 px-4 py-2 text-sm text-white rounded-lg font-medium" style={{ backgroundColor: '#1147FF' }}>
          <Save className="w-3.5 h-3.5" /> {saving ? 'Salvataggio...' : 'Salva'}
        </button>
        <button onClick={() => setConfirmDelete(true)} className="p-2 rounded-lg hover:bg-red-50 text-red-400 hover:text-red-600">
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Titolo</label>
          <input value={form.title || ''} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Tipo</label>
            <select value={form.type || ''} onChange={e => setForm(f => ({ ...f, type: e.target.value }))} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none">
              {TYPES.map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Scadenza</label>
            <input type="date" value={form.expiration_date || ''} onChange={e => setForm(f => ({ ...f, expiration_date: e.target.value }))} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Cliente</label>
            <select value={form.client_id || ''} onChange={e => setForm(f => ({ ...f, client_id: e.target.value }))} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none">
              <option value="">—</option>
              {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Progetto</label>
            <select value={form.project_id || ''} onChange={e => setForm(f => ({ ...f, project_id: e.target.value }))} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none">
              <option value="">—</option>
              {projects.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
            </select>
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Note</label>
          <textarea value={form.notes || ''} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={2} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none resize-none" />
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-gray-900">File</h2>
          <label className="flex items-center gap-2 px-3 py-1.5 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
            <Upload className="w-3.5 h-3.5" />
            {uploading ? 'Caricamento...' : 'Carica File'}
            <input type="file" className="hidden" onChange={handleFileUpload} disabled={uploading} />
          </label>
        </div>
        {form.file_url ? (
        <div className="space-y-3">
        {isImage ? (
          <img src={form.file_url} alt="" className="max-h-64 rounded-lg object-contain bg-gray-50 w-full" />
        ) : (
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
            <div className="text-2xl">📄</div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-700 truncate">Documento caricato</p>
              <p className="text-xs text-gray-400 truncate">{form.file_url}</p>
            </div>
          </div>
        )}
        <div className="flex items-center gap-3 pt-2">
          <button
            onClick={generateSignedUrl}
            disabled={generatingUrl}
            className="flex items-center gap-2 px-3 py-1.5 text-sm text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50 disabled:opacity-50"
          >
            {generatingUrl ? (
              <div className="w-3.5 h-3.5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <Clock className="w-3.5 h-3.5" />
                Genera URL Sicuro (7gg)
              </>
            )}
          </button>
          <button
            onClick={handleDownload}
            className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50"
          >
            <Download className="w-3.5 h-3.5" />
            Scarica
          </button>
          {signedUrl && (
            <a
              href={signedUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm text-green-600 hover:underline"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Apri URL Sicuro
            </a>
          )}
        </div>
        </div>
        ) : (
        <p className="text-sm text-gray-400 text-center py-6">Nessun file caricato</p>
        )}
      </div>
    </div>
  );
}