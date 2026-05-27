import { useState } from 'react';
import { X, Download, ZoomIn, ZoomOut, FileText, Image, ExternalLink, ChevronLeft, ChevronRight } from 'lucide-react';

function isImage(url) {
  return /\.(jpg|jpeg|png|gif|webp|svg|bmp)(\?|$)/i.test(url);
}

function isPdf(url) {
  return /\.pdf(\?|$)/i.test(url);
}

function getFileType(url) {
  if (isImage(url)) return 'image';
  if (isPdf(url)) return 'pdf';
  return 'other';
}

function getFileName(url) {
  try {
    const parts = new URL(url).pathname.split('/');
    return decodeURIComponent(parts[parts.length - 1] || 'file');
  } catch {
    return url.split('/').pop() || 'file';
  }
}

export function FilePreviewModal({ url, title, onClose, versions = [] }) {
  const [zoom, setZoom] = useState(1);
  const [currentVersionIdx, setCurrentVersionIdx] = useState(0);
  const activeUrl = versions.length > 0 ? versions[currentVersionIdx]?.url || url : url;
  const fileType = getFileType(activeUrl);

  const download = () => {
    const a = document.createElement('a');
    a.href = activeUrl;
    a.download = title || getFileName(activeUrl);
    a.target = '_blank';
    a.click();
  };

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex flex-col" onClick={onClose}>
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-3 bg-gray-900 flex-shrink-0" onClick={e => e.stopPropagation()}>
        <div className="flex items-center gap-3">
          {fileType === 'image' ? <Image className="w-4 h-4 text-gray-400" /> : <FileText className="w-4 h-4 text-gray-400" />}
          <span className="text-sm font-medium text-white">{title || getFileName(activeUrl)}</span>
          {versions.length > 1 && (
            <div className="flex items-center gap-1 ml-2">
              <button onClick={() => setCurrentVersionIdx(i => Math.max(0, i - 1))} disabled={currentVersionIdx === 0} className="p-1 rounded hover:bg-gray-700 disabled:opacity-40">
                <ChevronLeft className="w-3.5 h-3.5 text-gray-400" />
              </button>
              <span className="text-xs text-gray-400">v{versions.length - currentVersionIdx} / {versions.length}</span>
              <button onClick={() => setCurrentVersionIdx(i => Math.min(versions.length - 1, i + 1))} disabled={currentVersionIdx === versions.length - 1} className="p-1 rounded hover:bg-gray-700 disabled:opacity-40">
                <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
              </button>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          {fileType === 'image' && (
            <>
              <button onClick={() => setZoom(z => Math.max(0.25, z - 0.25))} className="p-1.5 rounded hover:bg-gray-700 text-gray-400" title="Zoom out"><ZoomOut className="w-4 h-4" /></button>
              <span className="text-xs text-gray-400 w-10 text-center">{Math.round(zoom * 100)}%</span>
              <button onClick={() => setZoom(z => Math.min(4, z + 0.25))} className="p-1.5 rounded hover:bg-gray-700 text-gray-400" title="Zoom in"><ZoomIn className="w-4 h-4" /></button>
            </>
          )}
          <button onClick={download} className="p-1.5 rounded hover:bg-gray-700 text-gray-400" title="Scarica"><Download className="w-4 h-4" /></button>
          <a href={activeUrl} target="_blank" rel="noopener noreferrer" className="p-1.5 rounded hover:bg-gray-700 text-gray-400" title="Apri in nuova tab" onClick={e => e.stopPropagation()}>
            <ExternalLink className="w-4 h-4" />
          </a>
          <button onClick={onClose} className="p-1.5 rounded hover:bg-gray-700 text-gray-300 ml-1"><X className="w-4 h-4" /></button>
        </div>
      </div>

      {/* Preview area */}
      <div className="flex-1 overflow-auto flex items-center justify-center p-4" onClick={e => e.stopPropagation()}>
        {fileType === 'image' && (
          <img
            src={activeUrl}
            alt={title || 'Preview'}
            style={{ transform: `scale(${zoom})`, transformOrigin: 'center', transition: 'transform 0.2s', maxWidth: '100%', maxHeight: '80vh', objectFit: 'contain' }}
            className="rounded shadow-2xl"
          />
        )}
        {fileType === 'pdf' && (
          <iframe
            src={`${activeUrl}#toolbar=1&navpanes=0`}
            className="w-full rounded shadow-2xl"
            style={{ height: 'calc(100vh - 100px)' }}
            title={title || 'PDF Preview'}
          />
        )}
        {fileType === 'other' && (
          <div className="text-center space-y-4">
            <FileText className="w-16 h-16 text-gray-500 mx-auto" />
            <p className="text-white font-medium">{title || getFileName(activeUrl)}</p>
            <p className="text-gray-400 text-sm">Anteprima non disponibile per questo tipo di file</p>
            <div className="flex gap-3 justify-center">
              <button onClick={download} className="flex items-center gap-2 px-4 py-2 text-sm text-white rounded-lg" style={{ backgroundColor: '#1147FF' }}>
                <Download className="w-4 h-4" /> Scarica
              </button>
              <a href={activeUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-4 py-2 text-sm bg-gray-700 text-white rounded-lg hover:bg-gray-600">
                <ExternalLink className="w-4 h-4" /> Apri
              </a>
            </div>
          </div>
        )}
      </div>

      {/* Version history panel */}
      {versions.length > 1 && (
        <div className="flex-shrink-0 bg-gray-900 border-t border-gray-700 px-4 py-3" onClick={e => e.stopPropagation()}>
          <p className="text-xs text-gray-400 mb-2 font-medium">Cronologia versioni ({versions.length})</p>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {versions.map((v, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentVersionIdx(idx)}
                className={`flex-shrink-0 px-3 py-1.5 text-xs rounded-lg border transition-colors ${
                  currentVersionIdx === idx ? 'border-blue-500 bg-blue-600 text-white' : 'border-gray-600 text-gray-400 hover:border-gray-500'
                }`}
              >
                v{versions.length - idx}
                {v.date && <span className="ml-1 opacity-70">{new Date(v.date).toLocaleDateString('it-IT')}</span>}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Inline thumbnail + click to preview
export default function FilePreview({ url, title, className = '', versions = [] }) {
  const [open, setOpen] = useState(false);
  const fileType = getFileType(url || '');

  if (!url) return null;

  return (
    <>
      <div
        onClick={() => setOpen(true)}
        className={`relative cursor-pointer rounded-lg overflow-hidden border border-gray-200 hover:border-blue-400 transition-colors group ${className}`}
        title="Clicca per anteprima"
      >
        {fileType === 'image' ? (
          <img src={url} alt={title || 'Preview'} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-gray-50 p-4">
            <FileText className="w-8 h-8 text-gray-400 mb-2" />
            <p className="text-xs text-gray-500 text-center truncate w-full">{title || getFileName(url)}</p>
          </div>
        )}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
          <ZoomIn className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-lg" />
        </div>
      </div>
      {open && <FilePreviewModal url={url} title={title} versions={versions} onClose={() => setOpen(false)} />}
    </>
  );
}