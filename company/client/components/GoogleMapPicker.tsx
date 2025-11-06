// 📁company/client/components/ui/GoogleMapPicker.tsx
import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { Button } from '@/components/ui/button';
import { Search, Navigation, MapPin, Loader2, X, AlertCircle, Smartphone } from 'lucide-react';
import { toast } from 'sonner';

export type MapPickerProps = {
  lat: number;
  lng: number;
  onChange: (lat: number, lng: number) => void;
  height?: number | string;
  showLocationTips?: boolean;
  onTipsClose?: () => void;
};

// Load Google Maps script
const loadGoogleMaps = (apiKey: string): Promise<boolean> => {
  return new Promise((resolve) => {
    if (window.google?.maps?.Map) {
      resolve(true);
      return;
    }

    const existingScript = document.querySelector(`script[src*="maps.googleapis.com"]`);
    if (existingScript) {
      const checkLoaded = () => {
        if (window.google?.maps?.Map) {
          resolve(true);
        } else {
          setTimeout(checkLoaded, 100);
        }
      };
      checkLoaded();
      return;
    }

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places,geometry&callback=gmapsCallback`;
    script.async = true;
    script.defer = true;
    
    (window as any).gmapsCallback = () => resolve(true);
    
    script.onerror = () => {
      delete (window as any).gmapsCallback;
      resolve(false);
    };
    
    document.head.appendChild(script);
  });
};

declare global {
  interface Window {
    google: any;
    gmapsCallback?: () => void;
  }
}

// Helper function to validate coordinates
const isValidCoordinate = (coord: any): coord is number => {
  return typeof coord === 'number' && isFinite(coord) && !isNaN(coord);
};

// Helper function to get safe coordinates
const getSafeCoordinates = (lat: any, lng: any): { lat: number; lng: number } => {
  const safeLat = isValidCoordinate(lat) ? lat : -15.4167;
  const safeLng = isValidCoordinate(lng) ? lng : 28.2833;
  return { lat: safeLat, lng: safeLng };
};

// Get location by IP address
const getLocationByIP = async (): Promise<{ lat: number; lng: number; accuracy: number; method: 'ip' }> => {
  try {
    const services = [
      'https://ipapi.co/json/',
      'https://ipinfo.io/json?token=YOUR_IPINFO_TOKEN',
      'https://api.ipgeolocation.io/ipgeo?apiKey=YOUR_IPGEOLOCATION_KEY'
    ];

    for (const service of services) {
      try {
        const response = await fetch(service);
        if (response.ok) {
          const data = await response.json();
          if (data.latitude && data.longitude) {
            return {
              lat: data.latitude,
              lng: data.longitude,
              accuracy: data.accuracy || 5000,
              method: 'ip'
            };
          }
        }
      } catch (error) {
        console.log(`IP service ${service} failed:`, error);
        continue;
      }
    }
    throw new Error('All IP location services failed');
  } catch (error) {
    console.error('IP location failed:', error);
    return {
      lat: -15.4167,
      lng: 28.2833,
      accuracy: 10000,
      method: 'ip'
    };
  }
};

// Enhanced geolocation with Google Maps Geolocation API fallback
const getEnhancedLocation = async (googleMapsApiKey: string): Promise<{ lat: number; lng: number; accuracy: number; method: 'gps' | 'google' | 'ip' }> => {
  // First try: Browser GPS with high accuracy
  try {
    const gpsPosition = await new Promise<GeolocationPosition>((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation not supported'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        resolve,
        reject,
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        }
      );
    });

    const accuracy = gpsPosition.coords.accuracy;
    console.log('GPS accuracy:', accuracy, 'meters');

    // If GPS accuracy is good, use it
    if (accuracy <= 100) {
      return {
        lat: gpsPosition.coords.latitude,
        lng: gpsPosition.coords.longitude,
        accuracy: accuracy,
        method: 'gps'
      };
    }

    // If GPS accuracy is poor, try to enhance with Google's service
    if (googleMapsApiKey) {
      try {
        const googleLocation = await getGoogleGeolocation(googleMapsApiKey);
        if (googleLocation.accuracy < accuracy) {
          return { ...googleLocation, method: 'google' };
        }
      } catch (googleError) {
        console.log('Google Geolocation failed, using GPS:', googleError);
      }
    }

    // Use the best available (GPS)
    return {
      lat: gpsPosition.coords.latitude,
      lng: gpsPosition.coords.longitude,
      accuracy: accuracy,
      method: 'gps'
    };

  } catch (gpsError) {
    console.log('GPS failed, falling back to IP:', gpsError);
    // Fallback to IP location
    return await getLocationByIP();
  }
};

// Google Maps Geolocation API
const getGoogleGeolocation = async (apiKey: string): Promise<{ lat: number; lng: number; accuracy: number }> => {
  const response = await fetch(`https://www.googleapis.com/geolocation/v1/geolocate?key=${apiKey}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      considerIp: true,
    }),
  });

  if (!response.ok) {
    throw new Error('Google Geolocation API failed');
  }

  const data = await response.json();
  return {
    lat: data.location.lat,
    lng: data.location.lng,
    accuracy: data.accuracy
  };
};

