/**
 * Currency utility for FreelanceHub Pro
 * Formats amounts in Nepali Rupees (NPR)
 */

/**
 * Format amount as Nepali Rupees
 * @param {number|string} amount - Amount to format
 * @param {boolean} showSymbol - Whether to show currency symbol (default: true)
 * @returns {string} Formatted currency string
 */
export const formatCurrency = (amount, showSymbol = true) => {
  const numAmount = parseFloat(amount) || 0;
  const formatted = numAmount.toLocaleString('en-NP', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
  
  return showSymbol ? `Rs. ${formatted}` : formatted;
};

/**
 * Format currency with Rupee symbol (₹)
 * @param {number|string} amount - Amount to format
 * @returns {string} Formatted currency string with ₹ symbol
 */
export const formatRupees = (amount) => {
  const numAmount = parseFloat(amount) || 0;
  const formatted = numAmount.toLocaleString('en-NP', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
  
  return `₹${formatted}`;
};

/**
 * Format currency range
 * @param {number|string} min - Minimum amount
 * @param {number|string} max - Maximum amount
 * @returns {string} Formatted range string
 */
export const formatCurrencyRange = (min, max) => {
  return `${formatCurrency(min)} - ${formatCurrency(max)}`;
};

/**
 * Get currency symbol
 * @returns {string} Currency symbol
 */
export const getCurrencySymbol = () => 'Rs.';

/**
 * Get currency code
 * @returns {string} Currency code
 */
export const getCurrencyCode = () => 'NPR';

/**
 * Parse currency string to number
 * @param {string} currencyString - Currency string to parse
 * @returns {number} Parsed number
 */
export const parseCurrency = (currencyString) => {
  if (typeof currencyString === 'number') return currencyString;
  const cleaned = currencyString.replace(/[^0-9.-]+/g, '');
  return parseFloat(cleaned) || 0;
};
