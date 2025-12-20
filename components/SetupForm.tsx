
import React, { useState, useEffect } from 'react';
import { NovelMetadata } from '../types';
import { Sparkles, PenTool, Bot, Loader2 } from 'lucide-react';
import { generateBlueprint } from '../services/geminiService';

interface SetupFormProps {
  initialData?: Partial<NovelMetadata>;
  onSubmit: (data: NovelMetadata) => void;
  fullText?: string;
}

export const SetupForm: React.FC<SetupFormProps> = ({ initialData, onSubmit, fullText }) => {
  const [isScanning, setIsScanning] = useState(false);
  
  // Lazy initialization to ensure data is present on first render if available
  const [formData, setFormData] = useState<NovelMetadata>(() => ({
    title: initialData?.title || '',
    author: initialData?.author || '',
    genre: initialData?.genre || '',
    synopsis: initialData?.synopsis || '',
    themes: initialData?.themes || '',
    characterArcs: initialData?.characterArcs || '',
    styleGoals: initialData?.styleGoals || '',
    comedy: initialData?.comedy || '',
    minWordCount: initialData?.minWordCount || 2500,
    maxWordCount: initialData?.maxWordCount || 4000,
    // Preserve structural and config data even if not displayed in this form
    beatSheet: initialData?.beatSheet || [],
    config: initialData?.config
  }));

  // Keep in sync if parent updates initialData later (though usually happens before mount)
  useEffect(() => {
    if (initialData && Object.keys(initialData).length > 0) {
      setFormData(prev => ({
        ...prev,
        title: initialData.title || prev.title,
        author: initialData.author || prev.author,
        genre: initialData.genre || prev.genre,
        synopsis: initialData.synopsis || prev.synopsis,
        themes: initialData.themes || prev.themes,
        characterArcs: initialData.characterArcs || prev.characterArcs,
        styleGoals: initialData.styleGoals || prev.styleGoals,
        comedy: initialData.comedy || prev.comedy,
        minWordCount: initialData.minWordCount || prev.minWordCount,
        maxWordCount: initialData.maxWordCount || prev.maxWordCount,
        beatSheet: initialData.beatSheet || prev.beatSheet,
        config: initialData.config || prev.config
      }));
    }
  }, [initialData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSmartScan = async () => {
    if (!fullText) return;
    setIsScanning(true);
    try {
      const blueprint = await generateBlueprint(fullText);
      setFormData(prev => ({
        ...prev,
        ...blueprint,
        // Ensure defaults if AI misses them
        minWordCount: blueprint.minWordCount || prev.minWordCount,
        maxWordCount: blueprint.maxWordCount || prev.maxWordCount,
        // Ensure complex objects are merged correctly
        beatSheet: blueprint.beatSheet || prev.beatSheet,
        config: blueprint.config || prev.config
      }));
    } catch (error) {
      console.error("Smart scan failed", error);
      alert("AI Scan failed to complete. Please try again.");
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <div className="w-full h-full overflow-y-auto bg-stone-950 flex justify-center p-6 md:p-12">
      <div className="max-w-4xl w-full h-fit bg-stone-900 shadow-2xl shadow-black/50 rounded-sm border border-stone-800 overflow-hidden mb-12 animate-fade-in">
        
        {/* Header */}
        <div className="px-10 py-12 border-b border-stone-800 bg-stone-900 relative">
          <div className="flex items-center gap-3 mb-2 text-stone-500 uppercase tracking-widest text-xs font-bold">
            <PenTool className="w-4 h-4" />
            <span>Configuration Phase</span>
          </div>
          <h2 className="text-4xl font-display font-bold text-stone-100">The Blueprint</h2>
          <p className="text-stone-400 mt-2 font-body text-lg italic">Define the parameters of your literary expansion.</p>
          
          {/* Smart Scan Button */}
          {fullText && (
             <div className="absolute top-12 right-10">
                <button 
                  onClick={handleSmartScan}
                  disabled={isScanning}
                  className="px-4 py-2 bg-stone-800 border border-stone-700 hover:border-[#d4af37] hover:text-[#d4af37] rounded-sm text-xs font-bold uppercase tracking-widest text-stone-400 transition-all flex items-center gap-2 shadow-lg"
                  title="Use Gemini Pro to analyze the full manuscript and populate this form."
                >
                    {isScanning ? (
                        <>
                           <Loader2 className="w-4 h-4 animate-spin" />
                           Scanning...
                        </>
                    ) : (
                        <>
                           <Bot className="w-4 h-4" />
                           Auto-Fill w/ Agent
                        </>
                    )}
                </button>
             </div>
          )}
        </div>

        <form onSubmit={(e) => { e.preventDefault(); onSubmit(formData); }} className="p-10 md:p-12 space-y-12">
          
          {/* Section 1: Core Identity */}
          <div className="space-y-8">
            <h3 className="text-sm font-bold uppercase tracking-widest text-stone-600 border-b border-stone-800 pb-2">Core Identity</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="group">
                <label className="block text-xs font-medium text-stone-500 uppercase tracking-wide mb-2">Project Title</label>
                <input required name="title" value={formData.title} onChange={handleChange} 
                  className="w-full bg-transparent border-b-2 border-stone-800 py-2 text-xl font-display font-bold text-stone-200 focus:border-stone-500 focus:outline-none transition-colors placeholder:text-stone-700" placeholder="Untitled Masterpiece" />
              </div>
              <div className="group">
                <label className="block text-xs font-medium text-stone-500 uppercase tracking-wide mb-2">Author Name</label>
                <input required name="author" value={formData.author} onChange={handleChange} 
                  className="w-full bg-transparent border-b-2 border-stone-800 py-2 text-xl font-display font-bold text-stone-200 focus:border-stone-500 focus:outline-none transition-colors placeholder:text-stone-700" placeholder="Your Name" />
              </div>
            </div>
            <div>
               <label className="block text-xs font-medium text-stone-500 uppercase tracking-wide mb-2">Genre Classification</label>
               <input required name="genre" value={formData.genre} onChange={handleChange} 
                  className="w-full bg-stone-950 border border-stone-800 rounded p-3 font-ui text-sm text-stone-300 focus:ring-1 focus:ring-stone-600 focus:border-stone-600 outline-none transition-all placeholder:text-stone-700" />
            </div>
          </div>

          {/* Section 2: Narrative Parameters */}
          <div className="space-y-8">
            <h3 className="text-sm font-bold uppercase tracking-widest text-stone-600 border-b border-stone-800 pb-2">Narrative Parameters</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
               <div>
                  <label className="block text-xs font-medium text-stone-500 uppercase tracking-wide mb-2">Core Synopsis</label>
                  <textarea required name="synopsis" rows={4} value={formData.synopsis} onChange={handleChange} 
                    className="w-full bg-stone-950 border border-stone-800 rounded p-4 font-body text-sm leading-relaxed text-stone-300 focus:ring-1 focus:ring-stone-600 focus:border-stone-600 outline-none resize-none transition-all placeholder:text-stone-700" />
               </div>
               <div className="space-y-6">
                 <div>
                    <label className="block text-xs font-medium text-stone-500 uppercase tracking-wide mb-2">Central Themes</label>
                    <textarea required name="themes" rows={2} value={formData.themes} onChange={handleChange} 
                      className="w-full bg-stone-950 border border-stone-800 rounded p-3 font-ui text-sm text-stone-300 focus:ring-1 focus:ring-stone-600 focus:border-stone-600 outline-none resize-none transition-all placeholder:text-stone-700" />
                 </div>
                 <div>
                    <label className="block text-xs font-medium text-stone-500 uppercase tracking-wide mb-2">Character Arcs</label>
                    <textarea required name="characterArcs" rows={2} value={formData.characterArcs} onChange={handleChange} 
                      className="w-full bg-stone-950 border border-stone-800 rounded p-3 font-ui text-sm text-stone-300 focus:ring-1 focus:ring-stone-600 focus:border-stone-600 outline-none resize-none transition-all placeholder:text-stone-700" />
                 </div>
               </div>
            </div>
          </div>

          {/* Section 3: Technical Constraints */}
          <div className="space-y-8">
            <h3 className="text-sm font-bold uppercase tracking-widest text-stone-600 border-b border-stone-800 pb-2">Technical Constraints</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
               <div className="col-span-1">
                 <label className="block text-xs font-medium text-stone-500 uppercase tracking-wide mb-2">Target Word Count Range</label>
                 <div className="flex items-center gap-2">
                    <input type="number" required name="minWordCount" value={formData.minWordCount} onChange={handleChange} className="w-full p-2 bg-stone-950 border border-stone-800 rounded font-mono text-sm text-center text-stone-300" />
                    <span className="text-stone-600">-</span>
                    <input type="number" required name="maxWordCount" value={formData.maxWordCount} onChange={handleChange} className="w-full p-2 bg-stone-950 border border-stone-800 rounded font-mono text-sm text-center text-stone-300" />
                 </div>
               </div>
               <div className="col-span-2">
                  <label className="block text-xs font-medium text-stone-500 uppercase tracking-wide mb-2">Stylistic Influences (Author's Voice)</label>
                  <input name="styleGoals" value={formData.styleGoals} onChange={handleChange} className="w-full p-2 bg-stone-950 border border-stone-800 rounded font-ui text-sm text-stone-300 placeholder:text-stone-700" placeholder="e.g. Hemingway's brevity, Tolkien's depth" />
               </div>
            </div>
            
             <div>
                <label className="block text-xs font-medium text-stone-500 uppercase tracking-wide mb-2">Comedy / Tone Adjustments (Optional)</label>
                <input name="comedy" value={formData.comedy} onChange={handleChange} className="w-full p-2 bg-stone-950 border border-stone-800 rounded font-ui text-sm text-stone-300 placeholder:text-stone-700" placeholder="e.g. Dry wit, situational irony" />
             </div>
          </div>

          <div className="pt-8">
            <button type="submit" className="w-full py-4 bg-stone-100 text-stone-950 font-display text-lg font-semibold tracking-wide rounded-sm hover:bg-white transition-all shadow-xl hover:shadow-2xl flex items-center justify-center gap-3">
              <Sparkles className="w-5 h-5" />
              Initialize Expansion Architecture
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