export default function GoogleMapPicker({ 
  lat, 
  lng, 
  onChange, 
  height = 400,
  showLocationTips = true,
  onTipsClose 
}: MapPickerProps) {
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const markerRef = useRef<google.maps.Marker | null>(null);
  const autocompleteServiceRef = useRef<google.maps.places.AutocompleteService | null>(null);
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<string>("");
  const [currentCoords, setCurrentCoords] = useState<{ lat: number; lng: number }>({ lat, lng });
  const [locationMethod, setLocationMethod] = useState<'gps' | 'google' | 'ip' | 'manual' | null>(null);
  const [locationAccuracy, setLocationAccuracy] = useState<number | null>(null);
  const [internalShowTips, setInternalShowTips] = useState(showLocationTips);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout>();
  const geocoderRef = useRef<google.maps.Geocoder | null>(null);
  const initializationAttempted = useRef(false);
  const accuracyCircleRef = useRef<google.maps.Circle | null>(null);
  
  // UPDATED: Better permission states
  const [showPermissionPopup, setShowPermissionPopup] = useState(false);
  const [locationPermissionState, setLocationPermissionState] = useState<'granted' | 'denied' | 'prompt' | 'unknown'>('unknown');
  const [checkingPermission, setCheckingPermission] = useState(false);
  const [hasAutoShownPopup, setHasAutoShownPopup] = useState(false);

  // Get safe coordinates to use
  const safeCoords = useMemo(() => getSafeCoordinates(lat, lng), [lat, lng]);

  // Initialize services when ready
  useEffect(() => {
    if (ready && window.google?.maps?.places) {
      autocompleteServiceRef.current = new google.maps.places.AutocompleteService();
      geocoderRef.current = new google.maps.Geocoder();
    }
  }, [ready]);

  // UPDATED: Better location permission status checking with auto-popup
  useEffect(() => {
    const checkPermissionStatus = async () => {
      if (!navigator.permissions || !navigator.permissions.query) {
        // If Permissions API is not supported, we don't know the state
        setLocationPermissionState('unknown');
        // Show popup since we don't know the state
        setTimeout(() => {
          if (!hasAutoShownPopup) {
            setShowPermissionPopup(true);
            setHasAutoShownPopup(true);
          }
        }, 1000);
        return;
      }

      try {
        const permissionStatus = await navigator.permissions.query({ name: 'geolocation' });
        const state = permissionStatus.state as 'granted' | 'denied' | 'prompt';
        setLocationPermissionState(state);
        
        // Auto-show popup if permission is not set (prompt state)
        if (state === 'prompt' && !hasAutoShownPopup) {
          setTimeout(() => {
            setShowPermissionPopup(true);
            setHasAutoShownPopup(true);
          }, 1000);
        }
        
        permissionStatus.onchange = () => {
          const newState = permissionStatus.state as 'granted' | 'denied' | 'prompt';
          setLocationPermissionState(newState);
        };
      } catch (error) {
        console.error('Error checking location permission:', error);
        setLocationPermissionState('unknown');
        // Show popup on error since we don't know the state
        setTimeout(() => {
          if (!hasAutoShownPopup) {
            setShowPermissionPopup(true);
            setHasAutoShownPopup(true);
          }
        }, 1000);
      }
    };

    checkPermissionStatus();
  }, [hasAutoShownPopup]);

  // Enhanced location detection
  const detectUserLocation = async () => {
    setSearchLoading(true);
    
    try {
      const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
      const location = await getEnhancedLocation(apiKey);
      
      console.log('Location detected:', location);
      updateMapLocation(location);
      
      if (location.method === 'gps' && location.accuracy <= 50) {
        toast.success(`High accuracy location detected (±${Math.round(location.accuracy)}m)`);
      } else if (location.method === 'gps') {
        toast.success(`Location detected (±${Math.round(location.accuracy)}m)`);
      } else if (location.method === 'google') {
        toast.success(`Enhanced location detected (±${Math.round(location.accuracy)}m)`);
      } else if (location.method === 'ip') {
        toast.warning(`Approximate location detected (±${(location.accuracy/1000).toFixed(1)}km). For precise placement, use a mobile device or search for your exact address.`);
      }
      
    } catch (error: any) {
      console.error('Location detection failed:', error);
      toast.error('Could not detect your location. Please search for your business address.');
    } finally {
      setSearchLoading(false);
    }
  };

  // UPDATED: Better location detection with improved permission handling
  const getCurrentLocation = useCallback(async () => {
    setCheckingPermission(true);
    
    try {
      // Check if geolocation is supported
      if (!navigator.geolocation) {
        toast.error('Geolocation is not supported by your browser');
        return;
      }

      // If we know permission is denied, show error and return
      if (locationPermissionState === 'denied') {
        toast.error('Location access denied. Please enable location permissions in your browser settings.');
        return;
      }

      // If permission state is unknown or prompt, show the permission popup
      if (locationPermissionState === 'prompt' || locationPermissionState === 'unknown') {
        setShowPermissionPopup(true);
        return;
      }

      // If permission is already granted, proceed with location detection
      await detectUserLocation();
      
    } catch (error) {
      console.error('Error checking location permission:', error);
    } finally {
      setCheckingPermission(false);
    }
  }, [locationPermissionState, detectUserLocation]);

  // UPDATED: Handle permission grant from popup
  const handleGrantPermission = async () => {
    setShowPermissionPopup(false);
    setCheckingPermission(true);
    
    try {
      // Now actually request the location - this will trigger the browser's permission prompt
      await detectUserLocation();
    } catch (error: any) {
      console.error('Location detection after permission grant failed:', error);
      
      // Check if the error is due to permission denial
      if (error.code === error.PERMISSION_DENIED) {
        setLocationPermissionState('denied');
        toast.error('Location access denied. Please enable location permissions in your browser settings.');
      } else {
        toast.error('Failed to get your location. Please try again.');
      }
    } finally {
      setCheckingPermission(false);
    }
  };

  // Update map with new location
  const updateMapLocation = (location: { lat: number; lng: number; accuracy: number; method: 'gps' | 'google' | 'ip' | 'manual' }) => {
    if (markerRef.current && mapRef.current && ready) {
      const newPosition = new google.maps.LatLng(location.lat, location.lng);
      
      markerRef.current.setPosition(newPosition);
      mapRef.current.setCenter(newPosition);
      const zoomLevel = location.accuracy < 100 ? 17 : location.accuracy < 1000 ? 15 : 12;
      mapRef.current.setZoom(zoomLevel);
      
      if ((location.method === 'gps' || location.method === 'google') && location.accuracy < 1000) {
        showAccuracyCircle({ lat: location.lat, lng: location.lng }, location.accuracy);
      }
      
      updateLocationName(location.lat, location.lng);
      onChange(location.lat, location.lng);
      setLocationAccuracy(location.accuracy);
      setLocationMethod(location.method);
      setCurrentCoords({ lat: location.lat, lng: location.lng });
    }
  };

  // FIXED: Enhanced search with broader matching
  const performSearch = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim() || !ready || !autocompleteServiceRef.current) {
      setSearchResults([]);
      setShowResults(false);
      return;
    }
    
    setSearchLoading(true);
    try {
      autocompleteServiceRef.current.getPlacePredictions(
        {
          input: searchQuery,
          componentRestrictions: { country: 'zm' },
        },
        (predictions: any[], status: string) => {
          if (status === google.maps.places.PlacesServiceStatus.OK && predictions) {
            setSearchResults(predictions.slice(0, 8));
            setShowResults(true);
          } else {
            setSearchResults([]);
            setShowResults(false);
          }
          setSearchLoading(false);
        }
      );
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults([]);
      setShowResults(false);
      setSearchLoading(false);
    }
  }, [ready]);

  // Debounced search effect
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (query.trim()) {
      setSearchLoading(true);
      searchTimeoutRef.current = setTimeout(() => {
        performSearch(query);
      }, 250);
    } else {
      setSearchResults([]);
      setShowResults(false);
      setSearchLoading(false);
    }

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [query, performSearch]);

  // Initialize Google Maps
  useEffect(() => {
    let mounted = true;
    
    const initializeMap = async () => {
      if (initializationAttempted.current) return;
      initializationAttempted.current = true;

      try {
        setLoading(true);
        setError(null);
        
        const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
        
        if (!apiKey) {
          throw new Error('Google Maps API key not found in environment variables');
        }

        const loaded = await loadGoogleMaps(apiKey);
        
        if (!mounted) return;
        
        if (!loaded) {
          throw new Error('Google Maps failed to load. Check your API key and network connection.');
        }

        if (!window.google?.maps?.Map) {
          throw new Error('Google Maps API not properly initialized');
        }

        setReady(true);
        
      } catch (error) {
        console.error('Google Maps initialization error:', error);
        if (mounted) {
          setError(error instanceof Error ? error.message : 'Unknown error loading map');
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    initializeMap();

    return () => {
      mounted = false;
      delete (window as any).gmapsCallback;
    };
  }, []);

  // Update location name using reverse geocoding
  const updateLocationName = useCallback(async (latitude: number, longitude: number) => {
    if (!ready || !geocoderRef.current) return;

    try {
      geocoderRef.current.geocode(
        { location: { lat: latitude, lng: longitude } },
        (results, status) => {
          if (status === 'OK' && results && results[0]) {
            const address = results[0].formatted_address;
            setSelectedLocation(address);
          } else {
            setSelectedLocation(`Location: ${latitude.toFixed(6)}, ${longitude.toFixed(6)}`);
          }
        }
      );
    } catch (error) {
      console.error('Reverse geocoding error:', error);
      setSelectedLocation(`Location: ${latitude.toFixed(6)}, ${longitude.toFixed(6)}`);
    }
  }, [ready]);

  // Show accuracy circle on map
  const showAccuracyCircle = useCallback((center: { lat: number; lng: number }, accuracy: number) => {
    if (!mapRef.current || !ready) return;

    if (accuracyCircleRef.current) {
      accuracyCircleRef.current.setMap(null);
    }

    accuracyCircleRef.current = new google.maps.Circle({
      strokeColor: '#4285F4',
      strokeOpacity: 0.8,
      strokeWeight: 2,
      fillColor: '#4285F4',
      fillOpacity: 0.15,
      map: mapRef.current,
      center: center,
      radius: accuracy,
    });

    setTimeout(() => {
      if (accuracyCircleRef.current) {
        accuracyCircleRef.current.setMap(null);
        accuracyCircleRef.current = null;
      }
    }, 10000);
  }, [ready]);

  // Initialize map when ready
  useEffect(() => {
    if (!ready || !mapContainerRef.current) return;
    
    try {
      const { lat: safeLat, lng: safeLng } = safeCoords;
      
      const map = new google.maps.Map(mapContainerRef.current, {
        center: { lat: safeLat, lng: safeLng },
        zoom: 15,
        streetViewControl: true,
        mapTypeControl: false,
        fullscreenControl: true,
        zoomControl: true,
        clickableIcons: false,
      });

      const marker = new google.maps.Marker({
        position: { lat: safeLat, lng: safeLng },
        map: map,
        draggable: true,
        title: "Your business location",
        optimized: true,
        icon: {
          url: "https://maps.google.com/mapfiles/ms/icons/red-dot.png",
          scaledSize: new google.maps.Size(32, 32),
          anchor: new google.maps.Point(16, 32),
        }
      });

      marker.addListener('dragend', () => {
        const position = marker.getPosition();
        if (position) {
          const newLat = position.lat();
          const newLng = position.lng();
          if (isValidCoordinate(newLat) && isValidCoordinate(newLng)) {
            updateLocationName(newLat, newLng);
            onChange(newLat, newLng);
            setLocationAccuracy(null);
            setLocationMethod('manual');
          }
        }
      });

      map.addListener('click', (e: google.maps.MapMouseEvent) => {
        if (e.latLng) {
          const newLat = e.latLng.lat();
          const newLng = e.latLng.lng();
          marker.setPosition(e.latLng);
          if (isValidCoordinate(newLat) && isValidCoordinate(newLng)) {
            updateLocationName(newLat, newLng);
            onChange(newLat, newLng);
            setLocationAccuracy(null);
            setLocationMethod('manual');
          }
        }
      });

      mapRef.current = map;
      markerRef.current = marker;

      updateLocationName(safeLat, safeLng);

    } catch (error) {
      console.error('Error creating map:', error);
      setError('Failed to create map instance');
    }
  }, [ready, onChange, safeCoords, updateLocationName]);

  // FIXED: Search result selection with proper event handling
  const pickResult = useCallback(async (result: any) => {
    if (!mapRef.current || !ready) return;

    try {
      const { Place } = await google.maps.importLibrary("places") as any;
      const place = await Place.fromPlaceId({
        placeId: result.place_id,
        requestedFields: ['location', 'displayName', 'formattedAddress']
      });

      if (place && place.location) {
        const newLat = place.location.lat();
        const newLng = place.location.lng();
        
        if (markerRef.current && mapRef.current && isValidCoordinate(newLat) && isValidCoordinate(newLng)) {
          const newPosition = new google.maps.LatLng(newLat, newLng);
          
          markerRef.current.setPosition(newPosition);
          mapRef.current.setCenter(newPosition);
          mapRef.current.setZoom(17);
          
          const displayName = place.formattedAddress || place.displayName || result.description;
          setSelectedLocation(displayName);
          setQuery(displayName);
          setCurrentCoords({ lat: newLat, lng: newLng });
          onChange(newLat, newLng);
          setLocationMethod('manual');
          setShowResults(false);
        }
      }
    } catch (error) {
      console.error('Error getting place details:', error);
      if (geocoderRef.current) {
        geocoderRef.current.geocode(
          { address: result.description },
          (results, status) => {
            if (status === 'OK' && results && results[0]) {
              const location = results[0].geometry.location;
              const newLat = location.lat();
              const newLng = location.lng();
              
              if (markerRef.current && mapRef.current) {
                const newPosition = new google.maps.LatLng(newLat, newLng);
                markerRef.current.setPosition(newPosition);
                mapRef.current.setCenter(newPosition);
                mapRef.current.setZoom(17);
                
                setSelectedLocation(result.description);
                setQuery(result.description);
                setCurrentCoords({ lat: newLat, lng: newLng });
                onChange(newLat, newLng);
                setLocationMethod('manual');
                setShowResults(false);
              }
            }
          }
        );
      }
    }
  }, [ready, onChange]);

  const retryInitialization = useCallback(() => {
    setError(null);
    setLoading(true);
    setReady(false);
    initializationAttempted.current = false;
    
    setTimeout(() => {
      const initialize = async () => {
        const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
        if (apiKey) {
          await loadGoogleMaps(apiKey);
          setReady(true);
          setLoading(false);
        } else {
          setError('API key not found');
          setLoading(false);
        }
      };
      initialize();
    }, 100);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('.search-container') && !target.closest('.search-results')) {
        setShowResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const clearSearch = () => {
    setQuery('');
    setSearchResults([]);
    setShowResults(false);
  };

  const handleTipsClose = () => {
    setInternalShowTips(false);
    onTipsClose?.();
  };

  if (loading) {
    return (
      <div style={{ height }} className="flex items-center justify-center rounded-lg border bg-muted">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
          <p className="mt-2 text-sm text-muted-foreground">Loading Google Maps...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ height }} className="flex items-center justify-center rounded-lg border bg-destructive/10 p-4">
        <div className="text-center">
          <p className="text-destructive font-medium">Map Loading Failed</p>
          <p className="text-sm text-muted-foreground mt-1 max-w-md">{error}</p>
          <div className="mt-3 space-y-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={retryInitialization}
            >
              Retry Loading Map
            </Button>
          </div>
        </div>
      </div>
    );
  }
console.log(locationPermissionState)
  return (
    <div className="space-y-4">
       {/* UPDATED: Location Permission Denied Alert - Now shows on ALL screen sizes */}
        {locationPermissionState === 'prompt' && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 shadow-sm">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <h4 className="font-medium text-red-800 text-sm mb-2">
                Location Access Required
              </h4>
              <div className="text-red-700 text-xs space-y-2">
                <p><strong>To enable location access:</strong></p>
                
                <p className="mt-2">Refresh the page and try the "Use My Location" button again.</p>
              </div>
            </div>
          </div>
        </div>
        )}
        {locationPermissionState === 'denied' && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 shadow-sm">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <h4 className="font-medium text-red-800 text-sm mb-2">
                Location Access Required
              </h4>
              <div className="text-red-700 text-xs space-y-2">
                <p><strong>To enable location access:</strong></p>
                <div className="space-y-1">
                  <p><strong>Chrome (Android):</strong> Settings → Site Settings → Location → Allow for this site</p>
                  <p><strong>Chrome (Desktop):</strong> Click the lock icon in address bar → Site settings → Location → Allow</p>
                  <p><strong>Safari (iOS):</strong> Settings → Privacy → Location Services → [This App] → While Using the App</p>
                  <p><strong>Firefox:</strong> Options → Privacy & Security → Permissions → Location → Settings → Allow</p>
                  <p><strong>General:</strong> Look for location block icon in address bar and click to allow permissions</p>
                </div>
                <p className="mt-2">After enabling, refresh the page and try the "Use My Location" button again.</p>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Location Tips Banner - NOW OUTSIDE THE MAP */}
      {internalShowTips && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 shadow-sm">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-amber-800 text-sm">
                  Set Your Precise Business Location
                </h4>
                <button
                  onClick={handleTipsClose}
                  className="text-amber-600 hover:text-amber-800 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="text-amber-700 text-xs mt-2 space-y-1">
                <p>• <strong>Search for nearby landmarks</strong> and drag the red pin to your exact spot</p>
                <p>• <strong>Allow location access</strong> for automatic detection with better accuracy</p>
                <p>• <strong>Click "Locate" button</strong> to automatically find your current position</p>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Map Container */}
      <div style={{ height }} className="relative rounded-lg overflow-hidden border bg-white">
        {/* Search Bar */}
        <div className="absolute z-10 left-3 right-3 top-3 flex gap-2 search-container">
          <div className="flex-1 relative">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onFocus={() => query.trim() && setShowResults(true)}
                placeholder="Search for businesses, addresses, or areas in Zambia..."
                className="w-full h-12 rounded-lg bg-background/95 backdrop-blur pl-10 pr-10 border shadow-lg transition-all focus:ring-2 focus:ring-primary focus:border-primary"
              />
              {query && (
                <button
                  onClick={clearSearch}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
              {searchLoading && (
                <div className="absolute right-10 top-1/2 transform -translate-y-1/2">
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                </div>
              )}
            </div>
            
            {/* Search Results Dropdown */}
            {showResults && searchResults.length > 0 && (
              <div className="absolute mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-xl overflow-hidden search-results z-50 max-h-60 overflow-y-auto">
                {searchResults.map((result) => (
                  <button
                    key={result.place_id}
                    className="w-full text-left px-4 py-3 hover:bg-accent/60 border-b border-gray-100 last:border-b-0 transition-colors focus:outline-none focus:bg-accent/60"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      pickResult(result);
                    }}
                    onMouseDown={(e) => e.preventDefault()}
                  >
                    <div className="flex items-start gap-3">
                      <MapPin className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate text-sm">
                          {result.structured_formatting?.main_text || result.description}
                        </div>
                        <div className="text-xs text-muted-foreground truncate mt-1">
                          {result.structured_formatting?.secondary_text || 'Location in Zambia'}
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
          
          {/* Current Location Button */}
          <button
            onClick={getCurrentLocation}
            disabled={searchLoading || !ready || checkingPermission}
            className="h-12 px-4 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-all disabled:opacity-50 flex items-center gap-2 shadow-lg"
            title="Detect my location automatically"
          >
            {checkingPermission ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Navigation className="h-4 w-4" />
            )}
            <span className="hidden sm:inline">
              {checkingPermission ? 'Checking...' : 'Locate'}
            </span>
          </button>
        </div>
        
        {/* Location Method & Accuracy Display */}
        <div className="absolute z-10 left-3 right-3 bottom-3">
          <div className="bg-background/95 backdrop-blur rounded-lg p-3 border shadow-lg">
            <div className="flex items-start gap-2 text-sm">
              <MapPin className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <div className="font-medium truncate">{selectedLocation}</div>
                <div className="text-xs text-muted-foreground mt-1 flex items-center gap-2 flex-wrap">
                  <span>Coordinates: {currentCoords.lat.toFixed(6)}, {currentCoords.lng.toFixed(6)}</span>
                  
                  {locationMethod && (
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      locationMethod === 'gps' ? 'bg-green-100 text-green-800' :
                      locationMethod === 'google' ? 'bg-blue-100 text-blue-800' :
                      locationMethod === 'ip' ? 'bg-amber-100 text-amber-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {locationMethod === 'gps' ? 'GPS' : 
                       locationMethod === 'google' ? 'Enhanced' : 
                       locationMethod === 'ip' ? 'Approximate' : 'Manual'}
                    </span>
                  )}
                  
                  {locationAccuracy && (
                    <span className={`${
                      locationAccuracy <= 20 ? 'text-green-600' :
                      locationAccuracy <= 50 ? 'text-green-500' :
                      locationAccuracy <= 100 ? 'text-amber-500' :
                      locationAccuracy <= 1000 ? 'text-amber-600' :
                      'text-orange-600'
                    }`}>
                      • Accuracy: ±{locationAccuracy <= 1000 ? Math.round(locationAccuracy) + 'm' : (locationAccuracy/1000).toFixed(1) + 'km'}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* UPDATED: Location Permission Popup - Now positioned in bottom left corner and shows automatically */}
        {showPermissionPopup && (
          <div className="absolute bottom-4 left-4 z-50 bg-white rounded-lg p-4 max-w-xs w-full shadow-xl border">
            <div className="text-center">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Navigation className="h-5 w-5 text-blue-600" />
              </div>
              <h3 className="text-sm font-semibold text-gray-900 mb-2">
                Location Access Required
              </h3>
              <p className="text-xs text-gray-600 mb-4">
                Please allow location access to accurately pin your current location on the map.
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowPermissionPopup(false)}
                  className="flex-1 text-xs"
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleGrantPermission}
                  className="flex-1 text-xs"
                >
                  OK
                </Button>
              </div>
            </div>
          </div>
        )}
        
        {/* Map Container */}
        <div 
          ref={mapContainerRef} 
          style={{ 
            height: "100%", 
            width: "100%",
          }} 
        />
      </div>
    </div>
  )
}