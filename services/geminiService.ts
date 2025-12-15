import { GoogleGenAI, GenerateContentResponse, Schema, Type } from "@google/genai";
import { LEA_SYSTEM_PROMPT, STYLE_ANALYSIS_PROMPT, REFINEMENT_PROMPT_TEMPLATE } from "../constants";
import { NovelMetadata, Beat, GenerationConfig } from "../types";

let client: GoogleGenAI | null = null;

const getClient = () => {
  if (!client) {
    const apiKey = process.env.API_KEY;
    if (!apiKey) throw new Error("API_KEY not found in environment");
    client = new GoogleGenAI({ apiKey });
  }
  return client;
};

// Approx 200,000 tokens * 4 chars/token = 800,000 characters
const MAX_CONTEXT_CHARS = 800000;

const cleanHtml = (text: string): string => {
  // Strip <style> tags and content
  let cleaned = text.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');
  // Strip other HTML tags
  cleaned = cleaned.replace(/<[^>]*>?/gm, '');
  return cleaned;
};

const manageContextWindow = (fullText: string): string => {
  if (fullText.length <= MAX_CONTEXT_CHARS) return fullText;
  
  // Keep the last chunk that fits within the limit
  const truncated = fullText.slice(-MAX_CONTEXT_CHARS);
  // Try to find a clean break (double newline) to avoid cutting mid-sentence
  const cleanBreakIndex = truncated.indexOf('\n\n');
  
  if (cleanBreakIndex > -1 && cleanBreakIndex < 5000) {
     return "[...Earliest context condensed for memory efficiency...]\n\n" + truncated.slice(cleanBreakIndex);
  }
  
  return "[...Earliest context condensed for memory efficiency...]\n\n" + truncated;
};

// Helper to format config for prompt
const formatConfigForPrompt = (config?: GenerationConfig): string => {
  if (!config) return "Use default balanced pacing and standard prose.";
  
  return `
    *** NARRATIVE ENGINE PARAMETERS (STRICT ADHERENCE REQUIRED) ***
    1. Structure:
       - Expansion Depth: ${config.expansionDepth}
       - Pacing Speed: ${config.pacingSpeed}
       - Narrative Flow: ${config.narrativeFlow}
    
    2. Stylistic Voice:
       - Tone/Mood: ${config.tone}
       - Point of View: ${config.pov}
       - Sensory Density: ${config.sensoryDensity}
    
    3. Characters:
       - Dialogue Ratio: ${config.dialogueRatio}
       - Character Agency: ${config.characterAgency}
       - Conflict Level: ${config.relationshipDynamic}
    
    4. World Logic:
       - Magic/Tech Rules: ${config.magicRules}
       - Worldbuilding Style: ${config.worldBuilding}
    
    5. Constraints:
       - Creativity Level: ${config.creativity}
       - Content Rating: ${config.rating}
  `;
};

