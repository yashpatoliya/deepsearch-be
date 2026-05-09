// ============================================================
// src/__tests__/tfidf.test.ts
// ============================================================

import { describe, it, expect } from 'vitest';
import { extractKeywords, scoreTextRelevance } from '../modules/ai/tfidf.js';

describe('extractKeywords', () => {
  it('returns top keywords from documents', () => {
    const texts = [
      'Elon Musk founded SpaceX and Tesla. SpaceX launches rockets to space.',
      'Tesla makes electric vehicles. Elon Musk is the CEO of Tesla.',
      'SpaceX is a private aerospace company founded by Elon Musk.',
    ];
    const keywords = extractKeywords(texts, 5);
    expect(keywords.length).toBeLessThanOrEqual(5);
    // Each keyword should have a term and score
    keywords.forEach((kw) => {
      expect(kw).toHaveProperty('term');
      expect(kw).toHaveProperty('score');
      expect(typeof kw.term).toBe('string');
      expect(typeof kw.score).toBe('number');
    });
  });

  it('returns empty array for empty input', () => {
    expect(extractKeywords([], 5)).toEqual([]);
  });

  it('scores are positive', () => {
    const texts = ['machine learning deep learning neural networks'];
    const keywords = extractKeywords(texts, 3);
    keywords.forEach((kw) => expect(kw.score).toBeGreaterThan(0));
  });
});

describe('scoreTextRelevance', () => {
  it('returns high score when all query terms match', () => {
    const text = 'Elon Musk founded Tesla and SpaceX companies';
    const queryTerms = ['elon', 'musk', 'tesla'];
    const score = scoreTextRelevance(text, queryTerms);
    expect(score).toBeGreaterThan(0.5);
  });

  it('returns 0 for empty query terms', () => {
    expect(scoreTextRelevance('some text', [])).toBe(0);
  });

  it('returns 0 for empty text', () => {
    expect(scoreTextRelevance('', ['test'])).toBe(0);
  });

  it('returns score between 0 and 1', () => {
    const score = scoreTextRelevance('hello world', ['hello', 'missing', 'world']);
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(1);
  });
});
