/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface SupportedFileType {
  extension: string;
  category: string;
  description: string;
}

export const SUPPORTED_FILE_TYPES: SupportedFileType[] = [
  { extension: '.exe', category: 'Executable', description: 'Windows Portable Executable binary' },
  { extension: '.dll', category: 'Executable', description: 'Dynamic Link Library' },
  { extension: '.msi', category: 'Installer', description: 'Windows Installer package' },
  { extension: '.pdf', category: 'Document', description: 'Adobe Portable Document Format' },
  { extension: '.docx', category: 'Document', description: 'Microsoft Word document' },
  { extension: '.xlsx', category: 'Document', description: 'Microsoft Excel spreadsheet' },
  { extension: '.zip', category: 'Archive', description: 'Compressed archive container' },
  { extension: '.rar', category: 'Archive', description: 'RAR archive container' },
  { extension: '.7z', category: 'Archive', description: '7-Zip archive container' },
  { extension: '.apk', category: 'Mobile', description: 'Android application package' },
  { extension: '.js', category: 'Script', description: 'JavaScript source / script' },
  { extension: '.vbs', category: 'Script', description: 'Visual Basic script' },
  { extension: '.bat', category: 'Script', description: 'Windows Batch script' },
  { extension: '.iso', category: 'Disk Image', description: 'Optical disk image container' },
  { extension: '.dmg', category: 'Disk Image', description: 'macOS Apple disk image' },
];

export const MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024; // 25 MB

/**
 * Checks if a file name has a supported extension
 */
export function isSupportedFileType(filename: string): boolean {
  if (!filename || typeof filename !== 'string') return false;
  const lower = filename.toLowerCase();
  return SUPPORTED_FILE_TYPES.some((t) => lower.endsWith(t.extension));
}

/**
 * Validates file size against maximum allowed threshold
 */
export function validateFileSize(bytes: number, maxBytes = MAX_FILE_SIZE_BYTES): { valid: boolean; error?: string } {
  if (bytes <= 0) {
    return { valid: false, error: 'File is empty (0 bytes).' };
  }
  if (bytes > maxBytes) {
    const maxMb = Math.round(maxBytes / (1024 * 1024));
    return { valid: false, error: `File exceeds maximum safe upload limit of ${maxMb}MB.` };
  }
  return { valid: true };
}

/**
 * Formats byte size into human-readable representation
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

/**
 * Detects dangerous double-extension masquerade attacks (e.g. invoice.pdf.exe)
 */
export function detectDoubleExtensionRisk(filename: string): { hasRisk: boolean; warning?: string } {
  if (!filename) return { hasRisk: false };
  const lower = filename.toLowerCase();

  // Pattern: innocent extension followed by dangerous executable/script extension
  const innocentExtensions = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'jpg', 'jpeg', 'png', 'txt', 'mp4'];
  const dangerousExtensions = ['exe', 'scr', 'bat', 'cmd', 'vbs', 'js', 'hta', 'ps1', 'msi', 'iso'];

  const parts = lower.split('.');
  if (parts.length >= 3) {
    const lastExt = parts[parts.length - 1];
    const secondLastExt = parts[parts.length - 2];

    if (innocentExtensions.includes(secondLastExt) && dangerousExtensions.includes(lastExt)) {
      return {
        hasRisk: true,
        warning: `High-risk file masquerade detected! File appears to disguise an executable (.${lastExt}) as an innocent document (.${secondLastExt}).`,
      };
    }
  }

  return { hasRisk: false };
}

/**
 * Validates an ArrayBuffer or binary buffer SHA-256 hex string
 */
export function isValidSha256(hash: string): boolean {
  if (!hash || typeof hash !== 'string') return false;
  return /^[a-f0-9]{64}$/i.test(hash.trim());
}
