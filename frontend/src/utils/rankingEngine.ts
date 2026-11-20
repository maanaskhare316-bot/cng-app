import type {
  StationSummaryDto,
  RecommendationCategory,
} from '../types';

export interface RankedStationsResult {
  stations: StationSummaryDto[];
  bestOverall: StationSummaryDto | null;
  fastestRefueling: StationSummaryDto | null;
  nearestStation: StationSummaryDto | null;
}

/**
 * Intelligent Multi-Factor Station Ranking Algorithm
 * Produces 3 Distinct Categories:
 * 1. BEST OVERALL
 * 2. FASTEST REFUELING
 * 3. NEAREST STATION
 */
export function rankStationsForRoute(
  candidateStations: StationSummaryDto[],
  totalRouteKm: number
): RankedStationsResult {
  if (!candidateStations || candidateStations.length === 0) {
    return {
      stations: [],
      bestOverall: null,
      fastestRefueling: null,
      nearestStation: null,
    };
  }

  // Score each station across multi-dimensional criteria
  const scoredStations = candidateStations.map((station) => {
    const isClosedOrDry =
      station.operationalStatus === 'TEMPORARILY_CLOSED' ||
      station.cngAvailability === 'OUT_OF_STOCK' ||
      station.cngAvailability === 'COMPRESSOR_DOWN';

    if (isClosedOrDry) {
      return {
        ...station,
        score: 0,
        fastestRefuelScore: 0,
        nearestScore: 0,
        reliabilityScore: 0,
        recommendationCategory: null as RecommendationCategory,
        recommendationReason: 'Station unavailable: Currently closed or out of CNG stock.',
      };
    }

    // 1. Data Reliability Score (0 - 100)
    let reliabilityScore = 70;
    if (station.verificationStatus === 'LIVE_VERIFIED') {
      reliabilityScore = 98;
    } else if (station.verificationStatus === 'RECENTLY_UPDATED') {
      reliabilityScore = 85;
    } else if (station.verificationStatus === 'COMMUNITY_REPORTED') {
      reliabilityScore = 78;
    } else if (station.verificationStatus === 'STALE_DATA') {
      reliabilityScore = 35;
    } else if (station.verificationStatus === 'UNAVAILABLE') {
      reliabilityScore = 15;
    }

    // 2. Queue & Wait Score (0 - 100)
    // Uses predicted wait at arrival if available, otherwise current wait
    const waitMins =
      station.arrivalPrediction?.predictedWaitMinutesAtArrival ??
      station.estimatedWaitMinutes ??
      Math.round((station.vehiclesWaiting ?? 4) * 2);

    // 0 mins wait = 100 score, 30+ mins wait = 10 score
    const queueScore = Math.max(10, Math.min(100, Math.round(100 - waitMins * 3)));

    // 3. Pressure Score (0 - 100)
    // 210+ Bar is top score; <160 Bar is penalized
    const pressureBar =
      station.arrivalPrediction?.predictedPressureBarAtArrival ??
      station.currentPressureBar ??
      190;
    const pressureScore = Math.min(
      100,
      Math.max(15, Math.round(((pressureBar - 140) / 80) * 100))
    );

    // 4. Detour Score (0 - 100)
    // 0 km detour = 100 score; 5 km detour = 40 score; 10 km detour = 10 score
    const detourKm = station.extraDetourKm ?? 0.5;
    const detourScore = Math.max(10, Math.min(100, Math.round(100 - detourKm * 12)));

    // 5. Total Overhead for Fastest Refueling (Travel Detour Mins + Wait Mins + 4m pumping)
    const detourMins = station.estimatedDetourMinutes ?? Math.round(detourKm * 1.8);
    const totalRefuelOverheadMins = detourMins + waitMins + 4;
    // Lower overhead is better (e.g. 8 mins overhead = 92 score, 35 mins overhead = 15 score)
    const fastestRefuelScore = Math.max(
      10,
      Math.min(100, Math.round(110 - totalRefuelOverheadMins * 2.8))
    );

    // 6. Nearest Distance Score
    const distFromStart = station.distanceFromStartKm ?? 10;
    const nearestScore = Math.max(10, Math.min(100, Math.round(100 - (distFromStart / (totalRouteKm || 100)) * 90)));

    // 7. Composite BEST OVERALL Score:
    // Balanced: 25% Reliability + 30% Queue/Wait + 25% Pressure + 20% Detour
    // This strictly avoids ranking a station high just because of high pressure if it has huge queue or stale data!
    const compositeScore = Math.round(
      reliabilityScore * 0.25 +
      queueScore * 0.30 +
      pressureScore * 0.25 +
      detourScore * 0.20
    );

    return {
      ...station,
      score: compositeScore,
      fastestRefuelScore,
      nearestScore,
      reliabilityScore,
      recommendationCategory: null as RecommendationCategory,
      recommendationReason: null as string | null,
    };
  });

  // Sort candidates for each category
  const operationalCandidates = scoredStations.filter((s) => s.score !== 0);

  // 1. BEST OVERALL Winner
  const sortedByComposite = [...operationalCandidates].sort(
    (a, b) => (b.score ?? 0) - (a.score ?? 0)
  );
  const bestOverall = sortedByComposite[0] || null;

  // 2. FASTEST REFUELING Winner (lowest total detour + wait + pumping time)
  const sortedBySpeed = [...operationalCandidates].sort(
    (a, b) => (b.fastestRefuelScore ?? 0) - (a.fastestRefuelScore ?? 0)
  );
  // Pick fastest that isn't identical if alternatives exist, or allow same if it truly excels
  const fastestRefueling = sortedBySpeed[0] || null;

  // 3. NEAREST STATION Winner (lowest distance from start/current location)
  const sortedByDistance = [...operationalCandidates].sort(
    (a, b) => (a.distanceFromStartKm ?? 999) - (b.distanceFromStartKm ?? 999)
  );
  const nearestStation = sortedByDistance[0] || null;

  // Apply categories and detailed human-readable reasons to the station objects
  const labeledStations = scoredStations.map((station) => {
    const isBest = bestOverall && station.id === bestOverall.id;
    const isFastest = fastestRefueling && station.id === fastestRefueling.id;
    const isNearest = nearestStation && station.id === nearestStation.id;

    const waitAtArrival =
      station.arrivalPrediction?.predictedWaitMinutesAtArrival ??
      station.estimatedWaitMinutes ??
      2;
    const pressureAtArrival =
      station.arrivalPrediction?.predictedPressureBarAtArrival ??
      station.currentPressureBar ??
      200;
    const detour = station.extraDetourKm ?? 0.4;
    const dist = station.distanceFromStartKm ?? 10;

    let category: RecommendationCategory = null;
    let reason: string | null = station.recommendationReason;
    let convenienceBadge: string | undefined = undefined;

    if (isBest) {
      category = 'BEST_OVERALL';
      convenienceBadge = '🏆 Best Overall Choice';
      reason = `Optimal balance of verified high pressure (${pressureAtArrival} Bar), short arrival wait (~${waitAtArrival} mins), and minimal detour (+${detour} km) with high data reliability.`;
    } else if (isFastest && (!isBest || operationalCandidates.length <= 1)) {
      category = 'FASTEST_REFUELING';
      convenienceBadge = '⚡ Fastest Refueling Stop';
      reason = `Shortest total stop overhead: only ~${waitAtArrival}m queue wait with direct highway access (+${detour} km detour). Gets you back on the road fastest.`;
    } else if (isNearest && (!isBest && !isFastest)) {
      category = 'NEAREST_STATION';
      convenienceBadge = '📍 Nearest Station On Route';
      reason = `Closest pump along your corridor (only ${dist} km away, ~${station.arrivalPrediction?.etaMinutes ?? 12} mins drive). Current status: ${station.vehiclesWaiting ?? 0} cars, ${station.currentPressureBar ?? 190} Bar.`;
    }

    return {
      ...station,
      recommendationCategory: category,
      recommendationReason: reason,
      convenienceBadge,
    };
  });

  return {
    stations: labeledStations,
    bestOverall: labeledStations.find((s) => s.recommendationCategory === 'BEST_OVERALL') || bestOverall,
    fastestRefueling:
      labeledStations.find((s) => s.recommendationCategory === 'FASTEST_REFUELING') ||
      (fastestRefueling ? labeledStations.find((s) => s.id === fastestRefueling.id) || null : null),
    nearestStation:
      labeledStations.find((s) => s.recommendationCategory === 'NEAREST_STATION') ||
      (nearestStation ? labeledStations.find((s) => s.id === nearestStation.id) || null : null),
  };
}
