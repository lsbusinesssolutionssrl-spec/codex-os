import { useState, useEffect } from 'react';
import { Box, Eye, EyeOff, Maximize2, Columns, LayoutDashboard, Minimize2 } from 'lucide-react';
import { useGlobalContext } from '@/lib/GlobalContextEngine';

export default function LayoutInspector() {
  const [minimized, setMinimized] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [layoutData, setLayoutData] = useState({
    mountedPanels: [],
    sidebarWidth: 0,
    ghostContainers: [],
    activeLayouts: [],
  });
  const globalContext = useGlobalContext();
  const { isPlatformMode, platformRole } = globalContext;

  // CRITICAL: Show ONLY to super_admin / developer in platform mode
  const isInternalUser = ['super_admin', 'developer', 'platform_owner'].includes(platformRole) && isPlatformMode;

/**
 * LAYOUT INSPECTOR - Developer Tool
 * Shows mounted layout components, active panels, and ghost containers
 */

  useEffect(() => {
    if (isOpen && isInternalUser) {
      inspectLayout();
    }
  }, [isOpen, isInternalUser]);

  if (!isInternalUser) return null;

  const inspectLayout = () => {
    // Scan DOM for layout containers
    const allDivs = Array.from(document.querySelectorAll('div'));
    
    const mountedPanels = allDivs
      .filter(div => {
        const className = div.className || '';
        return className.includes('panel') || 
               className.includes('sidebar') || 
               className.includes('drawer') ||
               className.includes('aside');
      })
      .map((div, idx) => ({
        id: idx,
        className: div.className,
        visible: div.offsetParent !== null,
        width: div.offsetWidth,
        height: div.offsetHeight,
      }));

    const ghostContainers = mountedPanels.filter(panel => 
      !panel.visible && panel.width > 100
    );

    const sidebar = document.querySelector('aside');
    const sidebarWidth = sidebar ? sidebar.offsetWidth : 0;

    setLayoutData({
      mountedPanels: mountedPanels.slice(0, 20), // Limit to 20
      sidebarWidth,
      ghostContainers,
      activeLayouts: ['Layout', 'Outlet'],
    });
  };

  if (minimized) {
    return (
      <button
        onClick={() => setMinimized(false)}
        className="fixed top-4 left-4 z-[100] flex items-center gap-2 px-3 py-2 bg-white rounded-lg shadow-lg border border-gray-200 hover:bg-gray-50 transition-colors"
      >
        <LayoutDashboard className="w-4 h-4 text-purple-600" />
        <span className="text-xs font-semibold text-gray-700">Layout</span>
        <span className="text-xs text-gray-500">{isPlatformMode ? 'Platform' : 'Tenant'}</span>
        <Maximize2 className="w-3 h-3 text-gray-400" />
      </button>
    );
  }

  return (
    <div className="fixed top-4 left-4 z-[100] w-80 bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-purple-900 text-white">
        <div className="flex items-center gap-2">
          <LayoutDashboard className="w-4 h-4" />
          <h3 className="text-sm font-bold">Layout Inspector</h3>
        </div>
        <button onClick={() => setMinimized(true)} className="text-white/80 hover:text-white">
          <Minimize2 className="w-4 h-4" />
        </button>
      </div>

      {/* Content */}
      <div className="p-4 space-y-3 max-h-96 overflow-y-auto">
        {/* Sidebar Width */}
        <div className="text-xs">
          <div className="flex items-center justify-between mb-1">
            <span className="text-gray-500 flex items-center gap-1">
              <Columns className="w-3 h-3" />
              Sidebar Width
            </span>
            <span className="font-mono text-gray-900">{layoutData.sidebarWidth}px</span>
          </div>
        </div>

        {/* Ghost Containers */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-gray-700 flex items-center gap-1">
              <EyeOff className="w-3 h-3" />
              Ghost Containers
            </span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700 font-medium">
              {layoutData.ghostContainers.length}
            </span>
          </div>
          {layoutData.ghostContainers.length === 0 ? (
            <p className="text-xs text-green-600">✓ No ghost containers detected</p>
          ) : (
            <div className="space-y-1">
              {layoutData.ghostContainers.map(ghost => (
                <div key={ghost.id} className="text-xs p-2 bg-red-50 border border-red-100 rounded">
                  <p className="font-mono text-red-900 truncate">{ghost.className}</p>
                  <p className="text-red-600 mt-0.5">{ghost.width}px × {ghost.height}px</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Mounted Panels */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-gray-700 flex items-center gap-1">
              <Box className="w-3 h-3" />
              Mounted Panels
            </span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-medium">
              {layoutData.mountedPanels.length}
            </span>
          </div>
          <div className="space-y-1 max-h-32 overflow-y-auto">
            {layoutData.mountedPanels.map(panel => (
              <div key={panel.id} className="text-xs p-1.5 bg-gray-50 border border-gray-100 rounded flex items-center justify-between">
                <span className="text-gray-600 truncate flex-1">{panel.visible ? '✓' : '✗'} {panel.width}px</span>
                <span className="text-gray-400 text-[10px] ml-2">{panel.visible ? 'Visible' : 'Hidden'}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Active Layouts */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-gray-700 flex items-center gap-1">
              <Maximize2 className="w-3 h-3" />
              Active Layouts
            </span>
          </div>
          <div className="flex flex-wrap gap-1">
            {layoutData.activeLayouts.map(layout => (
              <span key={layout} className="text-xs px-2 py-1 bg-purple-50 text-purple-700 rounded border border-purple-100">
                {layout}
              </span>
            ))}
          </div>
        </div>

        {/* Refresh Button */}
        <button
          onClick={inspectLayout}
          className="w-full py-2 text-xs font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700 transition-colors"
        >
          Refresh Layout Scan
        </button>
      </div>
    </div>
  );
}