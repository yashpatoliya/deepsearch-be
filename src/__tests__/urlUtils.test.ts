// ============================================================
// src/__tests__/urlUtils.test.ts
// ============================================================

import { describe, it, expect } from 'vitest';
import {
  normalizeUrl,
  extractDomain,
  isBlockedDomain,
  isCredibleDomain,
  isSsrfSafe,
  detectSocialPlatform,
  deduplicateUrls,
} from '../utils/urlUtils.js';

describe('normalizeUrl', () => {
  it('strips UTM parameters', () => {
    const url = 'https://example.com/page?utm_source=google&utm_medium=cpc&content=test';
    const result = normalizeUrl(url);
    expect(result).toBe('https://example.com/page?content=test');
  });

  it('returns null for non-http protocols', () => {
    expect(normalizeUrl('ftp://example.com')).toBeNull();
    expect(normalizeUrl('javascript:alert(1)')).toBeNull();
  });

  it('lowercases hostname', () => {
    expect(normalizeUrl('HTTPS://Example.COM/path')).toBe('https://example.com/path');
  });

  it('removes trailing slash from non-root paths', () => {
    expect(normalizeUrl('https://example.com/page/')).toBe('https://example.com/page');
  });

  it('keeps root path slash', () => {
    expect(normalizeUrl('https://example.com/')).toBe('https://example.com/');
  });
});

describe('extractDomain', () => {
  it('extracts domain without www', () => {
    expect(extractDomain('https://www.reuters.com/article')).toBe('reuters.com');
  });

  it('handles non-www domains', () => {
    expect(extractDomain('https://github.com/user/repo')).toBe('github.com');
  });
});

describe('isBlockedDomain', () => {
  it('blocks known ad domains', () => {
    expect(isBlockedDomain('https://doubleclick.net/ad')).toBe(true);
    expect(isBlockedDomain('https://googlesyndication.com')).toBe(true);
  });

  it('allows legitimate domains', () => {
    expect(isBlockedDomain('https://reuters.com')).toBe(false);
    expect(isBlockedDomain('https://github.com')).toBe(false);
  });
});

describe('isCredibleDomain', () => {
  it('marks known credible domains', () => {
    expect(isCredibleDomain('https://wikipedia.org/wiki/Test')).toBe(true);
    expect(isCredibleDomain('https://reuters.com/article')).toBe(true);
    expect(isCredibleDomain('https://github.com/repo')).toBe(true);
  });

  it('does not mark unknown domains as credible', () => {
    expect(isCredibleDomain('https://randomsite.xyz')).toBe(false);
  });
});

describe('isSsrfSafe', () => {
  it('blocks localhost', () => {
    expect(isSsrfSafe('http://localhost:3000')).toBe(false);
    expect(isSsrfSafe('http://127.0.0.1:8080')).toBe(false);
  });

  it('blocks private IP ranges', () => {
    expect(isSsrfSafe('http://192.168.1.1')).toBe(false);
    expect(isSsrfSafe('http://10.0.0.1')).toBe(false);
    expect(isSsrfSafe('http://172.16.0.1')).toBe(false);
  });

  it('allows public URLs', () => {
    expect(isSsrfSafe('https://google.com')).toBe(true);
    expect(isSsrfSafe('https://github.com')).toBe(true);
  });
});

describe('detectSocialPlatform', () => {
  it('detects Twitter/X', () => {
    const result = detectSocialPlatform('https://x.com/elonmusk');
    expect(result).not.toBeNull();
    expect(result?.platform).toBe('Twitter/X');
    expect(result?.username).toBe('elonmusk');
  });

  it('detects LinkedIn', () => {
    const result = detectSocialPlatform('https://linkedin.com/in/johndoe');
    expect(result?.platform).toBe('LinkedIn');
    expect(result?.username).toBe('johndoe');
  });

  it('returns null for non-social URLs', () => {
    expect(detectSocialPlatform('https://randomsite.com')).toBeNull();
  });
});

describe('deduplicateUrls', () => {
  it('removes duplicate URLs', () => {
    const urls = [
      'https://example.com/page',
      'https://example.com/page?utm_source=google',
      'https://other.com/article',
    ];
    const result = deduplicateUrls(urls);
    expect(result).toHaveLength(2);
  });
});
