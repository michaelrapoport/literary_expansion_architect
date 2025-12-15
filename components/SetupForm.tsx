import React, { useState, useEffect } from 'react';
import { NovelMetadata } from '../types';
import { Sparkles, PenTool } from 'lucide-react';

interface SetupFormProps {
  initialData?: Partial<NovelMetadata>;
  onSubmit: (data: NovelMetadata) => void;
}

export const SetupForm: React.FC<SetupFormProps> = ({ initialData, onSubmit }) => {
  const [formData, setFormData] = useState<NovelMetadata>({
    title: '',
    author: '',
    genre: '',
    synopsis: '',
    themes: '',
    characterArcs: '',
    styleGoals: '',
    comedy: '',
    minWordCount: 2500,
    maxWordCount: 4000
  });

  useEffect(() => {
    if (initialData) {
      setFormData(prev => ({ ...prev, ...initialData }));
    }
  }, [initialData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="w-full h-full overflow-y-auto bg-stone-950 flex justify-center p-6 md:p-12">
      <div className="max-w-4xl w-full bg-stone-900 shadow-2xl shadow-black/50 rounded-sm border border-stone-800 overflow-hidden">
        
        {/* Header */}
        <div className="px-10 py-12 border-b border-stone-800 bg-stone-900">
          <div className="flex items-center gap-3 mb-2 text-stone-500 uppercase tracking-widest text-xs font-bold">
            <PenTool className="w-4 h-4" />
            <span>Configuration Phase</span>
          </div>
          <h2 className="text-4xl font-display font-bold text-stone-100">The Blueprint</h2>
          <p className="text-stone-400 mt-2 font-body text-lg italic">Define the parameters of your literary expansion.</p>
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
                  <label className="block text-xs font-medium text-stone-500 uppercase tracking-wide mb-2">Stylistic Influences</label>
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