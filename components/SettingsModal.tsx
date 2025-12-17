import React from 'react';
import { X, Settings, Cpu, Zap, Brain } from 'lucide-react';
import { ModelConfiguration } from '../types';
import { AVAILABLE_MODELS } from '../constants';

interface SettingsModalProps {
  config: ModelConfiguration;
  onUpdate: (newConfig: ModelConfiguration) => void;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ config, onUpdate, onClose }) => {
  
  const handleChange = (key: keyof ModelConfiguration, value: string) => {
    onUpdate({ ...config, [key]: value });
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-lg bg-stone-900 border border-stone-800 rounded-sm shadow-2xl relative">
        
        <div className="flex items-center justify-between p-6 border-b border-stone-800">
          <div className="flex items-center gap-3 text-stone-100">
             <Settings className="w-5 h-5 text-[#d4af37]" />
             <h3 className="font-display font-bold text-xl tracking-wide">Model Configuration</h3>
          </div>
          <button onClick={onClose} className="text-stone-500 hover:text-stone-300 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-8 space-y-8">
            
            {/* Provider Selection (Visual Only for now) */}
            <div className="opacity-70 pointer-events-none">
                <label className="block text-xs font-bold uppercase tracking-widest text-stone-500 mb-3">Model Provider</label>
                <div className="flex gap-2">
                    <button className="flex-1 py-3 bg-stone-800 border border-[#d4af37] text-stone-200 font-bold text-sm rounded-sm flex items-center justify-center gap-2">
                        <Cpu className="w-4 h-4" /> Google GenAI
                    </button>
                    <button className="flex-1 py-3 bg-stone-950 border border-stone-800 text-stone-600 font-bold text-sm rounded-sm flex items-center justify-center gap-2">
                        OpenAI (Coming Soon)
                    </button>
                </div>
            </div>

            {/* Analysis Model */}
            <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-stone-500 mb-3 flex items-center gap-2">
                    <Brain className="w-3 h-3" />
                    Analysis & Planning Model
                </label>
                <p className="text-[10px] text-stone-600 mb-2">Used for metadata extraction, beat sheet generation, and deep style analysis.</p>
                <select 
                    value={config.analysisModel}
                    onChange={(e) => handleChange('analysisModel', e.target.value)}
                    className="w-full bg-stone-950 border border-stone-800 rounded-sm p-3 text-sm text-stone-300 focus:border-[#d4af37] outline-none"
                >
                    {AVAILABLE_MODELS.map(model => (
                        <option key={model.id} value={model.id}>{model.name}</option>
                    ))}
                </select>
            </div>

            {/* Drafting Model */}
            <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-stone-500 mb-3 flex items-center gap-2">
                    <Zap className="w-3 h-3" />
                    Drafting & Expansion Model
                </label>
                <p className="text-[10px] text-stone-600 mb-2">Used for generating chapter prose and applying refinements.</p>
                <select 
                    value={config.draftingModel}
                    onChange={(e) => handleChange('draftingModel', e.target.value)}
                    className="w-full bg-stone-950 border border-stone-800 rounded-sm p-3 text-sm text-stone-300 focus:border-[#d4af37] outline-none"
                >
                    {AVAILABLE_MODELS.map(model => (
                        <option key={model.id} value={model.id}>{model.name}</option>
                    ))}
                </select>
            </div>

            <div className="bg-stone-950/50 p-4 border border-stone-800/50 rounded-sm">
                <p className="text-[10px] text-stone-500 italic">
                    Note: Your API key is securely loaded from the environment variables. The models available are based on the Google Gemini ecosystem.
                </p>
            </div>

        </div>

        <div className="p-6 border-t border-stone-800 bg-stone-950 flex justify-end">
            <button onClick={onClose} className="px-6 py-2 bg-stone-100 hover:bg-white text-stone-900 font-bold text-sm uppercase tracking-wide rounded-sm transition-colors">
                Save Configuration
            </button>
        </div>

      </div>
    </div>
  );
};