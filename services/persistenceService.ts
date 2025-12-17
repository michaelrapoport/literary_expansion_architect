
import { ProjectState } from '../types';

const DB_NAME = 'LEA_ProjectDB';
const STORE_NAME = 'projects';
const PROJECT_KEY = 'current_project';

export const initDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);

    request.onerror = (event) => reject('Database error');

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };

    request.onsuccess = (event) => {
      resolve((event.target as IDBOpenDBRequest).result);
    };
  });
};

export const saveProject = async (state: ProjectState): Promise<void> => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.put({ ...state, lastSaved: Date.now() }, PROJECT_KEY);

    request.onsuccess = () => resolve();
    request.onerror = () => reject('Save failed');
  });
};

export const loadProject = async (): Promise<ProjectState | null> => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.get(PROJECT_KEY);

    request.onsuccess = () => {
      resolve(request.result as ProjectState || null);
    };
    request.onerror = () => reject('Load failed');
  });
};

export const exportProjectToJson = (state: ProjectState) => {
  const dataStr = JSON.stringify(state, null, 2);
  const blob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `LEA_Project_${state.metadata.title.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

export const generateProjectHtml = (state: ProjectState): string => {
    let html = `
        <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
        <head><meta charset='utf-8'><title>${state.metadata.title}</title>
        <style>
            body { font-family: 'Times New Roman', serif; font-size: 12pt; line-height: 1.5; color: black; background: white; max-width: 800px; margin: 0 auto; padding: 20px;}
            h1 { font-size: 24pt; font-weight: bold; text-align: center; margin-bottom: 24pt; color: black; }
            h2 { font-size: 18pt; font-weight: bold; margin-top: 18pt; margin-bottom: 12pt; page-break-before: always; color: black; }
            p { margin-bottom: 12pt; text-indent: 0.5in; text-align: justify; }
        </style>
        </head><body>
    `;
    
    html += `<h1>${state.metadata.title}</h1>`;
    html += `<p style="text-align:center">by ${state.metadata.author}</p>`;
    
    state.chapters.forEach(chapter => {
        html += `<h2>${chapter.title}</h2>`;
        const paragraphs = chapter.content.split('\n\n');
        paragraphs.forEach(p => {
            if (p.trim()) html += `<p>${p}</p>`;
        });
    });
    
    html += `</body></html>`;
    return html;
};

export const exportProjectToDocxHtml = (state: ProjectState) => {
    const html = generateProjectHtml(state);
    const blob = new Blob([html], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${state.metadata.title || 'Novel'}.doc`; 
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
};
