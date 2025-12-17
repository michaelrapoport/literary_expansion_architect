
import React, { useMemo } from 'react';
import { X, Download, FileText } from 'lucide-react';
import { ProjectState } from '../types';
import { generateProjectHtml } from '../services/persistenceService';

interface ExportPreviewModalProps {
  projectState: ProjectState;
  onClose: () => void;
  onConfirm: () => void;
}

export const ExportPreviewModal: React.FC<ExportPreviewModalProps> = ({ projectState, onClose, onConfirm }) => {
  const htmlContent = useMemo(() => generateProjectHtml(projectState), [projectState]);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
        <div className="w-full max-w-4xl h-[90vh] bg-stone-900 border border-stone-700 rounded-sm shadow-2xl flex flex-col">
            
            <div className="p-4 border-b border-stone-800 flex justify-between items-center bg-stone-950">
                <div className="flex items-center gap-2 text-stone-100 font-bold uppercase tracking-widest text-sm">
                    <FileText className="w-4 h-4 text-[#d4af37]" />
                    Document Preview
                </div>
                <button onClick={onClose} className="text-stone-500 hover:text-stone-300"><X className="w-5 h-5" /></button>
            </div>

            <div className="flex-1 overflow-hidden bg-stone-200 relative p-8 flex justify-center">
                <div className="h-full overflow-y-auto w-full max-w-[8.5in] bg-white shadow-xl p-[1in] text-black">
                     <div dangerouslySetInnerHTML={{ __html: htmlContent }} />
                </div>
            </div>

            <div className="p-4 border-t border-stone-800 bg-stone-950 flex justify-end gap-3">
                <button onClick={onClose} className="px-6 py-2 text-stone-500 text-xs font-bold uppercase hover:text-stone-300">Cancel</button>
                <button onClick={onConfirm} className="px-6 py-2 bg-[#d4af37] hover:bg-white text-stone-900 text-xs font-bold uppercase rounded-sm flex items-center gap-2 shadow-lg">
                    <Download className="w-4 h-4" />
                    Download DOCX
                </button>
            </div>
        </div>
    </div>
  );
};
