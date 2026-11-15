/**
 * Format a distance value in kilometres.
 * Example: formatDistance(2.345) → "2.3 km"
 */
export function formatDistance(km: number): string {
  if (km < 1) {
    return `${Math.round(km * 1000)} m`;
  }
  return `${km.toFixed(1)} km`;
}

/**
 * Format a duration in minutes to a human-readable string.
 * Example: formatDuration(75) → "1 hr 15 min"
 */
export function formatDuration(mins: number): string {
  if (mins < 1) return '< 1 min';
  if (mins < 60) return `${Math.round(mins)} min`;
  const hours = Math.floor(mins / 60);
  const remaining = Math.round(mins % 60);
  return remaining > 0 ? `${hours} hr ${remaining} min` : `${hours} hr`;
}

/**
 * Format a pressure value.
 * Example: formatPressure(195.5) → "195.5 Bar"
 */
export function formatPressure(bar: number): string {
  return `${Math.round(bar)} Bar`;
}

/**
 * Format a price-per-kg value.
 * Example: formatPrice(79.56) → "₹79.56/kg"
 *          formatPrice(null)  → "N/A"
 */
export function formatPrice(price: number | null | undefined): string {
  if (price === null || price === undefined) return 'N/A';
  return `₹${price.toFixed(2)}/kg`;
}

/**
 * Map a pressure reading to a qualitative status.
 * Assumes a standard CNG cascade: safe range ~160–250 Bar.
 */
export function getPressureStatus(
  bar: number,
): 'high' | 'medium' | 'low' | 'critical' {
  if (bar >= 180) return 'high';
  if (bar >= 140) return 'medium';
  if (bar >= 100) return 'low';
  return 'critical';
}

/**
 * Map a vehicle queue count to a qualitative status.
 */
export function getQueueStatus(vehicles: number): 'low' | 'moderate' | 'high' {
  if (vehicles <= 3) return 'low';
  if (vehicles <= 7) return 'moderate';
  return 'high';
}

/**
 * Map a status string to a Tailwind CSS text-color class.
 */
export function getStatusColor(status: string): string {
  switch (status) {
    case 'high':
      return 'text-green-500';
    case 'medium':
      return 'text-amber-500';
    case 'moderate':
      return 'text-amber-500';
    case 'low':
      return 'text-red-400';
    case 'critical':
      return 'text-red-600';
    default:
      return 'text-slate-400';
  }
}

/**
 * Format an ISO 8601 timestamp as a relative time string.
 * Example: "2 min ago", "1 hr ago", "just now"
 */
export function formatTimestamp(dt: string): string {
  const now = Date.now();
  const then = new Date(dt).getTime();
  if (Number.isNaN(then)) return 'unknown';

  const diffMs = now - then;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);

  if (diffSec < 10) return 'just now';
  if (diffSec < 60) return `${diffSec}s ago`;
  if (diffMin < 60) return `${diffMin} min ago`;
  if (diffHr < 24) return `${diffHr} hr ago`;
  return `${diffDay} day${diffDay > 1 ? 's' : ''} ago`;
}
