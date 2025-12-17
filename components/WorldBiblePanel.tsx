
import React, { useState } from 'react';
import { Book, Users, BarChart2, Plus, Search, MapPin, Glasses, AlertTriangle, Play } from 'lucide-react';
import { LoreEntry, CharacterStatus, SessionAnalytics, CritiquePoint } from '../types';
import { PacingGraph } from './PacingGraph';
import { generateCritique } from '../services/geminiService';

interface WorldBiblePanelProps {
  lore: LoreEntry[];
  characters: CharacterStatus[];
  analytics: SessionAnalytics;
  chapters: any[]; // Passing chapters for pacing graph
  currentChapterText?: string;
  model: string;
}

export const WorldBiblePanel: React.FC<WorldBiblePanelProps> = ({ lore, characters, analytics, chapters, currentChapterText, model }) => {
  const [activeTab, setActiveTab] = useState<'lore' | 'chars' | 'stats' | 'beta'>('lore');
  const [filter, setFilter] = useState('');
  const [critique, setCritique] = useState<CritiquePoint[]>([]);
  const [isCritiquing, setIsCritiquing] = useState(false);

  const filteredLore = lore.filter(l => l.key.toLowerCase().includes(filter.toLowerCase()));
  const filteredChars = characters.filter(c => c.name.toLowerCase().includes(filter.toLowerCase()));

  const handleCritique = async () => {
      if (!currentChapterText) return;
      setIsCritiquing(true);
      try {
          const feedback = await generateCritique(currentChapterText, model);
          setCritique(feedback);
      } catch (e) {
          console.error(e);
      } finally {
          setIsCritiquing(false);
      }
  };

  return (
    <div className="flex flex-col h-full bg-stone-900 border-l border-stone-800 w-full md:w-[420px] flex-none z-20 text-stone-300">
      <div className="p-6 border-b border-stone-800 bg-stone-950/50 backdrop-blur-sm">
        <div className="flex items-center gap-3 mb-4">
           <Book className="w-5 h-5 text-[#d4af37]" />
           <h3 className="font-display font-bold text-xl text-stone-100 tracking-wide">World Bible</h3>
        </div>
        
        <div className="flex gap-2 bg-stone-950 p-1 rounded-sm">
            <button 
                onClick={() => setActiveTab('lore')} 
                className={`flex-1 py-1 text-[10px] font-bold uppercase tracking-wider rounded-sm ${activeTab === 'lore' ? 'bg-stone-800 text-[#d4af37]' : 'text-stone-500 hover:text-stone-300'}`}
            >
                Lore
            </button>
            <button 
                onClick={() => setActiveTab('chars')} 
                className={`flex-1 py-1 text-[10px] font-bold uppercase tracking-wider rounded-sm ${activeTab === 'chars' ? 'bg-stone-800 text-[#d4af37]' : 'text-stone-500 hover:text-stone-300'}`}
            >
                Chars
            </button>
            <button 
                onClick={() => setActiveTab('beta')} 
                className={`flex-1 py-1 text-[10px] font-bold uppercase tracking-wider rounded-sm ${activeTab === 'beta' ? 'bg-stone-800 text-[#d4af37]' : 'text-stone-500 hover:text-stone-300'}`}
            >
                Beta
            </button>
            <button 
                onClick={() => setActiveTab('stats')} 
                className={`flex-1 py-1 text-[10px] font-bold uppercase tracking-wider rounded-sm ${activeTab === 'stats' ? 'bg-stone-800 text-[#d4af37]' : 'text-stone-500 hover:text-stone-300'}`}
            >
                Stats
            </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        
        {(activeTab === 'lore' || activeTab === 'chars') && (
            <div className="mb-4 relative">
                <Search className="w-4 h-4 absolute left-3 top-3 text-stone-600" />
                <input 
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                    placeholder="Search database..."
                    className="w-full bg-stone-950 border border-stone-800 rounded-sm py-2 pl-9 pr-4 text-xs text-stone-300 outline-none focus:border-[#d4af37]"
                />
            </div>
        )}

        {activeTab === 'lore' && (
            <div className="space-y-4">
                {filteredLore.length === 0 && <p className="text-center text-xs text-stone-600 italic mt-10">No lore entries found.</p>}
                {filteredLore.map(entry => (
                    <div key={entry.id} className="bg-stone-800/50 p-4 rounded-sm border border-stone-800">
                        <div className="flex justify-between items-start mb-2">
                            <span className="font-bold text-[#d4af37] text-sm">{entry.key}</span>
                            <span className="text-[9px] uppercase tracking-widest bg-stone-900 px-2 py-1 rounded text-stone-500">{entry.category}</span>
                        </div>
                        <p className="text-xs text-stone-400 leading-relaxed">{entry.description}</p>
                    </div>
                ))}
            </div>
        )}

        {activeTab === 'chars' && (
            <div className="space-y-4">
                {filteredChars.length === 0 && <p className="text-center text-xs text-stone-600 italic mt-10">No characters found.</p>}
                {filteredChars.map(char => (
                    <div key={char.id} className="bg-stone-800/50 p-4 rounded-sm border border-stone-800 relative overflow-hidden group">
                        <div className="flex gap-4">
                            <div className="w-12 h-12 bg-stone-900 rounded-full flex-none flex items-center justify-center text-stone-600 font-bold text-lg border border-stone-700">
                                {char.name.charAt(0)}
                            </div>
                            <div className="flex-1">
                                <h4 className="font-bold text-stone-200">{char.name}</h4>
                                <div className="flex items-center gap-2 mt-1 mb-2">
                                    <span className={`w-2 h-2 rounded-full ${char.status === 'Alive' ? 'bg-green-500' : 'bg-red-500'}`}></span>
                                    <span className="text-[10px] uppercase text-stone-500">{char.status}</span>
                                </div>
                                <div className="text-xs text-stone-400 flex items-center gap-1 mb-1">
                                    <MapPin className="w-3 h-3" />
                                    {char.location}
                                </div>
                                <p className="text-xs text-stone-500 italic">Goal: {char.goal}</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        )}

        {activeTab === 'beta' && (
            <div className="space-y-6">
                <div className="bg-stone-800/50 p-4 rounded-sm border border-stone-800 text-center">
                    <p className="text-xs text-stone-500 mb-4">Analyze the current active chapter for prose weaknesses.</p>
                    <button 
                        onClick={handleCritique}
                        disabled={isCritiquing}
                        className="w-full py-2 bg-[#d4af37]/10 text-[#d4af37] border border-[#d4af37]/30 hover:bg-[#d4af37]/20 rounded-sm font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2"
                    >
                        {isCritiquing ? 'Analyzing...' : 'Run Beta Reader'}
                        {!isCritiquing && <Glasses className="w-4 h-4" />}
                    </button>
                </div>

                <div className="space-y-4">
                    {critique.map((point, idx) => (
                        <div key={idx} className="bg-stone-800 p-4 rounded-sm border border-stone-700">
                             <div className="flex items-center gap-2 mb-2">
                                <AlertTriangle className="w-3 h-3 text-yellow-500" />
                                <span className="text-[10px] font-bold uppercase text-stone-400">{point.type}</span>
                             </div>
                             <div className="pl-3 border-l-2 border-stone-600 mb-2">
                                 <p className="text-xs text-stone-300 italic">"{point.quote}"</p>
                             </div>
                             <p className="text-xs text-stone-400">{point.comment}</p>
                        </div>
                    ))}
                    {critique.length === 0 && !isCritiquing && (
                        <p className="text-center text-xs text-stone-600 mt-10 italic">No critique generated yet.</p>
                    )}
                </div>
            </div>
        )}

        {activeTab === 'stats' && (
            <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-stone-800 p-4 rounded-sm border border-stone-700 text-center">
                        <div className="text-2xl font-bold text-[#d4af37] font-display">{analytics.wordsGenerated}</div>
                        <div className="text-[10px] uppercase tracking-widest text-stone-500">Words Generated</div>
                    </div>
                     <div className="bg-stone-800 p-4 rounded-sm border border-stone-700 text-center">
                        <div className="text-2xl font-bold text-stone-300 font-display">{Math.floor(analytics.editingTimeSeconds / 60)}m</div>
                        <div className="text-[10px] uppercase tracking-widest text-stone-500">Session Time</div>
                    </div>
                </div>
                
                 {/* Pacing Graph */}
                 <div className="bg-stone-800/30 p-6 rounded-sm border border-stone-800">
                     <PacingGraph chapters={chapters} />
                 </div>

                 <div className="bg-stone-800/30 p-6 rounded-sm border border-stone-800">
                    <h4 className="text-xs font-bold uppercase tracking-widest text-stone-400 mb-4 flex items-center gap-2">
                        <BarChart2 className="w-4 h-4" />
                        Session Milestones
                    </h4>
                    <div className="space-y-4">
                        <div className="flex justify-between text-xs">
                            <span className="text-stone-500">Chapters Drafted</span>
                            <span className="text-stone-300 font-mono">{(analytics.wordsGenerated / 2000).toFixed(1)}</span>
                        </div>
                        <div className="flex justify-between text-xs">
                            <span className="text-stone-500">Efficiency</span>
                            <span className="text-stone-300 font-mono">{(analytics.wordsGenerated / (analytics.editingTimeSeconds / 60 || 1)).toFixed(0)} wpm</span>
                        </div>
                    </div>
                 </div>
            </div>
        )}

      </div>
    </div>
  );
};
