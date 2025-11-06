import "./global.css";

import { Toaster } from "@/components/ui/toaster";
import { createRoot } from "react-dom/client";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import AgentLogin from "./pages/agent/Login";
import AgentDashboard from "./pages/agent/Dashboard";
import AgentSupport from "./pages/agent/Support";
import AgentSignUp from "./pages/agent/SignUp";
import { AgentAuthProvider } from "./hooks/useAgentAuth";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AgentAuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/agent/login" element={<AgentLogin />} />
            <Route path="/agent/signup" element={<AgentSignUp />} />
            <Route path="/agent/dashboard" element={<AgentDashboard />} />
            <Route path="/agent/support" element={<AgentSupport />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AgentAuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

createRoot(document.getElementById("root")!).render(<App />);
