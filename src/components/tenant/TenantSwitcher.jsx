import { useState, useEffect } from 'react';
import { useGlobalContext } from '@/lib/GlobalContextEngine';
import { Building2, Shield, Check } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';

export default function TenantSwitcher() {
  const { activeTenant, isPlatformMode, switchTenant, userRole } = useGlobalContext();
  const [tenants, setTenants] = useState([]);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (isPlatformMode) {
      base44.entities.Company.list().then(setTenants);
    }
  }, [isPlatformMode]);

  // Only platform users can switch tenants
  if (!isPlatformMode) {
    return null;
  }

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-all">
          {activeTenant ? (
            <>
              {activeTenant.logo_url ? (
                <img src={activeTenant.logo_url} alt="" className="w-5 h-5 object-contain" />
              ) : (
                <div 
                  className="w-5 h-5 rounded flex items-center justify-center text-white text-xs font-bold"
                  style={{ backgroundColor: activeTenant.brand_color_primary || '#1147FF' }}
                >
                  {activeTenant.name?.[0]?.toUpperCase()}
                </div>
              )}
              <span className="max-w-[150px] truncate">{activeTenant.name}</span>
            </>
          ) : (
            <>
              <Shield className="w-4 h-4 text-purple-600" />
              <span>Platform</span>
            </>
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <div className="px-3 py-2">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
            {activeTenant ? 'Tenant Attivo' : 'Modalità Platform'}
          </p>
        </div>
        
        <DropdownMenuSeparator />
        
        {/* Platform Mode */}
        <DropdownMenuItem
          onClick={() => {
            localStorage.removeItem('impersonate_tenant_id');
            window.location.reload();
          }}
          className={`flex items-center gap-3 px-3 py-2 cursor-pointer ${
            !activeTenant ? 'bg-purple-50' : ''
          }`}
        >
          <div className="w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0 bg-purple-100">
            <Shield className="w-4 h-4 text-purple-600" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-900">Platform</p>
            <p className="text-xs text-gray-500">Gestione tenant e sistemi</p>
          </div>
          {!activeTenant && <Check className="w-4 h-4 text-purple-600" />}
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        {/* Tenant List */}
        <div className="max-h-64 overflow-y-auto">
          {tenants.map(tenant => (
            <DropdownMenuItem
              key={tenant.id}
              onClick={() => {
                // Find membership for this tenant and switch
                localStorage.setItem('impersonate_tenant_id', tenant.id);
                window.location.reload();
              }}
              className={`flex items-center gap-3 px-3 py-2 cursor-pointer ${
                activeTenant?.id === tenant.id ? 'bg-blue-50' : ''
              }`}
            >
              {tenant.logo_url ? (
                <img src={tenant.logo_url} alt="" className="w-6 h-6 rounded object-contain" />
              ) : (
                <div 
                  className="w-6 h-6 rounded flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                  style={{ backgroundColor: tenant.brand_color_primary || '#1147FF' }}
                >
                  {tenant.name?.[0]?.toUpperCase()}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{tenant.name}</p>
                <p className="text-xs text-gray-500 truncate">{tenant.email}</p>
              </div>
              {activeTenant?.id === tenant.id && (
                <Check className="w-4 h-4 text-blue-600 flex-shrink-0" />
              )}
            </DropdownMenuItem>
          ))}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}