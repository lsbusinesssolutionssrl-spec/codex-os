import { useState, useEffect } from 'react';
import { Building2, Check } from 'lucide-react';
import { base44 } from '@/api/base44Client';

export default function BrandSelector() {
  const [brands, setBrands] = useState([]);
  const [currentBrand, setCurrentBrand] = useState(null);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const brands = await base44.entities.Brand.list();
        setBrands(brands);
        
        const savedBrandId = localStorage.getItem('currentBrandId');
        let current = brands.find(b => b.id === savedBrandId);
        
        if (!current && brands.length > 0) {
          current = brands[0];
          localStorage.setItem('currentBrandId', current.id);
        }
        
        setCurrentBrand(current);
      } catch (error) {
        console.error('Failed to load brands:', error);
      }
    };
    load();
  }, []);

  const handleSwitch = async (brand) => {
    localStorage.setItem('currentBrandId', brand.id);
    setCurrentBrand(brand);
    setIsOpen(false);
    window.location.reload();
  };

  if (!currentBrand || brands.length === 0) return null;

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 text-sm bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
      >
        <Building2 className="w-4 h-4" />
        <span className="font-medium">{currentBrand.name}</span>
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute top-full right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-200 z-50 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100">
              <p className="text-xs font-semibold text-gray-500 uppercase">Select Brand</p>
            </div>
            <div className="py-2">
              {brands.map(brand => (
                <button
                  key={brand.id}
                  onClick={() => handleSwitch(brand)}
                  className="w-full flex items-center gap-3 px-4 py-2 text-sm hover:bg-gray-50 transition-colors"
                >
                  {brand.logo_url ? (
                    <img src={brand.logo_url} alt={brand.name} className="w-5 h-5 object-contain" />
                  ) : (
                    <div className="w-5 h-5 rounded bg-blue-100 flex items-center justify-center text-xs font-bold text-blue-600">
                      {brand.name.charAt(0)}
                    </div>
                  )}
                  <span className="flex-1 text-left">{brand.name}</span>
                  {brand.id === currentBrand.id && (
                    <Check className="w-4 h-4 text-blue-600" />
                  )}
                </button>
              ))}
            </div>
            <div className="px-4 py-3 border-t border-gray-100">
              <button
                onClick={() => window.location.href = '/white-label'}
                className="w-full text-xs text-blue-600 hover:text-blue-700 font-medium"
              >
                Manage Brands →
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}