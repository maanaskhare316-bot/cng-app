// Google Maps JavaScript API dynamic loader with Places, Geometry & Routes support

const STORAGE_KEY = 'cng_google_maps_api_key';

let loadPromise: Promise<boolean> | null = null;
let isLoaded = false;
let authFailed = false;

type LoaderListener = (loaded: boolean, error?: string | null) => void;
const listeners = new Set<LoaderListener>();

function notifyListeners(loaded: boolean, error?: string | null) {
  listeners.forEach((fn) => {
    try {
      fn(loaded, error);
    } catch (e) {
      console.error('[GoogleMaps] Error in loader listener:', e);
    }
  });
}

// Global callback for Google Maps authentication failures
if (typeof window !== 'undefined') {
  (window as any).gm_authFailure = () => {
    console.warn('[GoogleMaps] Authentication failed or billing not active for this API key.');
    authFailed = true;
    isLoaded = false;
    notifyListeners(false, 'Google Maps Authentication failed (billing/referrer restriction).');
    window.dispatchEvent(new CustomEvent('google-maps-auth-error'));
  };
}

export function getStoredGoogleApiKey(): string {
  try {
    const fromStorage = localStorage.getItem(STORAGE_KEY);
    if (fromStorage && fromStorage.trim()) return fromStorage.trim();
  } catch {
    // Ignore storage errors
  }
  return (import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined)?.trim() ?? '';
}

export function storeGoogleApiKey(key: string): void {
  try {
    if (!key.trim()) {
      localStorage.removeItem(STORAGE_KEY);
    } else {
      localStorage.setItem(STORAGE_KEY, key.trim());
    }
  } catch {
    // Ignore storage errors
  }
}

export function isGoogleMapsLoaded(): boolean {
  return isLoaded && typeof window !== 'undefined' && !!(window as any).google?.maps;
}

export function getGoogle(): any {
  if (typeof window !== 'undefined' && (window as any).google?.maps) {
    return (window as any).google;
  }
  return null;
}

export function hasGoogleMapsAuthFailed(): boolean {
  return authFailed;
}

export function subscribeGoogleMapsState(listener: LoaderListener): () => void {
  listeners.add(listener);
  // Initial immediate notification if already resolved
  if (isGoogleMapsLoaded()) {
    listener(true, null);
  } else if (authFailed) {
    listener(false, 'Google Maps authentication failed.');
  }
  return () => {
    listeners.delete(listener);
  };
}

export function resetGoogleMapsLoader(): void {
  loadPromise = null;
  isLoaded = false;
  authFailed = false;
  const existing = document.getElementById('google-maps-script');
  if (existing) {
    existing.remove();
  }
}

export function loadGoogleMaps(customKey?: string): Promise<boolean> {
  if (typeof window === 'undefined') return Promise.resolve(false);

  const key = customKey ?? getStoredGoogleApiKey();

  // If already loaded with google.maps present
  if ((window as any).google?.maps) {
    isLoaded = true;
    notifyListeners(true, null);
    return Promise.resolve(true);
  }

  // If load is already in-flight
  if (loadPromise) return loadPromise;

  loadPromise = new Promise((resolve) => {
    const script = document.createElement('script');
    script.id = 'google-maps-script';
    script.async = true;
    script.defer = true;

    const callbackName = `__gmapsCallback_${Date.now()}`;
    let timeoutId: any = null;

    (window as any)[callbackName] = () => {
      if (timeoutId) clearTimeout(timeoutId);
      isLoaded = true;
      authFailed = false;
      delete (window as any)[callbackName];
      notifyListeners(true, null);
      resolve(true);
    };

    script.onerror = () => {
      if (timeoutId) clearTimeout(timeoutId);
      console.warn('[GoogleMaps] Failed to load Google Maps script tag.');
      isLoaded = false;
      notifyListeners(false, 'Failed to fetch Google Maps script from Google servers.');
      resolve(false);
    };

    // Timeout fallback after 8 seconds
    timeoutId = setTimeout(() => {
      console.warn('[GoogleMaps] Google Maps loading timed out.');
      if (!isLoaded) {
        notifyListeners(false, 'Google Maps script connection timed out.');
        resolve(false);
      }
    }, 8000);

    const keyParam = key ? `&key=${encodeURIComponent(key)}` : '';
    // Load official libraries: places, geometry, marker
    script.src = `https://maps.googleapis.com/maps/api/js?v=weekly&libraries=places,geometry,marker&loading=async&callback=${callbackName}${keyParam}`;
    document.head.appendChild(script);
  });

  return loadPromise;
}