export const extractMetadata = async (textSample: string): Promise<Partial<NovelMetadata>> => {
  const ai = getClient();
  
  // Using gemini-3-pro-preview for deep literary analysis and better character arc detection
  const prompt = `
    Analyze the provided manuscript text deeply and extract the specific metadata fields required by the schema.
    
    CRITICAL INSTRUCTIONS:
    - **Character Arcs**: detailed analysis of the protagonist, antagonist, and key supporting cast. Identify their internal wounds, external goals, and how they change.
    - **Synopsis**: A accurate summary of the plot points actually present in the text.
    - **Themes**: Identify recurring motifs and underlying messages.
    
    If the text is just a beginning, infer the likely direction based on the setup.
    
    Text Sample (First ~150k characters):
    "${textSample.slice(0, 150000)}..."
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING, description: "The title of the novel. Guess if not present." },
            author: { type: Type.STRING, description: "The author's name. Guess if not present." },
            genre: { type: Type.STRING, description: "The specific genre (e.g. Cyberpunk Noir, Regency Romance)." },
            synopsis: { type: Type.STRING, description: "A detailed summary of the plot points present in the text." },
            themes: { type: Type.STRING, description: "The central themes explored (e.g. Redemption, Nature vs Tech)." },
            characterArcs: { type: Type.STRING, description: "A detailed description of the main characters and their internal/external journeys detected so far." },
            styleGoals: { type: Type.STRING, description: "An analysis of the writing style (tone, pacing, vocabulary)." }
          },
          required: ["title", "author", "genre", "synopsis", "themes", "characterArcs", "styleGoals"]
        }
      }
    });

    if (response.text) {
        const data = JSON.parse(response.text);
        return {
          title: data.title || '',
          author: data.author || '',
          genre: data.genre || '',
          synopsis: data.synopsis || '',
          themes: data.themes || '',
          characterArcs: data.characterArcs || '',
          styleGoals: data.styleGoals || '',
          comedy: '', 
          minWordCount: 2500, 
          maxWordCount: 4000
        };
    }
    return {};
  } catch (e) {
    console.error("Failed to extract metadata", e);
    return {};
  }
};

export const generateBeatSheet = async (textSample: string, metadata: NovelMetadata): Promise<Beat[]> => {
  const ai = getClient();
  
  // Use a large context window (1.5M chars) with the Pro model for accurate structural analysis
  const contextText = textSample.slice(0, 1500000); 

  const prompt = `
    You are an expert structural editor and literary analyst.
    
    TASK:
    Generate a structural Beat Sheet (Outline) for the provided manuscript text.
    
    CRITICAL RULES:
    1. **ACCURACY IS PARAMOUNT.** Your beats must reflect events that ACTUALLY OCCUR in the provided text.
    2. Do not hallucinate events that are not in the text.
    3. If the provided text covers the WHOLE novel, outline the entire story arc.
    4. If the provided text is INCOMPLETE:
       - Outline the events present in the text specifically.
       - Then, based on the synopsis and setup, provide *projected* beats for where the story seems to be going, clearly labeled as (Projected).
    
    Metadata:
    Title: ${metadata.title}
    Synopsis: ${metadata.synopsis}
    
    Manuscript Text:
    "${contextText}"
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            beats: {
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
    });

    const cleanText = response.text ? response.text.replace(/```json/g, '').replace(/```/g, '').trim() : '{}';
    const data = JSON.parse(cleanText);
    if (data.beats && Array.isArray(data.beats) && data.beats.length > 0) {
        return data.beats;
    }
    // If empty array, fallback
    return [{ id: '1', description: 'Start of story' }];
    
  } catch (e) {
    console.error("Failed to parse beat sheet JSON", e);
    return [{ id: '1', description: 'Start of story' }];
  }
};

export const analyzeStyle = async (sampleText: string): Promise<string> => {
  const ai = getClient();
  const contextText = sampleText.slice(0, 50000);

  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: `Please analyze the following text sample:\n\n"${contextText}..."`, 
    config: {
      systemInstruction: STYLE_ANALYSIS_PROMPT,
      temperature: 0.5, 
    }
  });
  return response.text || "Style analysis failed.";
};

export const generateSetup = async (
  metadata: NovelMetadata,
  firstChunk: string
): Promise<AsyncIterable<GenerateContentResponse>> => {
  const ai = getClient();
  
  const beatSheetText = metadata.beatSheet 
    ? metadata.beatSheet.map(b => `[${b.id}] ${b.description}`).join('\n')
    : "No specific beat sheet provided.";

  const configPrompt = formatConfigForPrompt(metadata.config);

  const prompt = `
    Phase 1: Initial Setup & Phase 2 Start.
    
    Here is the Novel Metadata:
    Title: ${metadata.title}
    Author: ${metadata.author}
    Genre: ${metadata.genre}
    Synopsis: ${metadata.synopsis}
    Themes: ${metadata.themes}
    Character Arcs: ${metadata.characterArcs}
    Stylistic Goals: ${metadata.styleGoals}
    Comedic Elements: ${metadata.comedy}

    ${configPrompt}

    *** KEY PLOT OUTLINE (BEAT SHEET) ***
    Use this as the roadmap for the expansion structure:
    ${beatSheetText}

    *** CRITICAL: LITERARY DNA & STYLE CONSTRAINT ***
    The following is the detected style DNA of the author. You MUST adhere to this voice strictly:
    ${metadata.styleAnalysis}

    *** CRITICAL: WORD COUNT CONSTRAINT ***
    You must strictly write between ${metadata.minWordCount} and ${metadata.maxWordCount} words for this expansion. 
    Do not stop short. Do not excessively ramble beyond the limit.

    *** CRITICAL: NO REPETITION ***
    You are generating the start of the book. 
    Do not simply repeat the source text provided below. 
    Use the source text as a seed, but expand it, deepen it, and rewrite it to meet the style goals. 
    Do not output the source text verbatim.
    
    *** CRITICAL: FORMATTING ***
    OUTPUT PLAIN TEXT OR MARKDOWN ONLY. DO NOT USE HTML TAGS. STRIP ALL CSS/HTML.

    Here is the source text for the first chapter/segment to expand:
    "${firstChunk}"

    *** REQUIRED OUTPUT ***
    1. The expanded chapter text.
    2. The separator: |||STRATEGIC_SPLIT|||
    3. Exactly 4 valid JSON choices (A, B, C, D) for the direction of the NEXT segment/chapter.
  `;

  return await ai.models.generateContentStream({
    model: 'gemini-3-pro-preview',
    contents: prompt,
    config: {
      systemInstruction: LEA_SYSTEM_PROMPT,
      temperature: 0.8, 
    }
  });
};

