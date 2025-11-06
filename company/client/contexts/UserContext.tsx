// 📁company/client/contexts/UserContext.tsx
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { checkUserLogginStatus } from '../../Constants';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

// Types based on the checkUserLogginStatus structure
interface UserContextType {
  user: any | null;
  status: boolean;
  isLoading: boolean;
  isAuthenticated: boolean;
}

// Create context with default values
const UserContext = createContext<UserContextType>({
  user: null,
  status: false,
  isLoading: true,
  isAuthenticated: false,
});

// Skeleton components for loading states
const PageSkeleton = () => (
  <div className="space-y-4 p-4">
    <Skeleton className="h-8 w-1/3" />
    <div className="space-y-2">
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-5/6" />
      <Skeleton className="h-4 w-4/6" />
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-1/2" />
        </CardHeader>
        <CardContent className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-1/2" />
        </CardHeader>
        <CardContent className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </CardContent>
      </Card>
    </div>
  </div>
);

const ImagePageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <Card className="w-full max-w-md mx-4">
      <CardHeader className="text-center">
        <Skeleton className="h-8 w-3/4 mx-auto" />
        <Skeleton className="h-4 w-1/2 mx-auto mt-2" />
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Skeleton className="h-4 w-1/4" />
          <Skeleton className="h-10 w-full" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-4 w-1/4" />
          <Skeleton className="h-10 w-full" />
        </div>
        <Skeleton className="h-10 w-full" />
        <div className="text-center">
          <Skeleton className="h-4 w-1/2 mx-auto" />
        </div>
      </CardContent>
    </Card>
  </div>
);

// Provider component
interface UserProviderProps {
  children: ReactNode;
}

export function UserProvider({ children }: UserProviderProps) {
  const [loginStatus, setLoginStatus] = useState<{ user: any; status: boolean }>({
    user: null,
    status: false
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const loggedInUser = await checkUserLogginStatus();
        setLoginStatus(loggedInUser);
      } catch (error) {
        console.error('Error fetching logged in user:', error);
        setLoginStatus({ user: null, status: false });
      } finally {
        setIsLoading(false);
      }
    };

    if (typeof window !== 'undefined') {
      fetchUser();
    }
  }, []);

  const contextValue: UserContextType = {
    user: loginStatus.user,
    status: loginStatus.status,
    isLoading,
    isAuthenticated: loginStatus.status, // status indicates if user is confirmed and logged in
  };

  // Show loading skeletons based on the route
  if (isLoading) {
    if (typeof window !== 'undefined') {
      if (window.location.pathname.startsWith('/admin')) {
        return <PageSkeleton />;
      } else {
        return <ImagePageLoader />;
      }
    }
    return <ImagePageLoader />;
  }

  return (
    <UserContext.Provider value={contextValue}>
      {children}
    </UserContext.Provider>
  );
}

// Custom hook to use the user context
export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}