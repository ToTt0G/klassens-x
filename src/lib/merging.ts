/**
 * Fuzzy string matching / merging logic for award titles.
 * Handles Swedish characters (å, ä, ö) correctly.
 */

/**
 * Normalize a string for comparison:
 * - Lowercase
 * - Trim whitespace
 * - Normalize Unicode (handles å, ä, ö as single chars)
 */
export function normalizeTitle(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .normalize("NFC"); // Keep å, ä, ö as composed characters
}

/**
 * Compute Levenshtein distance between two strings.
 * Pure TS implementation, no dependencies needed.
 */
export function levenshteinDistance(a: string, b: string): number {
  const m = a.length;
  const n = b.length;

  // Create a 2D matrix
  const dp: number[][] = Array.from({ length: m + 1 }, (_, i) =>
    Array.from({ length: n + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
  );

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (a[i - 1] === b[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
      }
    }
  }

  return dp[m][n];
}

/**
 * Determine if two normalized titles should be merged.
 * Returns true if they are "similar enough".
 */
export function shouldMerge(a: string, b: string): boolean {
  if (a === b) return true;

  const dist = levenshteinDistance(a, b);
  const maxLen = Math.max(a.length, b.length);

  // For very short strings (≤5 chars), require exact match
  if (maxLen <= 5) return a === b;

  // Hard distance cap: never merge if more than 3 edits apart
  if (dist > 3) return false;

  // Similarity ratio: merge if < 25% of chars differ
  const ratio = dist / maxLen;
  if (ratio < 0.25) return true;

  // Prefix/substring match: one starts with the other
  if (a.startsWith(b) || b.startsWith(a)) return true;

  return false;
}

/**
 * Find the best matching existing normalized title from a list.
 * Returns the matching title, or null if no match found.
 */
export function findMatchingTitle(
  input: string,
  existingNormalizedTitles: string[]
): string | null {
  const normalized = normalizeTitle(input);

  for (const existing of existingNormalizedTitles) {
    if (shouldMerge(normalized, existing)) {
      return existing;
    }
  }

  return null;
}
