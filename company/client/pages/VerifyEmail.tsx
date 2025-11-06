// 📁company/client/pages/VerifyEmail.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import EmailOtpVerificationForm from '@/components/Includes/EmailOtpVerificationForm';
import { checkUserLogginStatus } from '../../Constants.js';

export default function VerifyEmail() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getUserEmail = async () => {
      try {
        const userData = await checkUserLogginStatus();
        
        if (userData?.user?.email) {
          setEmail(userData.user.email);
        } else {
          // If no user data or email, redirect to login
          toast.error('No user found. Please log in first.');
          navigate('/login');
        }
      } catch (error) {
        console.error('Error getting user data:', error);
        toast.error('Failed to get user information. Please try again.');
        navigate('/login');
      } finally {
        setLoading(false);
      }
    };

    getUserEmail();
  }, [navigate]);

  const handleOtpVerificationSuccess = async () => {
    const user = await checkUserLogginStatus();
    console.log('logged in user', user);
    
    toast.success('Email verified successfully! Your account is now active.');
    navigate('/', { 
      state: { 
        message: 'Email verification successful! Your account is now active.',
      }
    });
  };

  const handleResendOtp = () => {
    toast.info('OTP resent to your email address.');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-secondary/20 via-background to-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-lg">
          <CardContent className="p-6 text-center">
            <p>Loading...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!email) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-secondary/20 via-background to-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-lg">
          <CardContent className="p-6 text-center">
            <p>No email found. Redirecting to login...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-secondary/20 via-background to-background flex items-center justify-center p-4">
       <div>
        <EmailOtpVerificationForm
            email={email}
            onVerificationSuccess={handleOtpVerificationSuccess}
            onResendOtp={handleResendOtp}
          />
          
          <div style={{width:'100%',margin:'0 auto'}} className="text-center">
            <Button 
              variant="outline" 
              onClick={() => navigate('/login')}
              className="w-full"
            >
              Back to Login
            </Button>
          </div>
       </div>
    </div>
  );
}