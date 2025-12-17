
import React, { useState, useEffect, useRef } from 'react';
import { Wand2, Scissors, Type, Trash, X, Eraser, History, Undo } from 'lucide-react';
import { magicRefineSelection, magicEraser } from '../services/geminiService';

interface ChapterEditorProps {
  content: string;
  history?: string[];
  onHistoryUpdate: (newHistory: string[]) => void;
  onChange: (newContent: string) => void;
  isEditable: boolean;
  model: string;
}

export const ChapterEditor: React.FC<ChapterEditorProps> = ({ content, history = [], onHistoryUpdate, onChange, isEditable, model }) => {
  const [toolbarPos, setToolbarPos] = useState<{ top: number; left: number } | null>(null);
  const [selectionRange, setSelectionRange] = useState<Range | null>(null);
  const [isRefining, setIsRefining] = useState(false);
  const editorRef = useRef<HTMLDivElement>(null);
  
  // Version History State
  const [versionIndex, setVersionIndex] = useState(history.length > 0 ? history.length - 1 : 0);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
      // Sync local version index if history grows externally
      if (history.length > 0 && history.length - 1 !== versionIndex) {
          setVersionIndex(history.length - 1);
      }
  }, [history.length]);

  // Sync content only when it changes externally effectively
  useEffect(() => {
    if (editorRef.current && content !== editorRef.current.innerText) {
       if (Math.abs(content.length - editorRef.current.innerText.length) > 5) {
           editorRef.current.innerText = content;
       }
    }
  }, [content]);

  const handleSelect = () => {
    if (!isEditable) return;
    const selection = window.getSelection();
    if (selection && selection.toString().length > 0 && editorRef.current?.contains(selection.anchorNode)) {
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      setSelectionRange(range);
      setToolbarPos({
        top: rect.top - 50 + window.scrollY,
        left: rect.left + (rect.width / 2) - 100 
      });
    } else {
      setToolbarPos(null);
      setSelectionRange(null);
    }
  };

  const handleInput = (e: React.FormEvent<HTMLDivElement>) => {
      const text = e.currentTarget.innerText;
      onChange(text);
  };

  const pushToHistory = (newText: string) => {
      const newHistory = [...history, newText];
      onHistoryUpdate(newHistory);
      setVersionIndex(newHistory.length - 1);
  };

  const handleVersionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const idx = parseInt(e.target.value);
      setVersionIndex(idx);
      if (history[idx]) {
          onChange(history[idx]);
      }
  };

  const applyMagic = async (instruction: string, type: 'refine' | 'erase' = 'refine') => {
      if (!selectionRange || !isEditable) return;
      
      setIsRefining(true);
      const text = selectionRange.toString();
      const context = editorRef.current?.innerText || "";
      
      try {
          // Push current state to history before modifying
          if (history.length === 0 || history[history.length-1] !== context) {
              pushToHistory(context);
          }

          let newText = "";
          if (type === 'erase') {
             newText = await magicEraser(text, context, model);
          } else {
             newText = await magicRefineSelection(text, instruction, context, model);
          }
          
          selectionRange.deleteContents();
          if (newText) selectionRange.insertNode(document.createTextNode(newText));
          
          const updatedFullText = editorRef.current?.innerText || "";
          onChange(updatedFullText);
          pushToHistory(updatedFullText);
          
          setToolbarPos(null);
          setSelectionRange(null);
      } catch (e) {
          console.error("Magic refine failed", e);
      } finally {
          setIsRefining(false);
      }
  };

  return (
    <>
        {/* Version History Slider */}
        {history.length > 1 && (
            <div className="mb-4 bg-stone-900 border border-stone-800 p-2 rounded-sm flex items-center gap-3 animate-fade-in group hover:border-stone-600 transition-colors">
                <History className="w-3 h-3 text-stone-500" />
                <input 
                    type="range" 
                    min="0" 
                    max={history.length - 1} 
                    value={versionIndex}
                    onChange={handleVersionChange}
                    className="flex-1 h-1 bg-stone-700 rounded-lg appearance-none cursor-pointer accent-[#d4af37]"
                />
                <span className="text-[9px] font-mono text-stone-500">v{versionIndex + 1}/{history.length}</span>
            </div>
        )}

        <div
            ref={editorRef}
            contentEditable={isEditable}
            onInput={handleInput}
            onMouseUp={handleSelect}
            className={`font-body leading-[2.1] text-[1.15rem] text-justify whitespace-pre-wrap outline-none p-2 rounded-sm transition-all ${isEditable ? 'hover:bg-stone-900/50 focus:bg-stone-900/50 focus:ring-1 focus:ring-stone-700' : ''}`}
            suppressContentEditableWarning={true}
        >
            {content}
        </div>

        {/* Magic Toolbar */}
        {toolbarPos && (
            <div 
                className="fixed z-50 bg-stone-800 border border-[#d4af37] shadow-xl rounded-sm p-1 flex gap-1 animate-fade-in items-center"
                style={{ top: toolbarPos.top, left: toolbarPos.left }}
            >
                {isRefining ? (
                     <span className="px-3 py-1 text-xs text-[#d4af37] animate-pulse font-bold">Refining...</span>
                ) : (
                    <>
                        <button onClick={() => applyMagic("Make this funnier/wittier")} className="p-2 hover:bg-stone-700 text-stone-300 rounded-sm" title="Make Funny">
                            <span className="text-xs font-bold">😂</span>
                        </button>
                        <button onClick={() => applyMagic("Show, don't tell. Add sensory details.")} className="p-2 hover:bg-stone-700 text-stone-300 rounded-sm" title="Show Don't Tell">
                            <Eye className="w-4 h-4" />
                        </button>
                        <button onClick={() => applyMagic("Shorten and punch up.")} className="p-2 hover:bg-stone-700 text-stone-300 rounded-sm" title="Shorten">
                            <Scissors className="w-4 h-4" />
                        </button>
                        <button onClick={() => applyMagic("Make more formal/archaic.")} className="p-2 hover:bg-stone-700 text-stone-300 rounded-sm" title="Formalize">
                            <Type className="w-4 h-4" />
                        </button>
                        <div className="w-px h-4 bg-stone-600 mx-1"></div>
                        <button onClick={() => applyMagic("", "erase")} className="p-2 hover:bg-red-900/30 text-red-400 rounded-sm" title="Magic Eraser (Remove & Stitch)">
                            <Eraser className="w-4 h-4" />
                        </button>
                         <button onClick={() => setToolbarPos(null)} className="p-2 hover:bg-stone-700 text-stone-500 rounded-sm">
                            <X className="w-3 h-3" />
                        </button>
                    </>
                )}
            </div>
        )}
    </>
  );
};
import { Eye } from 'lucide-react';
