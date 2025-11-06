import "./global.css";

import { Toaster } from "@/components/ui/toaster";
import { createRoot } from "react-dom/client";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  BrowserRouter,
  Routes,
  Route,
  NavLink,
  useLocation,
  useNavigation,
  useNavigate 
} from "react-router-dom";
import { useState } from "react";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import AddFloat from "./pages/AddFloat";
import History from "./pages/History";
import Profile from "./pages/Profile";
import Location from "./pages/Location";
import Settings from "./pages/Settings";
import Support from "./pages/Support";
import Register from './pages/Register';
import { CompanyProvider, useCompany } from "./hooks/use-company";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
} from "@/components/ui/sheet";
import { Menu, LogOut } from "lucide-react";
import { formatCurrency } from "@/lib/currency";
import { AnimatePresence, motion } from "framer-motion";
import { UserProvider, useUser } from './contexts/UserContext'; // Import useUser
import { SocketProvider } from './contexts/SocketContext';
import Login from "./pages/Login";
import VerifyEmail from "./pages/VerifyEmail";
import Logout from "./pages/Logout";


const queryClient = new QueryClient();

function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      <TopNav />
      {children}
    </div>
  );
}

function TopNav() {
  const { company, logout } = useCompany();
  const { isAuthenticated } = useUser(); // Get authentication status
  const location = useLocation();
  const navigate = useNavigate()
  const [open, setOpen] = useState(false);
  
  const link = (to: string, label: string, onClick?: () => void) => (
    <NavLink
      to={to}
      onClick={onClick}
      className={({ isActive }) =>
        `px-3 py-2 rounded-md text-sm font-medium hover:bg-accent ${
          isActive ? "bg-accent text-foreground" : "text-muted-foreground"
        }`
      }
    >
      {label}
    </NavLink>
  );

  // Navigation links for authenticated users
  const authenticatedLinks = (
    <>
      {link("/", "Dashboard")}
      {link("/float", "Add Float")}
      {link("/history", "History")}
      {link("/profile", "Profile")}
      {link("/location", "Location")}
      {link("/settings", "Settings")}
      {link("/support", "Support")}
    </>
  );

  // Navigation links for unauthenticated users
  const unauthenticatedLinks = (
    <>
      {link("/register", "Register")}
      {link("/login", "Login")}
    </>
  );

  return (
    <div className="border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-40">
      <div className="container h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <NavLink to="/" className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-lg bg-primary text-primary-foreground grid place-content-center font-bold shadow-sm">
              Z
            </div>
            <div className="hidden sm:block leading-tight">
              <div className="font-extrabold tracking-tight">
                Zamoffice Company
              </div>
              <div className="text-xs text-muted-foreground">Console</div>
            </div>
          </NavLink>
          <div className="hidden md:flex items-center gap-1 ml-4">
            {isAuthenticated ? authenticatedLinks : unauthenticatedLinks}
          </div>
        </div>
        <div className="hidden md:flex items-center gap-3">
          {isAuthenticated && company ? (
            <>
              {/* <div className="text-sm text-muted-foreground">
                {(() => {
                  const id = company.id;
                  const raw = localStorage.getItem(
                    `zamoffice.floatHistory.${id}`,
                  );
                  const arr = raw ? JSON.parse(raw) : [];
                  const total = arr.reduce(
                    (s: number, a: any) => s + (Number(a.amount) || 0),
                    0,
                  );
                  const curr =
                    company.settings?.currency || company.currency || "ZMW";
                  const fmt = formatCurrency(total, curr);
                  return `Float: ${fmt}`;
                })()}
              </div> */}
              <Button
                variant="outline"
                className="gap-2"
                onClick={()=>{navigate("/logout")}}
              >
                <LogOut className="h-4 w-4" /> Logout
              </Button>
            </>
          ) : null}
        </div>
        <div className="md:hidden">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                aria-label="Open menu"
                onClick={() => setOpen(true)}
              >
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right">
              <SheetTitle className="sr-only">Main menu</SheetTitle>
              <nav className="grid gap-2 mt-8">
                {isAuthenticated ? (
                  <>
                    {link("/", "Dashboard", () => setOpen(false))}
                    {link("/float", "Add Float", () => setOpen(false))}
                    {link("/history", "History", () => setOpen(false))}
                    {link("/profile", "Profile", () => setOpen(false))}
                    {link("/location", "Location", () => setOpen(false))}
                    {link("/settings", "Settings", () => setOpen(false))}
                    {link("/support", "Support", () => setOpen(false))}
                  </>
                ) : (
                  <>
                    {link("/register", "Register", () => setOpen(false))}
                    {link("/login", "Login", () => setOpen(false))}
                  </>
                )}
                
                {isAuthenticated && company ? (
                  <Button
                    variant="outline"
                    className="mt-4"
                    onClick={() => {
                      setOpen(false);
                      logout();
                    }}
                  >
                    <LogOut className="h-4 w-4 mr-2" /> Logout
                  </Button>
                ) : null}
                <div className="text-xs text-muted-foreground mt-2">
                  {isAuthenticated && company
                    ? `Signed in as ${company.name || company.id}`
                    : "Not signed in"}
                </div>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </div>
  );
}

function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className="will-change-transform"
    >
      {children}
    </motion.div>
  );
}

function AnimatedRoutes() {
  const location = useLocation();
  const { isAuthenticated } = useUser(); // Get authentication status for route protection

  // Protected route wrapper
  const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
    if (!isAuthenticated) {
      return (
        <div className="min-h-screen bg-gradient-to-b from-accent to-background flex items-center justify-center">
          <div className="container py-8">
            <div className="p-8 shadow-xl border-border/60 max-w-md mx-auto text-center bg-background rounded-lg">
              <div className="space-y-6">
                <div>
                  <h1 className="text-2xl font-bold mb-2">Access Required</h1>
                  <p className="text-muted-foreground">
                    Please log in to access this page.
                  </p>
                </div>
                <Button asChild className="w-full h-11 text-base">
                  <a href="/login">Log In</a>
                </Button>
              </div>
            </div>
          </div>
        </div>
      );
    }
    return <PageShell>{children}</PageShell>;
  };

  return (
    <AnimatePresence mode="wait" initial={false}>
      <Routes location={location} key={location.pathname}>
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Index />
            </ProtectedRoute>
          }
        />
        <Route
          path="/float"
          element={
            <ProtectedRoute>
              <AddFloat />
            </ProtectedRoute>
          }
        />
        <Route
          path="/history"
          element={
            <ProtectedRoute>
              <History />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/location"
          element={
            <ProtectedRoute>
              <Location />
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <Settings />
            </ProtectedRoute>
          }
        />
        <Route
          path="/support"
          element={
            <ProtectedRoute>
              <Support />
            </ProtectedRoute>
          }
        />
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
        <Route path="/logout" element={<Logout />} />
        <Route path="/verify-email" element={<VerifyEmail />} />
        <Route
          path="*"
          element={
            <PageShell>
              <NotFound />
            </PageShell>
          }
        />
      </Routes>
    </AnimatePresence>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <UserProvider>
         <SocketProvider>
          <CompanyProvider>
            <BrowserRouter>
              <Layout>
                <AnimatedRoutes />
              </Layout>
            </BrowserRouter>
          </CompanyProvider>
        </SocketProvider>
      </UserProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

createRoot(document.getElementById("root")!).render(<App />);