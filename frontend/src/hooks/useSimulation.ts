import { useCallback, useEffect, useRef, useState } from 'react';
import type { StationSummaryDto } from '../types/index';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const SIMULATION_INTERVAL_MS = 8_000;
/** Maximum relative jitter applied to vehiclesWaiting (±10 %). */
const QUEUE_JITTER_RATIO = 0.10;
/** Maximum absolute jitter applied to pressureBar (±2 bar). */
const PRESSURE_JITTER_BAR = 2;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Return a random float in [−delta, +delta]. */
function jitter(delta: number): number {
  return (Math.random() * 2 - 1) * delta;
}

/** Clamp a value between min and max (inclusive). */
function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * Apply one round of simulated fluctuation to a station snapshot.
 * Values are clearly tagged as simulated via the returned wrapper.
 */
function simulateStation(station: StationSummaryDto): SimulatedStation {
  const rawQueue = station.vehiclesWaiting ?? 0;
  const rawPressure = station.currentPressureBar ?? 200;

  const simulatedVehiclesWaiting = Math.max(
    0,
    Math.round(rawQueue + jitter(rawQueue * QUEUE_JITTER_RATIO)),
  );

  const simulatedPressureBar = clamp(
    parseFloat((rawPressure + jitter(PRESSURE_JITTER_BAR)).toFixed(1)),
    station.minSafeLimitBar ?? 150,
    station.maxSafeLimitBar ?? 250,
  );

  const simulatedWaitMinutes =
    simulatedVehiclesWaiting > 0
      ? Math.max(1, Math.round(simulatedVehiclesWaiting * 2.5))
      : 0;

  return {
    ...station,
    vehiclesWaiting: simulatedVehiclesWaiting,
    estimatedWaitMinutes: simulatedWaitMinutes,
    currentPressureBar: simulatedPressureBar,
    isSimulated: true,
  };
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** A station snapshot that includes a flag indicating the values are simulated. */
export interface SimulatedStation extends StationSummaryDto {
  /** Always true for data returned by this hook — not from live sensor/API. */
  isSimulated: true;
}

// ---------------------------------------------------------------------------
// Overloads
// ---------------------------------------------------------------------------

export function useSimulation(stations: StationSummaryDto[]): {
  simulatedStations: SimulatedStation[];
  isPaused: boolean;
  togglePause: () => void;
};

export function useSimulation(station: StationSummaryDto): {
  simulatedStation: SimulatedStation;
  isPaused: boolean;
  togglePause: () => void;
};

// ---------------------------------------------------------------------------
// Implementation
// ---------------------------------------------------------------------------

export function useSimulation(
  input: StationSummaryDto | StationSummaryDto[],
): {
  simulatedStations?: SimulatedStation[];
  simulatedStation?: SimulatedStation;
  isPaused: boolean;
  togglePause: () => void;
} {
  const isSingle = !Array.isArray(input);
  const stations: StationSummaryDto[] = isSingle ? [input] : input;

  const [simulatedData, setSimulatedData] = useState<SimulatedStation[]>(() =>
    stations.map(simulateStation),
  );
  const [isPaused, setIsPaused] = useState(false);

  // Keep a ref to the current source stations so the interval closure always
  // has the freshest base values without needing to restart the interval.
  const stationsRef = useRef<StationSummaryDto[]>(stations);
  useEffect(() => {
    stationsRef.current = stations;
    // On source change, re-seed the simulated data immediately.
    setSimulatedData(stationsRef.current.map(simulateStation));
  }, [stations]); // eslint-disable-line react-hooks/exhaustive-deps

  const isPausedRef = useRef(isPaused);
  useEffect(() => {
    isPausedRef.current = isPaused;
  }, [isPaused]);

  // -------------------------------------------------------------------------
  // Simulation interval
  // -------------------------------------------------------------------------
  useEffect(() => {
    const intervalId = setInterval(() => {
      if (isPausedRef.current) return;
      setSimulatedData(stationsRef.current.map(simulateStation));
    }, SIMULATION_INTERVAL_MS);

    return () => clearInterval(intervalId);
  }, []); // intentionally runs once — refs keep values fresh

  const togglePause = useCallback(() => {
    setIsPaused((p) => !p);
  }, []);

  if (isSingle) {
    return {
      simulatedStation: simulatedData[0],
      isPaused,
      togglePause,
    };
  }

  return {
    simulatedStations: simulatedData,
    isPaused,
    togglePause,
  };
}

export default useSimulation;
