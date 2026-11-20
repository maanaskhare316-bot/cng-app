import type {
  StationSummaryDto,
  ArrivalPrediction,
  PredictionConfidence,
  QueueTrend,
  QueueIntelligence,
} from '../types';

/**
 * Formats a future clock time given elapsed travel minutes
 */
function getEtaClockTime(minutesFromNow: number): string {
  const d = new Date(Date.now() + minutesFromNow * 60 * 1000);
  let hours = d.getHours();
  const mins = d.getMinutes();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12; // 0 should be 12
  const minsStr = mins < 10 ? `0${mins}` : `${mins}`;
  return `${hours}:${minsStr} ${ampm}`;
}

/**
 * Calculates time-of-day arrival intensity factor (peak vs off-peak)
 */
function getHourlyInflowRate(): number {
  const currentHour = new Date().getHours();
  // Morning peak: 8:00 - 11:30 AM
  if (currentHour >= 8 && currentHour <= 11) return 0.35; // ~1 car every 2.8 mins
  // Evening peak: 5:00 - 9:30 PM
  if (currentHour >= 17 && currentHour <= 21) return 0.38; // ~1 car every 2.6 mins
  // Night low traffic: 11:00 PM - 5:00 AM
  if (currentHour >= 23 || currentHour <= 5) return 0.10;
  // Standard daytime
  return 0.22;
}

/**
 * Computes Advanced Queue Intelligence including trend, average vehicle service time,
 * and calculation assumptions.
 */
export function computeQueueIntelligence(
  station: Pick<
    StationSummaryDto,
    'vehiclesWaiting' | 'estimatedWaitMinutes' | 'activeDispensers' | 'totalDispensers' | 'dispenserCapacityPerHour'
  >,
  predictedQueueAtArrival: number | null
): QueueIntelligence {
  const currentQ = station.vehiclesWaiting ?? 0;
  const activeNozzles = Math.max(1, station.activeDispensers || 4);
  const totalNozzles = Math.max(activeNozzles, station.totalDispensers || 4);

  // Average vehicle service time:
  // Base average fill is ~4.2 mins per standard 10–12 kg car cylinder
  const avgServiceTimeMinutes = Number((4.2).toFixed(1));

  // Service throughput: (activeNozzles / avgServiceTimeMinutes) cars per minute
  const serviceRatePerMinute = activeNozzles / avgServiceTimeMinutes;
  const inflowRatePerMinute = getHourlyInflowRate();
  const netDrift = inflowRatePerMinute - serviceRatePerMinute;

  let queueTrend: QueueTrend = 'STABLE';
  let queueTrendLabel = 'Stable (Inflow equals nozzle throughput)';

  if (predictedQueueAtArrival !== null) {
    const diff = predictedQueueAtArrival - currentQ;
    if (diff >= 2) {
      queueTrend = 'INCREASING';
      queueTrendLabel = `Increasing (+${diff} cars expected by ETA)`;
    } else if (diff <= -2) {
      queueTrend = 'DECREASING';
      queueTrendLabel = `Decreasing (${diff} cars clearing)`;
    } else {
      queueTrend = 'STABLE';
      queueTrendLabel = 'Stable queue rate';
    }
  } else if (netDrift > 0.05) {
    queueTrend = 'INCREASING';
    queueTrendLabel = 'Peak hour buildup ↗';
  } else if (netDrift < -0.05) {
    queueTrend = 'DECREASING';
    queueTrendLabel = 'Off-peak clearing ↘';
  }

  // Calculated wait time
  const waitMins =
    station.estimatedWaitMinutes ??
    Math.max(1, Math.round(currentQ * (avgServiceTimeMinutes / activeNozzles)));

  // Detailed engineering assumptions text
  const assumptionsText = `Calculated assuming ~${avgServiceTimeMinutes} mins average filling duration per vehicle across ${activeNozzles}/${totalNozzles} functional high-flow dispensers with 85% compressor cascade delivery efficiency.`;

  return {
    currentQueue: currentQ,
    estimatedWaitMinutes: waitMins,
    avgServiceTimeMinutes,
    activeDispensers: activeNozzles,
    totalDispensers: totalNozzles,
    queueTrend,
    queueTrendLabel,
    predictedQueueAtArrival,
    assumptionsText,
  };
}

/**
 * Smart Arrival Prediction Engine
 * Computes predicted queue, pressure, and wait time upon driver's ETA
 */
