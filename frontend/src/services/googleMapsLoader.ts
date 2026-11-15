// Google Maps JavaScript API dynamic loader

const STORAGE_KEY = 'cng_google_maps_api_key';

let loadPromise: Promise<boolean> | null = null;
let isLoaded = false;
let authFailed = false;

// Global callback for auth failures
if (typeof window !== 'undefined') {
  (window as any).gm_authFailure = () => {
    console.warn('[GoogleMaps] Authentication failed or billing not active for this API key.');
    authFailed = true;
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

export function hasGoogleMapsAuthFailed(): boolean {
  return authFailed;
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
    return Promise.resolve(true);
  }

  // If load is already in-flight
  if (loadPromise) return loadPromise;

  loadPromise = new Promise((resolve) => {
    // If no key is provided, we can either resolve false or load in dev/preview mode
    // (Google Maps JS API allows demo rendering with watermarks if no key or sample key)
    const script = document.createElement('script');
    script.id = 'google-maps-script';
    script.async = true;
    script.defer = true;

    const callbackName = `__gmapsCallback_${Date.now()}`;
    (window as any)[callbackName] = () => {
      isLoaded = true;
      delete (window as any)[callbackName];
      resolve(true);
    };

    script.onerror = () => {
      console.warn('[GoogleMaps] Failed to load Google Maps script tag.');
      resolve(false);
    };

    const keyParam = key ? `&key=${encodeURIComponent(key)}` : '';
    script.src = `https://maps.googleapis.com/maps/api/js?v=weekly&libraries=places,geometry&callback=${callbackName}${keyParam}`;
    document.head.appendChild(script);
  });

  return loadPromise;
}
