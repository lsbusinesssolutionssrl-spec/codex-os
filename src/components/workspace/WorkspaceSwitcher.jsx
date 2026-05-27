import { useState } from 'react';
import { useWorkspace } from './WorkspaceContext';
import { ChevronDown, Shield, Crown, Activity, Wrench, TrendingUp, DollarSign } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const ICONS = {
  Shield,
  Crown,
  Activity,
  Wrench,
  TrendingUp,
  DollarSign,
};

export default function WorkspaceSwitcher() {
  const { currentWorkspace, availableWorkspaces, config, switchWorkspace, getWorkspaceConfig } = useWorkspace();
  const [open, setOpen] = useState(false);

  const Icon = ICONS[config.icon] || Crown;

  if (availableWorkspaces.length <= 1) return null;

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-all">
          <div 
            className="w-6 h-6 rounded-md flex items-center justify-center"
            style={{ backgroundColor: `${config.color}20` }}
          >
            <Icon className="w-3.5 h-3.5" style={{ color: config.color }} />
          </div>
          <span>{config.name}</span>
          <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <div className="px-2 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
          Area di Lavoro
        </div>
        {availableWorkspaces.map((wsId) => {
          const ws = getWorkspaceConfig(wsId);
          const WsIcon = ICONS[ws.icon] || Crown;
          const isActive = wsId === currentWorkspace;
          
          return (
            <DropdownMenuItem
              key={wsId}
              onClick={() => switchWorkspace(wsId)}
              className={`flex items-center gap-3 px-3 py-2 cursor-pointer ${
                isActive ? 'bg-gray-100' : ''
              }`}
            >
              <div 
                className="w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: `${ws.color}20` }}
              >
                <WsIcon className="w-4 h-4" style={{ color: ws.color }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium ${isActive ? 'text-gray-900' : 'text-gray-700'}`}>
                  {ws.name}
                </p>
                <p className="text-xs text-gray-500 truncate">{ws.description}</p>
              </div>
              {isActive && (
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: ws.color }} />
              )}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}