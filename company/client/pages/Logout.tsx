// Logout.tsx
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { logoutCompany } from "../../Functions"; // Adjust import path as needed
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

export default function Logout() {
  const navigate = useNavigate();

  useEffect(() => {
    // Perform logout and redirect
    const performLogout = async () => {
      // Run the logout function
      logoutCompany();
      
      // Add a small delay to show the loading state
      setTimeout(() => {
        // Redirect to login page using React Router
        if(window && typeof window !== "undefined"){
            window.location = "/login"
        }
      }, 1000);
    };

    performLogout();
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-accent to-background flex items-center justify-center">
      <div className="container py-8">
        <Card className="max-w-md mx-auto shadow-xl border-border/60">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl flex items-center justify-center gap-2">
              <Loader2 className="h-6 w-6 animate-spin" />
              Logging Out
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-muted-foreground">
              You are being logged out and redirected to the login page...
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}