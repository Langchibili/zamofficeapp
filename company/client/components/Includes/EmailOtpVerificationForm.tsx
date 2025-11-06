// 📁company/client/components/EmailOtpVerificationForm.tsx
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Mail, Clock, RefreshCw } from 'lucide-react';
import { api_url, checkUserLogginStatus } from "../../../Constants";
import { updateUser } from "../../../Functions.js";

interface EmailOtpVerificationFormProps {
  email: string;
  onVerificationSuccess: () => void;
  onResendOtp?: () => void;
}

export default function EmailOtpVerificationForm({ 
  email, 
  onVerificationSuccess,
  onResendOtp 
}: EmailOtpVerificationFormProps) {
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [countdown, setCountdown] = useState(90); // 1 minute 30 seconds
  const [isResendDisabled, setIsResendDisabled] = useState(true);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          setIsResendDisabled(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const verifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!otp.trim()) {
      setError('Please enter the OTP sent to your email');
      return;
    }
    
    if (otp.length !== 6) {
      setError('OTP must be exactly 6 digits');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      // Replace with your actual API endpoint
      const response = await fetch(`${api_url}/auths?identifier=${email}&otp=${otp}&auth_stage=verification&identifierType=email`, {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      
      if (!response.ok || !data.verificationStatus) {
        setError('Invalid OTP! Please check the code and try again.');
        return;
      }
      const loggedInUser = await checkUserLogginStatus()
      if(loggedInUser && loggedInUser.user && loggedInUser.user.id){
        updateUser({confirmed: true }, loggedInUser.user.id); // this is because at times updating the company type with the user relation doen't work, but vise versa
        // OTP verification successful
        onVerificationSuccess();
      }
      else{
        setError('Verification failed. Please try again.');
      }  
    } catch (error) {
      console.error('OTP verification error:', error);
      setError('Verification failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Replace with your actual API endpoint
      await fetch(`${api_url}/auths?identifier=${email}&auth_stage=sendotp&identifierType=email`, {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      // Reset countdown
      setCountdown(180); // 3 minutes
      setIsResendDisabled(true);
      
      // Start new countdown
      const timer = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            setIsResendDisabled(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

    } catch (error) {
      console.error('Resend OTP error:', error);
      setError('Failed to resend OTP. Please try again.');
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl flex items-center justify-center gap-2">
          <Mail className="h-6 w-6 text-primary" />
          Verify Your Email
        </CardTitle>
        <CardDescription>
          We've sent a 6-digit verification code to
          <br />
          <strong>{email}</strong>
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        <form onSubmit={verifyOTP} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="otp">Verification Code</Label>
            <Input
              id="otp"
              type="text"
              placeholder="Enter 6-digit code"
              value={otp}
              onChange={(e) => {
                setOtp(e.target.value.replace(/\D/g, '').slice(0, 6));
                setError('');
              }}
              maxLength={6}
              className="text-center text-lg font-mono tracking-widest"
            />
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Button 
            type="submit" 
            disabled={isSubmitting || otp.length !== 6}
            className="w-full"
          >
            {isSubmitting ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                Verifying...
              </>
            ) : (
              'Verify Code'
            )}
          </Button>
        </form>

        <div className="text-center space-y-3">
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>Time remaining: {formatTime(countdown)}</span>
          </div>

          <Button
            variant="outline"
            onClick={resendOTP}
            disabled={isResendDisabled}
            className="w-full"
          >
            {isResendDisabled ? 'Resend OTP' : 'Resend OTP Now'}
          </Button>

          <p className="text-xs text-muted-foreground">
            Didn't receive the code? Check your spam folder or try resending.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}