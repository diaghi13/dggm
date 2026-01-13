/**
 * Generates a material code from a name by:
 * 1. Converting to uppercase
 * 2. Removing accents and special characters
 * 3. Taking first 3 letters of each word (max 3 words)
 * 4. If code is too short, pad with first letters
 *
 * Examples:
 * "SmartBat Pro" -> "SMA-PRO"
 * "Cavo Alimentazione" -> "CAV-ALI"
 * "Box 6 Posti" -> "BOX-POS"
 */
export function generateMaterialCode(name: string): string {
  if (!name || name.trim().length === 0) {
    return '';
  }

  // Remove accents and normalize
  const normalized = name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase();

  // Split into words, filter out numbers and very short words
  const words = normalized
    .split(/\s+/)
    .filter(word => word.length >= 2 && !/^\d+$/.test(word))
    .slice(0, 3); // Max 3 words

  if (words.length === 0) {
    // Fallback: use first 6 characters
    return normalized.replace(/[^A-Z0-9]/g, '').slice(0, 6);
  }

  // Take first 3 letters of each word
  const parts = words.map(word => {
    // Remove special characters
    const clean = word.replace(/[^A-Z0-9]/g, '');
    return clean.slice(0, 3);
  });

  return parts.join('-');
}

/**
 * Checks if a code needs to be made unique by adding a number suffix
 * Returns the code with a number suffix if needed
 */
export function makeCodeUnique(baseCode: string, existingCodes: string[]): string {
  let code = baseCode;
  let counter = 1;

  while (existingCodes.includes(code)) {
    code = `${baseCode}-${counter}`;
    counter++;
  }

  return code;
}
