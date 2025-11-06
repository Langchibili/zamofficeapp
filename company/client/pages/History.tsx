// History.tsx
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useEffect, useState } from "react";
import type { PrintJob } from "@shared/api";
import type { FloatEntry } from "./AddFloat";
import { formatCurrency } from "@/lib/currency";
import { useUser } from "@/contexts/UserContext";
import { LogIn, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function History() {
  const { user, isAuthenticated, isLoading } = useUser();
  const company = user?.company;
  const [prints, setPrints] = useState<(PrintJob & { completedAt: string })[]>([]);
  const [floats, setFloats] = useState<FloatEntry[]>([]);

  useEffect(() => {
    if (company) {
      const pid = company.id;
      const ph = localStorage.getItem(pid ? `zamoffice.history.${pid}` : "zamoffice.history");
      const fh = localStorage.getItem(pid ? `zamoffice.floatHistory.${pid}` : "zamoffice.floatHistory");
      setPrints(ph ? JSON.parse(ph) : []);
      setFloats(fh ? JSON.parse(fh) : []);
    }
  }, [company]);

  // Show UserContext loading state
  if (isLoading) {
    return null; // UserProvider already shows loading skeletons
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
                  To view your history, you must log in to your account.
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
                Please set up your company profile to view history.
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

  return (
    <div className="min-h-screen bg-gradient-to-b from-accent to-background">
      <div className="container py-6">
        <Tabs defaultValue="prints">
          <div className="flex items-center justify-between">
            <TabsList>
              <TabsTrigger value="prints">Print History</TabsTrigger>
              <TabsTrigger value="floats">Float History</TabsTrigger>
            </TabsList>
          </div>
          
          <TabsContent value="prints" className="mt-4">
            <Card className="shadow-xl border-border/60">
              <CardHeader>
                <CardTitle className="text-2xl">Print History</CardTitle>
              </CardHeader>
              <CardContent>
                {prints.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>No print history yet.</p>
                    <p className="text-sm mt-2">Completed prints will appear here.</p>
                  </div>
                ) : (
                  <ul className="space-y-3">
                    {prints.map((p) => (
                      <li key={p.id} className="flex justify-between items-center border rounded-lg p-4 hover:bg-accent/50 transition-colors">
                        <div className="flex-1">
                          <div className="font-medium">{p.fileName}</div>
                          <div className="text-sm text-muted-foreground">{p.clientName}</div>
                          {p.pages && (
                            <div className="text-xs text-muted-foreground mt-1">
                              {p.pages} page{p.pages !== 1 ? 's' : ''} • {p.color ? 'Color' : 'B&W'}
                            </div>
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground text-right">
                          {new Date(p.completedAt).toLocaleDateString()}
                          <br />
                          <span className="text-xs">{new Date(p.completedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="floats" className="mt-4">
            <Card className="shadow-xl border-border/60">
              <CardHeader>
                <CardTitle className="text-2xl">Float History</CardTitle>
              </CardHeader>
              <CardContent>
                {floats.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>No float transactions yet.</p>
                    <p className="text-sm mt-2">Float top-ups and transactions will appear here.</p>
                  </div>
                ) : (
                  <ul className="space-y-3">
                    {floats.map((f) => (
                      <li key={f.id} className="flex justify-between items-center border rounded-lg p-4 hover:bg-accent/50 transition-colors">
                        <div className="flex-1">
                          <div className={`font-medium ${f.amount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {formatCurrency(f.amount, (company?.settings?.currency || (company as any)?.currency || "ZMW"))}
                          </div>
                          {f.note && (
                            <div className="text-sm text-muted-foreground mt-1">{f.note}</div>
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground text-right">
                          {new Date(f.createdAt).toLocaleDateString()}
                          <br />
                          <span className="text-xs">{new Date(f.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}