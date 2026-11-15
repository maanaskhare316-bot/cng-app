import { useCallback, useEffect, useRef, useState } from 'react';
import { telemetryApi } from '../services/api';
import { useAppContext } from '../context/AppContext';
import type { PressureReading, QueueObservation } from '../types/index';

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------
interface StationTelemetryState {
  pressureHistory: PressureReading[];
  queueHistory: QueueObservation[];
  isLoading: boolean;
  error: string | null;
}

/**
 * Fetches (and optionally polls) pressure and queue telemetry for a single station.
 *
 * @param stationId        - The station to fetch telemetry for.
 * @param pollingIntervalMs - How often to re-fetch while the tab is active (default 15 s).
 *                            Pass 0 to disable polling entirely.
 */
export function useStationTelemetry(
  stationId: number,
  pollingIntervalMs = 15_000,
) {
  const { settings } = useAppContext();

  const [state, setState] = useState<StationTelemetryState>({
    pressureHistory: [],
    queueHistory: [],
    isLoading: false,
    error: null,
  });

  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // -------------------------------------------------------------------------
  // Data-fetch function
  // -------------------------------------------------------------------------
  const fetchTelemetry = useCallback(async () => {
    if (!mountedRef.current) return;
    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const [pressure, queue] = await Promise.all([
        telemetryApi.getPressureHistory(stationId),
        telemetryApi.getQueueHistory(stationId),
      ]);

      if (!mountedRef.current) return;
      setState({
        pressureHistory: pressure,
        queueHistory: queue,
        isLoading: false,
        error: null,
      });
    } catch (err) {
      if (!mountedRef.current) return;
      const message =
        err instanceof Error ? err.message : 'Failed to load telemetry data';
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: message,
      }));
    }
  }, [stationId]);

  // -------------------------------------------------------------------------
  // Initial fetch + polling
  // -------------------------------------------------------------------------
  useEffect(() => {
    void fetchTelemetry();

    // Only start the polling interval when simulation is enabled and a
    // positive interval is provided.
    if (!settings.simulationEnabled || pollingIntervalMs <= 0) return;

    const intervalId = setInterval(() => {
      void fetchTelemetry();
    }, pollingIntervalMs);

    return () => clearInterval(intervalId);
  }, [fetchTelemetry, pollingIntervalMs, settings.simulationEnabled]);

  return {
    pressureHistory: state.pressureHistory,
    queueHistory: state.queueHistory,
    isLoading: state.isLoading,
    error: state.error,
  };
}

export default useStationTelemetry;
