// ============================================================
// src/utils/textUtils.ts — Text helpers
// ============================================================

/**
 * Split text into sentences using a simple regex-based splitter.
 * Handles common abbreviations to reduce false splits.
 */
export function splitSentences(text: string): string[] {
  // Replace known abbreviations to prevent false sentence splits
  const protected_text = text
    .replace(/\bMr\./g, 'Mr_')
    .replace(/\bMrs\./g, 'Mrs_')
    .replace(/\bMs\./g, 'Ms_')
    .replace(/\bDr\./g, 'Dr_')
    .replace(/\bProf\./g, 'Prof_')
    .replace(/\bSt\./g, 'St_')
    .replace(/\bJr\./g, 'Jr_')
    .replace(/\bSr\./g, 'Sr_')
    .replace(/\bvs\./g, 'vs_')
    .replace(/\betc\./g, 'etc_')
    .replace(/\bi\.e\./g, 'i_e_')
    .replace(/\be\.g\./g, 'e_g_');

  const raw = protected_text.split(/(?<=[.!?])\s+(?=[A-Z])/);
  return raw
    .map((s) =>
      s
        .replace(/Mr_/g, 'Mr.')
        .replace(/Mrs_/g, 'Mrs.')
        .replace(/Ms_/g, 'Ms.')
        .replace(/Dr_/g, 'Dr.')
        .replace(/Prof_/g, 'Prof.')
        .replace(/St_/g, 'St.')
        .replace(/Jr_/g, 'Jr.')
        .replace(/Sr_/g, 'Sr.')
        .replace(/vs_/g, 'vs.')
        .replace(/etc_/g, 'etc.')
        .replace(/i_e_/g, 'i.e.')
        .replace(/e_g_/g, 'e.g.')
        .trim()
    )
    .filter((s) => s.length > 20);
}

/**
 * Tokenize text into words, removing stopwords.
 */
const STOP_WORDS = new Set([
  'a', 'an', 'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
  'of', 'with', 'by', 'from', 'up', 'about', 'into', 'through', 'after',
  'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had',
  'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might',
  'shall', 'can', 'need', 'dare', 'ought', 'used', 'it', 'its', 'this',
  'that', 'these', 'those', 'i', 'me', 'my', 'myself', 'we', 'our', 'ours',
  'you', 'your', 'he', 'him', 'his', 'she', 'her', 'they', 'them', 'their',
  'what', 'which', 'who', 'whom', 'when', 'where', 'why', 'how', 'all',
  'each', 'every', 'both', 'few', 'more', 'most', 'other', 'some', 'such',
  'no', 'not', 'only', 'same', 'so', 'than', 'too', 'very', 's', 't',
  'just', 'don', 'as', 'if', 'then', 'there', 'also', 'been',
]);

export function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s'-]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOP_WORDS.has(w));
}

/**
 * Trim content to a maximum character count, cutting at the last full sentence.
 */
export function trimContent(text: string, maxChars: number): string {
  if (text.length <= maxChars) return text;
  const truncated = text.slice(0, maxChars);
  const lastPeriod = truncated.lastIndexOf('.');
  return lastPeriod > maxChars * 0.7 ? truncated.slice(0, lastPeriod + 1) : truncated;
}

/**
 * Strip HTML tags from a string.
 */
export function stripHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/\s{2,}/g, ' ')
    .trim();
}

/**
 * Detect if text is primarily in English using a heuristic.
 * Returns true if English, false otherwise.
 */
export function isEnglishText(text: string): boolean {
  const sample = text.slice(0, 500).toLowerCase();
  const commonEnglishWords = ['the', 'is', 'in', 'and', 'of', 'to', 'a', 'that', 'it', 'for'];
  const wordCount = commonEnglishWords.filter((w) =>
    new RegExp(`\\b${w}\\b`).test(sample)
  ).length;
  return wordCount >= 3;
}

/**
 * Calculate cosine similarity between two token arrays.
 * Used for deduplication.
 */
export function cosineSimilarity(a: string[], b: string[]): number {
  const setA = new Map<string, number>();
  const setB = new Map<string, number>();
  for (const t of a) setA.set(t, (setA.get(t) ?? 0) + 1);
  for (const t of b) setB.set(t, (setB.get(t) ?? 0) + 1);

  let dot = 0;
  let magA = 0;
  let magB = 0;

  for (const [term, countA] of setA) {
    const countB = setB.get(term) ?? 0;
    dot += countA * countB;
    magA += countA * countA;
  }
  for (const [, countB] of setB) {
    magB += countB * countB;
  }

  if (magA === 0 || magB === 0) return 0;
  return dot / (Math.sqrt(magA) * Math.sqrt(magB));
}
