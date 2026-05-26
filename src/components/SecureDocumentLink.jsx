import { useState } from 'react';
import { Download, Lock, Clock } from 'lucide-react';
import { base44 } from '@/api/base44Client';

/**
 * SecureDocumentLink - Secure document download with time-limited signed URL (7 days)
 * Only shows download link if user has access to the document
 */
export default function SecureDocumentLink({ document, showLabel = true }) {
  const [loading, setLoading] = useState(false);
  const [generatingUrl, setGeneratingUrl] = useState(false);
  const [signedUrl, setSignedUrl] = useState(null);
  const [expiresAt, setExpiresAt] = useState(null);

  const generateSignedUrl = async () => {
    if (!document.id) return;
    
    setGeneratingUrl(true);
    try {
      const res = await base44.functions.invoke('getDocumentSignedUrl', { 
        document_id: document.id 
      });
      const { signed_url, expires_at } = res.data;
      setSignedUrl(signed_url);
      setExpiresAt(expires_at);
    } catch (error) {
      console.error('Failed to generate signed URL:', error);
    } finally {
      setGeneratingUrl(false);
    }
  };

  const handleDownload = async () => {
    if (!document.file_url) return;
    
    setLoading(true);
    try {
      // Use signed URL if available, otherwise fetch directly
      const url = signedUrl || document.file_url;
      const res = await fetch(url);
      const blob = await res.blob();
      const downloadUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = document.title || 'documento';
      a.click();
      URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error('Download failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenUrl = async (e) => {
    e.preventDefault();
    if (!signedUrl) {
      await generateSignedUrl();
    }
    // Open in new tab after URL is generated
    const url = signedUrl || document.file_url;
    window.open(url, '_blank', 'noopener,noreferrer');
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
      <button
        onClick={handleOpenUrl}
        disabled={generatingUrl}
        className="text-xs text-blue-600 hover:underline flex items-center gap-1 disabled:opacity-50"
        title="Apri con URL sicuro (7 giorni)"
      >
        {generatingUrl ? (
          <div className="w-3.5 h-3.5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
        ) : (
          <>
            Apri
            <Clock className="w-3 h-3 text-gray-400" />
          </>
        )}
      </button>
      <button
        onClick={handleDownload}
        disabled={loading || generatingUrl}
        className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-700 disabled:opacity-50"
        title="Scarica con URL sicuro"
      >
        {loading || generatingUrl ? (
          <div className="w-3.5 h-3.5 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin" />
        ) : (
          <Download className="w-3.5 h-3.5" />
        )}
      </button>
      {signedUrl && expiresAt && (
        <span className="text-xs text-gray-400" title={`Scade: ${new Date(expiresAt).toLocaleDateString('it-IT')}`}>
          ✓
        </span>
      )}
    </div>
  );
}