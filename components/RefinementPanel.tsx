import React, { useState } from 'react';
import { Eye, Brain, MessageCircle, Map, Activity, Video, ArrowRight, Sparkles, Layers } from 'lucide-react';
import { REFINEMENT_OPTIONS } from '../constants';

interface RefinementPanelProps {
  onRefine: (selectedIds: string[]) => void;
  onSkip: () => void;
}

const ICON_MAP: Record<string, React.FC<any>> = {
  'Eye': Eye,
  'Brain': Brain,
  'MessageCircle': MessageCircle,
  'Map': Map,
  'Activity': Activity,
  'Video': Video
};

export const RefinementPanel: React.FC<RefinementPanelProps> = ({ onRefine, onSkip }) => {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const toggleOption = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  return (
    <div className="flex flex-col h-full bg-stone-900 border-l border-stone-800 w-full md:w-[420px] flex-none z-20 text-stone-300">
      <div className="p-6 border-b border-stone-800 bg-stone-950/50 backdrop-blur-sm">
        <div className="flex items-center gap-3 mb-1">
           <Layers className="w-5 h-5 text-[#d4af37]" />
           <h3 className="font-display font-bold text-xl text-stone-100 tracking-wide">Refinement Layers</h3>
        </div>
        <p className="text-xs text-stone-500 font-mono uppercase tracking-wider">Apply stylistic lenses</p>
      </div>

      <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 gap-3">
        {REFINEMENT_OPTIONS.map((option) => {
          const Icon = ICON_MAP[option.icon] || Sparkles;
          const isSelected = selectedIds.includes(option.id);
          
          return (
            <div
              key={option.id}
              onClick={() => toggleOption(option.id)}
              className={`cursor-pointer rounded-sm border p-4 transition-all duration-200 flex items-start gap-4 group ${
                isSelected
                  ? 'border-[#d4af37] bg-stone-800'
                  : 'border-stone-800 bg-transparent hover:bg-stone-800/30 hover:border-stone-700'
              }`}
            >
              <div className={`p-2 rounded-sm ${isSelected ? 'bg-[#d4af37] text-stone-900' : 'bg-stone-800 text-stone-500 group-hover:text-stone-400'}`}>
                <Icon className="w-4 h-4" />
              </div>
              <div>
                <h4 className={`font-bold text-sm mb-1 ${isSelected ? 'text-white' : 'text-stone-400 group-hover:text-stone-300'}`}>
                  {option.label}
                </h4>
                <p className="text-[11px] text-stone-600 leading-snug group-hover:text-stone-500">
                  {option.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="p-6 border-t border-stone-800 bg-stone-950 space-y-3">
        <button
          onClick={() => onRefine(selectedIds)}
          disabled={selectedIds.length === 0}
          className={`w-full py-4 rounded-sm font-bold text-sm tracking-widest uppercase flex items-center justify-center gap-3 transition-all ${
            selectedIds.length > 0
              ? 'bg-[#d4af37] text-stone-900 hover:bg-[#c5a028] shadow-[0_0_20px_rgba(212,175,55,0.2)]'
              : 'bg-stone-800 text-stone-600 cursor-not-allowed border border-stone-700'
          }`}
        >
          <Sparkles className="w-3 h-3" />
          Apply Filters
        </button>
        
        <button
          onClick={onSkip}
          className="w-full py-3 rounded-sm font-bold text-xs tracking-widest uppercase text-stone-500 hover:text-stone-300 transition-colors flex items-center justify-center gap-2"
        >
          Proceed Without Changes
          <ArrowRight className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
};