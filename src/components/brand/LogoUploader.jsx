import { useState } from 'react';
import { Upload } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export default function LogoUploader({ field, value, onChange, label = 'Upload', accept = 'image/*' }) {
  const [uploading, setUploading] = useState(false);

  const handleUpload = async () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = accept;
    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      
      setUploading(true);
      try {
        const { file_url } = await base44.integrations.Core.UploadFile({ file });
        onChange(file_url);
        toast.success('File caricato');
      } catch (error) {
        toast.error('Errore upload file');
      } finally {
        setUploading(false);
      }
    };
    input.click();
  };

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
      {value ? (
        <img src={value} alt="" className="max-h-32 object-contain rounded-lg border border-gray-200 bg-gray-50" />
      ) : (
        <div className="aspect-video rounded-lg border-2 border-dashed border-gray-200 flex items-center justify-center bg-gray-50">
          <div className="text-center text-gray-400">
            <Upload className="w-8 h-8 mx-auto mb-2" />
            <p className="text-sm">Click to upload</p>
          </div>
        </div>
      )}
      <button
        onClick={handleUpload}
        disabled={uploading}
        className="mt-3 w-full px-3 py-2 text-sm text-white rounded-lg font-medium disabled:opacity-40"
        style={{ backgroundColor: '#1147FF' }}
      >
        {uploading ? 'Uploading...' : label}
      </button>
    </div>
  );
}