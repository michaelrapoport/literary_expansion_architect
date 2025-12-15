import React, { useState } from 'react';
import { GenerationConfig } from '../types';
import { Sliders, Layers, Mic2, Globe, Shield, ArrowRight, CheckCircle2 } from 'lucide-react';

interface ConfigurationPanelProps {
  onConfirm: (config: GenerationConfig) => void;
}

const TABS = [
  { id: 'structure', label: 'Structure & Pacing', icon: Layers },
  { id: 'style', label: 'Style & Tone', icon: Sliders },
  { id: 'character', label: 'Character & Dialogue', icon: Mic2 },
  { id: 'world', label: 'World & Setting', icon: Globe },
  { id: 'safety', label: 'Safety & Creativity', icon: Shield },
];

export const ConfigurationPanel: React.FC<ConfigurationPanelProps> = ({ onConfirm }) => {
  const [activeTab, setActiveTab] = useState('structure');
  
  const [config, setConfig] = useState<GenerationConfig>({
    expansionDepth: 'Scene',
    pacingSpeed: 'Balanced',
    narrativeFlow: 'Linear',
    tone: 'Dark/Gritty',
    pov: 'Third Person Limited',
    sensoryDensity: 'Medium',
    dialogueRatio: 'Balanced',
    characterAgency: 'Active',
    relationshipDynamic: 'Conflict-Driven',
    magicRules: 'Soft Rules',
    worldBuilding: 'Integrated',
    creativity: 'Interpretive',
    rating: 'PG-13'
  });

  const updateConfig = (key: keyof GenerationConfig, value: string) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  };

  const renderOptionCard = (
      key: keyof GenerationConfig, 
      value: string, 
      label: string, 
      description: string
  ) => {
      const isSelected = config[key] === value;
      return (
          <div 
            onClick={() => updateConfig(key, value)}
            className={`cursor-pointer border p-4 rounded-sm transition-all duration-200 relative ${
                isSelected 
                ? 'bg-stone-800 border-[#d4af37] shadow-lg' 
                : 'bg-stone-900 border-stone-800 hover:border-stone-600'
            }`}
          >
              <div className="flex items-center justify-between mb-2">
                  <span className={`font-display font-bold text-lg ${isSelected ? 'text-white' : 'text-stone-400'}`}>
                      {label}
                  </span>
                  {isSelected && <CheckCircle2 className="w-5 h-5 text-[#d4af37]" />}
              </div>
              <p className="text-xs font-ui text-stone-500 leading-relaxed">{description}</p>
          </div>
      );
  };

  return (
    <div className="w-full h-full overflow-y-auto bg-stone-950 flex justify-center p-6 md:p-12">
      <div className="max-w-5xl w-full flex flex-col h-[85vh] bg-stone-900 shadow-2xl rounded-sm border border-stone-800 overflow-hidden">
        
        {/* Header */}
        <div className="px-8 py-8 border-b border-stone-800 bg-stone-900 flex-none">
          <div className="flex items-center gap-3 mb-2 text-stone-500 uppercase tracking-widest text-xs font-bold">
            <Sliders className="w-4 h-4" />
            <span>Engine Calibration</span>
          </div>
          <h2 className="text-3xl font-display font-bold text-stone-100">Narrative Parameters</h2>
        </div>

        <div className="flex flex-1 overflow-hidden">
            {/* Sidebar Tabs */}
            <div className="w-64 bg-stone-950/50 border-r border-stone-800 flex-none flex flex-col">
                {TABS.map(tab => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`w-full text-left px-6 py-5 flex items-center gap-3 transition-all border-l-2 ${
                                isActive 
                                ? 'bg-stone-900 border-[#d4af37] text-stone-100' 
                                : 'border-transparent text-stone-500 hover:text-stone-300 hover:bg-stone-900/50'
                            }`}
                        >
                            <Icon className={`w-4 h-4 ${isActive ? 'text-[#d4af37]' : ''}`} />
                            <span className="font-ui text-sm font-medium tracking-wide">{tab.label}</span>
                        </button>
                    )
                })}
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto p-8 bg-stone-900/30">
                
                {/* 1. Structural & Pacing */}
                {activeTab === 'structure' && (
                    <div className="space-y-10 animate-fade-in">
                        <div>
                            <h3 className="text-sm font-bold uppercase tracking-widest text-stone-400 mb-4 border-b border-stone-800 pb-2">Expansion Depth</h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {renderOptionCard('expansionDepth', 'Micro', 'Micro-Expansion', 'Flesh out single sentences into sensory-rich paragraphs.')}
                                {renderOptionCard('expansionDepth', 'Scene', 'Scene Expansion', 'Turn summaries into full scenes with dialogue and action.')}
                                {renderOptionCard('expansionDepth', 'Chapter', 'Chapter Expansion', 'Extrapolate plot points into full chapters with complete arcs.')}
                            </div>
                        </div>

                        <div>
                            <h3 className="text-sm font-bold uppercase tracking-widest text-stone-400 mb-4 border-b border-stone-800 pb-2">Pacing Speed</h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {renderOptionCard('pacingSpeed', 'Slow Burn', 'Slow Burn', 'High internal monologue, detailed description, delayed gratification.')}
                                {renderOptionCard('pacingSpeed', 'Balanced', 'Balanced', 'Standard commercial fiction pacing; equal mix of action and reflection.')}
                                {renderOptionCard('pacingSpeed', 'Fast', 'Fast / Action', 'Rapid event sequencing, minimal introspection, focus on verbs.')}
                            </div>
                        </div>

                        <div>
                            <h3 className="text-sm font-bold uppercase tracking-widest text-stone-400 mb-4 border-b border-stone-800 pb-2">Narrative Flow</h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {renderOptionCard('narrativeFlow', 'Linear', 'Linear', 'A to B chronological progression.')}
                                {renderOptionCard('narrativeFlow', 'Non-Linear', 'Non-Linear', 'Includes flashbacks, in media res openings, or fragmented timelines.')}
                                {renderOptionCard('narrativeFlow', 'Branching', 'Branching', 'Generates optional alternative outcomes for key scenes.')}
                            </div>
                        </div>
                    </div>
                )}

                {/* 2. Stylistic & Tonal */}
                {activeTab === 'style' && (
                    <div className="space-y-10 animate-fade-in">
                         <div>
                            <h3 className="text-sm font-bold uppercase tracking-widest text-stone-400 mb-4 border-b border-stone-800 pb-2">Tone & Mood</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                {renderOptionCard('tone', 'Dark/Gritty', 'Dark / Gritty', 'Harsh descriptors, cynical worldview, high stakes.')}
                                {renderOptionCard('tone', 'Light/Whimsical', 'Light / Whimsical', 'Optimistic phrasing, humor, lower tension.')}
                                {renderOptionCard('tone', 'Academic/Formal', 'Academic', 'Complex sentence structures, precise vocabulary.')}
                                {renderOptionCard('tone', 'Conversational', 'Conversational', 'Simple structures, slang, contractions, approachable.')}
                            </div>
                        </div>

                        <div>
                            <h3 className="text-sm font-bold uppercase tracking-widest text-stone-400 mb-4 border-b border-stone-800 pb-2">Point of View (POV)</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {renderOptionCard('pov', 'First Person', 'First Person', '"I walked..." (Intimate, limited).')}
                                {renderOptionCard('pov', 'Third Person Limited', 'Third Person Ltd', '"He walked..." (Close psychic distance).')}
                                {renderOptionCard('pov', 'Third Person Omniscient', 'Third Person Omni', '"He walked, unaware that..." (Broad, authorial).')}
                                {renderOptionCard('pov', 'Second Person', 'Second Person', '"You walk..." (Immersive, experimental).')}
                            </div>
                        </div>

                        <div>
                            <h3 className="text-sm font-bold uppercase tracking-widest text-stone-400 mb-4 border-b border-stone-800 pb-2">Sensory Density</h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {renderOptionCard('sensoryDensity', 'Low', 'Low (Beige)', 'Hemingway-esque, strictly functional description.')}
                                {renderOptionCard('sensoryDensity', 'Medium', 'Medium', 'Balanced description vs. action.')}
                                {renderOptionCard('sensoryDensity', 'High', 'High (Purple)', 'Heavy reliance on adjectives, metaphor, and all five senses.')}
                            </div>
                        </div>
                    </div>
                )}

                {/* 3. Character & Dialogue */}
                {activeTab === 'character' && (
                    <div className="space-y-10 animate-fade-in">
                        <div>
                            <h3 className="text-sm font-bold uppercase tracking-widest text-stone-400 mb-4 border-b border-stone-800 pb-2">Dialogue-to-Prose Ratio</h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {renderOptionCard('dialogueRatio', 'Dialogue Heavy', 'Dialogue Heavy', 'Story advances primarily through conversation.')}
                                {renderOptionCard('dialogueRatio', 'Balanced', 'Balanced', 'Mix of talk, action, and thought.')}
                                {renderOptionCard('dialogueRatio', 'Internal Monologue', 'Internal Monologue', 'Story advances primarily through character thoughts.')}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                            <div>
                                <h3 className="text-sm font-bold uppercase tracking-widest text-stone-400 mb-4 border-b border-stone-800 pb-2">Character Agency</h3>
                                <div className="grid grid-cols-1 gap-4">
                                    {renderOptionCard('characterAgency', 'Passive', 'Passive', 'Things happen to the protagonist; they react.')}
                                    {renderOptionCard('characterAgency', 'Active', 'Active', 'The protagonist drives the plot; they instigate.')}
                                </div>
                            </div>
                            <div>
                                <h3 className="text-sm font-bold uppercase tracking-widest text-stone-400 mb-4 border-b border-stone-800 pb-2">Relationship Dynamic</h3>
                                <div className="grid grid-cols-1 gap-4">
                                    {renderOptionCard('relationshipDynamic', 'Cooperative', 'Cooperative', 'Characters generally agree and support one another.')}
                                    {renderOptionCard('relationshipDynamic', 'Conflict-Driven', 'Conflict-Driven', 'High friction, arguments, and tension between characters.')}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* 4. World & Setting */}
                {activeTab === 'world' && (
                    <div className="space-y-10 animate-fade-in">
                        <div>
                            <h3 className="text-sm font-bold uppercase tracking-widest text-stone-400 mb-4 border-b border-stone-800 pb-2">Rule Strictness (Magic/Tech)</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {renderOptionCard('magicRules', 'Hard Rules', 'Hard Rules', 'Magic/Tech has strict costs and limits (Sanderson’s Laws).')}
                                {renderOptionCard('magicRules', 'Soft Rules', 'Soft Rules', 'Magic/Tech is mysterious and serves the plot (LOTR).')}
                            </div>
                        </div>

                        <div>
                            <h3 className="text-sm font-bold uppercase tracking-widest text-stone-400 mb-4 border-b border-stone-800 pb-2">Worldbuilding Inclusion</h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {renderOptionCard('worldBuilding', 'Expository', 'Expository', 'Engine pauses plot to explain history/lore.')}
                                {renderOptionCard('worldBuilding', 'Integrated', 'Integrated', 'Lore is only mentioned when relevant to immediate action.')}
                                {renderOptionCard('worldBuilding', 'Minimal', 'Minimal', 'Setting is a generic backdrop; focus remains on characters.')}
                            </div>
                        </div>
                    </div>
                )}

                {/* 5. Content & Creativity */}
                {activeTab === 'safety' && (
                    <div className="space-y-10 animate-fade-in">
                        <div>
                            <h3 className="text-sm font-bold uppercase tracking-widest text-stone-400 mb-4 border-b border-stone-800 pb-2">Creativity / Hallucination Level</h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {renderOptionCard('creativity', 'Strict', 'Strict / Grounded', 'Adheres strictly to prompt; no new subplots.')}
                                {renderOptionCard('creativity', 'Interpretive', 'Interpretive', 'Fills in gaps but stays on track.')}
                                {renderOptionCard('creativity', 'Wild', 'Wild / Surreal', 'Allowed to introduce new twists or weird elements.')}
                            </div>
                        </div>

                        <div>
                            <h3 className="text-sm font-bold uppercase tracking-widest text-stone-400 mb-4 border-b border-stone-800 pb-2">Content Rating</h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {renderOptionCard('rating', 'G', 'G / All Ages', 'Safe for all audiences.')}
                                {renderOptionCard('rating', 'PG-13', 'PG-13 / YA', 'Violence/Romance implied but not graphic.')}
                                {renderOptionCard('rating', 'R', 'R / Mature', 'Explicit violence, language, or themes allowed.')}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>

        <div className="p-8 border-t border-stone-800 bg-stone-900 flex justify-end">
             <button 
                onClick={() => onConfirm(config)}
                className="bg-stone-100 hover:bg-white text-stone-900 px-8 py-3 rounded-sm shadow-xl font-display font-bold text-lg flex items-center gap-2 transition-transform hover:-translate-y-0.5"
             >
                 Confirm Parameters
                 <ArrowRight className="w-5 h-5" />
             </button>
        </div>
      </div>
    </div>
  );
};
