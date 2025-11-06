// 📁company/client/pages/Register.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { MapPin, Mail, Lock, Building, User, Phone, Navigation } from 'lucide-react';
import { toast } from 'sonner';
import GoogleMapPicker from '@/components/GoogleMapPicker';
import EmailOtpVerificationForm from '@/components/Includes/EmailOtpVerificationForm';
import { registerCompany, createQueue } from '../../Functions.js';
import { checkUserLogginStatus } from '../../Constants.js';

interface CompanyRegistrationData {
  name: string
  email: string
  password: string
  confirmPassword: string
  ownerName: string
  phoneNumber: string
  about: string
  location: {
    lat: number
    lng: number
  }
  cost_per_page: number
  services: {
    color_print_surcharge: number
    lamination_surcharge: number
  }
  radiusConsideredNearInMeters: number
}

export default function Register() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [currentCoords, setCurrentCoords] = useState<{ lat: number; lng: number }>({ 
    lat: -15.4167, 
    lng: 28.2833 
  });
  const [hasLocationPermission, setHasLocationPermission] = useState<boolean | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [formData, setFormData] = useState<CompanyRegistrationData>({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    ownerName: '',
    phoneNumber: '',
    about: '',
    location: { lat: -15.4167, lng: 28.2833 },
    cost_per_page: 1.5,
    services: {
      color_print_surcharge: 0.5,
      lamination_surcharge: 5
    },
    radiusConsideredNearInMeters: 500
  });

  // Update formData location when currentCoords changes
  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      location: currentCoords
    }));
  }, [currentCoords]);

  const getUserLocation = () => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser');
      toast.error('Geolocation is not supported by your browser');
      return;
    }

    setLocationLoading(true);
    setLocationError(null);
    
    // This will trigger the browser's location permission prompt ONLY when user clicks the button
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const userCoords = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };
        
        setUserLocation(userCoords);
        setCurrentCoords(userCoords);
        setHasLocationPermission(true);
        
        setLocationLoading(false);
        toast.success('Your current location has been detected');
      },
      (error) => {
        setLocationLoading(false);
        let errorMessage = 'Failed to get your location';
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Location access denied. Please allow location access in your browser settings to use this feature.';
            setHasLocationPermission(false);
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Location information unavailable. Please check your device\'s location services.';
            break;
          case error.TIMEOUT:
            errorMessage = 'Location request timed out. Please try again.';
            break;
          default:
            errorMessage = 'An unknown error occurred while getting your location.';
            break;
        }
        
        setLocationError(errorMessage);
        toast.error(errorMessage);
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0
      }
    );
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleLocationChange = (lat: number, lng: number) => {
    const newCoords = { lat, lng };
    setCurrentCoords(newCoords);
    
    if (!userLocation || (userLocation.lat !== lat && userLocation.lng !== lng)) {
      setUserLocation(newCoords);
    }
  };

  const validateStep1 = () => {
    if (!formData.name.trim()) {
      toast.error('Company name is required');
      return false;
    }
    if (!formData.email.trim() || !/\S+@\S+\.\S+/.test(formData.email)) {
      toast.error('Valid email is required');
      return false;
    }
    if (!formData.ownerName.trim()) {
      toast.error('Owner name is required');
      return false;
    }
    if (!formData.phoneNumber.trim()) {
      toast.error('Phone number is required');
      return false;
    }
    return true;
  };

  const validateStep2 = () => {
    if (formData.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return false;
    }
    if (!formData.location.lat || !formData.location.lng) {
      toast.error('Please select your business location');
      return false;
    }
    return true;
  };

  const handleNextStep = () => {
    if (step === 1 && validateStep1()) {
      setStep(2);
    }
  };

  const handlePreviousStep = () => {
    setStep(step - 1);
  };

  const handleSubmit = async () => {
    if (!validateStep2()) return;

    setLoading(true);
    try {
      const { confirmPassword, ...registrationData } = formData;
      
      console.log('Registration data:', registrationData);
      
      const result = await registerCompany(registrationData);
      await createQueue({ // create new queue
           company: result.company.id,
           status: 'open'
      })
      if (result) {
        toast.success('Registration successful! Please check your email for OTP verification.');
        // Move to OTP verification step
        setStep(3);
      }
    } catch (error: any) {
      toast.error(error.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleOtpVerificationSuccess = async () => {
    const user = await checkUserLogginStatus()
    console.log('logged in user', user)
    return
    toast.success('Email verified successfully! Your account is now active.');
    navigate('/login', { 
      state: { 
        message: 'Registration completed successfully! You can now log in to your account.',
        email: formData.email
      }
    });
  };

  const handleResendOtp = () => {
    toast.info('OTP resent to your email address.');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-secondary/20 via-background to-background flex items-center justify-center p-4">
      <Card className="w-full max-w-4xl shadow-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold flex items-center justify-center gap-2">
            <Building className="h-6 w-6 text-primary" />
            Register Your Print Shop
          </CardTitle>
          <CardDescription>
            Join ZamOffice to manage your print services, queues, and customers
          </CardDescription>
          <div className="flex justify-center space-x-2 mt-4">
            <Badge variant={step >= 1 ? "default" : "secondary"}>1. Business Info</Badge>
            <Badge variant={step >= 2 ? "default" : "secondary"}>2. Location & Security</Badge>
            <Badge variant={step >= 3 ? "default" : "secondary"}>3. Verify Email</Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {step === 1 && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="flex items-center gap-2">
                    <Building className="h-4 w-4" />
                    Company Name *
                  </Label>
                  <Input
                    id="name"
                    placeholder="Enter your company name"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    Email Address *
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="your@company.zm"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="ownerName" className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Owner Name *
                  </Label>
                  <Input
                    id="ownerName"
                    placeholder="Full name of owner"
                    value={formData.ownerName}
                    onChange={(e) => handleInputChange('ownerName', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phoneNumber" className="flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    Phone Number *
                  </Label>
                  <Input
                    id="phoneNumber"
                    placeholder="+260 XXX XXX XXX"
                    value={formData.phoneNumber}
                    onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="about">About Your Business</Label>
                <Input
                  id="about"
                  placeholder="Brief description of your services, hours, specialties..."
                  value={formData.about}
                  onChange={(e) => handleInputChange('about', e.target.value)}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="cost_per_page">Base Price Per Page (ZMW)</Label>
                  <Input
                    id="cost_per_page"
                    type="number"
                    step="0.1"
                    min="0"
                    placeholder="1.5"
                    value={formData.cost_per_page}
                    onChange={(e) => handleInputChange('cost_per_page', parseFloat(e.target.value) || 0)}
                  />
                </div>
              </div>

              <Button onClick={handleNextStep} className="w-full">
                Continue to Location & Security
              </Button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      Business Location *
                    </Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={getUserLocation}
                      disabled={locationLoading}
                      className="flex items-center gap-2"
                    >
                      <Navigation className="h-4 w-4" />
                      {locationLoading ? 'Detecting...' : 'Use My Location'}
                    </Button>
                  </div>
                  
                  <div className="text-xs text-green-600 bg-green-50 p-2 rounded-md">
                    ✅ Current location: {currentCoords.lat.toFixed(6)}, {currentCoords.lng.toFixed(6)}
                    {userLocation && (
                      <span className="text-green-700 font-medium"> (Detected)</span>
                    )}
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
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="password" className="flex items-center gap-2">
                      <Lock className="h-4 w-4" />
                      Password *
                    </Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="At least 6 characters"
                      value={formData.password}
                      onChange={(e) => handleInputChange('password', e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm Password *</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      placeholder="Confirm your password"
                      value={formData.confirmPassword}
                      onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <Button 
                  variant="outline" 
                  onClick={handlePreviousStep}
                  className="flex-1"
                >
                  Back
                </Button>
                <Button 
                  onClick={handleSubmit}
                  disabled={loading}
                  className="flex-1"
                >
                  {loading ? 'Creating Account...' : 'Complete Registration'}
                </Button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <EmailOtpVerificationForm
                email={formData.email}
                onVerificationSuccess={handleOtpVerificationSuccess}
                onResendOtp={handleResendOtp}
              />
              
              <div className="text-center">
                <Button 
                  variant="outline" 
                  onClick={handlePreviousStep}
                >
                  Back to Registration
                </Button>
              </div>
            </div>
          )}

          {step !== 3 && (
            <div className="text-center text-sm text-muted-foreground">
              Already have an account?{' '}
              <Link to="/login" className="text-primary hover:underline">
                Sign in here
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}