/**
 * Formatting Utilities - Portfolio Scorecard v2
 */

/**
 * Format a number as percentage
 */
export function formatPercent(value, decimals = 1) {
  if (value == null || isNaN(value)) return '—';
  return `${Number(value).toFixed(decimals)}%`;
}

/**
 * Format a number as currency
 */
export function formatCurrency(value, decimals = 0) {
  if (value == null || isNaN(value)) return '—';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(value);
}

/**
 * Format a number with commas
 */
export function formatNumber(value, decimals = 0) {
  if (value == null || isNaN(value)) return '—';
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(value);
}

/**
 * Format a number as compact (1.2K, 3.4M, etc.)
 */
export function formatCompact(value) {
  if (value == null || isNaN(value)) return '—';
  return new Intl.NumberFormat('en-US', {
    notation: 'compact',
    compactDisplay: 'short'
  }).format(value);
}

/**
 * Format a date
 */
export function formatDate(date, format = 'short') {
  if (!date) return '—';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '—';
  
  const options = {
    short: { month: 'short', day: 'numeric' },
    medium: { month: 'short', day: 'numeric', year: 'numeric' },
    long: { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' },
    full: { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }
  };
  
  return new Intl.DateTimeFormat('en-US', options[format] || options.short).format(d);
}

/**
 * Format a date range
 */
export function formatDateRange(start, end) {
  if (!start || !end) return '—';
  return `${formatDate(start, 'short')} – ${formatDate(end, 'short')}`;
}

/**
 * Format relative time (e.g., "2 hours ago")
 */
export function formatRelativeTime(date) {
  if (!date) return '—';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '—';
  
  const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
  const diff = d.getTime() - Date.now();
  const diffSeconds = Math.round(diff / 1000);
  const diffMinutes = Math.round(diffSeconds / 60);
  const diffHours = Math.round(diffMinutes / 60);
  const diffDays = Math.round(diffHours / 24);
  
  if (Math.abs(diffSeconds) < 60) return rtf.format(diffSeconds, 'second');
  if (Math.abs(diffMinutes) < 60) return rtf.format(diffMinutes, 'minute');
  if (Math.abs(diffHours) < 24) return rtf.format(diffHours, 'hour');
  return rtf.format(diffDays, 'day');
}

/**
 * Format a score (0-5 scale)
 */
export function formatScore(value) {
  if (value == null || isNaN(value)) return '—';
  return Number(value).toFixed(1);
}

/**
 * Get trend arrow and color
 */
export function getTrend(current, previous) {
  if (current == null || previous == null) {
    return { arrow: '—', class: 'flat', value: 0 };
  }
  
  const diff = current - previous;
  const pct = previous !== 0 ? (diff / previous) * 100 : 0;
  
  if (Math.abs(pct) < 0.5) {
    return { arrow: '→', class: 'flat', value: pct };
  } else if (pct > 0) {
    return { arrow: '↑', class: 'up', value: pct };
  } else {
    return { arrow: '↓', class: 'down', value: pct };
  }
}

/**
 * Truncate text with ellipsis
 */
export function truncate(text, maxLength = 50) {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + '...';
}

/**
 * Capitalize first letter
 */
export function capitalize(text) {
  if (!text) return '';
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
}

/**
 * Convert snake_case to Title Case
 */
export function snakeToTitle(text) {
  if (!text) return '';
  return text
    .split('_')
    .map(word => capitalize(word))
    .join(' ');
}

/**
 * Pluralize a word
 */
export function pluralize(count, singular, plural = null) {
  if (count === 1) return singular;
  return plural || `${singular}s`;
}

export default {
  formatPercent,
  formatCurrency,
  formatNumber,
  formatCompact,
  formatDate,
  formatDateRange,
  formatRelativeTime,
  formatScore,
  getTrend,
  truncate,
  capitalize,
  snakeToTitle,
  pluralize
};
