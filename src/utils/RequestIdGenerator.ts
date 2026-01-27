/**
 * RequestIdGenerator - UUID generation for consent tracking in React Native
 */

/**
 * Generate a unique request ID for tracking consent attempts
 * Uses crypto.randomUUID() if available, otherwise generates a UUID v4
 */
export function generateRequestId(): string {
  // Try crypto.randomUUID() first (available in React Native 0.70+)
  if (typeof crypto !== 'undefined' && (crypto as any).randomUUID) {
    return (crypto as any).randomUUID();
  }

  // Fallback for older React Native versions
  // Generate a UUID v4 compliant string
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Check if a string is a valid UUID format
 */
export function isValidUUID(str: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
}

