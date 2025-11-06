import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Printer,
  MapPin,
  DollarSign,
  Home,
  Info,
  ArrowLeft,
  Clock,
  Menu,
} from "lucide-react";
import { ReactNode, useMemo } from "react";
import { SHOPS } from "@/data/shops";

import { AnimatePresence, motion } from "framer-motion";
export default function SiteLayout({ children }: { children: ReactNode }) {
  const loc = useLocation();
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 pb-16 md:pb-0 overflow-x-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={loc.pathname + loc.hash}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>
      <Footer />
      <BottomNav />
    </div>
  );
}

function Header() {
  const location = useLocation();
  const navigate = useNavigate();
  const companyId = useMemo(() => {
    if (!location.pathname.startsWith("/company/")) return null;
    const id = location.pathname.split("/company/")[1]?.split("/")[0] ?? null;
    return id;
  }, [location.pathname]);
  const shop = useMemo(
    () => (companyId ? SHOPS.find((s) => s.id === companyId) : undefined),
    [companyId],
  );
  const isCompany = !!companyId;

  if (isCompany) {
    return (
      <header className="sticky top-0 z-40 w-full border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center justify-between gap-2">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 rounded-md px-2 py-1 text-sm hover:bg-accent hover:text-accent-foreground"
            aria-label="Go back"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Back</span>
          </button>
          <div className="flex min-w-0 flex-1 items-center justify-center gap-2 text-sm">
            <div className="truncate font-semibold">
              {shop?.name ?? "Company"}
            </div>
            <span className="hidden sm:inline text-muted-foreground">•</span>
            <div className="hidden sm:flex items-center gap-1 text-muted-foreground">
              <Clock className="h-4 w-4" /> Queue {shop?.queue ?? "–"}
            </div>
          </div>
          <div className="flex items-center">
            <div className="md:hidden">
              <MobileMenu />
            </div>
          </div>
        </div>
        <div className="border-t hidden md:block">
          <div className="container flex h-12 items-center justify-center gap-3">
            <CompanyTab
              to="#print"
              label="Print"
              icon={<Printer className="h-4 w-4" />}
            />
            <CompanyTab
              to="#activity"
              label="Activity"
              icon={<Clock className="h-4 w-4" />}
              defaultActive
            />
            <CompanyTab
              to="#about"
              label="About"
              icon={<Info className="h-4 w-4" />}
            />
          </div>
        </div>
      </header>
    );
  }

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-2 font-extrabold text-lg">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <Printer className="h-5 w-5" />
          </span>
          <span>
            Zam<span className="text-primary">office</span>
          </span>
        </Link>
        <nav className="hidden md:flex items-center gap-1">
          <HeaderLink to="/">Home</HeaderLink>
          <HeaderLink to="/about">About</HeaderLink>
          <HeaderLink to="/history">History</HeaderLink>
        </nav>
        <div className="flex items-center gap-2">
          <Button asChild variant="secondary" className="hidden sm:inline-flex">
            <a href="#features">Features</a>
          </Button>
          <Button asChild>
            <Link to="/">Print</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}

function HeaderLink({ to, children }: { to: string; children: ReactNode }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        cn(
          "px-3 py-2 text-sm rounded-md hover:bg-accent hover:text-accent-foreground",
          isActive && "bg-secondary text-secondary-foreground",
        )
      }
    >
      {children}
    </NavLink>
  );
}

function CompanyTab({
  to,
  label,
  icon,
  defaultActive,
}: {
  to: string;
  label: string;
  icon: ReactNode;
  defaultActive?: boolean;
}) {
  const location = useLocation();
  const active = location.hash ? location.hash === to : defaultActive;
  return (
    <a
      href={to}
      className={cn(
        "inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-sm",
        active
          ? "bg-secondary text-secondary-foreground"
          : "hover:bg-accent hover:text-accent-foreground text-muted-foreground",
      )}
    >
      {icon}
      <span>{label}</span>
    </a>
  );
}

