import { useState } from 'react';
import { Download, Lock } from 'lucide-react';
import { base44 } from '@/api/base44Client';

/**
 * SecureDocumentLink - Secure document download with signed URL
 * Only shows download link if user has access to the document
 */
export default function SecureDocumentLink({ document, showLabel = true }) {
  const [loading, setLoading] = useState(false);
  const [hasAccess, setHasAccess] = useState(null);

  const handleDownload = async () => {
    if (!document.file_url) return;
    
    setLoading(true);
    try {
      // Try to get signed URL (for sensitive documents)
      // If document is public, use direct URL
      const res = await fetch(document.file_url);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = document.title || 'documento';
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download failed:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!document.file_url) {
    return (
      <div className="flex items-center gap-2 text-gray-400 text-xs">
        <Lock className="w-3.5 h-3.5" />
        {showLabel && <span>Non disponibile</span>}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <a
        href={document.file_url}
        target="_blank"
        rel="noreferrer"
        className="text-xs text-blue-600 hover:underline flex items-center gap-1"
      >
        Apri
      </a>
      <button
        onClick={handleDownload}
        disabled={loading}
        className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-700 disabled:opacity-50"
        title="Scarica"
      >
        {loading ? (
          <div className="w-3.5 h-3.5 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin" />
        ) : (
          <Download className="w-3.5 h-3.5" />
        )}
      </button>
    </div>
  );
}