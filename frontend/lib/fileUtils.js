/**
 * Utility functions for file handling
 */

/**
 * Ensure file URL is absolute
 * Converts relative URLs to absolute URLs pointing to the backend
 * @param {string} url - File URL (can be relative or absolute)
 * @returns {string} Absolute URL
 */
export const getAbsoluteFileUrl = (url) => {
  if (!url) return '';
  
  // If already absolute, return as is
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  
  // If relative, prepend backend URL
  const backendUrl = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:5000';
  
  // Remove leading slash if present
  const cleanUrl = url.startsWith('/') ? url.substring(1) : url;
  
  return `${backendUrl}/${cleanUrl}`;
};

/**
 * Format file size to human readable format
 * @param {number} bytes - File size in bytes
 * @returns {string} Formatted file size
 */
export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
};

/**
 * Get file icon based on MIME type
 * @param {string} mimeType - File MIME type
 * @returns {string} Icon name
 */
export const getFileIconType = (mimeType) => {
  if (!mimeType) return 'file';
  
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType.startsWith('video/')) return 'video';
  if (mimeType === 'application/pdf') return 'pdf';
  if (mimeType.includes('word') || mimeType.includes('document')) return 'document';
  if (mimeType.includes('sheet') || mimeType.includes('excel')) return 'spreadsheet';
  if (mimeType.includes('presentation') || mimeType.includes('powerpoint')) return 'presentation';
  if (mimeType.includes('zip') || mimeType.includes('compressed')) return 'archive';
  
  return 'file';
};
