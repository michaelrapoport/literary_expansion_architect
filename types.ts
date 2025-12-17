
export interface NovelMetadata {
  title: string;
  author: string;
  genre: string;
  synopsis: string;
  themes: string;
  characterArcs: string;
  styleGoals: string;
  comedy: string;
  minWordCount: number;
  maxWordCount: number;
  styleAnalysis?: string; // The extracted literary DNA
  beatSheet?: Beat[]; // The plot outline
  config?: GenerationConfig; // The engine parameters
}

export interface GenerationConfig {
  // --- Structure & Pacing ---
  expansionDepth: 'Micro' | 'Scene' | 'Chapter';
  pacingSpeed: 'Slow Burn' | 'Balanced' | 'Fast';
  narrativeFlow: 'Linear' | 'Non-Linear' | 'Branching';
  timeDilation: 'Real-time' | 'Compressed' | 'Expanded Moment' | 'Montage'; // NEW
  chapterStructure: 'Classic Arc' | 'Slice of Life' | 'Vignette' | 'Cliffhanger'; // NEW

  // --- Voice & Prose (New Section) ---
  tone: 'Dark/Gritty' | 'Light/Whimsical' | 'Academic/Formal' | 'Conversational';
  proseComplexity: 'Accessible' | 'Standard' | 'Baroque' | 'Experimental'; // NEW
  sentenceRhythm: 'Staccato' | 'Flowing' | 'Variable' | 'Repetitive'; // NEW
  vocabularyLevel: 'Simple' | 'College' | 'Archaic' | 'Esoteric'; // NEW
  metaphorFrequency: 'Sparse' | 'Moderate' | 'Dense' | 'Surreal'; // NEW

  // --- Narrative Mechanics ---
  pov: 'First Person' | 'Third Person Limited' | 'Third Person Omniscient' | 'Second Person';
  tense: 'Past' | 'Present' | 'Future'; // NEW
  narrativeDistance: 'Intimate' | 'Close' | 'Distant' | 'Cinematic'; // NEW
  narrativeReliability: 'Reliable' | 'Unreliable' | 'Naive' | 'Deceptive'; // NEW

  // --- Immersion ---
  sensoryDensity: 'High' | 'Medium' | 'Low';
  atmosphericFilter: 'Neutral' | 'Hopeful' | 'Oppressive' | 'Eerie' | 'Nostalgic'; // NEW

  // --- Character & Dialogue ---
  dialogueRatio: 'Dialogue Heavy' | 'Balanced' | 'Internal Monologue';
  characterAgency: 'Passive' | 'Active';
  relationshipDynamic: 'Cooperative' | 'Conflict-Driven';
  subtextLevel: 'On the Nose' | 'Balanced' | 'Deep Subtext' | 'Cryptic'; // NEW
  
  // --- World & Plot ---
  magicRules: 'Hard Rules' | 'Soft Rules';
  worldBuilding: 'Expository' | 'Integrated' | 'Minimal';
  conflictFocus: 'Internal' | 'Interpersonal' | 'Societal' | 'Elemental'; // NEW
  
  // --- Safety & Creativity ---
  creativity: 'Strict' | 'Interpretive' | 'Wild';
  rating: 'G' | 'PG-13' | 'R';
}

export interface Beat {
  id: string;
  description: string;
}

export interface Choice {
  id: string; 
  text: string;
  rationale: string;
  type: 'Character' | 'Subplot' | 'Theme' | 'Trope' | 'Other' | 'Pacing' | 'Chaos';
}

export interface Chapter {
  id: number;
  title: string;
  content: string;
  status: 'completed' | 'generating' | 'pending';
  summary?: string; // For RAG/Context
  lastModified?: number;
  // Versioning
  history?: string[]; 
  currentVersionIndex?: number;
  pacingScore?: number; // 1-10 Tension scale
}

export interface RefinementOption {
  id: string;
  label: string;
  description: string;
  icon: string;
}

export interface ModelConfiguration {
  provider: 'Google';
  analysisModel: string;
  draftingModel: string;
}

export interface AIModel {
  id: string;
  name: string;
  description: string;
}

export interface LoreEntry {
  id: string;
  key: string; 
  category: 'Character' | 'Location' | 'Item' | 'History';
  description: string;
  tags: string[];
}

export interface CharacterStatus {
  id: string;
  name: string;
  status: 'Alive' | 'Dead' | 'Missing' | 'Unknown';
  location: string;
  goal: string;
  inventory: string[];
  avatarUrl?: string; 
}

export interface SessionAnalytics {
  startTime: number;
  wordsGenerated: number;
  editingTimeSeconds: number;
  sessionsCount: number;
}

export interface ProjectState {
  metadata: NovelMetadata;
  chapters: Chapter[];
  lore: LoreEntry[];
  characters: CharacterStatus[];
  analytics: SessionAnalytics;
  lastSaved: number;
}

export enum AppState {
  UPLOAD = 'UPLOAD',
  DETECTING_METADATA = 'DETECTING_METADATA',
  SETUP = 'SETUP',
  CONFIGURATION = 'CONFIGURATION',
  GENERATING_BEATS = 'GENERATING_BEATS',
  BEAT_SHEET = 'BEAT_SHEET',
  ANALYZING = 'ANALYZING',
  PROCESSING = 'PROCESSING',
  REFINEMENT_SELECTION = 'REFINEMENT_SELECTION',
  REFINING = 'REFINING',
  DECISION = 'DECISION',
  FINISHED = 'FINISHED'
}

export interface GenerationResponse {
  expandedText: string;
  choices: Choice[];
}

// New Types
export interface ChatMessage {
    id: string;
    sender: 'user' | 'ai';
    text: string;
    timestamp: number;
}

export interface CritiquePoint {
    id: string;
    quote: string;
    comment: string;
    type: 'Pacing' | 'Prose' | 'Logic' | 'Character';
}
