
import React, { useState } from 'react';
import { GenerationConfig } from '../types';
import { Sliders, Layers, Mic2, Globe, Shield, ArrowRight, CheckCircle2, Feather, Eye } from 'lucide-react';

interface ConfigurationPanelProps {
  onConfirm: (config: GenerationConfig) => void;
}

const TABS = [
  { id: 'structure', label: 'Structure & Mechanics', icon: Layers },
  { id: 'prose', label: 'Advanced Prose', icon: Feather }, // NEW
  { id: 'character', label: 'Character & Dialogue', icon: Mic2 },
  { id: 'atmosphere', label: 'Atmosphere & World', icon: Globe },
  { id: 'safety', label: 'Safety & Creativity', icon: Shield },
];

export const ConfigurationPanel: React.FC<ConfigurationPanelProps> = ({ onConfirm }) => {
  const [activeTab, setActiveTab] = useState('structure');
  
  const [config, setConfig] = useState<GenerationConfig>({
    // Defaults including new fields
    expansionDepth: 'Scene',
    pacingSpeed: 'Balanced',
    narrativeFlow: 'Linear',
    timeDilation: 'Real-time',
    chapterStructure: 'Classic Arc',

    tone: 'Dark/Gritty',
    proseComplexity: 'Standard',
    sentenceRhythm: 'Flowing',
    vocabularyLevel: 'College',
    metaphorFrequency: 'Moderate',
    
    pov: 'Third Person Limited',
    tense: 'Past',
    narrativeDistance: 'Close',
    narrativeReliability: 'Reliable',

    sensoryDensity: 'Medium',
    atmosphericFilter: 'Neutral',

    dialogueRatio: 'Balanced',
    characterAgency: 'Active',
    relationshipDynamic: 'Conflict-Driven',
    subtextLevel: 'Balanced',
    conflictFocus: 'Interpersonal',

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
            className={`cursor-pointer border p-3 rounded-sm transition-all duration-200 relative group ${
                isSelected 
                ? 'bg-stone-800 border-[#d4af37] shadow-lg' 
                : 'bg-stone-900 border-stone-800 hover:border-stone-600'
            }`}
          >
              <div className="flex items-center justify-between mb-1.5">
                  <span className={`font-display font-bold text-base ${isSelected ? 'text-white' : 'text-stone-400 group-hover:text-stone-300'}`}>
                      {label}
                  </span>
                  {isSelected && <CheckCircle2 className="w-4 h-4 text-[#d4af37]" />}
              </div>
              <p className="text-[11px] font-ui text-stone-500 leading-snug">{description}</p>
          </div>
      );
  };

  return (
    <div className="w-full h-full overflow-y-auto bg-stone-950 flex justify-center p-4 md:p-8">
      <div className="max-w-6xl w-full flex flex-col h-[90vh] bg-stone-900 shadow-2xl rounded-sm border border-stone-800 overflow-hidden">
        
        {/* Header */}
        <div className="px-8 py-6 border-b border-stone-800 bg-stone-900 flex-none flex justify-between items-center">
          <div>
            <div className="flex items-center gap-3 mb-1 text-stone-500 uppercase tracking-widest text-[10px] font-bold">
                <Sliders className="w-3 h-3" />
                <span>Engine Calibration</span>
            </div>
            <h2 className="text-2xl font-display font-bold text-stone-100">Narrative Parameters</h2>
          </div>
          <button 
                onClick={() => onConfirm(config)}
                className="bg-stone-100 hover:bg-white text-stone-900 px-6 py-2 rounded-sm shadow-xl font-display font-bold text-sm flex items-center gap-2 transition-transform hover:-translate-y-0.5"
             >
                 Confirm Parameters
                 <ArrowRight className="w-4 h-4" />
             </button>
        </div>

        <div className="flex flex-1 overflow-hidden">
            {/* Sidebar Tabs */}
            <div className="w-56 bg-stone-950/50 border-r border-stone-800 flex-none flex flex-col pt-4">
                {TABS.map(tab => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`w-full text-left px-5 py-4 flex items-center gap-3 transition-all border-l-2 ${
                                isActive 
                                ? 'bg-stone-900 border-[#d4af37] text-stone-100' 
                                : 'border-transparent text-stone-500 hover:text-stone-300 hover:bg-stone-900/50'
                            }`}
                        >
                            <Icon className={`w-4 h-4 ${isActive ? 'text-[#d4af37]' : ''}`} />
                            <span className="font-ui text-xs font-bold tracking-wide uppercase">{tab.label}</span>
                        </button>
                    )
                })}
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto p-8 bg-stone-900/30">
                
                {/* 1. Structure & Mechanics */}
                {activeTab === 'structure' && (
                    <div className="space-y-8 animate-fade-in">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div>
                                <h3 className="text-xs font-bold uppercase tracking-widest text-stone-400 mb-4 border-b border-stone-800 pb-2">Expansion Depth</h3>
                                <div className="grid grid-cols-1 gap-3">
                                    {renderOptionCard('expansionDepth', 'Micro', 'Micro-Expansion', 'Flesh out single sentences into sensory-rich paragraphs.')}
                                    {renderOptionCard('expansionDepth', 'Scene', 'Scene Expansion', 'Turn summaries into full scenes with dialogue and action.')}
                                    {renderOptionCard('expansionDepth', 'Chapter', 'Chapter Expansion', 'Extrapolate plot points into full chapters with complete arcs.')}
                                </div>
                            </div>
                            <div>
                                <h3 className="text-xs font-bold uppercase tracking-widest text-stone-400 mb-4 border-b border-stone-800 pb-2">Narrative Flow</h3>
                                <div className="grid grid-cols-1 gap-3">
                                    {renderOptionCard('narrativeFlow', 'Linear', 'Linear', 'Standard chronological progression.')}
                                    {renderOptionCard('narrativeFlow', 'Non-Linear', 'Non-Linear', 'Includes flashbacks or in media res.')}
                                    {renderOptionCard('narrativeFlow', 'Branching', 'Branching', 'Generates optional outcomes for key scenes.')}
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div>
                                <h3 className="text-xs font-bold uppercase tracking-widest text-stone-400 mb-4 border-b border-stone-800 pb-2">Time Dilation</h3>
                                <div className="grid grid-cols-1 gap-3">
                                    {renderOptionCard('timeDilation', 'Real-time', 'Real-time', 'Minute-by-minute action.')}
                                    {renderOptionCard('timeDilation', 'Compressed', 'Compressed', 'Fast-forwarding through low-relevance events.')}
                                    {renderOptionCard('timeDilation', 'Expanded Moment', 'Expanded Moment', 'Slowing down time for intense detail.')}
                                </div>
                            </div>
                            <div>
                                <h3 className="text-xs font-bold uppercase tracking-widest text-stone-400 mb-4 border-b border-stone-800 pb-2">Chapter Structure</h3>
                                <div className="grid grid-cols-1 gap-3">
                                    {renderOptionCard('chapterStructure', 'Classic Arc', 'Classic Arc', 'Setup, Inciting Incident, Climax, Resolution.')}
                                    {renderOptionCard('chapterStructure', 'Cliffhanger', 'Cliffhanger', 'Ends on high tension to drive engagement.')}
                                    {renderOptionCard('chapterStructure', 'Vignette', 'Vignette', 'Atmospheric slice without strong plot resolution.')}
                                </div>
                            </div>
                             <div>
                                <h3 className="text-xs font-bold uppercase tracking-widest text-stone-400 mb-4 border-b border-stone-800 pb-2">Pacing Speed</h3>
                                <div className="grid grid-cols-1 gap-3">
                                    {renderOptionCard('pacingSpeed', 'Slow Burn', 'Slow Burn', 'Delayed gratification, high detail.')}
                                    {renderOptionCard('pacingSpeed', 'Balanced', 'Balanced', 'Standard commercial pacing.')}
                                    {renderOptionCard('pacingSpeed', 'Fast', 'Fast / Action', 'Rapid event sequencing.')}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* 2. Advanced Prose (NEW TAB) */}
                {activeTab === 'prose' && (
                    <div className="space-y-8 animate-fade-in">
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div>
                                <h3 className="text-xs font-bold uppercase tracking-widest text-stone-400 mb-4 border-b border-stone-800 pb-2">Prose Complexity</h3>
                                <div className="grid grid-cols-1 gap-3">
                                    {renderOptionCard('proseComplexity', 'Accessible', 'Accessible / Clear', 'Simple sentence structures, Hemingway-esque.')}
                                    {renderOptionCard('proseComplexity', 'Standard', 'Standard', 'Balanced syntax typical of modern fiction.')}
                                    {renderOptionCard('proseComplexity', 'Baroque', 'Baroque / Lyrical', 'Complex, nested clauses and poetic phrasing.')}
                                    {renderOptionCard('proseComplexity', 'Experimental', 'Experimental', 'Fragmented or stream-of-consciousness styles.')}
                                </div>
                            </div>
                            <div>
                                <h3 className="text-xs font-bold uppercase tracking-widest text-stone-400 mb-4 border-b border-stone-800 pb-2">Sentence Rhythm</h3>
                                <div className="grid grid-cols-1 gap-3">
                                    {renderOptionCard('sentenceRhythm', 'Flowing', 'Flowing', 'Long, connecting sentences with smooth transitions.')}
                                    {renderOptionCard('sentenceRhythm', 'Staccato', 'Staccato', 'Short, punchy sentences for tension.')}
                                    {renderOptionCard('sentenceRhythm', 'Variable', 'Variable', 'High contrast between short and long sentences.')}
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div>
                                <h3 className="text-xs font-bold uppercase tracking-widest text-stone-400 mb-4 border-b border-stone-800 pb-2">Narrative Distance</h3>
                                <div className="grid grid-cols-1 gap-3">
                                    {renderOptionCard('narrativeDistance', 'Intimate', 'Intimate', 'Deep inside the character\'s head/thoughts.')}
                                    {renderOptionCard('narrativeDistance', 'Close', 'Close', 'Standard over-the-shoulder perspective.')}
                                    {renderOptionCard('narrativeDistance', 'Cinematic', 'Cinematic', 'Visual focus, detached from internal thought.')}
                                </div>
                            </div>
                             <div>
                                <h3 className="text-xs font-bold uppercase tracking-widest text-stone-400 mb-4 border-b border-stone-800 pb-2">Tense & POV</h3>
                                <div className="grid grid-cols-1 gap-3">
                                    {renderOptionCard('tense', 'Past', 'Past Tense', '"He walked..."')}
                                    {renderOptionCard('tense', 'Present', 'Present Tense', '"He walks..."')}
                                    {renderOptionCard('pov', 'Third Person Limited', '3rd Person Ltd', 'Focus on one character.')}
                                    {renderOptionCard('pov', 'First Person', '1st Person', '"I walked..."')}
                                </div>
                            </div>
                            <div>
                                <h3 className="text-xs font-bold uppercase tracking-widest text-stone-400 mb-4 border-b border-stone-800 pb-2">Vocabulary</h3>
                                <div className="grid grid-cols-1 gap-3">
                                    {renderOptionCard('vocabularyLevel', 'Simple', 'Simple', 'Common words, easy to read.')}
                                    {renderOptionCard('vocabularyLevel', 'College', 'College', 'Educated but natural.')}
                                    {renderOptionCard('vocabularyLevel', 'Esoteric', 'Esoteric', 'Rare, specific, or archaic words.')}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* 3. Character & Dialogue */}
                {activeTab === 'character' && (
                    <div className="space-y-8 animate-fade-in">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                             <div>
                                <h3 className="text-xs font-bold uppercase tracking-widest text-stone-400 mb-4 border-b border-stone-800 pb-2">Dialogue Ratio</h3>
                                <div className="grid grid-cols-1 gap-3">
                                    {renderOptionCard('dialogueRatio', 'Dialogue Heavy', 'Dialogue Heavy', 'Story advances primarily through talk.')}
                                    {renderOptionCard('dialogueRatio', 'Balanced', 'Balanced', 'Mix of talk, action, and thought.')}
                                    {renderOptionCard('dialogueRatio', 'Internal Monologue', 'Internal Monologue', 'Story advances through thought.')}
                                </div>
                            </div>
                             <div>
                                <h3 className="text-xs font-bold uppercase tracking-widest text-stone-400 mb-4 border-b border-stone-800 pb-2">Subtext Level</h3>
                                <div className="grid grid-cols-1 gap-3">
                                    {renderOptionCard('subtextLevel', 'On the Nose', 'Direct', 'Characters say what they mean.')}
                                    {renderOptionCard('subtextLevel', 'Balanced', 'Balanced', 'Some hidden meaning, mostly clear.')}
                                    {renderOptionCard('subtextLevel', 'Deep Subtext', 'Deep Subtext', 'Meaning is implied, rarely spoken.')}
                                </div>
                            </div>
                        </div>

                         <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div>
                                <h3 className="text-xs font-bold uppercase tracking-widest text-stone-400 mb-4 border-b border-stone-800 pb-2">Conflict Focus</h3>
                                <div className="grid grid-cols-1 gap-3">
                                    {renderOptionCard('conflictFocus', 'Internal', 'Internal', 'Self-doubt, moral dilemmas.')}
                                    {renderOptionCard('conflictFocus', 'Interpersonal', 'Interpersonal', 'Arguments, rivalry, romance.')}
                                    {renderOptionCard('conflictFocus', 'Societal', 'Societal', 'Politics, class, war.')}
                                </div>
                            </div>
                            <div>
                                <h3 className="text-xs font-bold uppercase tracking-widest text-stone-400 mb-4 border-b border-stone-800 pb-2">Agency & Reliability</h3>
                                <div className="grid grid-cols-1 gap-3">
                                    {renderOptionCard('characterAgency', 'Active', 'Active Protagonist', 'Drives the plot forward.')}
                                    {renderOptionCard('characterAgency', 'Passive', 'Passive Protagonist', 'Reacts to events.')}
                                    {renderOptionCard('narrativeReliability', 'Unreliable', 'Unreliable Narrator', 'Narrator may lie or perceive incorrectly.')}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* 4. Atmosphere & World (Renamed from World) */}
                {activeTab === 'atmosphere' && (
                    <div className="space-y-8 animate-fade-in">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div>
                                <h3 className="text-xs font-bold uppercase tracking-widest text-stone-400 mb-4 border-b border-stone-800 pb-2">Atmospheric Filter</h3>
                                <div className="grid grid-cols-1 gap-3">
                                    {renderOptionCard('atmosphericFilter', 'Neutral', 'Neutral', 'Objective description.')}
                                    {renderOptionCard('atmosphericFilter', 'Oppressive', 'Oppressive', 'Heavy, claustrophobic, dark.')}
                                    {renderOptionCard('atmosphericFilter', 'Eerie', 'Eerie', 'Unsettling, strange, mysterious.')}
                                    {renderOptionCard('atmosphericFilter', 'Nostalgic', 'Nostalgic', 'Warm, longing, soft edges.')}
                                </div>
                            </div>
                            <div>
                                <h3 className="text-xs font-bold uppercase tracking-widest text-stone-400 mb-4 border-b border-stone-800 pb-2">Sensory Density</h3>
                                <div className="grid grid-cols-1 gap-3">
                                    {renderOptionCard('sensoryDensity', 'Low', 'Low (Beige)', 'Functional description.')}
                                    {renderOptionCard('sensoryDensity', 'Medium', 'Medium', 'Balanced description.')}
                                    {renderOptionCard('sensoryDensity', 'High', 'High (Purple)', 'Rich, poetic, multi-sensory.')}
                                </div>
                            </div>
                        </div>

                         <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div>
                                <h3 className="text-xs font-bold uppercase tracking-widest text-stone-400 mb-4 border-b border-stone-800 pb-2">Worldbuilding</h3>
                                <div className="grid grid-cols-1 gap-3">
                                    {renderOptionCard('worldBuilding', 'Integrated', 'Integrated', 'Lore appears naturally in action.')}
                                    {renderOptionCard('worldBuilding', 'Expository', 'Expository', 'Detailed explanations permitted.')}
                                    {renderOptionCard('magicRules', 'Hard Rules', 'Hard Magic/Tech', 'Strict costs and limits.')}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* 5. Safety & Creativity */}
                {activeTab === 'safety' && (
                    <div className="space-y-8 animate-fade-in">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div>
                                <h3 className="text-xs font-bold uppercase tracking-widest text-stone-400 mb-4 border-b border-stone-800 pb-2">Creativity Level</h3>
                                <div className="grid grid-cols-1 gap-3">
                                    {renderOptionCard('creativity', 'Strict', 'Strict', 'No deviation from prompts.')}
                                    {renderOptionCard('creativity', 'Interpretive', 'Interpretive', 'Fills gaps creatively.')}
                                    {renderOptionCard('creativity', 'Wild', 'Wild', 'High entropy, unexpected twists.')}
                                </div>
                            </div>
                            <div>
                                <h3 className="text-xs font-bold uppercase tracking-widest text-stone-400 mb-4 border-b border-stone-800 pb-2">Content Rating</h3>
                                <div className="grid grid-cols-1 gap-3">
                                    {renderOptionCard('rating', 'G', 'G / All Ages', 'Safe for everyone.')}
                                    {renderOptionCard('rating', 'PG-13', 'PG-13', 'Standard fiction violence/themes.')}
                                    {renderOptionCard('rating', 'R', 'R / Mature', 'Adult themes allowed.')}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
      </div>
    </div>
  );
};
