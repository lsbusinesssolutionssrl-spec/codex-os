import { useState, useRef } from 'react';
import { Camera, MapPin, Upload, X, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';

export default function PhotoCapture({ onCapture, label = "Scatta foto" }) {
  const [previews, setPreviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [geo, setGeo] = useState(null);
  const inputRef = useRef(null);

  const getGeo = () => new Promise((resolve) => {
    if (!navigator.geolocation) return resolve(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => resolve(null),
      { timeout: 5000 }
    );
  });

  const handleFiles = async (files) => {
    if (!files.length) return;
    setLoading(true);
    const location = await getGeo();
    setGeo(location);
    const uploaded = [];
    for (const file of Array.from(files)) {
      try {
        const { file_url } = await base44.integrations.Core.UploadFile({ file });
        uploaded.push({ url: file_url, geo: location, name: file.name });
        setPreviews(prev => [...prev, { url: file_url, geo: location }]);
      } catch (e) {
        console.error('Upload failed', e);
      }
    }
    setLoading(false);
    if (onCapture) onCapture(uploaded, location);
  };

  const remove = (idx) => setPreviews(prev => prev.filter((_, i) => i !== idx));

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={loading}
        className="flex items-center gap-2 px-4 py-2.5 rounded-lg border-2 border-dashed border-gray-300 text-sm text-gray-600 hover:border-blue-400 hover:text-blue-600 transition-colors w-full justify-center"
      >
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
        {loading ? 'Caricamento...' : label}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        multiple
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />
      {previews.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {previews.map((p, i) => (
            <div key={i} className="relative group rounded-lg overflow-hidden">
              <img src={p.url} alt="" className="w-full h-20 object-cover" />
              {p.geo && (
                <div className="absolute bottom-0 left-0 right-0 bg-black/60 px-1.5 py-0.5 flex items-center gap-1">
                  <MapPin className="w-2.5 h-2.5 text-green-400" />
                  <span className="text-white text-xs truncate">{p.geo.lat.toFixed(4)}, {p.geo.lng.toFixed(4)}</span>
                </div>
              )}
              <button
                onClick={() => remove(i)}
                className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}