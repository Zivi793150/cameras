// Utilities for parsing and formatting prices consistently across the app

/**
 * Normalize price values that might be stored as:
 * - number (e.g., 12500)
 * - string with thousand separators using dots (e.g., '19.000', '12.500')
 * - string with spaces (e.g., '19 000')
 * - string with decimal representing thousands (e.g., '12.5' meaning 12 500)
 * Returns a positive integer amount of tenge
 */
export function normalizePriceToNumber(rawPrice) {
  if (rawPrice == null) return 0;

  // Already a number
  if (typeof rawPrice === 'number') {
    const value = rawPrice;
    if (value < 1000 && String(value).includes('.')) {
      // Treat decimals as thousands (e.g., 12.5 => 12500)
      return Math.round(value * 1000);
    }
    return Math.round(value);
  }

  // Convert to string and trim
  let valueStr = String(rawPrice).trim();

  // Remove spaces and NBSP
  valueStr = valueStr.replace(/\s|\u00A0/g, '');

  // If it matches groups separated by '.' (e.g., 12.500 or 19.000), remove all dots
  if (/^\d{1,3}(\.\d{3})+$/.test(valueStr)) {
    return parseInt(valueStr.replace(/\./g, ''), 10);
  }

  // If it matches groups separated by ',' (unlikely, but safe), remove commas
  if (/^\d{1,3}(,\d{3})+$/.test(valueStr)) {
    return parseInt(valueStr.replace(/,/g, ''), 10);
  }

  // If it's plain digits
  if (/^\d+$/.test(valueStr)) {
    return parseInt(valueStr, 10);
  }

  // If it's a decimal with a dot or comma (e.g., '12.5' or '12,5')
  if (/^\d+[.,]\d+$/.test(valueStr)) {
    // Unify decimal separator to '.'
    const normalized = parseFloat(valueStr.replace(',', '.'));
    if (normalized < 1000) {
      // Treat as thousands
      return Math.round(normalized * 1000);
    }
    return Math.round(normalized);
  }

  // Fallback: strip non-digits and parse
  const digits = valueStr.replace(/\D/g, '');
  return digits ? parseInt(digits, 10) : 0;
}

/**
 * Format raw price into a human-readable tenge string with thousands separators
 */
export function formatTenge(rawPrice) {
  const amount = normalizePriceToNumber(rawPrice);
  return amount.toLocaleString('ru-RU');
}


