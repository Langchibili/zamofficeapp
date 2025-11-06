import "./global.css";

import { Toaster } from "@/components/ui/toaster";
import { createRoot } from "react-dom/client";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import About from "./pages/Index";
import NotFound from "./pages/NotFound";
import SiteLayout from "@/components/layout/SiteLayout";
import AllCompanies from "./pages/AllCompanies";
import CompanyPage from "./pages/CompanyPage";
import History from "./pages/History";
import NotificationGate from "@/components/NotificationGate";
import { SocketProvider } from "@/contexts/SocketContext";


const queryClient = new QueryClient();

const App = () => (
  <SocketProvider>
    <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <NotificationGate />
      <BrowserRouter>
        <SiteLayout>
          <Routes>
            <Route path="/" element={<AllCompanies />} />
            <Route path="/about" element={<About />} />
            <Route path="/company/:name" element={<CompanyPage />} />
            <Route path="/history" element={<History />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </SiteLayout>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
  </SocketProvider>
)

const _container = document.getElementById("root");
if (_container) {
  // Avoid calling createRoot twice during HMR or repeated module evaluation
  const anyWindow = window as any;
  let _root = anyWindow.__REACT_ROOT__;
  if (!_root) {
    _root = createRoot(_container);
    anyWindow.__REACT_ROOT__ = _root;
  }
  _root.render(<App />);
}