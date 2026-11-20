import type {
  DriverTrustProfile,
  CommunityReportPayload,
  StationSummaryDto,
} from '../types';

const DRIVER_PROFILE_STORAGE_KEY = 'cng_navigator_driver_trust_profile';
const RECENT_REPORTS_STORAGE_KEY = 'cng_navigator_recent_submitted_reports';

export interface ReportValidationResult {
  isValid: boolean;
  errorMessage?: string;
  isDuplicate?: boolean;
}

/**
 * Loads or initializes the current driver's trust profile
 */
export function getDriverTrustProfile(): DriverTrustProfile {
  try {
    const raw = localStorage.getItem(DRIVER_PROFILE_STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch {}

  // Generate anonymous persistent driver ID
  const newProfile: DriverTrustProfile = {
    driverId: `DRV-${Math.floor(100000 + Math.random() * 900000)}`,
    totalReportsSubmitted: 0,
    acceptedReports: 0,
    rejectedReports: 0,
    trustScore: 70, // Base starting trust score
    trustBadge: 'NEWBIE',
  };

  try {
    localStorage.setItem(DRIVER_PROFILE_STORAGE_KEY, JSON.stringify(newProfile));
  } catch {}

  return newProfile;
}

/**
 * Validates report payload against abuse prevention rules:
 * 1. Checks reasonable ranges (Queue 0–35 cars, Pressure 120–240 Bar)
 * 2. Prevents duplicate spamming (10-minute cooldown per station)
 */
export function validateDriverReport(
  payload: CommunityReportPayload,
  station: StationSummaryDto
): ReportValidationResult {
  // 1. Data sanity checks
  if (payload.vehiclesWaiting < 0 || payload.vehiclesWaiting > 35) {
    return {
      isValid: false,
      errorMessage: 'Invalid vehicle count. Please enter a realistic queue between 0 and 35 cars.',
    };
  }

  if (payload.hasReliablePressureReading && payload.pressureBar !== null && payload.pressureBar !== undefined) {
    if (payload.pressureBar < 120 || payload.pressureBar > 245) {
      return {
        isValid: false,
        errorMessage: 'Invalid pressure reading. Dispenser pressure must be between 120 and 245 Bar.',
      };
    }
  }

  // 2. Duplicate report prevention check (10-minute cooldown)
  try {
    const recentReportsRaw = localStorage.getItem(RECENT_REPORTS_STORAGE_KEY);
    const recentMap: Record<number, number> = recentReportsRaw ? JSON.parse(recentReportsRaw) : {};
    const lastReportTime = recentMap[payload.stationId];

    if (lastReportTime) {
      const elapsedMins = (Date.now() - lastReportTime) / (60 * 1000);
      if (elapsedMins < 10) {
        const waitMins = Math.ceil(10 - elapsedMins);
        return {
          isValid: false,
          isDuplicate: true,
          errorMessage: `Duplicate report detected. You recently updated this station. Please wait ${waitMins} minute(s) before submitting again.`,
        };
      }
    }
  } catch {}

  return { isValid: true };
}

/**
 * Records an accepted report submission and updates the contributor's reliability score.
 * Note: Never rewards users simply for submitting more reports — score is based on verification accuracy!
 */
export function recordReportSubmission(
  payload: CommunityReportPayload,
  isAccepted: boolean
): DriverTrustProfile {
  const profile = getDriverTrustProfile();

  profile.totalReportsSubmitted += 1;
  profile.lastReportTimestamp = new Date().toISOString();

  if (isAccepted) {
    profile.acceptedReports += 1;
    // Gradual score improvement (+3 per verified submission, capped at 98)
    profile.trustScore = Math.min(98, profile.trustScore + 3);
  } else {
    profile.rejectedReports += 1;
    // Penalty for outlier / rejected submissions (-12)
    profile.trustScore = Math.max(15, profile.trustScore - 12);
  }

  // Trust badge tiers
  if (profile.trustScore >= 88 && profile.acceptedReports >= 5) {
    profile.trustBadge = 'COMMUNITY_CHAMPION';
  } else if (profile.trustScore >= 75 && profile.acceptedReports >= 2) {
    profile.trustBadge = 'TRUSTED_CONTRIBUTOR';
  } else {
    profile.trustBadge = 'NEWBIE';
  }

  // Save profile & update station submission timestamp
  try {
    localStorage.setItem(DRIVER_PROFILE_STORAGE_KEY, JSON.stringify(profile));

    const recentReportsRaw = localStorage.getItem(RECENT_REPORTS_STORAGE_KEY);
    const recentMap: Record<number, number> = recentReportsRaw ? JSON.parse(recentReportsRaw) : {};
    recentMap[payload.stationId] = Date.now();
    localStorage.setItem(RECENT_REPORTS_STORAGE_KEY, JSON.stringify(recentMap));
  } catch {}

  return profile;
}
