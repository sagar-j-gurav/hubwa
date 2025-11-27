// HubSpot Brand Colors
export const COLORS = {
  // Primary Colors
  primary: '#ff7a59',           // HubSpot Orange
  primaryDark: '#e85e3d',       // Darker Orange
  primaryLight: '#ff9a7a',      // Lighter Orange

  // Secondary Colors
  secondary: '#00a4bd',         // HubSpot Teal
  secondaryDark: '#0091a8',     // Darker Teal
  secondaryLight: '#33b6ca',    // Lighter Teal

  // Neutral Colors
  obsidian: '#33475b',          // Dark Blue-Gray
  battleship: '#516f90',        // Medium Blue-Gray
  flint: '#7c98b6',             // Light Blue-Gray
  manatee: '#99acc2',           // Lighter Blue-Gray
  slinky: '#2d3e50',            // Very Dark Blue
  koala: '#cbd6e2',             // Pale Blue-Gray
  gypsum: '#f5f8fa',            // Very Light Blue
  olaf: '#ffffff',              // White

  // Semantic Colors
  success: '#00bda5',           // Green
  successLight: '#7fded0',      // Light Green
  successDark: '#00a38d',       // Dark Green

  warning: '#f5c26b',           // Yellow/Orange
  warningLight: '#f9d89f',      // Light Yellow
  warningDark: '#dbac5a',       // Dark Yellow

  error: '#f2545b',             // Red
  errorLight: '#f7898e',        // Light Red
  errorDark: '#d93840',         // Dark Red

  info: '#00a4bd',              // Blue/Teal
  infoLight: '#33b6ca',         // Light Blue
  infoDark: '#0091a8',          // Dark Blue

  // Call Status Colors
  calling: '#00bda5',           // Green - Active call
  ringing: '#f5c26b',           // Yellow - Ringing
  dialing: '#00a4bd',           // Teal - Dialing
  ended: '#99acc2',             // Gray - Call ended
  failed: '#f2545b',            // Red - Failed

  // Permission Status Colors
  permissionGranted: '#00bda5',
  permissionPending: '#f5c26b',
  permissionDenied: '#f2545b',
  permissionExpired: '#99acc2',

  // WhatsApp Colors
  whatsappGreen: '#25D366',
  whatsappDark: '#128C7E',
  whatsappLight: '#DCF8C6',
};

// Shadows
export const SHADOWS = {
  sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
  xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
};

// Border Radius
export const RADIUS = {
  sm: '4px',
  md: '8px',
  lg: '12px',
  xl: '16px',
  full: '9999px',
};

// Spacing
export const SPACING = {
  xs: '4px',
  sm: '8px',
  md: '16px',
  lg: '24px',
  xl: '32px',
  xxl: '48px',
};

// Typography
export const TYPOGRAPHY = {
  fontFamily: "'Lexend Deca', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  fontSize: {
    xs: '12px',
    sm: '14px',
    md: '16px',
    lg: '18px',
    xl: '24px',
    xxl: '32px',
  },
  fontWeight: {
    light: 300,
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },
  lineHeight: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.75,
  },
};

export default COLORS;
