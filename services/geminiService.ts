
import { GoogleGenAI, GenerateContentResponse, Schema, Type } from "@google/genai";
import { LEA_SYSTEM_PROMPT, STYLE_ANALYSIS_PROMPT, REFINEMENT_PROMPT_TEMPLATE } from "../constants";
import { NovelMetadata, Beat, GenerationConfig, Choice, CritiquePoint, LoreEntry, CharacterStatus } from "../types";

let client: GoogleGenAI | null = null;

const getClient = (): GoogleGenAI => {
  if (!client) {
    const apiKey = process.env.API_KEY;
    if (!apiKey) throw new Error("API_KEY not found in environment");
    client = new GoogleGenAI({ apiKey });
  }
  return client;
};

// Retry helper for 429 Rate Limits
const retry = async <T>(fn: () => Promise<T>, retries = 3, delayMs = 2000): Promise<T> => {
  try {
    return await fn();
  } catch (error: any) {
    // Check for 429 status or "quota" in message
    const isRateLimit = error?.status === 429 || error?.code === 429 || error?.message?.toLowerCase().includes('quota') || error?.message?.includes('429');
    
    if (retries > 0 && isRateLimit) {
      console.warn(`Quota exceeded (429). Retrying in ${delayMs}ms...`);
      await new Promise(resolve => setTimeout(resolve, delayMs));
      return retry(fn, retries - 1, delayMs * 2);
    }
    throw error;
  }
};

const MAX_CONTEXT_CHARS = 800000;

const cleanHtml = (text: string): string => {
  let cleaned = text.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');
  cleaned = cleaned.replace(/<[^>]*>?/gm, '');
  return cleaned;
};

const manageContextWindow = (fullText: string): string => {
  if (fullText.length <= MAX_CONTEXT_CHARS) return fullText;
  const truncated = fullText.slice(-MAX_CONTEXT_CHARS);
  const cleanBreakIndex = truncated.indexOf('\n\n');
  if (cleanBreakIndex > -1 && cleanBreakIndex < 5000) {
     return "[...Earliest context condensed for memory efficiency...]\n\n" + truncated.slice(cleanBreakIndex);
  }
  return "[...Earliest context condensed for memory efficiency...]\n\n" + truncated;
};

const formatConfigForPrompt = (config?: GenerationConfig): string => {
  if (!config) return "Use default balanced pacing and standard prose.";
  return `
    *** NARRATIVE ENGINE PARAMETERS ***
    [STRUCTURE]
    Depth: ${config.expansionDepth}, Speed: ${config.pacingSpeed}, Flow: ${config.narrativeFlow}
    Time Handling: ${config.timeDilation}, Chapter Arc: ${config.chapterStructure}

    [VOICE & PROSE]
    Tone: ${config.tone}, POV: ${config.pov}, Tense: ${config.tense}
    Complexity: ${config.proseComplexity}, Rhythm: ${config.sentenceRhythm}
    Vocab: ${config.vocabularyLevel}, Metaphor: ${config.metaphorFrequency}
    Distance: ${config.narrativeDistance}, Reliability: ${config.narrativeReliability}

    [IMMERSION & ATMOSPHERE]
    Sensory: ${config.sensoryDensity}, Atmosphere: ${config.atmosphericFilter}

    [CHARACTER & THEME]
    Dialogue: ${config.dialogueRatio}, Agency: ${config.characterAgency}, Dynamic: ${config.relationshipDynamic}
    Subtext: ${config.subtextLevel}, Conflict Focus: ${config.conflictFocus}

    [WORLD & CONSTRAINTS]
    Magic: ${config.magicRules}, Worldbuilding: ${config.worldBuilding}
    Creativity: ${config.creativity}, Rating: ${config.rating}
  `;
};

// --- EXISTING METHODS (extractMetadata, generateBeatSheet, analyzeStyle) REMAIN UNCHANGED ---

