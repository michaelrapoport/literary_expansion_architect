import React, { useState, useRef, useEffect } from 'react';
import { Beat } from '../types';
import { Plus, Trash2, ArrowRight, Upload, FileText, X, AlertCircle } from 'lucide-react';
import { readFileContent } from '../services/fileService';

interface BeatSheetEditorProps {
  initialBeats: Beat[];
  onConfirm: (beats: Beat[]) => void;
}

export const BeatSheetEditor: React.FC<BeatSheetEditorProps> = ({ initialBeats, onConfirm }) => {
  const [beats, setBeats] = useState<Beat[]>(initialBeats);
  const [showPasteImport, setShowPasteImport] = useState(false);
  const [pasteContent, setPasteContent] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (initialBeats && initialBeats.length > 0) {
        setBeats(initialBeats);
    }
  }, [initialBeats]);

  const updateBeat = (index: number, text: string) => {
    const newBeats = [...beats];
    newBeats[index].description = text;
    setBeats(newBeats);
  };

  const deleteBeat = (index: number) => {
    const newBeats = beats.filter((_, i) => i !== index);
    setBeats(newBeats);
  };

  const addBeat = () => {
    setBeats([...beats, { id: `${beats.length + 1}`, description: '' }]);
  };

  const processImportContent = (content: string) => {
      // Basic HTML tag stripping just in case
      const textOnly = content.replace(/<[^>]*>?/gm, '');

      // Heuristic parsing
      // Split by double newline first (paragraphs)
      let chunks = textOnly.split(/\n\s*\n/).filter(c => c.trim().length > 0);
      
      // If we don't get many chunks, try single newlines if the content is dense
      if (chunks.length <= 1 && textOnly.split('\n').length > 3) {
          chunks = textOnly.split('\n').filter(c => c.trim().length > 0);
      }

      const importedBeats: Beat[] = chunks.map((chunk, idx) => {
          // Clean up common list markers: "1.", "1)", "-", "*"
          // Also handle "Chapter 1:", "Beat 1:"
          const cleanText = chunk
            .replace(/^(\d+[\.\)]|\-|\*|Beat \d+:?|Chapter \d+:?|Scene \d+:?)\s*/i, '')
            .trim();
            
          return {
              id: (idx + 1).toString(),
              description: cleanText
          };
      });
      
      if (importedBeats.length > 0) {
          if (window.confirm(`Found ${importedBeats.length} beats. Replace current list?`)) {
              setBeats(importedBeats);
              setShowPasteImport(false);
              setPasteContent('');
          }
      } else {
          alert("Could not detect any beats in the text. Please ensure beats are separated by newlines.");
      }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      
      try {
          const content = await readFileContent(file);
          processImportContent(content);
      } catch (error) {
          console.error(error);
          alert("Failed to read file.");
      }
      
      // Reset input
      if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handlePasteSubmit = () => {
      processImportContent(pasteContent);
  };

  return (
    <div className="w-full h-full overflow-y-auto bg-stone-950 p-6 md:p-12 flex justify-center">
      <div className="max-w-4xl w-full">
        <div className="mb-10 text-center">
            <h2 className="text-4xl font-display font-bold text-stone-100 mb-3">Narrative Skeleton</h2>
            <p className="text-stone-400 font-body text-lg italic mb-6">Adjust the structural beats to guide the generation engine.</p>
            
            {/* Import Controls */}
            <div className="flex items-center justify-center gap-4 animate-fade-in">
                <input 
                    type="file" 
                    ref={fileInputRef}
                    className="hidden"
                    accept=".txt,.md,.html"
                    onChange={handleFileUpload}
                />
                <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="px-4 py-2 bg-stone-900 border border-stone-800 rounded-sm text-xs font-bold uppercase tracking-widest text-stone-400 hover:text-stone-200 hover:border-stone-600 transition-all flex items-center gap-2"
                >
                    <Upload className="w-3 h-3" />
                    Import File
                </button>
                <button 
                    onClick={() => setShowPasteImport(true)}
                    className="px-4 py-2 bg-stone-900 border border-stone-800 rounded-sm text-xs font-bold uppercase tracking-widest text-stone-400 hover:text-stone-200 hover:border-stone-600 transition-all flex items-center gap-2"
                >
                    <FileText className="w-3 h-3" />
                    Paste Text
                </button>
            </div>
        </div>

        {/* Paste Modal / Area */}
        {showPasteImport && (
            <div className="mb-10 bg-stone-900 p-6 rounded-sm border border-stone-700 animate-fade-in relative shadow-xl">
                <button onClick={() => setShowPasteImport(false)} className="absolute top-4 right-4 text-stone-500 hover:text-stone-300">
                    <X className="w-4 h-4" />
                </button>
                <h3 className="text-sm font-bold uppercase text-stone-300 mb-3 flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    Paste Outline
                </h3>
                <div className="mb-3 text-[10px] text-stone-500 bg-stone-950/50 p-2 rounded flex gap-2 items-start">
                    <AlertCircle className="w-3 h-3 flex-none mt-0.5" />
                    <p>Supported formats: Numbered lists, paragraphs separated by double newlines, or standard outlines. Text will be parsed automatically.</p>
                </div>
                <textarea
                    value={pasteContent}
                    onChange={(e) => setPasteContent(e.target.value)}
                    className="w-full h-40 bg-stone-950 border border-stone-800 rounded-sm p-4 text-stone-300 font-mono text-xs focus:ring-1 focus:ring-stone-600 outline-none mb-4 resize-y"
                    placeholder="1. Hero enters the village...&#10;2. Villagers are suspicious...&#10;3. The tavern scene..."
                />
                <div className="flex justify-end gap-3">
                    <button onClick={() => setShowPasteImport(false)} className="px-4 py-2 text-xs font-bold uppercase text-stone-500 hover:text-stone-300">Cancel</button>
                    <button onClick={handlePasteSubmit} className="px-6 py-2 bg-stone-100 text-stone-900 rounded-sm text-xs font-bold uppercase hover:bg-white shadow-lg hover:shadow-xl transition-all">Parse & Replace</button>
                </div>
            </div>
        )}

        <div className="relative border-l-2 border-stone-800 ml-4 md:ml-0 md:border-l-0 md:space-y-6 space-y-8 pb-12">
            {/* Beat Cards */}
            {beats.map((beat, index) => (
                <div key={index} className="group relative md:pl-0 pl-8 transition-all duration-300">
                    {/* Number Indicator */}
                    <div className="absolute -left-[9px] md:static md:mb-2 md:inline-block">
                       <div className="w-4 h-4 rounded-full bg-stone-700 border-2 border-stone-950 group-hover:bg-stone-200 transition-colors md:hidden"></div>
                    </div>

                    <div className="bg-stone-900 p-6 rounded-sm shadow-sm border border-stone-800 group-hover:shadow-md group-hover:border-stone-700 transition-all duration-300 relative">
                        <div className="absolute top-4 left-4 text-xs font-bold text-stone-600 font-mono">BEAT {String(index + 1).padStart(2, '0')}</div>
                        
                        <div className="pl-0 pt-6">
                            <textarea
                                value={beat.description}
                                onChange={(e) => updateBeat(index, e.target.value)}
                                placeholder="Describe the narrative action..."
                                rows={2}
                                className="w-full bg-transparent border-none p-0 font-body text-stone-300 text-lg leading-relaxed focus:ring-0 resize-none placeholder:text-stone-700"
                            />
                        </div>

                        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                             <button onClick={() => deleteBeat(index)} className="p-2 text-stone-600 hover:text-red-400 transition-colors">
                                 <Trash2 className="w-4 h-4" />
                             </button>
                        </div>
                    </div>
                </div>
            ))}

            <button onClick={addBeat} className="w-full py-6 border-2 border-dashed border-stone-800 rounded-sm text-stone-500 font-medium hover:border-stone-600 hover:text-stone-300 transition-all flex items-center justify-center gap-2 mt-6">
                <Plus className="w-5 h-5" />
                Append Narrative Beat
            </button>
        </div>

        <div className="sticky bottom-8 flex justify-center">
            <button onClick={() => onConfirm(beats)} className="bg-stone-100 text-stone-950 px-10 py-4 rounded-full shadow-2xl hover:bg-white hover:scale-105 transition-all font-display font-bold text-lg flex items-center gap-3">
                Confirm Structure
                <ArrowRight className="w-5 h-5" />
            </button>
        </div>
      </div>
    </div>
  );
};