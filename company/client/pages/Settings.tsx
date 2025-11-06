//Settings.tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useCompany } from "@/hooks/use-company";
import { useEffect, useMemo, useState } from "react";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { africanCountries, commonCurrencies } from "@/lib/africa";
import { Input } from "@/components/ui/input";
import { logClick } from "@/lib/logger";
import { useUser } from "@/contexts/UserContext";
import { LogIn, UserPlus, DollarSign, Clock, Calendar, Printer, Palette, BookOpen, CalendarDays } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";

const MIN_R = 50;
const MAX_R = 1000;

// Operating hours structure
const defaultOperatingHours = {
  monday: { open: "08:00", close: "17:00", closed: false },
  tuesday: { open: "08:00", close: "17:00", closed: false },
  wednesday: { open: "08:00", close: "17:00", closed: false },
  thursday: { open: "08:00", close: "17:00", closed: false },
  friday: { open: "08:00", close: "17:00", closed: false },
  saturday: { open: "09:00", close: "13:00", closed: false },
  sunday: { open: "09:00", close: "13:00", closed: true }
};

export default function Settings() {
  const { user, isAuthenticated, isLoading } = useUser();
  const { company, updateCompany } = useCompany();
  
  // Track if we're initialized to prevent overwriting user changes
  const [isInitialized, setIsInitialized] = useState(false);
  
  // Availability & Scheduling
  const [radius, setRadius] = useState(500);
  const [allowScheduling, setAllowScheduling] = useState(true);
  
  // Pricing
  const [costPerPage, setCostPerPage] = useState(0);
  const [costPerColorPrintPage, setCostPerColorPrintPage] = useState(0);
  const [costPerLaminatedDoc, setCostPerLaminatedDoc] = useState(0);
  const [costPerBoundDoc, setCostPerBoundDoc] = useState(0);
  const [costPerScheduledPrint, setCostPerScheduledPrint] = useState(0);
  const [laminationFlatPrice, setLaminationFlatPrice] = useState(0);
  const [bindingFlatPrice, setBindingFlatPrice] = useState(0);
  const [currency, setCurrency] = useState("ZMW");
  
  // Services
  const [hasColorPrints, setHasColorPrints] = useState(false);
  const [hasLamination, setHasLamination] = useState(false);
  const [hasBinding, setHasBinding] = useState(false);
  
  // Operating Hours
  const [operatingHours, setOperatingHours] = useState(defaultOperatingHours);
  const [holidays, setHolidays] = useState<string[]>([]);
  const [newHoliday, setNewHoliday] = useState("");

  // Initialize state from company data - only once when company loads
  useEffect(() => {
    if (company && !isInitialized) {
      console.log("Initializing settings from company:", company);
      
      // Availability & Scheduling
      setRadius(company.radiusConsideredNearInMeters || company.settings?.availabilityRadiusM || 500);
      setAllowScheduling(company.allowsPrintScheduling ?? true);
      
      // Pricing - FIXED: Currency is top-level in schema
      setCostPerPage(company.cost_per_page || 0);
      setCostPerColorPrintPage(company.cost_per_color_print_per_page || 0);
      setCostPerLaminatedDoc(company.cost_per_laminated_doc || 0);
      setCostPerBoundDoc(company.cost_per_bound_doc || 0);
      setCostPerScheduledPrint(company.cost_per_scheduled_print || 0);
      setLaminationFlatPrice(company.lamination_flat_price || 0);
      setBindingFlatPrice(company.binding_flat_price || 0);
      setCurrency(company.currency || "ZMW"); // FIXED: Use top-level currency
      
      // Services
      setHasColorPrints(company.hasColorPrints ?? false);
      setHasLamination(company.hasLamination ?? false);
      setHasBinding(company.hasBinding ?? false);
      
      // Operating Hours & Holidays
      setOperatingHours(company.operating_hours || defaultOperatingHours);
      setHolidays(company.holidays || []);
      
      setIsInitialized(true);
    }
  }, [company, isInitialized]);

  // Reset initialization when company changes
  useEffect(() => {
    if (company) {
      setIsInitialized(false);
    }
  }, [company?.id]); // Reset when company ID changes

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
                  To manage your settings, you must log in to your account.
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
                Please set up your company profile first to manage settings.
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

  const saveAvailabilitySettings = async () => {
    logClick("Save Availability Settings", "client/pages/Settings.tsx", 40);
    try {
      const updateData = { 
        radiusConsideredNearInMeters: Math.min(MAX_R, Math.max(MIN_R, radius)),
        allowsPrintScheduling: allowScheduling
      };
      console.log("Saving availability:", updateData);
      await updateCompany(updateData);
      toast.success("Availability settings updated successfully");
    } catch (error) {
      console.error("Failed to update availability:", error);
      toast.error("Failed to update availability settings");
    }
  };

  const savePricingSettings = async () => {
    logClick("Save Pricing Settings", "client/pages/Settings.tsx", 50);
    try {
      const updateData = { 
        cost_per_page: costPerPage,
        cost_per_color_print_per_page: costPerColorPrintPage,
        cost_per_laminated_doc: costPerLaminatedDoc,
        cost_per_bound_doc: costPerBoundDoc,
        cost_per_scheduled_print: costPerScheduledPrint,
        lamination_flat_price: laminationFlatPrice,
        binding_flat_price: bindingFlatPrice,
        currency: currency // FIXED: Currency is top-level in schema
      };
      console.log("Saving pricing:", updateData);
      await updateCompany(updateData);
      toast.success("Pricing settings updated successfully");
    } catch (error) {
      console.error("Failed to update pricing:", error);
      toast.error("Failed to update pricing settings");
    }
  };

  const saveServiceSettings = async () => {
    logClick("Save Service Settings", "client/pages/Settings.tsx", 60);
    try {
      const updateData = { 
        hasColorPrints,
        hasLamination,
        hasBinding
      };
      console.log("Saving services:", updateData);
      await updateCompany(updateData);
      toast.success("Service settings updated successfully");
    } catch (error) {
      console.error("Failed to update services:", error);
      toast.error("Failed to update service settings");
    }
  };

  const saveOperatingSettings = async () => {
    logClick("Save Operating Settings", "client/pages/Settings.tsx", 70);
    try {
      const updateData = { 
        operating_hours: operatingHours,
        holidays
      };
      console.log("Saving operating settings:", updateData);
      await updateCompany(updateData);
      toast.success("Operating settings updated successfully");
    } catch (error) {
      console.error("Failed to update operating settings:", error);
      toast.error("Failed to update operating settings");
    }
  };

  const addHoliday = () => {
    if (newHoliday && !holidays.includes(newHoliday)) {
      setHolidays([...holidays, newHoliday]);
      setNewHoliday("");
    }
  };

  const removeHoliday = (holidayToRemove: string) => {
    setHolidays(holidays.filter(h => h !== holidayToRemove));
  };

  const updateOperatingHours = (day: string, field: string, value: string | boolean) => {
    setOperatingHours(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        [field]: value
      }
    }));
  };

  const radiusPct = (radius - MIN_R) / (MAX_R - MIN_R);

  return (
    <div className="min-h-screen bg-gradient-to-b from-accent to-background">
      <div className="container py-8">
        <div className="grid gap-6">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Availability & Radius Card */}
            <Card className="shadow-xl border-border/60">
              <CardHeader className="flex flex-row items-center gap-3">
                <Printer className="h-6 w-6 text-primary" />
                <CardTitle>Availability Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="relative h-48 grid place-content-center">
                  <svg viewBox="0 0 200 200" className="w-full h-full">
                    <circle cx="100" cy="100" r={20 + 80 * radiusPct} fill="hsl(var(--accent))" opacity="0.3" />
                    <circle cx="100" cy="100" r={6} fill="hsl(var(--primary))" />
                  </svg>
                  <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-sm text-muted-foreground">
                    {radius} m radius
                  </div>
                </div>
                
                <div>
                  <Label>Service Radius (50m - 1000m)</Label>
                  <Slider 
                    value={[radius]} 
                    min={MIN_R} 
                    max={MAX_R} 
                    step={10} 
                    onValueChange={(value) => {
                      console.log("Slider value changed:", value);
                      setRadius(value[0]);
                    }}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">Allow Print Scheduling</div>
                    <div className="text-sm text-muted-foreground">
                      Clients can schedule prints for later
                    </div>
                  </div>
                  <Switch 
                    checked={allowScheduling} 
                    onCheckedChange={(checked) => {
                      console.log("Scheduling switch:", checked);
                      setAllowScheduling(checked);
                    }}
                  />
                </div>
                
                <div className="flex gap-3">
                  <Button variant="success" onClick={saveAvailabilitySettings}>
                    Save Availability
                  </Button>
                  <Button 
                    variant="secondary" 
                    onClick={() => { 
                      setRadius(company.radiusConsideredNearInMeters || 500); 
                      setAllowScheduling(company.allowsPrintScheduling ?? true);
                    }}
                  >
                    Reset
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Service Offerings Card */}
            <Card className="shadow-xl border-border/60">
              <CardHeader className="flex flex-row items-center gap-3">
                <Palette className="h-6 w-6 text-primary" />
                <CardTitle>Service Offerings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">Color Printing</div>
                      <div className="text-sm text-muted-foreground">
                        Offer color print services
                      </div>
                    </div>
                    <Switch 
                      checked={hasColorPrints} 
                      onCheckedChange={(checked) => {
                        console.log("Color prints switch:", checked);
                        setHasColorPrints(checked);
                      }}
                    />
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">Lamination Services</div>
                      <div className="text-sm text-muted-foreground">
                        Offer document lamination
                      </div>
                    </div>
                    <Switch 
                      checked={hasLamination} 
                      onCheckedChange={(checked) => {
                        console.log("Lamination switch:", checked);
                        setHasLamination(checked);
                      }}
                    />
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">Binding Services</div>
                      <div className="text-sm text-muted-foreground">
                        Offer document binding
                      </div>
                    </div>
                    <Switch 
                      checked={hasBinding} 
                      onCheckedChange={(checked) => {
                        console.log("Binding switch:", checked);
                        setHasBinding(checked);
                      }}
                    />
                  </div>
                </div>
                
                <div className="flex gap-3">
                  <Button variant="success" onClick={saveServiceSettings}>
                    Save Services
                  </Button>
                  <Button 
                    variant="secondary" 
                    onClick={() => { 
                      setHasColorPrints(company.hasColorPrints ?? false);
                      setHasLamination(company.hasLamination ?? false);
                      setHasBinding(company.hasBinding ?? false);
                    }}
                  >
                    Reset
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Pricing Settings Card */}
          <Card className="shadow-xl border-border/60">
            <CardHeader className="flex flex-row items-center gap-3">
              <DollarSign className="h-6 w-6 text-primary" />
              <CardTitle>Pricing Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-medium text-sm text-muted-foreground">Base Pricing</h4>
                  
                  <div>
                    <Label htmlFor="costPerPage">Cost per B&W Page ({currency})</Label>
                    <Input 
                      id="costPerPage"
                      type="number"
                      step="0.01"
                      value={costPerPage}
                      onChange={(e) => {
                        console.log("Cost per page:", e.target.value);
                        setCostPerPage(parseFloat(e.target.value) || 0);
                      }}
                    />
                  </div>

                  <div>
                    <Label htmlFor="costPerColorPrintPage">Cost per Color Page ({currency})</Label>
                    <Input 
                      id="costPerColorPrintPage"
                      type="number"
                      step="0.01"
                      value={costPerColorPrintPage}
                      onChange={(e) => {
                        console.log("Color cost:", e.target.value);
                        setCostPerColorPrintPage(parseFloat(e.target.value) || 0);
                      }}
                    />
                  </div>

                  <div>
                    <Label htmlFor="costPerScheduledPrint">Scheduling Fee ({currency})</Label>
                    <Input 
                      id="costPerScheduledPrint"
                      type="number"
                      step="0.01"
                      value={costPerScheduledPrint}
                      onChange={(e) => {
                        console.log("Scheduling fee:", e.target.value);
                        setCostPerScheduledPrint(parseFloat(e.target.value) || 0);
                      }}
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-medium text-sm text-muted-foreground">Additional Services</h4>
                  
                  <div>
                    <Label htmlFor="laminationFlatPrice">Lamination Flat Price ({currency})</Label>
                    <Input 
                      id="laminationFlatPrice"
                      type="number"
                      step="0.01"
                      value={laminationFlatPrice}
                      onChange={(e) => {
                        console.log("Lamination flat:", e.target.value);
                        setLaminationFlatPrice(parseFloat(e.target.value) || 0);
                      }}
                    />
                  </div>

                  <div>
                    <Label htmlFor="costPerLaminatedDoc">Lamination per Doc ({currency})</Label>
                    <Input 
                      id="costPerLaminatedDoc"
                      type="number"
                      step="0.01"
                      value={costPerLaminatedDoc}
                      onChange={(e) => {
                        console.log("Lamination per doc:", e.target.value);
                        setCostPerLaminatedDoc(parseFloat(e.target.value) || 0);
                      }}
                    />
                  </div>

                  <div>
                    <Label htmlFor="bindingFlatPrice">Binding Flat Price ({currency})</Label>
                    <Input 
                      id="bindingFlatPrice"
                      type="number"
                      step="0.01"
                      value={bindingFlatPrice}
                      onChange={(e) => {
                        console.log("Binding flat:", e.target.value);
                        setBindingFlatPrice(parseFloat(e.target.value) || 0);
                      }}
                    />
                  </div>

                  <div>
                    <Label htmlFor="costPerBoundDoc">Binding per Doc ({currency})</Label>
                    <Input 
                      id="costPerBoundDoc"
                      type="number"
                      step="0.01"
                      value={costPerBoundDoc}
                      onChange={(e) => {
                        console.log("Binding per doc:", e.target.value);
                        setCostPerBoundDoc(parseFloat(e.target.value) || 0);
                      }}
                    />
                  </div>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="currency">Currency</Label>
                  <select 
                    id="currency" 
                    className="mt-1 w-full border rounded-md h-10 px-3 bg-background" 
                    value={currency} 
                    onChange={(e) => {
                      console.log("Currency changed:", e.target.value);
                      setCurrency(e.target.value);
                    }}
                  >
                    <optgroup label="Common Currencies">
                      {commonCurrencies.map((c) => (
                        <option key={c.code} value={c.code}>
                          {c.name} ({c.code})
                        </option>
                      ))}
                    </optgroup>
                    <optgroup label="All African Currencies">
                      {africanCountries.map((c) => (
                        <option key={c.code} value={c.currency}>
                          {c.name} ({c.currency})
                        </option>
                      ))}
                    </optgroup>
                  </select>
                </div>
              </div>
              
              <div className="flex gap-3">
                <Button variant="success" onClick={savePricingSettings}>
                  Save Pricing
                </Button>
                <Button 
                  variant="secondary" 
                  onClick={() => { 
                    setCostPerPage(company.cost_per_page || 0);
                    setCostPerColorPrintPage(company.cost_per_color_print_per_page || 0);
                    setCostPerLaminatedDoc(company.cost_per_laminated_doc || 0);
                    setCostPerBoundDoc(company.cost_per_bound_doc || 0);
                    setCostPerScheduledPrint(company.cost_per_scheduled_print || 0);
                    setLaminationFlatPrice(company.lamination_flat_price || 0);
                    setBindingFlatPrice(company.binding_flat_price || 0);
                    setCurrency(company.currency || "ZMW"); // FIXED: Use top-level currency
                  }}
                >
                  Reset
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Operating Hours & Holidays Card */}
          <Card className="shadow-xl border-border/60">
            <CardHeader className="flex flex-row items-center gap-3">
              <Clock className="h-6 w-6 text-primary" />
              <CardTitle>Operating Hours & Holidays</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-medium text-sm text-muted-foreground">Operating Hours</h4>
                  
                  {Object.entries(operatingHours).map(([day, hours]) => (
                    <div key={day} className="flex items-center gap-4 p-3 border rounded-lg">
                      <div className="w-24 font-medium capitalize">{day}</div>
                      <div className="flex items-center gap-2 flex-1">
                        <Input 
                          type="time"
                          value={hours.open}
                          onChange={(e) => updateOperatingHours(day, 'open', e.target.value)}
                          disabled={hours.closed}
                          className="w-24"
                        />
                        <span className="text-muted-foreground">to</span>
                        <Input 
                          type="time"
                          value={hours.close}
                          onChange={(e) => updateOperatingHours(day, 'close', e.target.value)}
                          disabled={hours.closed}
                          className="w-24"
                        />
                        <Switch 
                          checked={!hours.closed}
                          onCheckedChange={(checked) => {
                            console.log(`${day} closed:`, !checked);
                            updateOperatingHours(day, 'closed', !checked);
                          }}
                        />
                        <span className="text-sm w-12">{hours.closed ? 'Closed' : 'Open'}</span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="space-y-4">
                  <h4 className="font-medium text-sm text-muted-foreground">Holidays</h4>
                  
                  <div className="space-y-3">
                    <div className="flex gap-2">
                      <Input 
                        type="date"
                        value={newHoliday}
                        onChange={(e) => {
                          console.log("New holiday:", e.target.value);
                          setNewHoliday(e.target.value);
                        }}
                        placeholder="Add holiday date"
                      />
                      <Button onClick={addHoliday} variant="outline">
                        <CalendarDays className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {holidays.map((holiday, index) => (
                        <div key={index} className="flex items-center justify-between p-2 border rounded">
                          <span>{new Date(holiday).toLocaleDateString()}</span>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => removeHoliday(holiday)}
                          >
                            Remove
                          </Button>
                        </div>
                      ))}
                      {holidays.length === 0 && (
                        <div className="text-center text-muted-foreground py-4">
                          No holidays scheduled
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex gap-3">
                <Button variant="success" onClick={saveOperatingSettings}>
                  Save Operating Settings
                </Button>
                <Button 
                  variant="secondary" 
                  onClick={() => { 
                    setOperatingHours(company.operating_hours || defaultOperatingHours);
                    setHolidays(company.holidays || []);
                  }}
                >
                  Reset
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}