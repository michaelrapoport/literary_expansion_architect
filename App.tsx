import React, { useState, useEffect, useRef } from 'react';
import { Layout } from './components/Layout';
import { FileUploader } from './components/FileUploader';
import { SetupForm } from './components/SetupForm';
import { ConfigurationPanel } from './components/ConfigurationPanel';
import { DecisionPanel } from './components/DecisionPanel';
import { BeatSheetEditor } from './components/BeatSheetEditor';
import { RefinementPanel } from './components/RefinementPanel';
import { AppState, Chapter, Choice, NovelMetadata, Beat, GenerationConfig } from './types';
import { splitIntoSourceChunks } from './services/fileService';
import { generateSetup, generateNextChapter, analyzeStyle, extractMetadata, generateBeatSheet, refineChapter } from './services/geminiService';
import { Download, Loader2, ScanSearch, Wand2, FileSearch, BookOpen, AlignLeft, Bot } from 'lucide-react';
import { GenerateContentResponse } from '@google/genai';
import { REFINEMENT_OPTIONS } from './constants';

const countWords = (text: string): number => {
  return text.trim().split(/\s+/).filter(w => w.length > 0).length;
};

// Simple HTML strip for display safety
const stripHtml = (html: string) => {
   return html.replace(/<[^>]*>?/gm, '');
};

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>(AppState.UPLOAD);
  const [sourceChunks, setSourceChunks] = useState<string[]>([]);
  const [currentChunkIndex, setCurrentChunkIndex] = useState(0);
  const [metadata, setMetadata] = useState<NovelMetadata | null>(null);
  
  // New State for auto-filled data
  const [autoFilledMetadata, setAutoFilledMetadata] = useState<Partial<NovelMetadata>>({});
  const [beatSheet, setBeatSheet] = useState<Beat[]>([]);
  
  // Novel State
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [currentStreamingContent, setCurrentStreamingContent] = useState('');
  
  // Interaction State
  const [currentChoices, setCurrentChoices] = useState<Choice[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  
  // Auto-Pilot State
  const [autoPilotRemaining, setAutoPilotRemaining] = useState(0);

  // Refs for auto-scrolling
  const novelEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom of novel when content updates
  useEffect(() => {
    if (novelEndRef.current) {
      novelEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chapters, currentStreamingContent]);

  // Auto-Pilot Effect Logic
  useEffect(() => {
    if (autoPilotRemaining > 0 && !isGenerating) {
        let timer: ReturnType<typeof setTimeout>;
        
        // If we are at Refinement Selection -> Skip it
        if (appState === AppState.REFINEMENT_SELECTION) {
            timer = setTimeout(() => {
                handleRefinementSkip();
            }, 1000); // Small delay for visual feedback
        }
        
        // If we are at Decision -> Make Decision 'A' and Continue
        if (appState === AppState.DECISION) {
            timer = setTimeout(() => {
                // Default to Choice A or "Continue"
                const defaultChoice = currentChoices.length > 0 ? currentChoices[0].text : "Continue the story naturally.";
                // Decrement happens inside handleDecision wrapper logic or here?
                // We decrement AFTER the decision initiates the next chunk
                handleDecision(defaultChoice, "", 'new', true); 
            }, 1000);
        }

        return () => {
            if (timer) clearTimeout(timer);
        };
    }
  }, [appState, autoPilotRemaining, isGenerating, currentChoices]);

  const handleFileLoaded = async (content: string) => {
    const chunks = splitIntoSourceChunks(content);
    setSourceChunks(chunks);
    
    // START AUTO-DETECTION FLOW
    setAppState(AppState.DETECTING_METADATA);
    try {
      const extractedData = await extractMetadata(content);
      setAutoFilledMetadata(extractedData);
      setAppState(AppState.SETUP);
    } catch (e) {
      console.error("Metadata extraction failed", e);
      // Fallback to empty setup
      setAppState(AppState.SETUP);
    }
  };

  const handleMetadataSubmit = async (data: NovelMetadata) => {
    // Save metadata temporarily
    setMetadata(data);
    
    // Proceed to Detailed Configuration instead of straight to Beat Sheet
    setAppState(AppState.CONFIGURATION);
  };
  
  const handleConfigurationSubmit = async (config: GenerationConfig) => {
      if (!metadata) return;
      const updatedMetadata = { ...metadata, config };
      setMetadata(updatedMetadata);
      
      // NOW Generate Beat Sheet
      setAppState(AppState.GENERATING_BEATS);
      try {
        const fullText = sourceChunks.join('\n\n');
        const beats = await generateBeatSheet(fullText, updatedMetadata);
        setBeatSheet(beats);
        setAppState(AppState.BEAT_SHEET);
      } catch (e) {
        console.error("Beat sheet generation failed", e);
        setBeatSheet([{ id: '1', description: 'Start of story' }]);
        setAppState(AppState.BEAT_SHEET);
      }
  };

  const handleBeatSheetConfirm = async (confirmedBeats: Beat[]) => {
    if (!metadata) return;

    const finalMetadata = { ...metadata, beatSheet: confirmedBeats };
    setMetadata(finalMetadata);

    setAppState(AppState.ANALYZING);
    
    try {
        const styleDNA = await analyzeStyle(sourceChunks[0] || "");
        const metadataWithStyle = { ...finalMetadata, styleAnalysis: styleDNA };
        setMetadata(metadataWithStyle);
        
        setAppState(AppState.PROCESSING);
        await processGeminiLoop(metadataWithStyle, sourceChunks[0], true, 'new');
    } catch (e) {
        console.error("Analysis failed", e);
        alert("Style Analysis failed. Please try again.");
        setAppState(AppState.SETUP);
    }
  };

  const processGeminiLoop = async (
    meta: NovelMetadata,
    chunkText: string,
    isFirst: boolean,
    placement: 'new' | 'append',
    userChoice: string = '',
    customInstr: string = ''
  ) => {
    setIsGenerating(true);
    setCurrentStreamingContent('');
    
    try {
      let streamResult: AsyncIterable<GenerateContentResponse>;
      
      if (isFirst) {
        streamResult = await generateSetup(meta, chunkText);
      } else {
        // Concatenate all previous chapter content to form the full story history
        const fullStoryHistory = chapters.map(c => c.content).join('\n\n');
        
        // Pass full history + placement intent
        streamResult = await generateNextChapter(
            meta, 
            fullStoryHistory, 
            userChoice, 
            customInstr, 
            chunkText,
            placement === 'new'
        );
      }

      let fullResponseText = '';
      const splitMarker = '|||STRATEGIC_SPLIT|||';
      
      for await (const chunk of streamResult) {
         const text = chunk.text;
         if (text) {
             const cleanedChunk = stripHtml(text);
             fullResponseText += cleanedChunk;
             
             // Dynamic visual truncation for streaming
             let displayLimit = fullResponseText.indexOf(splitMarker);
             if (displayLimit === -1) {
                 // Fallback visual check
                 const match = fullResponseText.match(/\n\s*\[\s*\{\s*"id"/);
                 if (match && match.index) displayLimit = match.index;
             }

             if (displayLimit !== -1) {
                 setCurrentStreamingContent(fullResponseText.substring(0, displayLimit));
             } else {
                 setCurrentStreamingContent(fullResponseText);
             }
         }
      }

      // Final Split Logic
      let storyPart = fullResponseText;
      let jsonPart = '';
      
      const splitIndex = fullResponseText.indexOf(splitMarker);
      
      if (splitIndex !== -1) {
          storyPart = fullResponseText.substring(0, splitIndex);
          jsonPart = fullResponseText.substring(splitIndex + splitMarker.length);
      } else {
          // Fallback: Try to find the JSON start regex if marker missing
          // Look for [ followed by { "id":
          const jsonMatch = fullResponseText.match(/\[\s*\{\s*"id"\s*:/);
          if (jsonMatch && jsonMatch.index !== undefined) {
               storyPart = fullResponseText.substring(0, jsonMatch.index);
               jsonPart = fullResponseText.substring(jsonMatch.index);
          }
      }
      
      const finalStoryContent = storyPart.trim();
      
      if (placement === 'new') {
        const newChapter: Chapter = {
            id: chapters.length + 1,
            title: `Chapter ${chapters.length + 1}`,
            content: finalStoryContent
        };
        setChapters(prev => [...prev, newChapter]);
      } else {
        // Append mode
        setChapters(prev => {
            const updated = [...prev];
            const lastIdx = updated.length - 1;
            if (lastIdx >= 0) {
                // Add a scene break visual separator
                updated[lastIdx] = {
                    ...updated[lastIdx],
                    content: updated[lastIdx].content + '\n\n* * *\n\n' + finalStoryContent
                };
            }
            return updated;
        });
      }

      setCurrentStreamingContent('');

      if (jsonPart) {
          try {
              const cleanJson = jsonPart.replace(/```json/g, '').replace(/```/g, '').trim();
              const parsedChoices = JSON.parse(cleanJson);
              setCurrentChoices(parsedChoices);
              setAppState(AppState.REFINEMENT_SELECTION);
          } catch (e) {
              console.error("Failed to parse choices JSON", e);
              setCurrentChoices([{ id: 'A', text: 'Continue naturally', rationale: 'Fallback due to parsing error', type: 'Other' }]);
              setAppState(AppState.REFINEMENT_SELECTION);
          }
      } else {
          setCurrentChoices([{ id: 'A', text: 'Continue', rationale: 'Auto-generated path', type: 'Other' }]);
          setAppState(AppState.REFINEMENT_SELECTION);
      }

    } catch (error) {
        console.error("Gemini Error:", error);
        alert("An error occurred during generation. Please check console.");
        setAppState(AppState.SETUP);
        setAutoPilotRemaining(0); // Stop auto-pilot on error
    } finally {
        setIsGenerating(false);
    }
  };

  const handleRefinementSelection = async (selectedIds: string[]) => {
      const selectedLabels = REFINEMENT_OPTIONS
          .filter(opt => selectedIds.includes(opt.id))
          .map(opt => opt.label);
          
      const instructions = selectedLabels.join(", ");
      const currentChapter = chapters[chapters.length - 1];
      
      if (!currentChapter || !metadata?.styleAnalysis) return;

      setAppState(AppState.REFINING);
      setIsGenerating(true);
      setCurrentStreamingContent(currentChapter.content);

      try {
          const fullStoryHistory = chapters.map(c => c.content).join('\n\n');
          
          const streamResult = await refineChapter(
              currentChapter.content,
              instructions,
              metadata.styleAnalysis,
              fullStoryHistory // Pass context for continuity
          );
          
          let fullRefinedText = "";
          for await (const chunk of streamResult) {
              const text = chunk.text;
              if (text) {
                  const cleaned = stripHtml(text);
                  fullRefinedText += cleaned;
                  setCurrentStreamingContent(fullRefinedText);
              }
          }
          
          const updatedChapters = [...chapters];
          updatedChapters[updatedChapters.length - 1].content = fullRefinedText;
          setChapters(updatedChapters);
          
          setAppState(AppState.REFINEMENT_SELECTION);

      } catch (e) {
          console.error("Refinement failed", e);
          alert("Refinement failed.");
          setAppState(AppState.REFINEMENT_SELECTION);
          setAutoPilotRemaining(0);
      } finally {
          setIsGenerating(false);
          setCurrentStreamingContent('');
      }
  };

  const handleRefinementSkip = () => {
      setAppState(AppState.DECISION);
  };

  const handleDecision = async (choiceText: string, customInstructions: string, placement: 'new' | 'append', isAutoPilotStep: boolean = false) => {
      const nextIndex = currentChunkIndex + 1;
      
      if (nextIndex >= sourceChunks.length) {
          setAppState(AppState.FINISHED);
          setAutoPilotRemaining(0);
          return;
      }

      if (isAutoPilotStep) {
          setAutoPilotRemaining(prev => Math.max(0, prev - 1));
      }

      setCurrentChunkIndex(nextIndex);
      setAppState(AppState.PROCESSING);
      setCurrentChoices([]);
      
      if (metadata) {
          await processGeminiLoop(
              metadata, 
              sourceChunks[nextIndex], 
              false, // Not first
              placement, // User selected placement
              choiceText, 
              customInstructions
          );
      }
  };

  const handleAutoPilotEngage = (count: number) => {
     setAutoPilotRemaining(count);
     // Trigger the first step of auto-pilot by taking Choice A immediately
     const defaultChoice = currentChoices.length > 0 ? currentChoices[0].text : "Continue the story naturally.";
     handleDecision(defaultChoice, "", 'new', true);
  };

  const handleDownload = () => {
      const fullText = chapters.map(c => `# ${c.title}\n\n${c.content}`).join('\n\n');
      const blob = new Blob([fullText], { type: 'text/markdown' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${metadata?.title || 'expanded_novel'}.md`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
  };

  return (
    <Layout>
      {appState === AppState.UPLOAD && <FileUploader onFileLoaded={handleFileLoaded} />}
      
      {appState === AppState.DETECTING_METADATA && (
        <div className="w-full h-full flex flex-col items-center justify-center p-8 text-center animate-fade-in bg-stone-950">
           <div className="w-24 h-24 bg-stone-900 rounded-full flex items-center justify-center mb-8 animate-pulse">
               <FileSearch className="w-10 h-10 text-stone-300" />
           </div>
           <h2 className="text-3xl font-display font-bold text-stone-100 mb-2">Analyzing Manuscript</h2>
           <p className="text-stone-500 font-ui tracking-wide text-sm">DETECTING NARRATIVE SIGNATURES...</p>
        </div>
      )}

      {appState === AppState.SETUP && (
        <SetupForm 
          initialData={autoFilledMetadata} 
          onSubmit={handleMetadataSubmit} 
        />
      )}
      
      {appState === AppState.CONFIGURATION && (
        <ConfigurationPanel onConfirm={handleConfigurationSubmit} />
      )}

      {appState === AppState.GENERATING_BEATS && (
        <div className="w-full h-full flex flex-col items-center justify-center p-8 text-center animate-fade-in bg-stone-950">
           <div className="w-24 h-24 bg-[#d4af37]/20 rounded-full flex items-center justify-center mb-8 animate-pulse">
               <Wand2 className="w-10 h-10 text-[#d4af37]" />
           </div>
           <h2 className="text-3xl font-display font-bold text-stone-100 mb-2">Architecting Structure</h2>
           <p className="text-stone-500 font-ui tracking-wide text-sm">EXTRACTING NARRATIVE VERTEBRAE...</p>
        </div>
      )}

      {appState === AppState.BEAT_SHEET && (
        <BeatSheetEditor 
          initialBeats={beatSheet} 
          onConfirm={handleBeatSheetConfirm} 
        />
      )}
      
      {appState === AppState.ANALYZING && (
          <div className="w-full h-full flex flex-col items-center justify-center p-8 text-center animate-fade-in bg-stone-950">
             <div className="w-24 h-24 bg-stone-900 rounded-full flex items-center justify-center mb-8 relative">
                 <ScanSearch className="w-10 h-10 text-stone-200 z-10" />
                 <div className="absolute inset-0 border-4 border-stone-700 rounded-full animate-ping opacity-30"></div>
             </div>
             <h2 className="text-3xl font-display font-bold text-stone-100 mb-2">Decapsulating DNA</h2>
             <p className="text-stone-500 max-w-md font-body italic">
                 "Style is the feather in the arrow, not the feather in the cap."
             </p>
          </div>
      )}
      
      {(appState === AppState.PROCESSING || appState === AppState.DECISION || appState === AppState.FINISHED || appState === AppState.REFINEMENT_SELECTION || appState === AppState.REFINING) && (
        <div className="w-full flex h-full bg-stone-950 overflow-hidden relative">
          
          {/* Main Novel Display Area - Fixed Card Layout */}
          <div className="flex-1 flex items-center justify-center p-4 md:p-8 h-full">
            <div className="w-full max-w-[900px] h-full bg-stone-900 shadow-2xl border border-stone-800 flex flex-col relative rounded-sm">
                
                {/* Book Header / Running Head - Fixed */}
                <div className="flex-none h-16 border-b border-stone-800 flex items-center justify-between px-8 md:px-12 bg-stone-900/95 backdrop-blur z-10">
                    <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-stone-500">{metadata?.author}</span>
                    <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-stone-500">{metadata?.title}</span>
                </div>

                {/* Scrollable Content Area */}
                <div className="flex-1 overflow-y-auto novel-scroll p-12 md:p-20 scroll-smooth relative">
                    {chapters.length === 0 && isGenerating && (
                        <div className="mt-10 mb-12 text-center border-b-2 border-stone-800 pb-12">
                            <h1 className="text-4xl md:text-5xl font-display font-bold text-stone-100 mb-4">{metadata?.title}</h1>
                            <p className="text-stone-500 font-display italic text-xl">Expansion in progress...</p>
                        </div>
                    )}
                    
                    {chapters.map((chapter) => (
                        <div key={chapter.id} className="mb-24 animate-fade-in">
                            <div className="flex justify-between items-end mb-12 border-b border-stone-800 pb-2">
                            <span className="text-xs font-bold tracking-widest uppercase text-stone-500">Chapter {chapter.id}</span>
                            <span className="flex items-center gap-2 text-[10px] font-mono text-stone-600 uppercase">
                                <AlignLeft className="w-3 h-3" />
                                {countWords(chapter.content)} Words
                            </span>
                            </div>
                            <div className="font-body leading-[2.1] text-[1.15rem] text-stone-300 text-justify">
                                <div className="whitespace-pre-wrap">{chapter.content}</div>
                            </div>
                        </div>
                    ))}
                    
                    {/* Streaming Content */}
                    {isGenerating && (
                        <div className="animate-fade-in">
                            <div className="flex justify-between items-end mb-8 border-b border-stone-800 pb-2 opacity-60">
                            <span className="text-xs font-bold tracking-widest uppercase text-stone-500">
                                {appState === AppState.REFINING 
                                    ? `Polishing Chapter ${chapters.length}` 
                                    : (chapters.length > 0 ? 'Generating Continuation...' : 'Generating Chapter 1')
                                }
                            </span>
                            <span className="flex items-center gap-2 text-[10px] font-mono text-stone-500 uppercase">
                                    <Loader2 className="w-3 h-3 animate-spin" />
                                    {countWords(currentStreamingContent)} Words
                            </span>
                            </div>
                            <div className="font-body leading-[2.1] text-[1.15rem] text-stone-300 text-justify animate-pulse opacity-80">
                                <div className="whitespace-pre-wrap">{currentStreamingContent}</div>
                                <span className="inline-block w-1.5 h-6 bg-stone-500 ml-1 animate-blink align-middle"></span>
                            </div>
                        </div>
                    )}
                    
                    <div ref={novelEndRef} className="h-16" />
                </div>
            </div>

            {/* Floating Status Indicators (positioned relative to main area) */}
            {autoPilotRemaining > 0 && (
                <div className="absolute top-6 left-1/2 -translate-x-1/2 bg-[#d4af37]/90 text-stone-900 px-6 py-2 rounded-full shadow-lg z-40 flex items-center gap-3 animate-pulse pointer-events-none">
                    <Bot className="w-4 h-4" />
                    <span className="text-xs font-bold uppercase tracking-wider">Auto-Pilot Active: {autoPilotRemaining} Ch remaining</span>
                </div>
            )}

            {isGenerating && (
                <div className="absolute bottom-10 left-1/2 -translate-x-1/2 bg-stone-800 text-stone-100 px-8 py-4 rounded-full shadow-2xl flex items-center gap-4 z-30 font-ui text-sm tracking-wide border border-stone-700 pointer-events-none">
                    <Loader2 className="w-4 h-4 animate-spin text-[#d4af37]" />
                    <span className="font-medium uppercase">
                        {appState === AppState.REFINING ? 'Polishing Prose...' : 'Architecting Expansion...'}
                    </span>
                    <span className="ml-2 font-mono text-xs text-stone-400 border-l border-stone-600 pl-4">
                        {countWords(currentStreamingContent)} w
                    </span>
                </div>
            )}
            
            {appState === AppState.FINISHED && (
                <div className="fixed bottom-12 left-1/2 -translate-x-1/2 z-50">
                    <button onClick={handleDownload} className="bg-[#d4af37] hover:bg-[#c5a028] text-stone-900 px-10 py-5 rounded-sm shadow-2xl font-bold font-display text-xl flex items-center gap-3 transition transform hover:-translate-y-1">
                        <BookOpen className="w-6 h-6" />
                        Download Manuscript
                    </button>
                </div>
            )}
          </div>

          {/* Sidebar Panels */}
          {appState === AppState.REFINEMENT_SELECTION && (
             <RefinementPanel onRefine={handleRefinementSelection} onSkip={handleRefinementSkip} />
          )}

          {appState === AppState.DECISION && (
             <DecisionPanel 
                choices={currentChoices} 
                onDecision={handleDecision} 
                onAutoPilot={handleAutoPilotEngage}
             />
          )}
        </div>
      )}
    </Layout>
  );
};

export default App;