export const generateNextChapter = async (
  metadata: NovelMetadata,
  storyHistory: string,
  userChoice: string,
  customInstructions: string,
  nextChunk: string,
  isNewChapter: boolean
): Promise<AsyncIterable<GenerateContentResponse>> => {
  const ai = getClient();
  
  const structureInstruction = isNewChapter 
    ? "START A NEW CHAPTER. You may assume a time jump, location change, or scene shift as appropriate."
    : "CONTINUE THE CURRENT CHAPTER. Pick up immediately after the previous context without a hard break. Connect the scenes fluidly.";

  const configPrompt = formatConfigForPrompt(metadata.config);
  
  // Apply rolling window if necessary
  const managedContext = manageContextWindow(storyHistory);

  const prompt = `
    CONTINUATION PHASE.
    
    Current Structural Goal: ${structureInstruction}

    ${configPrompt}

    *** CRITICAL: LITERARY DNA & STYLE CONSTRAINT ***
    Maintain strict adherence to this style profile:
    ${metadata.styleAnalysis}

    *** CRITICAL: WORD COUNT CONSTRAINT ***
    You must strictly write between ${metadata.minWordCount} and ${metadata.maxWordCount} words for this expansion.

    *** CRITICAL: STORY CONTINUITY (MEMORY) ***
    Below is the story so far. You must maintain perfect continuity with these events, character states, and established facts.
    
    STORY SO FAR (FULL CONTEXT):
    "${managedContext}"
    
    (END OF PREVIOUS CONTEXT)

    User Selection for next path: ${userChoice}
    User Custom Instructions: ${customInstructions}

    SOURCE MATERIAL TO EXPAND (THIS IS THE *NEW* CONTENT TO ADAPT):
    "${nextChunk}"

    Instructions:
    1. Ingest the "SOURCE MATERIAL".
    2. Adapt it into the narrative following the "STORY SO FAR".
    3. Ensure the events differ from the "STORY SO FAR" (Do not repeat events that have already happened). 
    4. If the Source Material looks identical to the immediate previous context, you must ADVANCE the plot beyond it.
    
    *** CRITICAL: FORMATTING ***
    OUTPUT PLAIN TEXT OR MARKDOWN ONLY. DO NOT USE HTML TAGS. STRIP ALL CSS/HTML.

    *** REQUIRED OUTPUT ***
    1. The expanded chapter text.
    2. The separator: |||STRATEGIC_SPLIT|||
    3. Exactly 4 valid JSON choices (A, B, C, D) for the direction of the NEXT segment/chapter.
  `;

  return await ai.models.generateContentStream({
    model: 'gemini-3-pro-preview',
    contents: prompt,
    config: {
      systemInstruction: LEA_SYSTEM_PROMPT,
      temperature: 0.8,
    }
  });
};

export const refineChapter = async (
  chapterText: string,
  refinementInstructions: string,
  styleDNA: string,
  storyHistory: string // Added to ensure continuity during refinement
): Promise<AsyncIterable<GenerateContentResponse>> => {
  const ai = getClient();
  const wordCount = chapterText.split(/\s+/).length;
  
  // Manage context window for the refinement pass as well
  const managedContext = manageContextWindow(storyHistory);

  const prompt = REFINEMENT_PROMPT_TEMPLATE
    .replace('{{STYLE_DNA}}', styleDNA)
    .replace('{{CHAPTER_TEXT}}', chapterText)
    .replace('{{REFINEMENT_GOALS}}', refinementInstructions)
    .replace('{{WORD_COUNT}}', wordCount.toString())
    + `\n\nCONTEXT FOR CONTINUITY:\n${managedContext.slice(-20000)}` 
    + `\n\nCRITICAL: OUTPUT PLAIN TEXT ONLY. NO HTML.`;

  return await ai.models.generateContentStream({
    model: 'gemini-3-pro-preview',
    contents: prompt,
    config: {
      temperature: 0.7, 
    }
  });
};