//use-company.tsx
import { createContext, useContext, useMemo, useState, useEffect } from "react";
import type { CompanyProfile } from "@shared/api";
import { useUser } from "../contexts/UserContext"; // Import UserContext
import { getCurrentCompany, updateCompany as updateCompanyAPI } from "../../Functions"; // Import API functions

const storage = {
  get<T>(k: string): T | null {
    try {
      const v = localStorage.getItem(k);
      return v ? (JSON.parse(v) as T) : null;
    } catch {
      return null;
    }
  },
  set<T>(k: string, v: T) {
    localStorage.setItem(k, JSON.stringify(v));
  },
  remove(k: string) {
    localStorage.removeItem(k);
  },
};

export type CompanyContextValue = {
  company: CompanyProfile | null;
  login: (profile: CompanyProfile) => void;
  logout: () => void;
  updateCompany: (patch: Partial<CompanyProfile>) => Promise<void>;
  isLoading: boolean;
};

const CompanyContext = createContext<CompanyContextValue | undefined>(
  undefined,
);

function ensureDefaults(p: CompanyProfile): CompanyProfile {
  const settings = p.settings ?? {
    availabilityRadiusM: 500,
    allowScheduling: true,
    currency: p.currency || "ZMW",
  };
  return { ...p, settings };
}

export function CompanyProvider({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated } = useUser(); // Get user from UserContext
  const [company, setCompany] = useState<CompanyProfile | null>(() =>
    storage.get<CompanyProfile>("zamoffice.company"),
  );
  const [isLoading, setIsLoading] = useState(false);

  // Sync company data when user changes
  useEffect(() => {
    const syncCompanyWithUser = async () => {
      if (isAuthenticated && user?.company) {
        // If we have a user with company data, use it
        setCompany(ensureDefaults(user.company));
        storage.set("zamoffice.company", ensureDefaults(user.company));
      } else if (isAuthenticated && !company) {
        // If authenticated but no company in state, fetch it
        setIsLoading(true);
        try {
          const userData = await getCurrentCompany();
          console.log("userData",userData)
          if (userData?.company) {
            const companyWithDefaults = ensureDefaults(userData.company);
            setCompany(companyWithDefaults);
            storage.set("zamoffice.company", companyWithDefaults);
          }
        } catch (error) {
          console.error("Failed to fetch company:", error);
        } finally {
          setIsLoading(false);
        }
      } else if (!isAuthenticated) {
        // If not authenticated, clear company
        setCompany(null);
        storage.remove("zamoffice.company");
      }
    };

    syncCompanyWithUser();
  }, [user, isAuthenticated, company]);

  const value = useMemo<CompanyContextValue>(
    () => ({
      company: company ? ensureDefaults(company) : null,
      isLoading,
      login: (p) => {
        const withDefaults = ensureDefaults(p);
        setCompany(withDefaults);
        storage.set("zamoffice.company", withDefaults);
      },
      logout: () => {
        setCompany(null);
        storage.remove("zamoffice.company");
      },
      updateCompany: async (patch) => {
        if (!company?.id) {
          throw new Error("No company to update");
        }

        setIsLoading(true);
        try {
          // Update company via API
          const updatedCompany = await updateCompanyAPI(company.id, patch);
          const withDefaults = ensureDefaults({ ...company, ...updatedCompany });
          
          setCompany(withDefaults);
          storage.set("zamoffice.company", withDefaults);
        } catch (error) {
          console.error("Failed to update company:", error);
          throw error;
        } finally {
          setIsLoading(false);
        }
      },
    }),
    [company, isLoading],
  );

  return <CompanyContext.Provider value={value}>{children}</CompanyContext.Provider>;
}

export function useCompany() {
  const ctx = useContext(CompanyContext);
  if (!ctx) throw new Error("useCompany must be used within CompanyProvider");
  return ctx;
}