export const extractMetadata = async (textSample: string, model: string): Promise<Partial<NovelMetadata>> => {
  const ai = getClient();
  const prompt = `
    Analyze the following novel text and extract structured metadata to populate a writing planning form.
    
    1. Extract Basic Metadata:
    - title (if apparent), author (if apparent), genre, synopsis (1 paragraph), themes (comma list), characterArcs (brief), styleGoals (analysis).

    2. Extract Configuration Parameters (Select the closest fit from options):
    - tone: 'Dark/Gritty', 'Light/Whimsical', 'Academic/Formal', 'Conversational'
    - pov: 'First Person', 'Third Person Limited', 'Third Person Omniscient', 'Second Person'
    - tense: 'Past', 'Present', 'Future'
    - proseComplexity: 'Accessible', 'Standard', 'Baroque', 'Experimental'
    - pacingSpeed: 'Slow Burn', 'Balanced', 'Fast'
    
    Text Sample:
    "${textSample.slice(0, 50000)}..."
  `;
  try {
    const response = await retry<GenerateContentResponse>(() => ai.models.generateContent({
      model: model, contents: prompt,
      config: { 
        responseMimeType: 'application/json', 
        responseSchema: { 
            type: Type.OBJECT, 
            properties: { 
                title: {type:Type.STRING}, 
                author: {type:Type.STRING}, 
                genre: {type:Type.STRING}, 
                synopsis: {type:Type.STRING}, 
                themes: {type:Type.STRING}, 
                characterArcs: {type:Type.STRING}, 
                styleGoals: {type:Type.STRING},
                config: {
                    type: Type.OBJECT,
                    properties: {
                        tone: {type: Type.STRING},
                        pov: {type: Type.STRING},
                        tense: {type: Type.STRING},
                        proseComplexity: {type: Type.STRING},
                        pacingSpeed: {type: Type.STRING}
                    }
                }
            } 
        } 
      }
    }));
    return response.text ? JSON.parse(response.text) : {};
  } catch (e) { return {}; }
};

export const generateBlueprint = async (fullText: string): Promise<Partial<NovelMetadata>> => {
  const ai = getClient();
  // Using gemini-3-pro-preview as the high-reasoning "Pro" agent
  const model = 'gemini-3-pro-preview'; 
  
  const prompt = `
    You are a professional literary agent and editor. 
    Analyze the uploaded manuscript to create a comprehensive "Novel Blueprint" JSON.
    
    Tasks:
    1. Determine the Title and Author (if present).
    2. Write a compelling Synopsis (100-150 words).
    3. Identify the Genre (be specific, e.g., "Cyberpunk Noir").
    4. List Core Themes (comma separated).
    5. Describe the major Character Arcs.
    6. Analyze the Style Goals (what makes this writing unique?).
    7. Suggest Tone/Comedy adjustments.
    8. Estimate ideal min/max word counts for chapters based on the pacing.
    9. EXTRACT THE NARRATIVE SKELETON (Beat Sheet): Identify the key existing plot points/chapters from the text as a list of beats.

    Manuscript Excerpt:
    "${fullText.slice(0, 100000)}..."
  `;

  try {
    const response = await retry<GenerateContentResponse>(() => ai.models.generateContent({
      model: model,
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            author: { type: Type.STRING },
            genre: { type: Type.STRING },
            synopsis: { type: Type.STRING },
            themes: { type: Type.STRING },
            characterArcs: { type: Type.STRING },
            styleGoals: { type: Type.STRING },
            comedy: { type: Type.STRING },
            minWordCount: { type: Type.INTEGER },
            maxWordCount: { type: Type.INTEGER },
            beatSheet: { 
                type: Type.ARRAY, 
                items: { 
                    type: Type.OBJECT, 
                    properties: { 
                        id: { type: Type.STRING }, 
                        description: { type: Type.STRING } 
                    } 
                } 
            }
          }
        }
      }
    }));
    return response.text ? JSON.parse(response.text) : {};
  } catch (e) {
    console.error("Blueprint generation failed", e);
    return {};
  }
};

