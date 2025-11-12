/**
 * Text processing utilities for Edge Functions
 */

/**
 * Chunk text into smaller pieces for embedding
 * @param text The text to chunk
 * @param maxChunkSize Maximum characters per chunk
 * @param overlap Number of characters to overlap between chunks
 */
export function chunkText(
  text: string,
  maxChunkSize: number = 1000,
  overlap: number = 200
): string[] {
  const chunks: string[] = [];
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);

  let currentChunk = '';

  for (const sentence of sentences) {
    const trimmedSentence = sentence.trim();

    if (currentChunk.length + trimmedSentence.length + 1 <= maxChunkSize) {
      currentChunk += (currentChunk ? '. ' : '') + trimmedSentence;
    } else {
      if (currentChunk) {
        chunks.push(currentChunk + '.');
      }
      currentChunk = trimmedSentence;
    }
  }

  if (currentChunk) {
    chunks.push(currentChunk + '.');
  }

  // Add overlap between chunks for better context
  const overlappedChunks: string[] = [];
  for (let i = 0; i < chunks.length; i++) {
    if (i === 0) {
      overlappedChunks.push(chunks[i]);
    } else {
      // Add last part of previous chunk to current chunk
      const prevChunk = chunks[i - 1];
      const overlapText = prevChunk.slice(-overlap);
      overlappedChunks.push(overlapText + ' ' + chunks[i]);
    }
  }

  return overlappedChunks;
}

/**
 * Clean and normalize text
 */
export function cleanText(text: string): string {
  return text
    .replace(/\s+/g, ' ') // Normalize whitespace
    .replace(/\n{3,}/g, '\n\n') // Normalize line breaks
    .replace(/[^\S\n]+/g, ' ') // Remove extra spaces but keep newlines
    .trim();
}

/**
 * Extract text from HTML
 */
export function extractTextFromHTML(html: string): string {
  // Remove script and style tags
  let text = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  text = text.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');

  // Remove HTML tags
  text = text.replace(/<[^>]+>/g, ' ');

  // Decode HTML entities
  text = text.replace(/&nbsp;/g, ' ');
  text = text.replace(/&amp;/g, '&');
  text = text.replace(/&lt;/g, '<');
  text = text.replace(/&gt;/g, '>');
  text = text.replace(/&quot;/g, '"');
  text = text.replace(/&#39;/g, "'");

  return cleanText(text);
}

/**
 * Calculate readability metrics
 */
export function calculateReadabilityMetrics(text: string): {
  avgSentenceLength: number;
  avgWordLength: number;
  questionRate: number;
  exclamationRate: number;
} {
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const words = text.split(/\s+/).filter(w => w.length > 0);
  const questions = (text.match(/\?/g) || []).length;
  const exclamations = (text.match(/!/g) || []).length;

  return {
    avgSentenceLength: sentences.length > 0 ? words.length / sentences.length : 0,
    avgWordLength: words.length > 0
      ? words.reduce((sum, w) => sum + w.length, 0) / words.length
      : 0,
    questionRate: words.length > 0 ? (questions / words.length) * 1000 : 0,
    exclamationRate: words.length > 0 ? (exclamations / words.length) * 1000 : 0,
  };
}

/**
 * Extract common phrases from text
 */
export function extractCommonPhrases(text: string, minLength: number = 3, maxCount: number = 10): string[] {
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const phrases: Map<string, number> = new Map();

  for (const sentence of sentences) {
    const words = sentence.toLowerCase().trim().split(/\s+/);

    // Extract n-grams
    for (let n = minLength; n <= Math.min(5, words.length); n++) {
      for (let i = 0; i <= words.length - n; i++) {
        const phrase = words.slice(i, i + n).join(' ');
        phrases.set(phrase, (phrases.get(phrase) || 0) + 1);
      }
    }
  }

  // Sort by frequency and return top phrases
  return Array.from(phrases.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, maxCount)
    .map(([phrase]) => phrase);
}
