//Location.tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useEffect, useState } from "react";
import { logClick, logInfo } from "@/lib/logger";
import { useUser } from "@/contexts/UserContext";
import { LogIn, UserPlus, MapPin, Navigation } from "lucide-react";
import GoogleMapPicker from "@/components/GoogleMapPicker";

// Update company API function
const updateCompanyAPI = async (companyId: number, data: any) => {
  const response = await fetch(`/api/companies/${companyId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ data }),
  });
  return response.json();
};

export default function Location() {
  const { user, isAuthenticated, isLoading } = useUser();
  const company = user?.company;
  const [currentCoords, setCurrentCoords] = useState<{ lat: number; lng: number }>({ 
    lat: -15.4167, 
    lng: 28.2833 
  });
  const [locationLoading, setLocationLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [hasLocationPermission, setHasLocationPermission] = useState<boolean | null>(null);

  useEffect(() => {
    if (company?.location) {
      setCurrentCoords({
        lat: company.location.lat || -15.4167,
        lng: company.location.lng || 28.2833
      });
    }
  }, [company]);

  const getUserLocation = () => {
    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by your browser");
      return;
    }

    setLocationLoading(true);
    setLocationError(null);
    
    // This will trigger the browser's location permission prompt
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const userCoords = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };
        
        setCurrentCoords(userCoords);
        setLocationLoading(false);
        setHasLocationPermission(true);
        
        if (typeof toast !== 'undefined') {
          toast.success('Your current location has been detected');
        }
      },
      (error) => {
        setLocationLoading(false);
        let errorMessage = "Failed to get your location";
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = "Location access denied. Please allow location access in your browser settings to use this feature.";
            setHasLocationPermission(false);
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = "Location information unavailable. Please check your device's location services.";
            break;
          case error.TIMEOUT:
            errorMessage = "Location request timed out. Please try again.";
            break;
          default:
            errorMessage = "An unknown error occurred while getting your location.";
            break;
        }
        
        setLocationError(errorMessage);
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0
      }
    );
  };

  const handleLocationChange = (lat: number, lng: number) => {
    setCurrentCoords({ lat, lng });
  };

  // Show UserContext loading state
  if (isLoading) {
    return null;
  }

  // Show login/register message if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-accent to-background flex items-center justify-center">
        <div className="container py-8">
          <Card className="p-8 shadow-xl border-border/60 max-w-md mx-auto text-center">
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl font-bold mb-2">Access Required</h1>
                <p className="text-muted-foreground">
                  To update your location, you must log in to your account.
                </p>
              </div>
              
              <div className="space-y-4">
                <Button asChild className="w-full h-11 text-base">
                  <a href="/login">
                    <LogIn className="h-4 w-4 mr-2" />
                    Log In to Dashboard
                  </a>
                </Button>
                
                <div className="text-sm text-muted-foreground">
                  If you don't have an account yet
                </div>
                
                <Button asChild variant="outline" className="w-full h-11 text-base">
                  <a href="/register">
                    <UserPlus className="h-4 w-4 mr-2" />
                    Create New Account
                  </a>
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  // Show setup message if authenticated but no company
  if (!company) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-accent to-background">
        <div className="container py-8">
          <Card className="max-w-md mx-auto shadow-xl border-border/60">
            <CardHeader>
              <CardTitle>Company Setup Required</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Please set up your company profile first to update your location.
              </p>
              <Button asChild>
                <a href="/profile">Set Up Company</a>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const save = async () => {
    logClick("Save Location", "client/pages/Location.tsx", 50);
    setIsSaving(true);
    
    try {
      await updateCompanyAPI(company.id, { 
        location: currentCoords
      });
      if (typeof toast !== 'undefined') {
        toast.success("Location updated successfully");
      }
    } catch (error) {
      console.error("Failed to update location:", error);
      if (typeof toast !== 'undefined') {
        toast.error("Failed to update location");
      }
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-accent to-background">
      <div className="container py-8">
        <Card className="max-w-2xl mx-auto shadow-xl border-border/60">
          <CardHeader>
            <CardTitle className="text-2xl flex items-center gap-2">
              <MapPin className="h-6 w-6" />
              Update Location
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <p className="text-sm text-muted-foreground">
                Set your company location to help customers find you. This location is used for proximity-based availability.
                Click on the map or drag the marker to set your exact location.
              </p>
            </div>

            {/* Location coordinates display */}
            <div className="text-xs text-green-600 bg-green-50 p-2 rounded-md">
              ✅ Current location: {currentCoords.lat.toFixed(6)}, {currentCoords.lng.toFixed(6)}
            </div>
            
            {/* Google Maps Picker */}
            <Card>
              <CardContent className="p-0">
                <GoogleMapPicker
                  lat={currentCoords.lat}
                  lng={currentCoords.lng}
                  onChange={handleLocationChange}
                  height={400}
                  showLocationTips={true}
                />
                <div className="p-4 border-t">
                  <div className="text-sm text-muted-foreground">
                    Drag the red marker to your exact business location or search for an address
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="lat" className="text-sm font-medium">Latitude</Label>
                <Input 
                  id="lat" 
                  type="number" 
                  step="any" 
                  value={currentCoords.lat} 
                  onChange={(e) => setCurrentCoords(prev => ({ ...prev, lat: parseFloat(e.target.value) || 0 }))} 
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="lng" className="text-sm font-medium">Longitude</Label>
                <Input 
                  id="lng" 
                  type="number" 
                  step="any" 
                  value={currentCoords.lng} 
                  onChange={(e) => setCurrentCoords(prev => ({ ...prev, lng: parseFloat(e.target.value) || 0 }))} 
                  className="mt-1"
                />
              </div>
            </div>
            
            {/* Location Permission Status */}
            {hasLocationPermission === false && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-md">
                <p className="text-sm text-amber-800">
                  Location access is currently denied. Click "Use My Location" to allow access when prompted.
                </p>
              </div>
            )}
            
            {/* Location Error */}
            {locationError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-800">{locationError}</p>
              </div>
            )}
            
            <div className="flex gap-3 pt-2">
              <Button 
                variant="outline" 
                onClick={getUserLocation} 
                disabled={locationLoading}
                className="flex-1"
              >
                <Navigation className="h-4 w-4 mr-2" />
                {locationLoading ? 'Detecting...' : 'Use My Location'}
              </Button>
              <Button 
                variant="success" 
                onClick={save} 
                disabled={isSaving}
                className="flex-1"
              >
                {isSaving ? "Saving..." : "Save Location"}
              </Button>
            </div>

            {company.location && (
              <div className="text-sm text-muted-foreground pt-4 border-t">
                <p>
                  Saved location: {company.location.lat.toFixed(6)}, {company.location.lng.toFixed(6)}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}