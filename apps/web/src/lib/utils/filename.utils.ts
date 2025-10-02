/**
 * Filename Utilities
 * Helper functions for generating consistent filenames
 */

/**
 * Generate selfie filename with consistent naming convention
 * Format: {employee_id}_{timestamp}_{action}.jpg
 */
export function generateSelfieFilename(
  employeeId: string, 
  action: 'checkin' | 'checkout'
): string {
  const timestamp = new Date().toISOString()
    .replace(/[-:]/g, '')
    .replace('T', '_')
    .split('.')[0];
  
  return `${employeeId}_${timestamp}_${action}.jpg`;
}

/**
 * Parse selfie filename to extract metadata
 */
export function parseSelfieFilename(filename: string): {
  employeeId: string;
  timestamp: string;
  action: 'checkin' | 'checkout';
} | null {
  const match = filename.match(/^(.+)_(\d{8}_\d{6})_(checkin|checkout)\.jpg$/);
  
  if (!match) {
    return null;
  }

  return {
    employeeId: match[1],
    timestamp: match[2],
    action: match[3] as 'checkin' | 'checkout'
  };
}

/**
 * Generate storage path for selfie
 */
export function generateSelfiePath(
  employeeId: string,
  action: 'checkin' | 'checkout',
  filename?: string
): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  
  const finalFilename = filename || generateSelfieFilename(employeeId, action);
  
  return `${year}/${month}/${employeeId}/${action}_images/${finalFilename}`;
}

/**
 * Validate selfie filename format
 */
export function isValidSelfieFilename(filename: string): boolean {
  return /^.+_\d{8}_\d{6}_(checkin|checkout)\.jpg$/.test(filename);
}

/**
 * Extract employee ID from selfie filename
 */
export function extractEmployeeIdFromFilename(filename: string): string | null {
  const parsed = parseSelfieFilename(filename);
  return parsed?.employeeId || null;
}

/**
 * Format timestamp from filename for display
 */
export function formatTimestampFromFilename(filename: string): string | null {
  const parsed = parseSelfieFilename(filename);
  if (!parsed) return null;
  
  const { timestamp } = parsed;
  const dateStr = timestamp.substring(0, 8);
  const timeStr = timestamp.substring(9, 15);
  
  const year = dateStr.substring(0, 4);
  const month = dateStr.substring(4, 6);
  const day = dateStr.substring(6, 8);
  
  const hour = timeStr.substring(0, 2);
  const minute = timeStr.substring(2, 4);
  const second = timeStr.substring(4, 6);
  
  return `${day}/${month}/${year} ${hour}:${minute}:${second}`;
}