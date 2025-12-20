
import React, { useState, useEffect, useRef } from 'react';
import { Layout } from './components/Layout';
import { FileUploader } from './components/FileUploader';
import { SetupForm } from './components/SetupForm';
import { ConfigurationPanel } from './components/ConfigurationPanel';
import { DecisionPanel } from './components/DecisionPanel';
import { BeatSheetEditor } from './components/BeatSheetEditor';
import { RefinementPanel } from './components/RefinementPanel';
import { SettingsModal } from './components/SettingsModal';
import { WorldBiblePanel } from './components/WorldBiblePanel';
import { ChapterEditor } from './components/ChapterEditor';
import { QuickChat } from './components/QuickChat';
import { ExportPreviewModal } from './components/ExportPreviewModal';
import { AppState, Chapter, Choice, NovelMetadata, Beat, GenerationConfig, ModelConfiguration, LoreEntry, CharacterStatus, SessionAnalytics } from './types';
import { splitIntoSourceChunks } from './services/fileService';
import { generateSetup, generateNextChapter, analyzeStyle, extractMetadata, generateBeatSheet, refineChapter, generateChapterFromBeat, generateChaosTwist, generateCritique, extractLoreUpdates, checkBeatConsistency } from './services/geminiService';
import { saveProject, loadProject, exportProjectToJson, exportProjectToDocxHtml } from './services/persistenceService';
import { retrieveContext } from './services/knowledgeService';
import { Loader2, ScanSearch, Wand2, FileSearch, BookOpen, AlignLeft, Bot, Search, ArrowUp, ArrowDown, MoreHorizontal, RefreshCw, Layers } from 'lucide-react';
import { GenerateContentResponse } from '@google/genai';
import { REFINEMENT_OPTIONS, DEFAULT_MODEL_CONFIG } from './constants';

const countWords = (text: string): number => {
  return text.trim().split(/\s+/).filter(w => w.length > 0).length;
};

const stripHtml = (html: string) => {
   return html.replace(/<[^>]*>?/gm, '');
};

