// ============================================================
// src/utils/urlUtils.ts — URL normalization and validation
// ============================================================

import { URL } from 'url';

// Domains that are known ads, spam, or low-quality
const BLOCKED_DOMAINS = new Set([
  'ads.google.com',
  'doubleclick.net',
  'googlesyndication.com',
  'amazon-adsystem.com',
  'facebook.com/ads',
  'outbrain.com',
  'taboola.com',
  'revcontent.com',
  'mgid.com',
  'adskeeper.co.uk',
  'clksite.com',
  'bit.ly',
  'tinyurl.com',
  'ow.ly',
]);

// Social platforms for profile detection
const SOCIAL_PLATFORMS: Record<string, string> = {
  'twitter.com': 'Twitter/X',
  'x.com': 'Twitter/X',
  'linkedin.com': 'LinkedIn',
  'instagram.com': 'Instagram',
  'facebook.com': 'Facebook',
  'github.com': 'GitHub',
  'youtube.com': 'YouTube',
  'reddit.com': 'Reddit',
  'wikipedia.org': 'Wikipedia',
  'crunchbase.com': 'Crunchbase',
  'bloomberg.com': 'Bloomberg',
  'forbes.com': 'Forbes',
  'medium.com': 'Medium',
};

// Trusted/credible domains get a boost in ranking
const CREDIBLE_DOMAINS = new Set([
  'wikipedia.org',
  'reuters.com',
  'apnews.com',
  'bbc.com',
  'bbc.co.uk',
  'nytimes.com',
  'washingtonpost.com',
  'theguardian.com',
  'bloomberg.com',
  'forbes.com',
  'ft.com',
  'economist.com',
  'nature.com',
  'science.org',
  'pubmed.ncbi.nlm.nih.gov',
  'scholar.google.com',
  'gov',
  'edu',
  'ac.uk',
  'github.com',
  'stackoverflow.com',
  'medium.com',
  'techcrunch.com',
  'wired.com',
  'theverge.com',
]);

export function normalizeUrl(rawUrl: string): string | null {
  try {
    const url = new URL(rawUrl);
    // Only allow http/https
    if (!['http:', 'https:'].includes(url.protocol)) return null;
    // Remove tracking parameters
    const trackingParams = [
      'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content',
      'fbclid', 'gclid', 'msclkid', 'ref', 'source', '_ga',
    ];
    trackingParams.forEach((p) => url.searchParams.delete(p));
    // Lowercase the host
    url.hostname = url.hostname.toLowerCase();
    // Remove trailing slash from pathname if not root
    if (url.pathname !== '/' && url.pathname.endsWith('/')) {
      url.pathname = url.pathname.slice(0, -1);
    }
    return url.toString();
  } catch {
    return null;
  }
}

export function extractDomain(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return '';
  }
}

export function isBlockedDomain(url: string): boolean {
  const domain = extractDomain(url);
  for (const blocked of BLOCKED_DOMAINS) {
    if (domain === blocked || domain.endsWith(`.${blocked}`)) return true;
  }
  return false;
}

export function isCredibleDomain(url: string): boolean {
  const domain = extractDomain(url);
  for (const credible of CREDIBLE_DOMAINS) {
    if (domain === credible || domain.endsWith(`.${credible}`)) return true;
  }
  return false;
}

export function detectSocialPlatform(
  url: string
): { platform: string; url: string; username?: string } | null {
  const domain = extractDomain(url);
  const platform = SOCIAL_PLATFORMS[domain];
  if (!platform) return null;

  let username: string | undefined;
  try {
    const parsed = new URL(url);
    const parts = parsed.pathname.split('/').filter(Boolean);
    if (parts.length >= 1 && !['watch', 'search', 'hashtag'].includes(parts[0]!)) {
      username = parts[0];
    }
  } catch {
    // ignore
  }

  return { platform, url, username };
}

export function isSsrfSafe(url: string): boolean {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname;
    // Block private IP ranges and localhost
    const privateRanges = [
      /^localhost$/i,
      /^127\./,
      /^10\./,
      /^172\.(1[6-9]|2\d|3[01])\./,
      /^192\.168\./,
      /^::1$/,
      /^fd[0-9a-f]{2}:/i,
      /^0\.0\.0\.0$/,
    ];
    for (const pattern of privateRanges) {
      if (pattern.test(host)) return false;
    }
    return true;
  } catch {
    return false;
  }
}

export function deduplicateUrls(urls: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const url of urls) {
    const normalized = normalizeUrl(url);
    if (normalized && !seen.has(normalized)) {
      seen.add(normalized);
      result.push(normalized);
    }
  }
  return result;
}
