import type {
  StationSummaryDto,
  AlertPreferences,
  StationAlertNotification,
} from '../types';

export const DEFAULT_ALERT_PREFERENCES: AlertPreferences = {
  queueSpikes: true,
  stationClosure: true,
  pressureDrops: true,
  infoChanges: true,
};

/**
 * Checks for actual state transitions between previous and new station state,
 * and generates real alerts strictly when changes occur.
 */
export function detectStationAlerts(
  prevStation: StationSummaryDto,
  nextStation: StationSummaryDto,
  preferences: AlertPreferences = DEFAULT_ALERT_PREFERENCES
): StationAlertNotification[] {
  const alerts: StationAlertNotification[] = [];
  const now = new Date().toISOString();

  // 1. Station Closure or Gas Out of Stock Alert
  if (preferences.stationClosure) {
    if (prevStation.verifiedOpen && !nextStation.verifiedOpen) {
      alerts.push({
        id: `alert-${nextStation.id}-${Date.now()}-closed`,
        stationId: nextStation.id,
        stationName: nextStation.name,
        type: 'STATION_CLOSED',
        severity: 'CRITICAL',
        title: 'Station Reported Closed',
        message: `${nextStation.name} has been reported temporarily closed. Rerouting recommended!`,
        timestamp: now,
        read: false,
      });
    } else if (
      prevStation.cngAvailability === 'AVAILABLE' &&
      nextStation.cngAvailability === 'OUT_OF_STOCK'
    ) {
      alerts.push({
        id: `alert-${nextStation.id}-${Date.now()}-dry`,
        stationId: nextStation.id,
        stationName: nextStation.name,
        type: 'OUT_OF_STOCK',
        severity: 'CRITICAL',
        title: 'CNG Out of Stock',
        message: `${nextStation.name} has run out of CNG stock.`,
        timestamp: now,
        read: false,
      });
    }
  }

  // 2. Significant Queue Spikes (>= +3 vehicles)
  if (preferences.queueSpikes) {
    const prevQ = prevStation.vehiclesWaiting ?? 0;
    const nextQ = nextStation.vehiclesWaiting ?? 0;
    const delta = nextQ - prevQ;

    if (delta >= 3 && nextQ >= 6) {
      alerts.push({
        id: `alert-${nextStation.id}-${Date.now()}-queue`,
        stationId: nextStation.id,
        stationName: nextStation.name,
        type: 'QUEUE_SPIKE',
        severity: 'WARNING',
        title: 'Significant Queue Buildup',
        message: `Queue jumped by +${delta} vehicles at ${nextStation.name} (now ${nextQ} cars waiting, ~${nextStation.estimatedWaitMinutes}m wait).`,
        timestamp: now,
        read: false,
      });
    }
  }

  // 3. Pressure Drop below 165 Bar
  if (preferences.pressureDrops) {
    const prevP = prevStation.currentPressureBar ?? 200;
    const nextP = nextStation.currentPressureBar ?? 200;

    if (prevP >= 175 && nextP < 165) {
      alerts.push({
        id: `alert-${nextStation.id}-${Date.now()}-pressure`,
        stationId: nextStation.id,
        stationName: nextStation.name,
        type: 'PRESSURE_DROP',
        severity: 'WARNING',
        title: 'Compressor Pressure Drop',
        message: `Pressure at ${nextStation.name} dipped to ${Math.round(nextP)} Bar (below 165 Bar threshold). Slower fills expected.`,
        timestamp: now,
        read: false,
      });
    }
  }

  return alerts;
}
