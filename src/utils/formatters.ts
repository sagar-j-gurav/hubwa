/**
 * Utility formatters
 */

/**
 * Format phone number for display
 */
export const formatPhoneNumber = (phone: string): string => {
  if (!phone) return '';

  // Remove whatsapp: prefix if present
  let cleaned = phone.replace('whatsapp:', '').replace(/\s/g, '');

  // If starts with +, keep international format
  if (cleaned.startsWith('+')) {
    // Format: +1 234 567 8900
    if (cleaned.length > 10) {
      const country = cleaned.slice(0, cleaned.length - 10);
      const area = cleaned.slice(-10, -7);
      const first = cleaned.slice(-7, -4);
      const last = cleaned.slice(-4);
      return `${country} ${area} ${first} ${last}`;
    }
  }

  return cleaned;
};

/**
 * Clean phone number for API calls
 */
export const cleanPhoneNumber = (phone: string): string => {
  if (!phone) return '';

  // Remove whatsapp: prefix, spaces, dashes, parentheses
  let cleaned = phone
    .replace('whatsapp:', '')
    .replace(/[\s\-\(\)]/g, '');

  // Ensure it starts with +
  if (!cleaned.startsWith('+')) {
    cleaned = '+' + cleaned;
  }

  return cleaned;
};

/**
 * Format call duration from seconds
 */
export const formatDuration = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  const pad = (n: number) => n.toString().padStart(2, '0');

  if (hours > 0) {
    return `${pad(hours)}:${pad(minutes)}:${pad(secs)}`;
  }
  return `${pad(minutes)}:${pad(secs)}`;
};

/**
 * Format date/time for display
 */
export const formatDateTime = (date: Date | string): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
};

/**
 * Get initials from name
 */
export const getInitials = (name: string): string => {
  if (!name) return '?';

  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) {
    return parts[0].charAt(0).toUpperCase();
  }
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
};

/**
 * Truncate string with ellipsis
 */
export const truncate = (str: string, maxLength: number): string => {
  if (!str || str.length <= maxLength) return str;
  return str.slice(0, maxLength - 3) + '...';
};