export const generateBeatSheet = async (textSample: string, metadata: NovelMetadata, model: string): Promise<Beat[]> => {
  const ai = getClient();
  const contextText = textSample.slice(0, 1500000); 
  const prompt = `Generate structural Beat Sheet (JSON array of {id, description}) for: Title: ${metadata.title}\n"${contextText}"`;
  try {
    const response = await retry<GenerateContentResponse>(() => ai.models.generateContent({
      model: model, contents: prompt,
      config: { responseMimeType: 'application/json', responseSchema: { type: Type.OBJECT, properties: { beats: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { id: {type:Type.STRING}, description: {type:Type.STRING} } } } } } }
    }));
    const data = JSON.parse(response.text || '{}');
    return data.beats || [{ id: '1', description: 'Start of story' }];
  } catch (e) { return [{ id: '1', description: 'Start of story' }]; }
};

export const analyzeStyle = async (sampleText: string, model: string): Promise<string> => {
  const ai = getClient();
  const response = await retry<GenerateContentResponse>(() => ai.models.generateContent({
    model: model, contents: `Analyze style: "${sampleText.slice(0, 50000)}..."`, 
    config: { systemInstruction: STYLE_ANALYSIS_PROMPT, temperature: 0.5 }
  }));
  return response.text || "Style analysis failed.";
};

export const generateSetup = async (metadata: NovelMetadata, firstChunk: string, model: string): Promise<AsyncIterable<GenerateContentResponse>> => {
  const ai = getClient();
  const beatSheetText = metadata.beatSheet ? metadata.beatSheet.map(b => `[${b.id}] ${b.description}`).join('\n') : "";
  const configPrompt = formatConfigForPrompt(metadata.config);
  const prompt = `Phase 1 Setup. Meta: ${JSON.stringify(metadata)}. ${configPrompt}\nBeats:\n${beatSheetText}\nStyle:\n${metadata.styleAnalysis}\nSource:\n"${firstChunk}"\nOutput expanded text then |||STRATEGIC_SPLIT||| then JSON object with keys: "pacingScore" (1-10) and "choices" (array of 4 objects).`;
  return await retry(async () => {
    return await ai.models.generateContentStream({ model: model, contents: prompt, config: { systemInstruction: LEA_SYSTEM_PROMPT, temperature: 0.8 } });
  });
};

export const generateNextChapter = async (metadata: NovelMetadata, storyHistory: string, userChoice: string, customInstructions: string, nextChunk: string, isNewChapter: boolean, model: string): Promise<AsyncIterable<GenerateContentResponse>> => {
  const ai = getClient();
  const structureInstruction = isNewChapter ? "START A NEW CHAPTER." : "CONTINUE THE CURRENT CHAPTER.";
  const managedContext = manageContextWindow(storyHistory);
  const prompt = `CONTINUATION. ${structureInstruction} ${formatConfigForPrompt(metadata.config)}\nStyle: ${metadata.styleAnalysis}\nContext: "${managedContext}"\nUser: ${userChoice} ${customInstructions}\nSource: "${nextChunk}"\nOutput expanded text then |||STRATEGIC_SPLIT||| then JSON object with keys: "pacingScore" (1-10) and "choices" (array of 4 objects).`;
  return await retry(async () => {
    return await ai.models.generateContentStream({ model: model, contents: prompt, config: { systemInstruction: LEA_SYSTEM_PROMPT, temperature: 0.8 } });
  });
};

