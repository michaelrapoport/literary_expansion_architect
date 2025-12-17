
import React from 'react';
import { Feather, Download, Settings, Book, Save, FileType, Undo2 } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  onExport?: () => void;
  canExport?: boolean;
  onOpenSettings: () => void;
  onOpenBible: () => void;
  onSave?: () => void;
  onExportDocx?: () => void;
  onUndo?: () => void; // New Prop
}

export const Layout: React.FC<LayoutProps> = ({ 
    children, onExport, canExport, onOpenSettings, onOpenBible, onSave, onExportDocx, onUndo
}) => {
  return (
    <div className="flex flex-col h-screen bg-stone-950">
      <header className="flex-none h-16 bg-stone-900/80 backdrop-blur-md border-b border-stone-800 flex items-center justify-between px-4 md:px-8 z-50 transition-all duration-300">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-stone-100 text-stone-900 rounded-full flex items-center justify-center shadow-lg shadow-stone-900/50">
             <Feather className="w-4 h-4" />
          </div>
          <div>
            <h1 className="text-xl font-display font-bold tracking-wide text-stone-100">LEA</h1>
          </div>
        </div>
        
        <div className="flex items-center gap-2 md:gap-4">
            
          {onUndo && (
              <button onClick={onUndo} className="p-2 text-stone-500 hover:text-red-400 hover:bg-stone-800 rounded-sm transition-all" title="Undo Last Chapter">
                  <Undo2 className="w-4 h-4" />
              </button>
          )}

          {onSave && (
              <button onClick={onSave} className="p-2 text-stone-500 hover:text-stone-300 hover:bg-stone-800 rounded-sm transition-all" title="Save & Export Project">
                  <Save className="w-4 h-4" />
              </button>
          )}

          {canExport && onExport && (
             <div className="flex gap-1">
                <button
                onClick={onExport}
                className="hidden md:flex items-center gap-2 px-3 py-2 bg-stone-800 hover:bg-stone-700 hover:text-white text-stone-300 rounded-sm text-[10px] font-bold uppercase tracking-widest border border-stone-700 transition-all shadow-lg"
                title="Export JSON Backup"
                >
                <Download className="w-3 h-3" />
                <span className="hidden lg:inline">JSON</span>
                </button>
             </div>
          )}
          
          <div className="h-6 w-px bg-stone-800 mx-2"></div>

          <button 
            onClick={onOpenBible}
            className="p-2 text-stone-500 hover:text-stone-300 hover:bg-stone-800 rounded-sm transition-all"
            title="World Bible & Analytics"
          >
            <Book className="w-4 h-4" />
          </button>

          <button 
            onClick={onOpenSettings}
            className="p-2 text-stone-500 hover:text-stone-300 hover:bg-stone-800 rounded-sm transition-all"
            title="Model Configuration"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </header>
      <main className="flex-1 overflow-hidden relative flex">
        {children}
      </main>
    </div>
  );
};
