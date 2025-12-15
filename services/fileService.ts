declare global {
  interface Window {
    pdfjsLib: any;
  }
}

export const readFileContent = async (file: File): Promise<string> => {
  const fileType = file.type;
  const fileName = file.name.toLowerCase();

  if (fileType === 'application/pdf' || fileName.endsWith('.pdf')) {
    return readPdfFile(file);
  } else if (fileType === 'text/html' || fileName.endsWith('.html')) {
    return readHtmlFile(file);
  } else if (
    fileType === 'text/plain' ||
    fileType === 'text/markdown' ||
    fileName.endsWith('.txt') ||
    fileName.endsWith('.md')
  ) {
    return readTextFile(file);
  } else {
    throw new Error('Unsupported file type. Please upload PDF, TXT, MD, or HTML.');
  }
};

const readTextFile = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target?.result as string);
    reader.onerror = (e) => reject(e);
    reader.readAsText(file);
  });
};

const readHtmlFile = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const htmlContent = e.target?.result as string;
      const parser = new DOMParser();
      const doc = parser.parseFromString(htmlContent, 'text/html');
      // Extract text content, preserving some structure with line breaks
      // A simple strategy is to replace <br> and block elements with newlines before getting textContent
      const body = doc.body;
      const text = body.innerText || body.textContent || "";
      resolve(text);
    };
    reader.onerror = (e) => reject(e);
    reader.readAsText(file);
  });
};

const readPdfFile = async (file: File): Promise<string> => {
  if (!window.pdfjsLib) {
    throw new Error('PDF library not loaded.');
  }

  const arrayBuffer = await file.arrayBuffer();
  const pdf = await window.pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  let fullText = '';

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const pageText = textContent.items.map((item: any) => item.str).join(' ');
    fullText += pageText + '\n\n';
  }

  return fullText;
};

// Helper to chunk text roughly by chapters or length
export const splitIntoSourceChunks = (text: string, roughWordCount = 1000): string[] => {
  // Try to split by "Chapter" headers first
  const chapterRegex = /\n\s*(Chapter|CHAPTER)\s+\d+/;
  if (chapterRegex.test(text)) {
     // Simplistic split, preserving headers
     const parts = text.split(chapterRegex);
     // Reconstruct is tricky with split, let's use a simpler length-based approach if headers are inconsistent
     // Or just split by double newlines and group until we hit a limit.
  }

  // Fallback: Group by paragraphs until word count limit
  const paragraphs = text.split(/\n\s*\n/);
  const chunks: string[] = [];
  let currentChunk = '';
  
  for (const para of paragraphs) {
    if ((currentChunk.split(/\s+/).length + para.split(/\s+/).length) > roughWordCount && currentChunk.length > 0) {
      chunks.push(currentChunk);
      currentChunk = '';
    }
    currentChunk += para + '\n\n';
  }
  if (currentChunk.trim().length > 0) {
    chunks.push(currentChunk);
  }
  
  return chunks;
};