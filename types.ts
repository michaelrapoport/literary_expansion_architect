
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
  // 1. Structural & Pacing
  expansionDepth: 'Micro' | 'Scene' | 'Chapter';
  pacingSpeed: 'Slow Burn' | 'Balanced' | 'Fast';
  narrativeFlow: 'Linear' | 'Non-Linear' | 'Branching';
  
  // 2. Stylistic & Tonal
  tone: 'Dark/Gritty' | 'Light/Whimsical' | 'Academic/Formal' | 'Conversational';
  pov: 'First Person' | 'Third Person Limited' | 'Third Person Omniscient' | 'Second Person';
  sensoryDensity: 'High' | 'Medium' | 'Low';
  
  // 3. Character & Dialogue
  dialogueRatio: 'Dialogue Heavy' | 'Balanced' | 'Internal Monologue';
  characterAgency: 'Passive' | 'Active';
  relationshipDynamic: 'Cooperative' | 'Conflict-Driven';
  
  // 4. World & Setting
  magicRules: 'Hard Rules' | 'Soft Rules';
  worldBuilding: 'Expository' | 'Integrated' | 'Minimal';
  
  // 5. Content & Creativity
  creativity: 'Strict' | 'Interpretive' | 'Wild';
  rating: 'G' | 'PG-13' | 'R';
}

export interface Beat {
  id: string;
  description: string;
}

export interface Choice {
  id: string; // 'A', 'B', 'C', 'D'
  text: string;
  rationale: string;
  type: 'Character' | 'Subplot' | 'Theme' | 'Trope' | 'Other';
}

export interface Chapter {
  id: number;
  title: string;
  content: string;
  isExpanding?: boolean;
}

export interface RefinementOption {
  id: string;
  label: string;
  description: string;
  icon: string; // Lucide icon name
}

export enum AppState {
  UPLOAD = 'UPLOAD',
  DETECTING_METADATA = 'DETECTING_METADATA', // Auto-fill setup
  SETUP = 'SETUP', // Review metadata
  CONFIGURATION = 'CONFIGURATION', // New Phase: Fine-tuning parameters
  GENERATING_BEATS = 'GENERATING_BEATS', // Auto-create beat sheet
  BEAT_SHEET = 'BEAT_SHEET', // Review beat sheet
  ANALYZING = 'ANALYZING', // Style analysis
  PROCESSING = 'PROCESSING', // Analyzing and writing
  REFINEMENT_SELECTION = 'REFINEMENT_SELECTION', // Choosing how to improve current chapter
  REFINING = 'REFINING', // Applying improvements
  DECISION = 'DECISION', // Waiting for user input
  FINISHED = 'FINISHED'
}

export interface GenerationResponse {
  expandedText: string;
  choices: Choice[];
}
