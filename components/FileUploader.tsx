import React, { useState } from 'react';
import { Upload, Loader2, AlertCircle, FileText } from 'lucide-react';
import { readFileContent } from '../services/fileService';

interface FileUploaderProps {
  onFileLoaded: (content: string, fileName: string) => void;
}

export const FileUploader: React.FC<FileUploaderProps> = ({ onFileLoaded }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    processFile(file);
  };

  const processFile = async (file: File) => {
    setIsLoading(true);
    setError(null);
    try {
      const content = await readFileContent(file);
      onFileLoaded(content, file.name);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to parse file");
    } finally {
      setIsLoading(false);
    }
  };

  const onDragOver = (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(true);
  };
  
  const onDragLeave = () => setIsDragging(false);
  
  const onDrop = (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files?.[0];
      if(file) processFile(file);
  };

  return (
    <div className="w-full h-full flex items-center justify-center p-8 bg-stone-950">
      <div 
        className={`max-w-xl w-full transition-all duration-500 transform ${isLoading ? 'scale-95 opacity-80' : 'scale-100'}`}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
      >
        <div className={`
            relative overflow-hidden bg-stone-900 rounded-sm shadow-2xl shadow-black/40 border transition-all duration-300
            ${isDragging ? 'border-stone-600 ring-1 ring-stone-500 scale-[1.02]' : 'border-stone-800'}
        `}>
          {/* Decorative binding strip */}
          <div className="absolute top-0 left-0 w-1.5 h-full bg-stone-950/50"></div>

          <div className="p-12 text-center flex flex-col items-center">
            <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-8 transition-colors duration-300 ${isDragging ? 'bg-stone-800 text-stone-200' : 'bg-stone-800/50 text-stone-500'}`}>
              {isLoading ? (
                <Loader2 className="w-8 h-8 animate-spin text-stone-200" />
              ) : (
                <Upload className="w-8 h-8 stroke-[1.5]" />
              )}
            </div>
            
            <h2 className="text-4xl font-display font-semibold text-stone-100 mb-3 tracking-tight">
              Begin the Expansion
            </h2>
            <p className="text-stone-400 font-ui text-sm mb-10 max-w-sm mx-auto leading-relaxed">
              Drag and drop your manuscript (PDF, TXT, MD, HTML) to initialize the architectural analysis.
            </p>

            {error && (
              <div className="mb-8 p-4 bg-red-900/20 border border-red-900/50 text-red-300 text-sm rounded flex items-center gap-3 animate-fade-in">
                <AlertCircle className="w-4 h-4" />
                {error}
              </div>
            )}

            <label className="group relative inline-flex items-center justify-center px-8 py-3 font-ui text-sm font-medium tracking-wide text-stone-950 transition-all duration-300 bg-stone-100 rounded-sm hover:bg-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-stone-500 cursor-pointer shadow-lg hover:shadow-xl hover:-translate-y-0.5">
              <span>Select Manuscript</span>
              <input 
                type="file" 
                accept=".pdf,.txt,.md,.html"
                onChange={handleFileChange}
                disabled={isLoading}
                className="hidden"
              />
            </label>
            
            <div className="mt-10 flex items-center gap-4 text-[10px] uppercase tracking-widest text-stone-600 font-medium">
               <span className="flex items-center gap-1"><FileText className="w-3 h-3" /> PDF</span>
               <span className="w-1 h-1 rounded-full bg-stone-700"></span>
               <span>TXT</span>
               <span className="w-1 h-1 rounded-full bg-stone-700"></span>
               <span>Markdown</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};