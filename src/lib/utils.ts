/**
 * General utility functions.
 */

/**
 * Convert a class name into a URL-friendly slug with a random suffix.
 * E.g. "Klass 9B Åsenhögsskolan" → "klass-9b-asenhogsskolan-x7f2k"
 */
export function generateSlug(name: string): string {
  const base = name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // strip diacritics (å→a, ä→a, ö→o)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);

  const suffix = Math.random().toString(36).slice(2, 7);
  return `${base}-${suffix}`;
}

/**
 * Parse a newline-separated student list string into individual names.
 * Filters out empty lines and trims whitespace.
 */
export function parseStudentNames(raw: string): string[] {
  return raw
    .split("\n")
    .map((name) => name.trim())
    .filter((name) => name.length > 0);
}

/**
 * Generate a voter ID (UUID v4) for session tracking.
 * Works in both browser and server environments.
 */
export function generateVoterId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback for older environments
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Get or create a persistent voterId in sessionStorage.
 */
export function getOrCreateVoterId(classSlug: string): string {
  if (typeof window === "undefined") return "";
  const key = `voterId-${classSlug}`;
  let id = sessionStorage.getItem(key);
  if (!id) {
    id = generateVoterId();
    sessionStorage.setItem(key, id);
  }
  return id;
}
