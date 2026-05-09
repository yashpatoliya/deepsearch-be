// ============================================================
// src/modules/ai/tfidf.ts — TF-IDF keyword extraction
// ============================================================

import { tokenize } from '../../utils/textUtils.js';
import type { TfIdfResult } from '../../types/index.js';

/**
 * Compute TF (Term Frequency) for a document.
 */
function computeTF(tokens: string[]): Map<string, number> {
  const freq = new Map<string, number>();
  for (const token of tokens) {
    freq.set(token, (freq.get(token) ?? 0) + 1);
  }
  // Normalize by total terms
  for (const [term, count] of freq) {
    freq.set(term, count / tokens.length);
  }
  return freq;
}

/**
 * Compute IDF (Inverse Document Frequency) across all documents.
 */
function computeIDF(documents: string[][]): Map<string, number> {
  const docCount = documents.length;
  const termDocCount = new Map<string, number>();

  for (const doc of documents) {
    const uniqueTerms = new Set(doc);
    for (const term of uniqueTerms) {
      termDocCount.set(term, (termDocCount.get(term) ?? 0) + 1);
    }
  }

  const idf = new Map<string, number>();
  for (const [term, count] of termDocCount) {
    idf.set(term, Math.log(docCount / (1 + count)) + 1);
  }
  return idf;
}

/**
 * Extract top keywords from a collection of texts using TF-IDF.
 */
export function extractKeywords(texts: string[], topN = 10): TfIdfResult[] {
  if (texts.length === 0) return [];

  const tokenizedDocs = texts.map((t) => tokenize(t));
  const idf = computeIDF(tokenizedDocs);

  // Aggregate TF-IDF scores across all documents
  const aggregatedScores = new Map<string, number>();

  for (const doc of tokenizedDocs) {
    const tf = computeTF(doc);
    for (const [term, tfScore] of tf) {
      const idfScore = idf.get(term) ?? 0;
      const tfidf = tfScore * idfScore;
      aggregatedScores.set(term, (aggregatedScores.get(term) ?? 0) + tfidf);
    }
  }

  return Array.from(aggregatedScores.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, topN)
    .map(([term, score]) => ({ term, score }));
}

/**
 * Score a text against a list of query keywords.
 * Returns a relevance score between 0 and 1.
 */
export function scoreTextRelevance(text: string, queryTerms: string[]): number {
  if (!queryTerms.length || !text) return 0;
  const tokens = new Set(tokenize(text));
  const matches = queryTerms.filter((t) => tokens.has(t)).length;
  return matches / queryTerms.length;
}
