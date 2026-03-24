/**
 * Color utility functions for theme support
 * Matches web implementation color transformations
 */

/**
 * Convert hex color to RGBA string
 * Supports 3-digit and 6-digit hex formats
 * @param hex - Hex color code (e.g., '#ff0000' or '#f00')
 * @param alpha - Alpha value (0-1)
 * @returns RGBA string (e.g., 'rgba(255, 0, 0, 0.5)') or null if invalid
 */
export const hexToRgba = (hex: string | null | undefined, alpha: number): string | null => {
  if (typeof hex !== 'string') return null;
  
  const clean = hex.replace('#', '').trim();
  if (![3, 6].includes(clean.length)) return null;
  
  // Expand 3-digit hex to 6-digit
  const full = clean.length === 3 
    ? clean.split('').map((ch) => ch + ch).join('') 
    : clean;
  
  // Parse hex to integer
  const intVal = Number.parseInt(full, 16);
  if (Number.isNaN(intVal)) return null;
  
  // Extract RGB components
  const r = (intVal >> 16) & 255;
  const g = (intVal >> 8) & 255;
  const b = intVal & 255;
  
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

/**
 * Parse RGBA string and return as object
 * Useful for breaking down computed colors
 * @param rgba - RGBA string (e.g., 'rgba(255, 0, 0, 0.5)')
 * @returns Object with r, g, b, a properties or null if invalid
 */
export const parseRgba = (rgba: string): { r: number; g: number; b: number; a: number } | null => {
  const match = rgba.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
  if (!match) return null;
  
  return {
    r: parseInt(match[1], 10),
    g: parseInt(match[2], 10),
    b: parseInt(match[3], 10),
    a: match[4] ? parseFloat(match[4]) : 1,
  };
};

/**
 * Generate theme colors from base API settings
 * Matches web implementation's color derivation
 */
export const deriveThemeColors = (settings: {
  background_color?: string;
  primary_text_color?: string;
  secondary_text_color?: string;
  button_color?: string;
  button_text_color?: string;
}) => {
  const bg = settings.background_color || '#020617';
  const primaryText = settings.primary_text_color || '#e5e7eb';
  const secondaryText = settings.secondary_text_color || '#9ca3af';
  const primary = settings.button_color || '#65a30d';
  const buttonText = settings.button_text_color || '#0b1120';

  return {
    background: bg,
    textPrimary: primaryText,
    textSecondary: secondaryText,
    button: primary,
    buttonText: buttonText,
    
    // Derived colors (matching web implementation)
    hoverBg: hexToRgba(primaryText, 0.08) || 'rgba(255, 255, 255, 0.06)',
    border: hexToRgba(secondaryText, 0.45) || 'rgba(107, 114, 128, 0.45)',
    infoBg: hexToRgba(primary, 0.12) || 'rgba(101, 163, 13, 0.12)',
    infoBorder: hexToRgba(primary, 0.25) || 'rgba(101, 163, 13, 0.25)',
    
    // Standard status colors
    successBg: 'rgba(34, 197, 94, 0.18)',
    successText: '#166534',
    dangerBg: 'rgba(239, 68, 68, 0.18)',
    dangerText: '#991b1b',
    dangerBtn: '#dc2626',
    dangerBtnHover: '#b91c1c',
    warningBg: 'rgba(245, 158, 11, 0.12)',
    warningBorder: 'rgba(245, 158, 11, 0.28)',
    warningText: '#fbbf24',
    
    // Overlay
    overlay: 'rgba(2, 6, 23, 0.72)',
  };
};

export default {
  hexToRgba,
  parseRgba,
  deriveThemeColors,
};
