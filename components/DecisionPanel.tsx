
import React, { useState } from 'react';
import { Choice } from '../types';
import { ArrowRight, MessageSquarePlus, Play, Compass, FilePlus, ArrowDownToLine, Bot, Zap, Wind, Dices } from 'lucide-react';

interface DecisionPanelProps {
  choices: Choice[];
  onDecision: (choiceId: string, customInstructions: string, placement: 'new' | 'append') => void;
  onAutoPilot: (count: number) => void;
  onChaos: () => void;
}

export const DecisionPanel: React.FC<DecisionPanelProps> = ({ choices, onDecision, onAutoPilot, onChaos }) => {
  const [selectedChoiceId, setSelectedChoiceId] = useState<string | null>(null);
  const [customInstructions, setCustomInstructions] = useState('');
  const [placement, setPlacement] = useState<'new' | 'append'>('new');
  
  // Auto-Pilot State
  const [autoPilotCount, setAutoPilotCount] = useState(3);

  const handleSubmit = () => {
    if (selectedChoiceId) {
      const choiceText = choices.find(c => c.id === selectedChoiceId)?.text || "User Custom Path";
      onDecision(choiceText, customInstructions, placement);
    }
  };

  const handleDirectContinue = () => {
      // Find the "Continue" choice or default to A
      const defaultChoice = choices.find(c => c.type === 'Other' || c.text.includes('Continue')) || choices[0];
      const text = defaultChoice ? defaultChoice.text : "Continue automatically.";
      onDecision(text, "", placement);
  };

  const getChoiceStyles = (choice: Choice, isSelected: boolean) => {
      if (choice.type === 'Pacing') {
          return isSelected 
            ? 'border-cyan-500 bg-cyan-900/20 shadow-[0_0_15px_rgba(6,182,212,0.3)]' 
            : 'border-cyan-800 bg-cyan-900/10 hover:border-cyan-500 hover:bg-cyan-900/20';
      }
      if (choice.type === 'Chaos') {
          return isSelected
            ? 'border-purple-500 bg-purple-900/20 shadow-[0_0_15px_rgba(168,85,247,0.3)]'
            : 'border-purple-800 bg-purple-900/10 hover:border-purple-500 hover:bg-purple-900/20';
      }
      return isSelected
        ? 'border-[#d4af37] bg-stone-800 shadow-lg shadow-black/20'
        : 'border-stone-700 bg-transparent hover:border-stone-500 hover:bg-stone-800/50';
  };

  const getTypeColor = (type: string) => {
      if (type === 'Pacing') return 'text-cyan-400 border-cyan-800';
      if (type === 'Chaos') return 'text-purple-400 border-purple-800';
      return 'border-stone-600 text-stone-500';
  };

  return (
    <div className="flex flex-col h-full bg-stone-900 border-l border-stone-800 w-full md:w-[420px] flex-none z-20 text-stone-300">
      <div className="p-6 border-b border-stone-800 bg-stone-950/50 backdrop-blur-sm flex justify-between items-center">
        <div>
            <div className="flex items-center gap-3 mb-1">
            <Compass className="w-5 h-5 text-[#d4af37]" />
            <h3 className="font-display font-bold text-xl text-stone-100 tracking-wide">Pathways</h3>
            </div>
            <p className="text-xs text-stone-500 font-mono uppercase tracking-wider">Select the narrative vector</p>
        </div>
        <button 
            onClick={onChaos} 
            className="p-2 bg-purple-500/10 border border-purple-500/30 text-purple-400 rounded-sm hover:bg-purple-500 hover:text-white transition-all"
            title="Surprise Me (Chaos Mode)"
        >
            <Dices className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-5">
        {choices.map((choice) => {
          const isSelected = selectedChoiceId === choice.id;
          return (
            <div
                key={choice.id}
                onClick={() => setSelectedChoiceId(choice.id)}
                className={`cursor-pointer rounded-sm border p-5 transition-all duration-300 relative group ${getChoiceStyles(choice, isSelected)}`}
            >
                {choice.type === 'Pacing' && (
                    <div className="absolute top-0 right-0 p-2 text-cyan-500">
                        <Wind className="w-4 h-4 animate-pulse" />
                    </div>
                )}
                 {choice.type === 'Chaos' && (
                    <div className="absolute top-0 right-0 p-2 text-purple-500">
                        <Dices className="w-4 h-4 animate-spin-slow" />
                    </div>
                )}

                <div className="flex justify-between items-start mb-3">
                <span className={`text-[9px] font-bold uppercase tracking-widest px-2 py-1 rounded-full border ${
                    isSelected && choice.type !== 'Pacing' && choice.type !== 'Chaos' ? 'border-[#d4af37]/50 text-[#d4af37]' : getTypeColor(choice.type)
                }`}>
                    {choice.type}
                </span>
                <span className="font-mono text-xs text-stone-600 group-hover:text-stone-400">{choice.id}</span>
                </div>
                <h4 className={`font-display font-semibold text-lg mb-2 leading-tight ${isSelected ? 'text-white' : 'text-stone-300'}`}>
                    {choice.text}
                </h4>
                <p className="text-xs text-stone-500 leading-relaxed font-ui border-l border-stone-700 pl-3">
                {choice.rationale}
                </p>
            </div>
          );
        })}
      </div>

      <div className="p-6 border-t border-stone-800 bg-stone-950 space-y-5">
        {/* Auto-Pilot Section */}
        <div className="bg-stone-900/50 border border-stone-800 rounded-sm p-4">
             <div className="flex items-center justify-between mb-3">
                 <div className="flex items-center gap-2 text-[#d4af37]">
                     <Bot className="w-4 h-4" />
                     <span className="text-xs font-bold uppercase tracking-widest">Automated Expansion</span>
                 </div>
                 <span className="text-[10px] text-stone-500 font-mono">{autoPilotCount} Chapters</span>
             </div>
             <div className="flex items-center gap-3">
                 <input 
                    type="range" 
                    min="1" 
                    max="20" 
                    value={autoPilotCount} 
                    onChange={(e) => setAutoPilotCount(parseInt(e.target.value))}
                    className="w-full h-1 bg-stone-800 rounded-lg appearance-none cursor-pointer accent-[#d4af37]"
                 />
                 <button 
                    onClick={() => onAutoPilot(autoPilotCount)}
                    className="px-3 py-1.5 bg-stone-800 hover:bg-[#d4af37] hover:text-stone-900 text-stone-400 text-[10px] font-bold uppercase rounded-sm transition-colors flex-none"
                 >
                     Engage
                 </button>
             </div>
        </div>

        {/* Manual Controls */}
        <div>
          <label className="block text-[10px] font-bold uppercase tracking-widest text-stone-500 mb-3 flex items-center gap-2">
            <MessageSquarePlus className="w-3 h-3" />
            Director's Notes
          </label>
          <textarea
            value={customInstructions}
            onChange={(e) => setCustomInstructions(e.target.value)}
            placeholder="Additional directives for the engine..."
            className="w-full text-sm p-4 bg-stone-900 border border-stone-800 rounded-sm focus:border-[#d4af37] focus:ring-1 focus:ring-[#d4af37] outline-none resize-none h-16 text-stone-300 placeholder:text-stone-700 font-mono transition-all"
          />
        </div>
        
        <div className="grid grid-cols-2 gap-3">
           <button 
                onClick={handleDirectContinue}
                className="py-3 rounded-sm border border-stone-700 bg-transparent text-stone-400 hover:text-stone-200 hover:bg-stone-800 font-bold text-xs tracking-widest uppercase flex items-center justify-center gap-2 transition-all"
           >
                <Zap className="w-3 h-3" />
                Quick Continue
           </button>
           <button
              onClick={handleSubmit}
              disabled={!selectedChoiceId}
              className={`py-3 rounded-sm font-bold text-xs tracking-widest uppercase flex items-center justify-center gap-2 transition-all ${
                selectedChoiceId
                  ? 'bg-[#d4af37] text-stone-900 hover:bg-[#c5a028] shadow-[0_0_20px_rgba(212,175,55,0.2)]'
                  : 'bg-stone-800 text-stone-600 cursor-not-allowed border border-stone-700'
              }`}
            >
              <span>Execute</span>
              <Play className="w-3 h-3 fill-current" />
            </button>
        </div>
      </div>
    </div>
  );
};
