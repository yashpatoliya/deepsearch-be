// ============================================================
// src/__tests__/textUtils.test.ts
// ============================================================

import { describe, it, expect } from 'vitest';
import {
  splitSentences,
  tokenize,
  trimContent,
  stripHtml,
  isEnglishText,
  cosineSimilarity,
} from '../utils/textUtils.js';

describe('splitSentences', () => {
  it('splits text into sentences', () => {
    const text =
      'Elon Musk is a billionaire entrepreneur. He founded SpaceX in 2002. Tesla is also one of his ventures.';
    const result = splitSentences(text);
    expect(result.length).toBeGreaterThanOrEqual(2);
  });

  it('handles abbreviations correctly', () => {
    const text = 'Dr. Smith founded the company. Mr. Jones joined later.';
    const result = splitSentences(text);
    // Should not split at Dr. or Mr.
    expect(result.length).toBeLessThanOrEqual(3);
  });
});

describe('tokenize', () => {
  it('removes stopwords', () => {
    const tokens = tokenize('the quick brown fox jumps over the lazy dog');
    expect(tokens).not.toContain('the');
    expect(tokens).not.toContain('over');
  });

  it('lowercases all tokens', () => {
    const tokens = tokenize('Hello World TEST');
    tokens.forEach((t) => expect(t).toBe(t.toLowerCase()));
  });

  it('removes short words', () => {
    const tokens = tokenize('a an is to of');
    expect(tokens.length).toBe(0);
  });
});

describe('trimContent', () => {
  it('returns full content if under limit', () => {
    const text = 'Short text.';
    expect(trimContent(text, 1000)).toBe(text);
  });

  it('trims to last sentence boundary', () => {
    const text = 'First sentence. Second sentence. Third sentence.';
    const trimmed = trimContent(text, 35);
    expect(trimmed.endsWith('.')).toBe(true);
  });
});

describe('stripHtml', () => {
  it('removes HTML tags', () => {
    const html = '<p>Hello <strong>world</strong></p>';
    expect(stripHtml(html)).toBe('Hello world');
  });

  it('removes script tags', () => {
    const html = '<div>Content<script>alert("xss")</script>After</div>';
    const result = stripHtml(html);
    expect(result).not.toContain('alert');
    expect(result).toContain('Content');
  });

  it('decodes HTML entities', () => {
    const html = 'Hello &amp; World &lt;test&gt;';
    expect(stripHtml(html)).toContain('& World');
  });
});

describe('isEnglishText', () => {
  it('detects English text', () => {
    const text =
      'The quick brown fox jumps over the lazy dog. This is a standard English sentence.';
    expect(isEnglishText(text)).toBe(true);
  });
});

describe('cosineSimilarity', () => {
  it('returns 1 for identical token arrays', () => {
    const tokens = ['hello', 'world', 'test'];
    expect(cosineSimilarity(tokens, tokens)).toBeCloseTo(1, 2);
  });

  it('returns 0 for completely different arrays', () => {
    const a = ['apple', 'banana'];
    const b = ['car', 'truck'];
    expect(cosineSimilarity(a, b)).toBe(0);
  });

  it('returns value between 0 and 1 for partial overlap', () => {
    const a = ['hello', 'world', 'foo'];
    const b = ['hello', 'world', 'bar'];
    const sim = cosineSimilarity(a, b);
    expect(sim).toBeGreaterThan(0);
    expect(sim).toBeLessThan(1);
  });
});
