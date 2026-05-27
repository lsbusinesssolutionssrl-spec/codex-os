import { useState } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';

export default function SidePanel({ isOpen, onClose, title, children, width = 'w-96' }) {
  const [isExpanded, setIsExpanded] = useState(true);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/30 z-40 transition-opacity"
        onClick={onClose}
      />
      
      {/* Panel */}
      <div 
        className={`fixed top-0 right-0 h-full bg-white shadow-2xl z-50 transition-transform duration-300 ${width} ${isExpanded ? 'translate-x-0' : 'translate-x-full'}`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
          <h2 className="text-sm font-semibold text-gray-900">{title}</h2>
          <div className="flex items-center gap-1">
            <button 
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
            >
              {isExpanded ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </button>
            <button 
              onClick={onClose}
              className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
        
        {/* Content */}
        <div className={`h-[calc(100vh-60px)] overflow-y-auto ${isExpanded ? 'p-4' : ''}`}>
          {isExpanded ? children : null}
        </div>
      </div>
    </>
  );
}