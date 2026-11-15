import { useCallback, useState } from 'react';
import { stationApi } from '../services/api';
import type { RouteSearchRequest, RouteSearchResultDto } from '../types/index';

interface RouteSearchState {
  result: RouteSearchResultDto | null;
  isLoading: boolean;
  error: string | null;
}

export function useRouteSearch() {
  const [state, setState] = useState<RouteSearchState>({ result: null, isLoading: false, error: null });

  const search = useCallback(async (req: RouteSearchRequest): Promise<RouteSearchResultDto | null> => {
    setState({ result: null, isLoading: true, error: null });
    try {
      const result = await stationApi.searchRoute(req);
      setState({ result, isLoading: false, error: null });
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Route search failed. Please try again.';
      setState({ result: null, isLoading: false, error: message });
      return null;
    }
  }, []);

  const reset = useCallback(() => {
    setState({ result: null, isLoading: false, error: null });
  }, []);

  return { result: state.result, isLoading: state.isLoading, error: state.error, search, reset };
}

export default useRouteSearch;
