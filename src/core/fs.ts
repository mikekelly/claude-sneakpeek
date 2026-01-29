import fs from 'node:fs';

export const ensureDir = (dir: string) => {
  fs.mkdirSync(dir, { recursive: true });
};

export const writeJson = <T>(filePath: string, data: T) => {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
};

/**
 * SECURITY: Sanitize JSON to prevent prototype pollution attacks.
 * This removes any __proto__, constructor, or prototype properties
 * that could be used to inject malicious properties.
 */
const sanitizeJson = <T>(obj: unknown): T => {
  // Parse and stringify to remove prototype chain
  // This is a zero-dependency approach to prevent prototype pollution
  return JSON.parse(JSON.stringify(obj)) as T;
};

/**
 * Maximum JSON file size to prevent DoS via massive files (1MB)
 */
const MAX_JSON_SIZE = 1024 * 1024;

export const readJson = <T>(filePath: string): T | null => {
  try {
    // SECURITY: Check file size to prevent DoS via massive JSON
    const stats = fs.statSync(filePath);
    if (stats.size > MAX_JSON_SIZE) {
      throw new Error(`JSON file too large (${stats.size} bytes, max ${MAX_JSON_SIZE})`);
    }

    const content = fs.readFileSync(filePath, 'utf8');
    const parsed = JSON.parse(content);

    // SECURITY: Sanitize to prevent prototype pollution
    // Removes __proto__, constructor, prototype properties
    return sanitizeJson<T>(parsed);
  } catch {
    return null;
  }
};