function BottomNav() {
  const location = useLocation();
  const companyId = useMemo(() => {
    if (!location.pathname.startsWith("/company/")) return null;
    const id = location.pathname.split("/company/")[1]?.split("/")[0] ?? null;
    return id;
  }, [location.pathname]);

  if (companyId) {
    const activeHash = location.hash || "#activity";
    const items: {
      hash: "#print" | "#activity" | "#about";
      label: string;
      icon: ReactNode;
    }[] = [
      { hash: "#print", label: "Print", icon: <Printer className="h-5 w-5" /> },
      {
        hash: "#activity",
        label: "Activity",
        icon: <Clock className="h-5 w-5" />,
      },
      { hash: "#about", label: "About", icon: <Info className="h-5 w-5" /> },
    ];
    return (
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60 md:hidden">
        <ul className="mx-auto grid max-w-md grid-cols-3">
          {items.map((it) => (
            <li key={it.hash}>
              <a
                href={it.hash}
                className={cn(
                  "flex flex-col items-center justify-center gap-1 py-2 text-[11px] leading-none",
                  activeHash === it.hash
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground",
                )}
                aria-label={it.label}
              >
                {it.icon}
                <span>{it.label}</span>
              </a>
            </li>
          ))}
        </ul>
      </nav>
    );
  }

  const items: { to: string; label: string; icon: ReactNode }[] = [
    { to: "/", label: "Home", icon: <Home className="h-5 w-5" /> },
    { to: "/about", label: "About", icon: <Info className="h-5 w-5" /> },
  ];

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60 md:hidden">
      <ul className="mx-auto grid max-w-md grid-cols-3">
        <li>
          <MobileMenu />
        </li>
        {items.map((it) => (
          <li key={it.to}>
            <NavLink
              to={it.to}
              className={({ isActive }) =>
                cn(
                  "flex flex-col items-center justify-center gap-1 py-2 text-[11px] leading-none",
                  isActive
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground",
                )
              }
              aria-label={it.label}
            >
              {it.icon}
              <span>{it.label}</span>
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose,
} from "@/components/ui/sheet";

function MobileMenu({
  triggerClassName,
  label = "Menu",
}: {
  triggerClassName?: string;
  label?: string | null;
}) {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <button
          className={cn(
            "w-full flex flex-col items-center justify-center gap-1 py-2 text-[11px] leading-none text-muted-foreground hover:text-foreground",
            triggerClassName,
          )}
          aria-label="Menu"
        >
          <Menu className="h-5 w-5" />
          {label ? <span>{label}</span> : <span className="sr-only">Menu</span>}
        </button>
      </SheetTrigger>
      <SheetContent
        side="left"
        className="w-[92vw] max-w-none h-[96vh] rounded-r-2xl p-0"
      >
        <div className="p-6 border-b">
          <SheetHeader>
            <SheetTitle>Menu</SheetTitle>
          </SheetHeader>
        </div>
        <nav className="p-2">
          <SheetClose asChild>
            <NavLink
              to="/"
              className="block rounded px-3 py-3 text-base hover:bg-accent hover:text-accent-foreground"
            >
              Home
            </NavLink>
          </SheetClose>
          <SheetClose asChild>
            <NavLink
              to="/about"
              className="block rounded px-3 py-3 text-base hover:bg-accent hover:text-accent-foreground"
            >
              About
            </NavLink>
          </SheetClose>
          <SheetClose asChild>
            <NavLink
              to="/history"
              className="block rounded px-3 py-3 text-base hover:bg-accent hover:text-accent-foreground"
            >
              History
            </NavLink>
          </SheetClose>
        </nav>
      </SheetContent>
    </Sheet>
  );
}

function Footer() {
  return (
    <footer className="border-t bg-background">
      <div className="container py-10 grid gap-6 md:grid-cols-3">
        <div>
          <div className="flex items-center gap-2 font-extrabold text-lg">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <Printer className="h-5 w-5" />
            </span>
            Zam<span className="text-primary">office</span>
          </div>
          <p className="mt-3 text-sm text-muted-foreground">
            Privacy‑safe print orders, live queues, float & commissions. Built
            for Zambia and beyond.
          </p>
        </div>
        <div>
          <h4 className="font-semibold">Highlights</h4>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li className="flex items-center gap-2">
              <MapPin className="h-4 w-4" /> Proximity ≤ 500 m
            </li>
            <li className="flex items-center gap-2">
              <DollarSign className="h-4 w-4" /> Float packs & commissions
            </li>
            <li className="flex items-center gap-2">
              Secure uploads, no WhatsApp
            </li>
          </ul>
        </div>
        <div id="get-started">
          <h4 className="font-semibold">Actions</h4>
          <div className="mt-3 flex gap-2">
            <Button asChild>
              <Link to="/">Print</Link>
            </Button>
            <Button asChild variant="secondary">
              <Link to="/about">About</Link>
            </Button>
          </div>
        </div>
      </div>
      <div className="border-t">
        <div className="container py-4 text-xs text-muted-foreground flex items-center justify-between">
          <span>© {new Date().getFullYear()} Zamoffice</span>
          <a href="#features" className="hover:underline">
            Features
          </a>
        </div>
      </div>
    </footer>
  );
}
