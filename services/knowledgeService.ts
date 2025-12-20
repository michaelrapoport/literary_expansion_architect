
import { LoreEntry, CharacterStatus, Chapter } from '../types';

// Simple client-side RAG: Find lore entries mentioned in the upcoming beat or recent text
export const retrieveContext = (
    currentText: string, 
    lore: LoreEntry[], 
    characters: CharacterStatus[]
): string => {
    const relevantLore = lore.filter(entry => 
        currentText.toLowerCase().includes(entry.key.toLowerCase()) || 
        entry.tags.some(tag => currentText.toLowerCase().includes(tag.toLowerCase()))
    );

    const relevantChars = characters.filter(char => 
        currentText.toLowerCase().includes(char.name.toLowerCase())
    );

    let context = "";

    if (relevantLore.length > 0) {
        context += "\n*** LORE DATABASE (RELEVANT ENTRIES) ***\n";
        relevantLore.forEach(l => {
            context += `- ${l.key} (${l.category}): ${l.description}\n`;
        });
    }

    if (relevantChars.length > 0) {
        context += "\n*** CHARACTER STATUS ***\n";
        relevantChars.forEach(c => {
            context += `- ${c.name}: Currently at ${c.location}. Goal: ${c.goal}. Status: ${c.status}.\n`;
        });
    }

    return context;
};