export const generateChapterFromBeat = async (metadata: NovelMetadata, targetBeat: Beat, previousBeats: Beat[], storyHistory: string, model: string): Promise<AsyncIterable<GenerateContentResponse>> => {
    const ai = getClient();
    const managedContext = manageContextWindow(storyHistory);
    const beatContext = previousBeats.slice(-5).map(b => `[Beat ${b.id}] ${b.description}`).join('\n'); // Last 5 beats
    
    const prompt = `
        BATCH PROCESSING - GHOSTWRITER MODE.
        
        Metadata: ${JSON.stringify(metadata.config)}
        Style DNA: ${metadata.styleAnalysis}
        
        Previous Context: "${managedContext.slice(-5000)}"
        Recent Beats:
        ${beatContext}
        
        TARGET BEAT TO EXPAND:
        "${targetBeat.description}"
        
        Task: Write the complete chapter corresponding to the Target Beat. 
        Maintain strict continuity with Previous Context.
        No JSON output. Just prose.
    `;

    return await retry(async () => {
        return await ai.models.generateContentStream({ model: model, contents: prompt, config: { systemInstruction: LEA_SYSTEM_PROMPT, temperature: 0.8 } });
    });
};

export const refineChapter = async (chapterText: string, instructions: string, styleDNA: string, storyHistory: string, model: string): Promise<AsyncIterable<GenerateContentResponse>> => {
  const ai = getClient();
  const managedContext = manageContextWindow(storyHistory);
  const prompt = REFINEMENT_PROMPT_TEMPLATE.replace('{{STYLE_DNA}}', styleDNA).replace('{{CHAPTER_TEXT}}', chapterText).replace('{{REFINEMENT_GOALS}}', instructions).replace('{{WORD_COUNT}}', chapterText.split(/\s+/).length.toString()) + `\nContext: ${managedContext.slice(-20000)}`;
  return await retry(async () => {
    return await ai.models.generateContentStream({ model: model, contents: prompt, config: { temperature: 0.7 } });
  });
};

export const magicRefineSelection = async (
    selection: string, 
    instruction: string, 
    context: string,
    model: string
): Promise<string> => {
    const ai = getClient();
    const prompt = `
        You are a surgical literary editor.
        
        CONTEXT (Surrounding text):
        "...${context.slice(-1000)}..."

        TARGET TEXT TO EDIT:
        "${selection}"

        INSTRUCTION: ${instruction}

        Output ONLY the rewritten version of the TARGET TEXT. Do not output quotes or explanations.
    `;
    
    const response = await retry<GenerateContentResponse>(() => ai.models.generateContent({
        model: model,
        contents: prompt
    }));
    
    return response.text?.trim() || selection;
};

// --- NEW METHOD FOR LORE EXTRACTION ---
export const extractLoreUpdates = async (text: string, model: string): Promise<any> => {
    const ai = getClient();
    const prompt = `
        Read the following story segment and extract any NEW significant facts for a "World Bible".
        
        Tasks:
        1. Identify new facts about Locations, History, or Magic.
        2. Identify updates to Character status (Where are they? How are they feeling? What items do they have?).

        Return JSON format: 
        { 
            "lore": [{ "key": "Name of Place/Item", "category": "Location/Item/History", "description": "1 sentence fact" }], 
            "characters": [{ "name": "Exact Name", "location": "Current Location", "goal": "Current Goal", "inventory": ["Item 1"], "status": "Alive/Dead/Injured" }] 
        }
        
        Text: "${text.slice(0, 50000)}"
    `;
    
    try {
        const response = await retry<GenerateContentResponse>(() => ai.models.generateContent({
            model: model,
            contents: prompt,
            config: { responseMimeType: 'application/json' }
        }));
        return response.text ? JSON.parse(response.text) : null;
    } catch(e) { return null; }
};

// --- NEW METHODS FOR 2.0 UPGRADE ---

