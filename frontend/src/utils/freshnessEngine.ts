import type {
  StationSummaryDto,
  DataVerificationStatus,
  FreshnessExpiryConfig,
  DataFreshnessInfo,
} from '../types';

export const DEFAULT_FRESHNESS_CONFIG: FreshnessExpiryConfig = {
  liveVerifiedExpiryMinutes: 15,
  recentlyUpdatedExpiryMinutes: 45,
  communityReportExpiryMinutes: 60,
  staleThresholdMinutes: 90,
};

/**
 * Returns human-readable relative timestamp (e.g. "Just now", "6m ago", "1h ago")
 */
export function getRelativeTimeAgo(timestamp?: string): string {
  if (!timestamp) return 'Time unknown';
  const time = new Date(timestamp).getTime();
  if (isNaN(time)) return 'Time unknown';

  const diffMs = Date.now() - time;
  const diffSecs = Math.round(diffMs / 1000);
  const diffMins = Math.round(diffSecs / 60);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.round(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${Math.round(diffHours / 24)}d ago`;
}

/**
 * Dynamically evaluates station freshness based on elapsed time and configurable expiry thresholds.
 * Strictly guarantees that expired data is never presented as live!
 */
export function evaluateStationFreshness(
  station: Pick<StationSummaryDto, 'verificationStatus' | 'lastUpdatedTimestamp' | 'dataSourceLabel' | 'dataConfidenceScore' | 'isDemoData'>,
  config: FreshnessExpiryConfig = DEFAULT_FRESHNESS_CONFIG
): DataFreshnessInfo {
  const updatedTime = station.lastUpdatedTimestamp
    ? new Date(station.lastUpdatedTimestamp).getTime()
    : Date.now() - 100 * 60 * 1000;

  const elapsedMinutes = Math.max(0, (Date.now() - updatedTime) / (60 * 1000));
  const relativeTimeAgo = getRelativeTimeAgo(station.lastUpdatedTimestamp);

  let activeStatus: DataVerificationStatus = station.verificationStatus;
  let expiryDurationMinutes = config.staleThresholdMinutes;

  if (station.verificationStatus === 'LIVE_VERIFIED') {
    expiryDurationMinutes = config.liveVerifiedExpiryMinutes;
  } else if (station.verificationStatus === 'RECENTLY_UPDATED') {
    expiryDurationMinutes = config.recentlyUpdatedExpiryMinutes;
  } else if (station.verificationStatus === 'COMMUNITY_REPORTED') {
    expiryDurationMinutes = config.communityReportExpiryMinutes;
  }

  // Check if reading has crossed expiry threshold
  const isExpired = elapsedMinutes >= expiryDurationMinutes;
  const minutesRemainingUntilExpiry = Math.max(0, Math.round(expiryDurationMinutes - elapsedMinutes));
  const expiresAt = new Date(updatedTime + expiryDurationMinutes * 60 * 1000).toISOString();

  // Automatic status downgrade if elapsed time exceeds freshness window
  if (elapsedMinutes >= config.staleThresholdMinutes) {
    activeStatus = 'STALE_DATA';
  } else if (isExpired && station.verificationStatus === 'LIVE_VERIFIED') {
    activeStatus = 'RECENTLY_UPDATED';
  }

  // Adjust confidence score based on aging
  let adjustedConfidence = station.dataConfidenceScore ?? 75;
  if (activeStatus === 'STALE_DATA') {
    adjustedConfidence = Math.min(35, Math.round(adjustedConfidence * 0.4));
  } else if (isExpired) {
    adjustedConfidence = Math.round(adjustedConfidence * 0.85);
  }

  return {
    status: activeStatus,
    lastUpdatedTimestamp: station.lastUpdatedTimestamp,
    relativeTimeAgo,
    expiresAt,
    isExpired,
    minutesRemainingUntilExpiry,
    dataSourceLabel: station.dataSourceLabel,
    confidenceScore: adjustedConfidence,
    isDemoData: !!station.isDemoData,
  };
}