const App: React.FC = () => {
  // --- STATE ---
  const [appState, setAppState] = useState<AppState>(AppState.UPLOAD);
  const [sourceChunks, setSourceChunks] = useState<string[]>([]);
  const [currentChunkIndex, setCurrentChunkIndex] = useState(0);
  const [metadata, setMetadata] = useState<NovelMetadata | null>(null);
  
  const [modelConfig, setModelConfig] = useState<ModelConfiguration>(DEFAULT_MODEL_CONFIG);
  const [showSettings, setShowSettings] = useState(false);
  const [showBible, setShowBible] = useState(false);
  const [showFindReplace, setShowFindReplace] = useState(false);
  const [showExportPreview, setShowExportPreview] = useState(false);
  
  const [autoFilledMetadata, setAutoFilledMetadata] = useState<Partial<NovelMetadata>>({});
  const [beatSheet, setBeatSheet] = useState<Beat[]>([]);
  
  // Novel Data
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [lore, setLore] = useState<LoreEntry[]>([]);
  const [characters, setCharacters] = useState<CharacterStatus[]>([]);
  const [analytics, setAnalytics] = useState<SessionAnalytics>({ startTime: Date.now(), wordsGenerated: 0, editingTimeSeconds: 0, sessionsCount: 1 });

  // Stream & UI
  const [currentStreamingContent, setCurrentStreamingContent] = useState('');
  const [generationStatus, setGenerationStatus] = useState<string>(''); // NEW: For "Critiquing...", "Lore Update..." status
  const [currentChoices, setCurrentChoices] = useState<Choice[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  
  // Batch & AutoPilot State
  const autoPilotRef = useRef(0);
  const [autoPilotRemaining, setAutoPilotRemaining] = useState(0); 
  const [consecutiveHighEnergy, setConsecutiveHighEnergy] = useState(0); 

  // Batch Processing State (NEW)
  const [isBatchProcessing, setIsBatchProcessing] = useState(false);
  const [batchQueue, setBatchQueue] = useState<Beat[]>([]);
  const [batchProgress, setBatchProgress] = useState(0);

  const novelEndRef = useRef<HTMLDivElement>(null);
  const analyticsInterval = useRef<any>(null);

  // --- PERSISTENCE & INIT ---
  useEffect(() => {
      loadProject().then(saved => {
          if (saved) {
             // Logic to resume could go here
          }
      });

      analyticsInterval.current = setInterval(() => {
          setAnalytics(prev => ({ ...prev, editingTimeSeconds: prev.editingTimeSeconds + 1 }));
      }, 1000);

      return () => clearInterval(analyticsInterval.current);
  }, []);

  // Auto-Save Background
  useEffect(() => {
      if (metadata && chapters.length > 0) {
          const timeout = setTimeout(() => {
              saveProject({
                  metadata,
                  chapters,
                  lore,
                  characters,
                  analytics,
                  lastSaved: Date.now()
              });
          }, 5000); 
          return () => clearTimeout(timeout);
      }
  }, [metadata, chapters, lore, characters, analytics]);

  // --- ACTIONS ---

  const handleDownloadJson = () => {
     if (metadata) exportProjectToJson({ metadata, chapters, lore, characters, analytics, lastSaved: Date.now() });
  };

  const handleDownloadDocx = () => {
      setShowExportPreview(true);
  };

  const handleSaveButton = () => {
      // Explicitly open the Export Preview modal
      if (chapters.length > 0 && metadata) {
        setShowExportPreview(true);
      }
  };

  const moveChapter = (index: number, direction: 'up' | 'down') => {
      if (direction === 'up' && index === 0) return;
      if (direction === 'down' && index === chapters.length - 1) return;
      
      const newChapters = [...chapters];
      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      [newChapters[index], newChapters[targetIndex]] = [newChapters[targetIndex], newChapters[index]];
      setChapters(newChapters);
  };

  const handleFindReplace = (findText: string, replaceText: string) => {
      const newChapters = chapters.map(c => ({
          ...c,
          content: c.content.split(findText).join(replaceText)
      }));
      setChapters(newChapters);
      alert(`Replaced instances of "${findText}" with "${replaceText}".`);
      setShowFindReplace(false);
  };

  const handleChaosMode = async () => {
      if (!metadata) return;
      const context = chapters.slice(-3).map(c => c.content).join('\n').slice(-5000);
      setIsGenerating(true);
      try {
        const chaosChoice = await generateChaosTwist(context, metadata, modelConfig.analysisModel);
        setCurrentChoices(prev => [chaosChoice, ...prev]);
      } finally {
        setIsGenerating(false);
      }
  };

  const handleUndo = () => {
    if (chapters.length === 0) return;
    if (window.confirm("Undo the last chapter generation? This cannot be reversed.")) {
        setChapters(prev => prev.slice(0, -1));
        setCurrentChunkIndex(prev => Math.max(0, prev - 1));
        // Reset AutoPilot if active
        autoPilotRef.current = 0;
        setAutoPilotRemaining(0);
        // Reset to Decision state if we have chapters, else Setup
        setAppState(chapters.length > 1 ? AppState.DECISION : AppState.SETUP);
    }
  };

  const handleAutoPilot = (count: number) => {
      // Set Ref for logic
      autoPilotRef.current = count;
      // Set State for UI
      setAutoPilotRemaining(count);
      
      // Trigger the first step immediately
      const defaultChoice = currentChoices.find(c => c.text.includes("Continue")) || currentChoices[0] || { id: 'Auto', text: "Continue story naturally.", rationale: 'Auto-Pilot', type: 'Other' };
      handleDecision(defaultChoice.text, "", "new");
  };

  const handleRefinement = async (selectedOptionIds: string[]) => {
      if (chapters.length === 0 || !metadata) return;
      
      const lastChapter = chapters[chapters.length - 1];
      const styleDNA = metadata.styleAnalysis || "";
      const storyHistory = chapters.slice(0, -1).map(c => c.content).join('\n'); 
      
      const options = REFINEMENT_OPTIONS.filter(opt => selectedOptionIds.includes(opt.id));
      const instructions = options.map(o => o.description).join(" ");
      
      setAppState(AppState.REFINING);
      setIsGenerating(true);
      setCurrentStreamingContent('');

      try {
          const streamResult = await refineChapter(lastChapter.content, instructions, styleDNA, storyHistory, modelConfig.draftingModel);
          
          let fullRefinedText = "";
          for await (const chunk of streamResult) {
              if (chunk.text) {
                  const clean = stripHtml(chunk.text);
                  fullRefinedText += clean;
                  setCurrentStreamingContent(clean); 
                  
                  // Live update for feedback
                  setChapters(prev => {
                      const copy = [...prev];
                      copy[copy.length - 1].content = fullRefinedText;
                      return copy;
                  });
              }
          }
          
          // Finalize with version history
           setChapters(prev => {
                const copy = [...prev];
                const final = copy[copy.length - 1];
                final.content = fullRefinedText;
                final.history = [...(final.history || []), fullRefinedText];
                final.currentVersionIndex = (final.history.length || 1) - 1;
                return copy;
           });

      } catch (e) {
          console.error("Refinement failed", e);
          alert("Refinement process encountered an error.");
      } finally {
          setIsGenerating(false);
          setCurrentStreamingContent('');
          setAppState(AppState.DECISION);
      }
  };

  // --- BATCH GENERATION LOGIC ---
  const handleBatchGenerate = async (selectedBeats: Beat[]) => {
      if (selectedBeats.length === 0 || !metadata) return;
      
      setIsBatchProcessing(true);
      setBatchQueue(selectedBeats);
      setBatchProgress(0);
      setAppState(AppState.PROCESSING); // Move to main view
      
      for (let i = 0; i < selectedBeats.length; i++) {
          const beat = selectedBeats[i];
          setGenerationStatus(`Batching: Beat ${i + 1}/${selectedBeats.length}`);
          
          // 1. Narrative Unit Test (Consistency Guard)
          try {
              const consistency = await checkBeatConsistency(beat, lore, characters, modelConfig.analysisModel);
              if (!consistency.safe) {
                   const proceed = window.confirm(`Consistency Warning for Beat "${beat.description}":\n${consistency.issues.join('\n')}\n\nProceed anyway?`);
                   if (!proceed) {
                       setIsBatchProcessing(false);
                       alert("Batch generation paused by user.");
                       return;
                   }
              }
          } catch(e) { console.warn("Consistency check skipped due to error"); }

          // 2. Generate Chapter
          setIsGenerating(true);
          setCurrentStreamingContent('');
          const storyHistory = chapters.map(c => c.content).join('\n\n');
          
          // For Batch, we use 'generateChapterFromBeat' but we need to pass previous beats if available
          const beatIndex = beatSheet.findIndex(b => b.id === beat.id);
          const prevBeats = beatIndex > 0 ? beatSheet.slice(0, beatIndex) : [];
          
          try {
              const streamResult = await generateChapterFromBeat(metadata, beat, prevBeats, storyHistory, modelConfig.draftingModel);
              
              let fullText = "";
              for await (const chunk of streamResult) {
                  if (chunk.text) {
                      const clean = stripHtml(chunk.text);
                      fullText += clean;
                      setCurrentStreamingContent(fullText);
                  }
              }
              
              // 3. Commit Chapter
              const newChapter: Chapter = {
                  id: chapters.length + 1 + i, // Rough ID
                  title: `Chapter ${chapters.length + 1} (Beat ${beat.id})`,
                  content: fullText,
                  status: 'completed',
                  lastModified: Date.now(),
                  history: [fullText],
                  pacingScore: 5 // Default for batch
              };
              
              setChapters(prev => [...prev, newChapter]);
              setBatchProgress(i + 1);
              
              // 4. Update Lore (Auto-Lore runs in background per chapter)
               if (metadata.config?.autoLore) {
                   extractLoreUpdates(fullText, modelConfig.analysisModel).then(updates => {
                       // Lore updates in background
                   });
               }

          } catch (e) {
              console.error("Batch Error", e);
              setIsBatchProcessing(false);
              break;
          }
          
          setIsGenerating(false);
      }
      
      setIsBatchProcessing(false);
      setGenerationStatus('');
      setAppState(AppState.DECISION); // Finished
  };

  // --- GENERATION LOGIC ---

  const processGeminiLoop = async (
    meta: NovelMetadata,
    chunkText: string,
    isFirst: boolean,
    placement: 'new' | 'append',
    userChoice: string = '',
    customInstr: string = ''
  ) => {
    setIsGenerating(true);
    setGenerationStatus('Generating Draft...');
    setCurrentStreamingContent('');
    
    const fullStoryHistory = chapters.map(c => c.content).join('\n\n');
    const dynamicContext = retrieveContext(chunkText + userChoice, lore, characters);
    const enrichedHistory = fullStoryHistory + dynamicContext; 

    // Pacing Logic
    const currentPacing = meta.config?.pacingSpeed;
    if (currentPacing === 'Fast' || currentPacing === 'Balanced') {
        setConsecutiveHighEnergy(prev => prev + 1);
    } else {
        setConsecutiveHighEnergy(0);
    }

    try {
      // 1. DRAFTING PHASE
      let streamResult: AsyncIterable<GenerateContentResponse>;
      
      if (isFirst) {
        streamResult = await generateSetup(meta, chunkText, modelConfig.draftingModel);
      } else {
        streamResult = await generateNextChapter(
            meta, enrichedHistory, userChoice, customInstr, chunkText, placement === 'new', modelConfig.draftingModel
        );
      }

      let fullResponseText = '';
      const splitMarker = '|||STRATEGIC_SPLIT|||';
      
      for await (const chunk of streamResult) {
         if (chunk.text) {
             fullResponseText += stripHtml(chunk.text);
             const displayLimit = fullResponseText.indexOf(splitMarker);
             setCurrentStreamingContent(displayLimit !== -1 ? fullResponseText.substring(0, displayLimit) : fullResponseText);
         }
      }

      // 2. PARSE OUTPUT
      let storyPart = fullResponseText;
      let jsonPart = '';
      const splitIndex = fullResponseText.indexOf(splitMarker);
      if (splitIndex !== -1) {
          storyPart = fullResponseText.substring(0, splitIndex);
          jsonPart = fullResponseText.substring(splitIndex + splitMarker.length);
      } else {
           // Fallback regex attempt if separator missing (legacy fallback)
           const jsonMatch = fullResponseText.match(/\[\s*\{\s*"id"\s*:/); // Array check
           if (!jsonMatch) {
                const objectMatch = fullResponseText.match(/\{\s*"pacingScore"/); // Object check
                if (objectMatch && objectMatch.index !== undefined) {
                    storyPart = fullResponseText.substring(0, objectMatch.index);
                    jsonPart = fullResponseText.substring(objectMatch.index);
                }
           } else if (jsonMatch.index !== undefined) {
               storyPart = fullResponseText.substring(0, jsonMatch.index);
               jsonPart = fullResponseText.substring(jsonMatch.index);
           }
      }
      
      let finalStoryContent = storyPart.trim();
      let historyVersion = [finalStoryContent];

      // 3. RECURSIVE POLISH PROTOCOL (Auto-Critique)
      if (meta.config?.autoCritique && !isFirst) {
          setGenerationStatus('Running Editorial Critique...');
          try {
              const critiquePoints = await generateCritique(finalStoryContent, modelConfig.analysisModel);
              if (critiquePoints.length > 0) {
                  setGenerationStatus('Applying Automated Polish...');
                  
                  const instructions = "Fix these specific issues: " + critiquePoints.map(c => c.comment).join(' ');
                  const styleDNA = meta.styleAnalysis || "";
                  
                  // Run refinement
                  const refinedStream = await refineChapter(finalStoryContent, instructions, styleDNA, enrichedHistory, modelConfig.draftingModel);
                  let refinedText = "";
                  for await (const chunk of refinedStream) {
                      if (chunk.text) {
                          refinedText += stripHtml(chunk.text);
                          setCurrentStreamingContent(refinedText); // Update UI to show polish happening
                      }
                  }
                  
                  if (refinedText.length > 100) { // Safety check
                      finalStoryContent = refinedText.trim();
                      historyVersion.push(finalStoryContent);
                  }
              }
          } catch (e) {
              console.warn("Auto-critique failed, using draft.");
          }
      }

      // 4. PARSE JSON & COMMIT CHAPTER
      let nextChoices: Choice[] = [];
      let parsedPacing = 5;

      if (jsonPart) {
          try {
              const cleanJson = jsonPart.replace(/```json/g, '').replace(/```/g, '').trim();
              const parsed = JSON.parse(cleanJson);
              
              if (Array.isArray(parsed)) {
                  // Legacy/Fallback format (just choices array)
                  nextChoices = parsed;
              } else if (parsed && typeof parsed === 'object') {
                  // New format { pacingScore, choices }
                  nextChoices = parsed.choices || [];
                  if (parsed.pacingScore) parsedPacing = parsed.pacingScore;
              }
          } catch (e) { 
              console.error("JSON Parsing Error", e);
              nextChoices = [{ id: 'A', text: 'Continue', rationale: 'Parse Error', type: 'Other' }]; 
          }
      } else { 
          nextChoices = [{ id: 'A', text: 'Continue', rationale: 'Auto', type: 'Other' }]; 
      }

      const newWords = countWords(finalStoryContent);
      setAnalytics(prev => ({ ...prev, wordsGenerated: prev.wordsGenerated + newWords }));

      const newChapter: Chapter = {
          id: chapters.length + 1,
          title: `Chapter ${chapters.length + 1}`,
          content: finalStoryContent,
          status: 'completed',
          lastModified: Date.now(),
          history: historyVersion,
          currentVersionIndex: historyVersion.length - 1,
          pacingScore: parsedPacing
      };
      setChapters(prev => [...prev, newChapter]);

      setCurrentStreamingContent('');
      setGenerationStatus('');

      // 5. DYNAMIC LORE SYPHON (Auto-Lore)
      if (meta.config?.autoLore) {
          // Fire and forget - don't await this blocking the UI
          extractLoreUpdates(finalStoryContent, modelConfig.analysisModel).then((updates) => {
             if (updates) {
                 if (updates.lore && updates.lore.length > 0) {
                     setLore(prev => {
                         const existingKeys = new Set(prev.map(l => l.key.toLowerCase()));
                         const newEntries = updates.lore.filter((l: any) => !existingKeys.has(l.key.toLowerCase())).map((l: any, idx: number) => ({
                             id: `auto-${Date.now()}-${idx}`,
                             key: l.key,
                             category: l.category || 'General',
                             description: l.description,
                             tags: []
                         }));
                         return [...prev, ...newEntries];
                     });
                 }
                 if (updates.characters && updates.characters.length > 0) {
                     setCharacters(prev => {
                         const copy = [...prev];
                         updates.characters.forEach((u: any) => {
                             const idx = copy.findIndex(c => c.name.toLowerCase() === u.name.toLowerCase());
                             if (idx >= 0) {
                                 copy[idx] = { ...copy[idx], location: u.location || copy[idx].location, goal: u.goal || copy[idx].goal, status: u.status || copy[idx].status };
                                 if (u.inventory) copy[idx].inventory = [...new Set([...copy[idx].inventory, ...u.inventory])];
                             } else {
                                 copy.push({
                                     id: `auto-char-${Date.now()}`,
                                     name: u.name,
                                     status: u.status || 'Alive',
                                     location: u.location || 'Unknown',
                                     goal: u.goal || 'Unknown',
                                     inventory: u.inventory || []
                                 });
                             }
                         });
                         return copy;
                     });
                 }
             }
          });
      }
      
      // 6. Pacing Injection Logic
      let pacingCount = consecutiveHighEnergy;
      if (currentPacing === 'Fast' || currentPacing === 'Balanced') pacingCount++;
      else pacingCount = 0;

      if (pacingCount >= 3) {
          nextChoices.unshift({
            id: 'BREATHING_ROOM',
            text: 'Insert a "Breathing Room" Chapter',
            rationale: 'System detects high narrative intensity. Slow down to process character emotions.',
            type: 'Pacing'
          });
      }

      setCurrentChoices(nextChoices);

      // --- AUTOPILOT LOGIC CHECK ---
      if (autoPilotRef.current > 0) {
          // Decrement
          autoPilotRef.current -= 1;
          setAutoPilotRemaining(autoPilotRef.current);

          const nextChoice = nextChoices.find(c => c.type !== 'Pacing') || nextChoices[0];
          
          // Small delay for UI update before next recursion
          setTimeout(() => {
              handleDecision(nextChoice.text, "Auto-pilot continuation", "new");
          }, 2000);
      } else {
          setAppState(AppState.REFINEMENT_SELECTION);
      }

    } catch (error) {
        console.error("Gemini Error:", error);
        alert("Generation interrupted.");
        setAppState(AppState.DECISION); 
    } finally {
        setIsGenerating(false);
        setGenerationStatus('');
    }
  };

  // --- EVENT HANDLERS ---
  const handleFileLoaded = async (content: string) => {
    const chunks = splitIntoSourceChunks(content);
    setSourceChunks(chunks);
    setAppState(AppState.DETECTING_METADATA);
    try {
      const extractedData = await extractMetadata(content, modelConfig.analysisModel);
      setAutoFilledMetadata(extractedData);
      setAppState(AppState.SETUP);
    } catch (e) { setAppState(AppState.SETUP); }
  };
  const handleMetadataSubmit = (data: NovelMetadata) => { setMetadata(data); setAppState(AppState.CONFIGURATION); };
  const handleConfigurationSubmit = (config: GenerationConfig) => {
      if (metadata) { setMetadata({ ...metadata, config }); setAppState(AppState.GENERATING_BEATS); handleBeatGen(); }
  };
  const handleBeatGen = async () => {
       if(!metadata) return;
       
       // Optimization: If beats were already detected by the Smart Scan in the Setup Phase, use them.
       if (metadata.beatSheet && metadata.beatSheet.length > 0) {
           setBeatSheet(metadata.beatSheet);
           setAppState(AppState.BEAT_SHEET);
           return;
       }

       try {
        const fullText = sourceChunks.join('\n\n');
        const beats = await generateBeatSheet(fullText, metadata, modelConfig.analysisModel);
        setBeatSheet(beats);
        setAppState(AppState.BEAT_SHEET);
      } catch(e) { setBeatSheet([{ id: '1', description: 'Start' }]); setAppState(AppState.BEAT_SHEET); }
  };
  const handleBeatSheetConfirm = async (beats: Beat[]) => {
      if(!metadata) return;
      const finalMeta = { ...metadata, beatSheet: beats };
      setMetadata(finalMeta);
      setAppState(AppState.ANALYZING);
      const styleDNA = await analyzeStyle(sourceChunks[0] || "", modelConfig.analysisModel);
      setMetadata({ ...finalMeta, styleAnalysis: styleDNA });
      setAppState(AppState.PROCESSING);
      await processGeminiLoop({ ...finalMeta, styleAnalysis: styleDNA }, sourceChunks[0], true, 'new');
  };
  
  const handleDecision = (text: string, instr: string, place: 'new' | 'append') => {
      const nextIdx = currentChunkIndex + 1;
      
      if (text === 'Insert a "Breathing Room" Chapter' || text.includes('Breathing Room')) {
          if (metadata) {
              const slowConfig: GenerationConfig = { 
                  ...metadata.config!, 
                  pacingSpeed: 'Slow Burn', 
                  expansionDepth: 'Scene',
                  dialogueRatio: 'Internal Monologue',
                  sensoryDensity: 'High'
              };
              setAppState(AppState.PROCESSING);
              const interludeMeta = { ...metadata, config: slowConfig };
              const interludeInstr = `Write a slow-paced, atmospheric interlude. ${instr}`;
              processGeminiLoop(interludeMeta, sourceChunks[currentChunkIndex] || "", false, place, "Interlude", interludeInstr);
              setConsecutiveHighEnergy(0);
              return;
          }
      }

      if (nextIdx >= sourceChunks.length) { setAppState(AppState.FINISHED); return; }
      setCurrentChunkIndex(nextIdx);
      setAppState(AppState.PROCESSING);
      if(metadata) processGeminiLoop(metadata, sourceChunks[nextIdx], false, place, text, instr);
  };

  // --- RENDER ---
  return (
    <Layout 
        onExport={handleDownloadJson} 
        onExportDocx={handleDownloadDocx}
        canExport={chapters.length > 0}
        onSave={handleSaveButton} 
        onUndo={chapters.length > 0 ? handleUndo : undefined}
        onOpenSettings={() => setShowSettings(true)}
        onOpenBible={() => setShowBible(!showBible)}
    >
      {showSettings && <SettingsModal config={modelConfig} onUpdate={setModelConfig} onClose={() => setShowSettings(false)} />}
      
      {showExportPreview && metadata && (
          <ExportPreviewModal 
            projectState={{ metadata, chapters, lore, characters, analytics, lastSaved: Date.now() }}
            onClose={() => setShowExportPreview(false)}
            onConfirm={() => {
                exportProjectToDocxHtml({ metadata, chapters, lore, characters, analytics, lastSaved: Date.now() });
                setShowExportPreview(false);
            }}
          />
      )}

      {showFindReplace && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50">
              <div className="bg-stone-900 p-6 border border-stone-700 rounded-sm w-96">
                  <h3 className="text-stone-100 font-bold mb-4">Global Find & Replace</h3>
                  <form onSubmit={(e) => {
                      e.preventDefault();
                      const fd = new FormData(e.currentTarget);
                      handleFindReplace(fd.get('find') as string, fd.get('replace') as string);
                  }}>
                      <input name="find" placeholder="Find..." className="w-full mb-3 p-2 bg-stone-950 border border-stone-800 text-stone-300" />
                      <input name="replace" placeholder="Replace with..." className="w-full mb-4 p-2 bg-stone-950 border border-stone-800 text-stone-300" />
                      <div className="flex justify-end gap-2">
                          <button type="button" onClick={() => setShowFindReplace(false)} className="text-stone-500 text-xs">Cancel</button>
                          <button type="submit" className="bg-[#d4af37] text-stone-900 px-4 py-1 text-xs font-bold rounded-sm">Execute</button>
                      </div>
                  </form>
              </div>
          </div>
      )}

      <QuickChat 
        context={chapters.slice(-3).map(c => c.content).join('\n')}
        loreContext={JSON.stringify(lore)}
        model={modelConfig.draftingModel}
      />

      {(appState === AppState.UPLOAD || appState === AppState.DETECTING_METADATA || appState === AppState.SETUP || appState === AppState.CONFIGURATION || appState === AppState.GENERATING_BEATS || appState === AppState.BEAT_SHEET || appState === AppState.ANALYZING) ? (
          <div className="w-full h-full flex flex-col flex-1 min-h-0 overflow-hidden">
             {appState === AppState.UPLOAD && <FileUploader onFileLoaded={handleFileLoaded} />}
             {appState === AppState.SETUP && <SetupForm initialData={autoFilledMetadata} onSubmit={handleMetadataSubmit} fullText={sourceChunks.join('\n\n')} />}
             {appState === AppState.CONFIGURATION && <ConfigurationPanel onConfirm={handleConfigurationSubmit} initialConfig={autoFilledMetadata.config} />}
             {appState === AppState.BEAT_SHEET && 
                <BeatSheetEditor 
                    initialBeats={beatSheet} 
                    onConfirm={handleBeatSheetConfirm} 
                    onBatchGenerate={handleBatchGenerate}
                />
             }
             {(appState === AppState.DETECTING_METADATA || appState === AppState.GENERATING_BEATS || appState === AppState.ANALYZING) && (
                 <div className="flex flex-col items-center justify-center h-full text-stone-400">
                     <Loader2 className="w-10 h-10 animate-spin mb-4" />
                     <p className="uppercase tracking-widest font-bold">Processing Neural Tasks...</p>
                 </div>
             )}
          </div>
      ) : (
        <div className="w-full flex h-full bg-stone-950 overflow-hidden relative">
          
          <div className="flex-1 flex items-center justify-center p-4 md:p-8 h-full">
            <div className="w-full max-w-[900px] h-full bg-stone-900 shadow-2xl border border-stone-800 flex flex-col relative rounded-sm">
                
                <div className="flex-none h-16 border-b border-stone-800 flex items-center justify-between px-8 bg-stone-900/95 backdrop-blur z-10">
                    <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-stone-500">{metadata?.title}</span>
                    <button onClick={() => setShowFindReplace(true)} className="p-2 text-stone-500 hover:text-stone-300"><Search className="w-4 h-4" /></button>
                </div>

                <div className="flex-1 overflow-y-auto novel-scroll p-12 scroll-smooth relative">
                    {chapters.map((chapter, idx) => (
                        <div key={chapter.id} className="animate-fade-in relative group">
                            
                            {/* Chapter Divider Logic */}
                            {idx > 0 && (
                                <div className="flex items-center justify-center py-16 opacity-30 select-none">
                                    <div className="h-px bg-gradient-to-r from-transparent via-stone-500 to-transparent w-32"></div>
                                    <div className="mx-4 text-stone-500">
                                         <MoreHorizontal className="w-5 h-5" />
                                    </div>
                                    <div className="h-px bg-gradient-to-r from-transparent via-stone-500 to-transparent w-32"></div>
                                </div>
                            )}

                            <div className="flex justify-between items-end mb-6 border-b border-stone-800 pb-2">
                                <span className="text-xs font-bold tracking-widest uppercase text-stone-500">{chapter.title}</span>
                                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => moveChapter(idx, 'up')} className="p-1 hover:text-[#d4af37]"><ArrowUp className="w-3 h-3" /></button>
                                    <button onClick={() => moveChapter(idx, 'down')} className="p-1 hover:text-[#d4af37]"><ArrowDown className="w-3 h-3" /></button>
                                </div>
                            </div>

                            <ChapterEditor 
                                content={chapter.content} 
                                history={chapter.history || [chapter.content]}
                                onHistoryUpdate={(newHistory) => {
                                    const updated = [...chapters];
                                    updated[idx].history = newHistory;
                                    setChapters(updated);
                                }}
                                isEditable={true} 
                                model={modelConfig.draftingModel}
                                onChange={(newText) => {
                                    const updated = [...chapters];
                                    updated[idx].content = newText;
                                    setChapters(updated);
                                }} 
                            />
                        </div>
                    ))}
                    
                    {isGenerating && (
                        <div className="animate-fade-in pb-20 pt-10">
                             {/* GENERATION STATUS INDICATOR (NEW) */}
                            {generationStatus && (
                                <div className="flex items-center gap-3 text-[#d4af37] mb-4 bg-[#d4af37]/10 p-3 rounded-sm border border-[#d4af37]/30 max-w-fit animate-fade-in">
                                    <RefreshCw className="w-4 h-4 animate-spin" />
                                    <span className="text-xs font-bold uppercase tracking-widest">{generationStatus}</span>
                                </div>
                            )}

                            <div className="font-body leading-[2.1] text-[1.15rem] text-stone-300 text-justify animate-pulse opacity-80 whitespace-pre-wrap">
                                {currentStreamingContent}
                            </div>
                        </div>
                    )}

                    {/* BATCH PROGRESS BAR OVERLAY */}
                    {isBatchProcessing && (
                        <div className="fixed bottom-10 left-1/2 transform -translate-x-1/2 bg-stone-900 border border-[#d4af37] shadow-2xl p-4 rounded-sm z-50 flex flex-col items-center gap-2 w-96 animate-fade-in">
                            <div className="flex justify-between w-full text-[10px] font-bold uppercase tracking-widest text-[#d4af37]">
                                <span>Batch Generation Active</span>
                                <span>{batchProgress} / {batchQueue.length}</span>
                            </div>
                            <div className="w-full h-1 bg-stone-800 rounded-full overflow-hidden">
                                <div 
                                    className="h-full bg-[#d4af37] transition-all duration-500"
                                    style={{ width: `${(batchProgress / batchQueue.length) * 100}%` }}
                                ></div>
                            </div>
                        </div>
                    )}
                    
                    <div ref={novelEndRef} className="h-16" />
                </div>
            </div>
          </div>

          {showBible && (
            <WorldBiblePanel 
                lore={lore} 
                characters={characters} 
                analytics={analytics} 
                chapters={chapters}
                currentChapterText={chapters.length > 0 ? chapters[chapters.length-1].content : ''}
                model={modelConfig.draftingModel}
            />
          )}
          {appState === AppState.REFINEMENT_SELECTION && (
            <RefinementPanel 
                onRefine={handleRefinement} 
                onSkip={() => setAppState(AppState.DECISION)} 
            />
          )}
          {appState === AppState.DECISION && (
             <DecisionPanel 
                choices={currentChoices} 
                onDecision={handleDecision} 
                onAutoPilot={handleAutoPilot} 
                onChaos={handleChaosMode}
             />
          )}
        </div>
      )}
    </Layout>
  );
};

export default App;