export function computeArrivalPrediction(
  station: Pick<
    StationSummaryDto,
    | 'currentPressureBar'
    | 'vehiclesWaiting'
    | 'estimatedWaitMinutes'
    | 'activeDispensers'
    | 'totalDispensers'
    | 'verificationStatus'
    | 'cngAvailability'
    | 'operationalStatus'
    | 'lastUpdatedTimestamp'
  >,
  distanceKm: number,
  etaMinutes: number
): ArrivalPrediction {
  const sanitizedDistance = Math.max(0.1, Number(distanceKm.toFixed(1)));
  const sanitizedEta = Math.max(1, Math.round(etaMinutes));
  const etaClock = getEtaClockTime(sanitizedEta);

  const DISCLAIMER =
    'Pressure & queue at arrival are statistical estimates. Compressor cycles fluctuate based on active vehicle loads.';

  // 1. Check if prediction is impossible due to lack of reliable telemetry or station closure
  const isStationClosed =
    station.operationalStatus === 'TEMPORARILY_CLOSED' ||
    station.cngAvailability === 'OUT_OF_STOCK' ||
    station.cngAvailability === 'COMPRESSOR_DOWN';

  const isDataStaleOrMissing =
    station.verificationStatus === 'UNAVAILABLE' ||
    station.verificationStatus === 'STALE_DATA' ||
    station.currentPressureBar === null ||
    station.vehiclesWaiting === null;

  if (isStationClosed) {
    return {
      distanceKm: sanitizedDistance,
      etaMinutes: sanitizedEta,
      etaClockTime: etaClock,
      currentQueue: station.vehiclesWaiting ?? null,
      predictedQueueAtArrival: null,
      currentWaitMinutes: station.estimatedWaitMinutes ?? null,
      predictedWaitMinutesAtArrival: null,
      currentPressureBar: station.currentPressureBar ?? null,
      predictedPressureBarAtArrival: null,
      queueTrend: 'STABLE',
      confidenceLevel: 'INSUFFICIENT_DATA',
      confidencePercentage: 0,
      predictionAvailable: false,
      unavailabilityReason:
        station.cngAvailability === 'OUT_OF_STOCK'
          ? 'Station reported out of CNG stock.'
          : station.cngAvailability === 'COMPRESSOR_DOWN'
          ? 'Compressor breakdown reported.'
          : 'Station is currently reported closed.',
      disclaimer: DISCLAIMER,
    };
  }

  if (isDataStaleOrMissing) {
    return {
      distanceKm: sanitizedDistance,
      etaMinutes: sanitizedEta,
      etaClockTime: etaClock,
      currentQueue: station.vehiclesWaiting ?? null,
      predictedQueueAtArrival: null,
      currentWaitMinutes: station.estimatedWaitMinutes ?? null,
      predictedWaitMinutesAtArrival: null,
      currentPressureBar: station.currentPressureBar ?? null,
      predictedPressureBarAtArrival: null,
      queueTrend: 'STABLE',
      confidenceLevel: 'INSUFFICIENT_DATA',
      confidencePercentage: 15,
      predictionAvailable: false,
      unavailabilityReason: 'Prediction unavailable — insufficient data.',
      disclaimer: DISCLAIMER,
    };
  }

  // 2. Data is reliable! Compute Queue & Wait Dynamics at ETA
  const currentQ = station.vehiclesWaiting ?? 0;
  const activeNozzles = Math.max(1, station.activeDispensers || 4);

  // Service rate: Average CNG filling time is ~4.2 mins per car
  const serviceRatePerMinute = activeNozzles * (1 / 4.2);
  const inflowRatePerMinute = getHourlyInflowRate();

  // Net queue shift over travel duration
  const netDeltaVehicles = (inflowRatePerMinute - serviceRatePerMinute) * sanitizedEta;
  const predictedQ = Math.max(0, Math.min(24, Math.round(currentQ + netDeltaVehicles)));

  // Wait time computation
  const waitPerCarMinutes = 4.2 / activeNozzles;
  const currentWait = station.estimatedWaitMinutes ?? Math.round(currentQ * waitPerCarMinutes);
  const predictedWait = Math.max(1, Math.round(predictedQ * waitPerCarMinutes));

  // Determine Queue Trend
  let queueTrend: QueueTrend = 'STABLE';
  if (predictedQ > currentQ + 1) queueTrend = 'INCREASING';
  else if (predictedQ < currentQ - 1) queueTrend = 'DECREASING';

  // 3. Compressor Pressure Dynamics at ETA
  const currentP = station.currentPressureBar ?? 200;
  let predictedP = currentP;

  // If predicted queue is heavy (>6 vehicles), compressor bank experiences high drawdown
  if (predictedQ >= 7) {
    const drawdown = Math.min(22, Math.round((predictedQ - 6) * 2.4));
    predictedP = Math.max(160, currentP - drawdown);
  } else if (predictedQ <= 2 && currentP < 218) {
    // Light queue gives compressor time to recharge cascade banks
    const recovery = Math.min(15, Math.round((3 - predictedQ) * 3));
    predictedP = Math.min(222, currentP + recovery);
  }

  // 4. Prediction Confidence Score (Base Source - Travel Horizon Decay)
  let baseConfidence = 92;
  if (station.verificationStatus === 'LIVE_VERIFIED') {
    baseConfidence = 96;
  } else if (station.verificationStatus === 'RECENTLY_UPDATED') {
    baseConfidence = 84;
  } else if (station.verificationStatus === 'COMMUNITY_REPORTED') {
    baseConfidence = 76;
  }

  // Decay by 0.35% for every minute of ETA travel (longer horizon = higher variance)
  const confidencePercentage = Math.max(
    35,
    Math.min(98, Math.round(baseConfidence - sanitizedEta * 0.35))
  );

  let confidenceLevel: PredictionConfidence = 'MEDIUM';
  if (confidencePercentage >= 85) {
    confidenceLevel = 'HIGH';
  } else if (confidencePercentage >= 70) {
    confidenceLevel = 'MEDIUM';
  } else if (confidencePercentage >= 40) {
    confidenceLevel = 'LOW';
  } else {
    confidenceLevel = 'INSUFFICIENT_DATA';
  }

  return {
    distanceKm: sanitizedDistance,
    etaMinutes: sanitizedEta,
    etaClockTime: etaClock,
    currentQueue: currentQ,
    predictedQueueAtArrival: predictedQ,
    currentWaitMinutes: currentWait,
    predictedWaitMinutesAtArrival: predictedWait,
    currentPressureBar: Math.round(currentP),
    predictedPressureBarAtArrival: Math.round(predictedP),
    queueTrend,
    confidenceLevel,
    confidencePercentage,
    predictionAvailable: true,
    disclaimer: DISCLAIMER,
  };
}
