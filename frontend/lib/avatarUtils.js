/**
 * Get the full URL for an avatar image
 * @param {string} avatarPath - The avatar path from the API (can be relative or absolute)
 * @returns {string|null} - Full URL to the avatar image or null if no path
 */
export const getAvatarUrl = (avatarPath) => {
  if (!avatarPath) return null;
  
  // If it's already a full URL, return as-is
  if (avatarPath.startsWith('http://') || avatarPath.startsWith('https://')) {
    return avatarPath;
  }
  
  // Get the backend URL from environment variable
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
  
  // Remove '/api' from the end if present to get the base backend URL
  const backendUrl = apiUrl.replace(/\/api\/?$/, '');
  
  // Ensure the avatar path starts with a slash
  const normalizedPath = avatarPath.startsWith('/') ? avatarPath : `/${avatarPath}`;
  
  return `${backendUrl}${normalizedPath}`;
};

/**
 * Get initials from a name
 * @param {string} name - Full name or email
 * @returns {string} - Initials (max 2 characters)
 */
export const getInitials = (name) => {
  if (!name) return '?';
  
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
};

/**
 * Generate a consistent color for an avatar based on a string
 * @param {string} str - String to generate color from (usually name or email)
 * @returns {string} - Hex color code
 */
export const getAvatarColor = (str) => {
  if (!str) return '#6B7280'; // Default gray
  
  const colors = [
    '#EF4444', // red
    '#F59E0B', // amber
    '#10B981', // green
    '#3B82F6', // blue
    '#8B5CF6', // purple
    '#EC4899', // pink
    '#14B8A6', // teal
    '#F97316', // orange
  ];
  
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  return colors[Math.abs(hash) % colors.length];
};
