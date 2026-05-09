// ============================================================
// src/modules/ai/summarizer.ts — Extractive summarization
// ============================================================

import { splitSentences, tokenize } from '../../utils/textUtils.js';
import { scoreTextRelevance } from './tfidf.js';
import config from '../../config/index.js';

interface SummarizationResult {
  summary: string;
  keyPoints: string[];
}

/**
 * Score a sentence based on query relevance and position.
 */
function scoreSentence(
  sentence: string,
  index: number,
  total: number,
  queryTerms: string[],
  docFrequencies: Map<string, number>
): number {
  let score = 0;

  // Query term relevance (most important)
  score += scoreTextRelevance(sentence, queryTerms) * 5;

  // Word frequency score
  const tokens = tokenize(sentence);
  const freqScore = tokens.reduce((sum, t) => sum + (docFrequencies.get(t) ?? 0), 0);
  score += Math.min(freqScore / Math.max(tokens.length, 1), 2);

  // Position bonus: first and last sentences often contain key info
  if (index === 0) score += 1.5;
  else if (index === 1) score += 0.8;
  else if (index === total - 1) score += 0.5;

  // Length preference: prefer medium-length sentences
  const wordCount = tokens.length;
  if (wordCount >= 10 && wordCount <= 35) score += 0.5;

  // Presence of numbers/dates often indicates factual content
  if (/\d{4}|\$[\d,]+|\d+%/.test(sentence)) score += 0.3;

  return score;
}

/**
 * Build word frequency map across all content.
 */
function buildFrequencyMap(texts: string[]): Map<string, number> {
  const freq = new Map<string, number>();
  for (const text of texts) {
    for (const token of tokenize(text)) {
      freq.set(token, (freq.get(token) ?? 0) + 1);
    }
  }
  return freq;
}

/**
 * Generate an extractive summary and key points from scraped content.
 */
export function generateSummary(
  query: string,
  contents: string[]
): SummarizationResult {
  if (contents.length === 0) {
    return { summary: '', keyPoints: [] };
  }

  const queryTerms = tokenize(query);
  const docFrequencies = buildFrequencyMap(contents);

  // Collect all sentences from all documents
  const allSentences: Array<{ text: string; score: number; docIndex: number }> = [];

  for (let docIdx = 0; docIdx < contents.length; docIdx++) {
    const sentences = splitSentences(contents[docIdx]!);
    for (let i = 0; i < sentences.length; i++) {
      const sentence = sentences[i]!;
      if (sentence.length < 30 || sentence.length > 600) continue;
      const score = scoreSentence(
        sentence,
        i,
        sentences.length,
        queryTerms,
        docFrequencies
      );
      allSentences.push({ text: sentence, score, docIndex: docIdx });
    }
  }

  // Sort by score descending
  allSentences.sort((a, b) => b.score - a.score);

  // Select top sentences for summary (maintain reading order from top doc)
  const summaryCount = config.ai.summaryMaxSentences;
  const topSentences = allSentences.slice(0, summaryCount * 2);

  // Sort selected sentences by their original position to maintain flow
  topSentences.sort((a, b) => a.docIndex - b.docIndex);
  const summarySentences = topSentences.slice(0, summaryCount);

  const summary = summarySentences.map((s) => s.text).join(' ');

  // Key points: next best sentences not already in summary
  const keyPointCandidates = allSentences.filter(
    (s) => !summarySentences.includes(s) && s.score > 0.5
  );

  const keyPoints = keyPointCandidates
    .slice(0, config.ai.keyPointsCount)
    .map((s) => {
      // Clean up and format as bullet-friendly text
      let text = s.text.trim();
      if (text.endsWith('.')) text = text.slice(0, -1);
      return text;
    });

  return { summary, keyPoints };
}
