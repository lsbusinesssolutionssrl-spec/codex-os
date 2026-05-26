import { useState } from 'react';
import { Camera, X, Trash2, Upload } from 'lucide-react';
import { base44 } from '@/api/base44Client';

export default function PhotoGallery({ category, photos, onUpload, onRemove, uploading }) {
  const [showModal, setShowModal] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const fileInputRef = null;

  const handleFileSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    onUpload(file, category);
  };

  const openPhoto = (url) => {
    setSelectedPhoto(url);
    setShowModal(true);
  };

  const categoryLabels = {
    before: 'Prima',
    during: 'Durante',
    after: 'Dopo',
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-900">Foto {categoryLabels[category]}</h3>
        <label className="flex items-center gap-2 px-3 py-1.5 text-xs text-white rounded-lg cursor-pointer" style={{ backgroundColor: '#1147FF' }}>
          {uploading ? (
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <>
              <Camera className="w-3.5 h-3.5" />
              <span>Aggiungi</span>
            </>
          )}
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileSelect}
            disabled={uploading}
          />
        </label>
      </div>

      {(!photos || photos.length === 0) ? (
        <div className="flex flex-col items-center justify-center h-32 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
          <Camera className="w-8 h-8 text-gray-300 mb-2" />
          <p className="text-sm text-gray-400">Nessuna foto</p>
        </div>
      ) : (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
          {photos.map((photo, idx) => (
            <div key={idx} className="relative group aspect-square">
              <img
                src={photo.url || photo}
                alt={photo.title || `Foto ${categoryLabels[category]} ${idx + 1}`}
                className="w-full h-full object-cover rounded-lg cursor-pointer"
                onClick={() => openPhoto(photo.url || photo)}
              />
              <button
                onClick={() => onRemove(photo.url || photo, category)}
                className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="w-3 h-3" />
              </button>
              {photo.title && (
                <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white text-xs px-2 py-1 rounded-b-lg truncate">
                  {photo.title}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && selectedPhoto && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4" onClick={() => setShowModal(false)}>
          <div className="relative max-w-4xl max-h-[90vh]">
            <img src={selectedPhoto} alt="" className="max-w-full max-h-[90vh] object-contain" />
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 bg-white/10 hover:bg-white/20 rounded-full p-2 transition-colors"
            >
              <X className="w-6 h-6 text-white" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}