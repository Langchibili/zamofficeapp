// Profile.tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useEffect, useState } from "react";
import { logClick } from "@/lib/logger";
import { useUser } from "../contexts/UserContext";
import { LogIn, UserPlus } from "lucide-react";
import Uploader from "@/components/ui/uploader";
import { useCompany } from "@/hooks/use-company";
import { toast } from "sonner";

export default function Profile() {
  const { user, isAuthenticated, isLoading } = useUser();
  const { company, updateCompany } = useCompany();
  
  const [name, setName] = useState("");
  const [about, setAbout] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize state from company data - only once when company loads
  useEffect(() => {
    if (company && !isInitialized) {
      console.log("Initializing profile from company:", company);
      
      // Populate form fields
      setName(company.name || "");
      setAbout(company.about || "");
      
      setIsInitialized(true);
    }
  }, [company, isInitialized]);

  // Reset initialization when company changes
  useEffect(() => {
    if (company) {
      setIsInitialized(false);
    }
  }, [company?.id]);

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
                  To manage your company profile, you must log in to your account.
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
                Please set up your company profile first to manage your profile.
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
    logClick("Save Profile", "client/pages/Profile.tsx", 45);
    setIsSaving(true);
    
    try {
      const updateData = { 
        name, 
        about: about || null,
      };
      
      console.log("Saving profile:", updateData);
      await updateCompany(updateData);
      toast.success("Profile updated successfully");
    } catch (error) {
      console.error("Failed to update profile:", error);
      toast.error("Failed to update profile");
    } finally {
      setIsSaving(false);
    }
  };

  const reset = () => {
    if (company) {
      setName(company.name || "");
      setAbout(company.about || "");
    } else {
      setName("");
      setAbout("");
    }
    logClick("Reset Profile", "client/pages/Profile.tsx", 67);
  };

  // Get logo URL from company data - handle different possible structures
  const getLogoUrl = () => {
    if (!company?.logo) return null;
    
    // Handle different logo data structures
    if (typeof company.logo === 'string') {
      return company.logo;
    }
    if (company.logo.url) {
      return company.logo.url;
    }
    if (company.logo.data?.attributes?.url) {
      return company.logo.data.attributes.url;
    }
    return null;
  };

  const logoUrl = getLogoUrl();

  return (
    <div className="min-h-screen bg-gradient-to-b from-accent to-background">
      <div className="container py-8">
        <Card className="max-w-2xl mx-auto shadow-xl border-border/60">
          <CardHeader>
            <CardTitle className="text-2xl">
              {company ? "Company Profile" : "Setup Your Company Profile"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <Label htmlFor="name" className="text-sm font-medium">Company Name *</Label>
              <Input 
                id="name" 
                value={name} 
                onChange={(e) => {
                  console.log("Company name:", e.target.value);
                  setName(e.target.value);
                }}
                className="mt-1"
                placeholder="Enter your company name"
                required
              />
            </div>
            
            <div>
              <Label htmlFor="email" className="text-sm font-medium">Contact Email</Label>
              <Input 
                id="email" 
                type="email" 
                value={user?.email || ""} 
                className="mt-1"
                placeholder="contact@yourcompany.com"
                disabled
              />
              <div className="text-xs text-muted-foreground mt-1">
                Email is managed through your user account settings
              </div>
            </div>
            
            <div>
              <Label htmlFor="logo" className="text-sm font-medium">Company Logo</Label>
              
              {/* Uploader component */}
              <div className="mt-2">
                <Uploader
                  refId={company.id}
                  refName="api::company.company"
                  fieldName="logo"
                  allowedTypes={["image/*"]}
                  onUploadComplete={() => {
                    // Refresh company data after upload
                    // The useCompany hook should automatically update
                    console.log("Logo upload complete");
                    toast.success("Logo uploaded successfully");
                  }}
                  onUploadError={(error) => {
                    console.error("Logo upload failed:", error);
                    toast.error("Failed to upload logo");
                  }}
                />
              </div>
              
              {/* Logo preview using the current company data */}
              <div className="mt-4 p-4 border rounded-lg bg-muted/20">
                <Label className="text-sm font-medium mb-2 block">Current Logo Preview</Label>
                <div className="flex items-center gap-4">
                  {logoUrl ? (
                    <>
                      <img 
                        src={logoUrl} 
                        alt="Company logo" 
                        className="h-20 w-20 rounded-lg object-cover border shadow-sm" 
                        onError={(e) => {
                          console.error("Failed to load logo image");
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                      <div className="flex-1">
                        <div className="text-sm text-muted-foreground">
                          Current company logo
                        </div>
                        <div className="text-xs text-green-600 mt-1">
                          Logo will update automatically after upload
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="h-20 w-20 rounded-lg bg-muted border flex items-center justify-center">
                        <span className="text-xs text-muted-foreground">No logo</span>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Upload a square logo (recommended: 200x200px) for best results
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
            
            <div>
              <Label htmlFor="about" className="text-sm font-medium">About Your Company</Label>
              <Textarea 
                id="about" 
                value={about} 
                onChange={(e) => {
                  console.log("About:", e.target.value);
                  setAbout(e.target.value);
                }}
                className="mt-1 min-h-[120px]"
                placeholder="Tell customers about your printing services, specialties, and what makes your company unique..."
              />
              <div className="text-xs text-muted-foreground mt-1">
                This description will be visible to customers when they browse companies.
              </div>
            </div>
            
            <div className="flex gap-3 pt-4">
              <Button 
                variant="success" 
                onClick={save} 
                className="h-11 px-6"
                disabled={!name.trim() || isSaving}
              >
                {isSaving ? "Saving..." : (company ? "Save Changes" : "Create Company Profile")}
              </Button>
              <Button 
                variant="outline" 
                onClick={reset} 
                className="h-11 px-6" 
                disabled={isSaving}
              >
                Reset
              </Button>
            </div>

            {!company && (
              <div className="text-sm text-muted-foreground pt-4 border-t">
                <p>Complete your company profile to start receiving print orders from customers.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}