export const generateChaosTwist = async (
  contextText: string, 
  metadata: NovelMetadata, 
  model: string
): Promise<Choice> => {
  const ai = getClient();
  const prompt = `
    Based on this story context, generate ONE shocking, high-creativity, high-entropy plot twist choice.
    Context Summary: "${contextText.slice(-5000)}"
    Tone: ${metadata.config?.tone}
    
    Return JSON: { "id": "CHAOS", "text": "The twist description", "rationale": "Why this breaks expectations", "type": "Chaos" }
  `;

  try {
    const response = await retry<GenerateContentResponse>(() => ai.models.generateContent({
      model: model, contents: prompt,
      config: { 
        responseMimeType: 'application/json',
        temperature: 1.5 // High entropy
      }
    }));
    const choice = JSON.parse(response.text || '{}');
    return { ...choice, type: 'Chaos' };
  } catch (e) {
    return { id: 'CHAOS', text: 'A sudden, inexplicable event changes everything.', rationale: 'Engine fallback.', type: 'Chaos' };
  }
};

export const chatWithStory = async (
    query: string, 
    context: string, 
    loreContext: string,
    model: string
): Promise<string> => {
    const ai = getClient();
    const prompt = `
        You are the "Memory Bank" for a novel.
        Context: 
        ${loreContext}
        ...
        ${context.slice(-20000)}

        User Question: "${query}"

        Answer briefly and accurately based strictly on the text provided.
    `;
    const response = await retry<GenerateContentResponse>(() => ai.models.generateContent({
        model: model, contents: prompt
    }));
    return response.text || "I couldn't find that in the archives.";
};

export const generateCritique = async (
    text: string, 
    model: string
): Promise<CritiquePoint[]> => {
    const ai = getClient();
    const prompt = `
        Act as a ruthless literary editor. Read the text below and identify 3-4 specific issues (weak verbs, redundancy, pacing issues, logic gaps).
        
        Text: "${text.slice(0, 5000)}"

        Return JSON: [ { "id": "1", "quote": "text segment", "comment": "critique", "type": "Prose" } ]
    `;
     try {
        const response = await retry<GenerateContentResponse>(() => ai.models.generateContent({
            model: model, contents: prompt, config: { responseMimeType: 'application/json' }
        }));
        return JSON.parse(response.text || '[]');
    } catch (e) { return []; }
};

export const magicEraser = async (
    selection: string,
    context: string,
    model: string
): Promise<string> => {
    const ai = getClient();
    const prompt = `
        SURGICAL REMOVAL TASK.
        Context: "...${context.slice(-1000)}..."
        Target to Remove: "${selection}"
        
        Rewrite the context to seamlessly bridge the gap left by removing the target text.
        Ensure flow, grammar, and continuity are preserved.
        Output ONLY the bridged text replacement.
    `;
    const response = await retry<GenerateContentResponse>(() => ai.models.generateContent({
        model: model, contents: prompt
    }));
    return response.text?.trim() || "";
}

// --- NEW METHOD: NARRATIVE UNIT TEST ---
export const checkBeatConsistency = async (
  beat: Beat, 
  lore: LoreEntry[], 
  characters: CharacterStatus[], 
  model: string
): Promise<{ safe: boolean; issues: string[] }> => {
  const ai = getClient();
  const loreContext = lore.map(l => `${l.key} (${l.category}): ${l.description}`).join('\n');
  const charContext = characters.map(c => `${c.name}: ${c.status} at ${c.location}`).join('\n');

  const prompt = `
    NARRATIVE UNIT TEST (CONSISTENCY CHECK).
    
    World Data:
    ${loreContext}
    
    Character States:
    ${charContext}
    
    Proposed Plot Beat:
    "${beat.description}"
    
    Task: Check if the Proposed Plot Beat contradicts any World Data or Character States (e.g., using a dead character, teleporting without travel, using lost item).
    
    Return JSON: { "safe": boolean, "issues": ["Issue 1", "Issue 2"] }
    If no issues, "safe": true, "issues": [].
  `;
  
  try {
      const response = await retry<GenerateContentResponse>(() => ai.models.generateContent({
        model: model, contents: prompt, config: { responseMimeType: 'application/json' }
      }));
      return JSON.parse(response.text || '{"safe": true, "issues": []}');
  } catch (e) {
      return { safe: true, issues: [] };
  }
};
