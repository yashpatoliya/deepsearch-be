// ============================================================
// src/modules/ai/entityExtractor.ts — Named entity extraction
// ============================================================

import { tokenize } from '../../utils/textUtils.js';
import type { Profile } from '../../types/index.js';
import { detectSocialPlatform } from '../../utils/urlUtils.js';

// Common social/professional platforms pattern in text
const PLATFORM_PATTERNS: Array<{ pattern: RegExp; platform: string }> = [
  { pattern: /twitter\.com\/([A-Za-z0-9_]+)/gi, platform: 'Twitter/X' },
  { pattern: /x\.com\/([A-Za-z0-9_]+)/gi, platform: 'Twitter/X' },
  { pattern: /linkedin\.com\/in\/([A-Za-z0-9_-]+)/gi, platform: 'LinkedIn' },
  { pattern: /instagram\.com\/([A-Za-z0-9_.]+)/gi, platform: 'Instagram' },
  { pattern: /github\.com\/([A-Za-z0-9_-]+)/gi, platform: 'GitHub' },
  { pattern: /youtube\.com\/(?:@|channel\/|user\/)([A-Za-z0-9_-]+)/gi, platform: 'YouTube' },
  { pattern: /facebook\.com\/([A-Za-z0-9.]+)/gi, platform: 'Facebook' },
  { pattern: /crunchbase\.com\/person\/([A-Za-z0-9-]+)/gi, platform: 'Crunchbase' },
];

/**
 * Extract social/professional profiles from raw URLs.
 */
export function extractProfilesFromUrls(urls: string[]): Profile[] {
  const profiles: Profile[] = [];
  const seenPlatforms = new Set<string>();

  for (const url of urls) {
    const detected = detectSocialPlatform(url);
    if (detected && !seenPlatforms.has(`${detected.platform}:${url}`)) {
      seenPlatforms.add(`${detected.platform}:${url}`);
      profiles.push(detected);
    }
  }

  return profiles;
}

/**
 * Extract potential profile URLs from page content using regex patterns.
 */
export function extractProfilesFromContent(
  content: string,
  baseUrl: string
): Profile[] {
  const profiles: Profile[] = [];
  const seen = new Set<string>();

  for (const { pattern, platform } of PLATFORM_PATTERNS) {
    const matches = content.matchAll(pattern);
    for (const match of matches) {
      const username = match[1];
      if (!username || username.length < 2) continue;
      // Reconstruct clean profile URL
      const cleanPlatform = platform.toLowerCase().replace('/x', '').replace('twitter', 'twitter');
      let profileUrl = '';
      if (platform === 'Twitter/X') profileUrl = `https://x.com/${username}`;
      else if (platform === 'LinkedIn') profileUrl = `https://www.linkedin.com/in/${username}`;
      else if (platform === 'Instagram') profileUrl = `https://www.instagram.com/${username}`;
      else if (platform === 'GitHub') profileUrl = `https://github.com/${username}`;
      else if (platform === 'YouTube') profileUrl = `https://www.youtube.com/@${username}`;
      else if (platform === 'Facebook') profileUrl = `https://www.facebook.com/${username}`;
      else if (platform === 'Crunchbase') profileUrl = `https://www.crunchbase.com/person/${username}`;

      if (profileUrl && !seen.has(profileUrl)) {
        seen.add(profileUrl);
        profiles.push({ platform, url: profileUrl, username });
      }
    }
  }

  return profiles;
}

/**
 * Extract named entities (names, organizations) from text using heuristics.
 * Proper NLP would use a library like compromise.js or a model.
 */
export function extractEntities(text: string): {
  names: string[];
  organizations: string[];
  keywords: string[];
} {
  // Capitalize words heuristic for names (2+ words starting with capital)
  const namePattern = /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)\b/g;
  const orgPattern = /\b([A-Z][A-Za-z]+(?:\s+(?:Inc|Corp|Ltd|LLC|Group|Company|Technologies|Systems|Foundation|University|Institute)\.?))\b/g;

  const names = new Set<string>();
  const organizations = new Set<string>();

  let match: RegExpExecArray | null;

  while ((match = namePattern.exec(text)) !== null) {
    const name = match[1]!.trim();
    if (name.length > 4 && name.split(' ').length >= 2) {
      names.add(name);
    }
  }

  while ((match = orgPattern.exec(text)) !== null) {
    organizations.add(match[1]!.trim());
  }

  // Keywords from TF-IDF (just top tokens for now)
  const keywords = tokenize(text.slice(0, 2000))
    .reduce((acc: Map<string, number>, t) => {
      acc.set(t, (acc.get(t) ?? 0) + 1);
      return acc;
    }, new Map())
    .entries();

  const topKeywords = Array.from(keywords)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([k]) => k);

  return {
    names: Array.from(names).slice(0, 10),
    organizations: Array.from(organizations).slice(0, 5),
    keywords: topKeywords,
  };
}
