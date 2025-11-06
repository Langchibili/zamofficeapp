import { useEffect, useMemo, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import {
  MapPin,
  ShieldCheck,
  Upload,
  Clock,
  Users,
  DollarSign,
} from "lucide-react";
import { SHOPS, haversineKm } from "@/data/shops";


function uuid(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function getOrCreateClientId(): string {
  try {
    const key = "zamoffice_client_id";
    const existing = localStorage.getItem(key);
    if (existing) return existing;
    const id = uuid();
    localStorage.setItem(key, id);
    return id;
  } catch {
    return uuid();
  }
}

export default function Index() {
  const [clientId, setClientId] = useState<string>("");
  const [coords, setCoords] = useState<{ lat: number; lon: number } | null>(
    null,
  );
  const [files, setFiles] = useState<File[]>([]);
  const [pages, setPages] = useState<number>(12);
  const [copies, setCopies] = useState<number>(1);
  const [pricePerPage, setPricePerPage] = useState<number>(2.5); // ZMW
  const [queuePos, setQueuePos] = useState<number>(3);
  const [queueSize, setQueueSize] = useState<number>(12);
  

  useEffect(() => {
    setClientId(getOrCreateClientId());
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) =>
          setCoords({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
        () => setCoords(null),
        { enableHighAccuracy: true, timeout: 5000 },
      );
    }
  }, []);

  const shops = useMemo(() => {
    return SHOPS.map((s) => {
      const km = coords
        ? haversineKm(coords, { lat: s.lat, lon: s.lon })
        : null;
      const available = s.floatOK && km !== null && km <= 0.5;
      return { ...s, km, available };
    }).sort((a, b) => (a.km ?? 999) - (b.km ?? 999));
  }, [coords]);

  const total = useMemo(() => {
    const perCopy = pricePerPage * pages;
    return perCopy * copies;
  }, [pricePerPage, pages, copies]);

  const nearest = shops[0];
  const canSubmitNow = !!nearest?.available;

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-gradient-to-br from-secondary via-background to-background" />
        <div className="container py-16 md:py-24">
          <div className="grid gap-10 md:grid-cols-2 md:items-center">
            <div>
              <Badge className="mb-4">Zamoffice</Badge>
              <h1 className="text-4xl/tight font-extrabold sm:text-5xl">
                Print‑on‑Demand for Zambia — privacy‑safe, proximity‑smart
              </h1>
              <p className="mt-4 text-lg text-muted-foreground">
                Upload without WhatsApp, join a structured queue, and print now
                if you’re within 500 m — or schedule and pay ahead if you’re
                remote.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Button asChild>
                  <Link to="/">Print</Link>
                </Button>
                <Button asChild variant="secondary">
                  <a href="#pricing">Estimate price</a>
                </Button>
              </div>
              <div className="mt-6 flex items-center gap-4 text-sm text-muted-foreground">
                <span className="inline-flex items-center gap-1">
                  <ShieldCheck className="h-4 w-4 text-primary" /> Secure
                  uploads
                </span>
                <span className="inline-flex items-center gap-1">
                  <Users className="h-4 w-4 text-primary" /> Real‑time queues
                </span>
                <span className="inline-flex items-center gap-1">
                  <Clock className="h-4 w-4 text-primary" /> Scheduling
                </span>
              </div>
            </div>
            <div className="md:pl-10">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Upload className="h-5 w-5" /> Quick upload
                  </CardTitle>
                  <CardDescription>
                    Drag a PDF here to preview and count pages with server‑side
                    PDF.js.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <label
                    htmlFor="file"
                    className="flex h-44 w-full cursor-pointer flex-col items-center justify-center rounded-md border-2 border-dashed text-center hover:bg-accent/30"
                  >
                    <input
                      id="file"
                      type="file"
                      accept="application/pdf,image/*"
                      className="hidden"
                      multiple
                      onChange={(e) =>
                        setFiles(Array.from(e.target.files || []))
                      }
                    />
                    <Upload className="h-6 w-6 text-primary" />
                    <span className="mt-2 text-sm">
                      Drop files or click to browse
                    </span>
                    <span className="mt-1 text-xs text-muted-foreground">
                      PDF recommended for page‑accurate pricing
                    </span>
                  </label>
                  {files.length > 0 && (
                    <ul className="mt-4 space-y-2 text-sm">
                      {files.map((f) => (
                        <li
                          key={f.name}
                          className="flex items-center justify-between"
                        >
                          <span className="truncate">{f.name}</span>
                          <span className="text-muted-foreground">
                            {(f.size / 1024).toFixed(1)} KB
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Discovery */}
      <section id="discover" className="container py-16">
        <div className="mb-8 flex items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold">Nearby print shops</h2>
            <p className="text-muted-foreground">
              Availability turns green within 500 m and if the shop has float.
            </p>
          </div>
          <div className="text-xs text-muted-foreground">
            Client ID: {clientId.slice(0, 8)}…
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {shops.map((s) => (
            <Card key={s.id}>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between">
                  <span className="truncate">{s.name}</span>
                  <span
                    className={`ml-2 inline-flex h-2 w-2 rounded-full ${s.available ? "bg-green-500" : "bg-gray-300"}`}
                    aria-label={s.available ? "available" : "unavailable"}
                  />
                </CardTitle>
                <CardDescription className="flex items-center gap-2 text-sm">
                  <MapPin className="h-4 w-4" />
                  {s.km !== null
                    ? `${s.km.toFixed(2)} km`
                    : "Enable location"}{" "}
                  • Queue {s.queue}
                  {!s.floatOK && (
                    <span className="text-destructive ml-1">Out of float</span>
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex items-center justify-between">
                  <Button size="sm" disabled={!s.available}>
                    {" "}
                    {s.available ? "Submit now" : "Schedule"}{" "}
                  </Button>
                  <Badge variant="secondary">
                    Float {s.floatOK ? "OK" : "Low"}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Pricing & Queue */}
      <section id="pricing" className="bg-secondary/50 border-y">
        <div className="container py-16 grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Estimate your price</CardTitle>
              <CardDescription>
                pricePerPage × totalPages, or pricePerCopy for page bundles.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-xs text-muted-foreground">
                    Price / page (ZMW)
                  </label>
                  <input
                    type="number"
                    className="mt-1 w-full rounded-md border bg-background px-3 py-2"
                    value={pricePerPage}
                    min={0}
                    step={0.1}
                    onChange={(e) =>
                      setPricePerPage(parseFloat(e.target.value || "0"))
                    }
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Pages</label>
                  <input
                    type="number"
                    className="mt-1 w-full rounded-md border bg-background px-3 py-2"
                    value={pages}
                    min={1}
                    onChange={(e) => setPages(parseInt(e.target.value || "1"))}
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">
                    Copies
                  </label>
                  <input
                    type="number"
                    className="mt-1 w-full rounded-md border bg-background px-3 py-2"
                    value={copies}
                    min={1}
                    onChange={(e) => setCopies(parseInt(e.target.value || "1"))}
                  />
                </div>
              </div>
              <div className="mt-6 flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                  Estimated total
                  <div className="text-2xl font-bold text-foreground">
                    ZMW {total.toFixed(2)}
                  </div>
                </div>
                <Button asChild>
                  <Link to="/">Print</Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Live queue status</CardTitle>
              <CardDescription>
                Your position updates in real‑time after submission.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between text-sm">
                <span>Position</span>
                <span>
                  {queuePos} / {queueSize}
                </span>
              </div>
              <div className="mt-3 h-3 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary"
                  style={{
                    width: `${(queuePos / Math.max(queueSize, 1)) * 100}%`,
                  }}
                />
              </div>
              <div className="mt-4 text-xs text-muted-foreground">
                Estimated wait: ~{Math.max(0, (queuePos - 1) * 2)} min
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Features & Economics */}
      <section id="features" className="container py-16">
        <div className="grid gap-6 md:grid-cols-3">
          <Feature
            icon={<Upload className="h-5 w-5" />}
            title="File transfers without WhatsApp"
            desc="Secure uploads through the app only. Preserve privacy and prevent misdirected orders."
          />
          <Feature
            icon={<Users className="h-5 w-5" />}
            title="Structured queues"
            desc="Automated position tracking with priority for paying or on‑premise clients."
          />
          <Feature
            icon={<Clock className="h-5 w-5" />}
            title="Online scheduling"
            desc="Outside 500 m? Pick a time and pre‑pay to reserve your slot."
          />
        </div>
      </section>

      <section id="economics" className="container pb-24">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" /> Float & commissions
            </CardTitle>
            <CardDescription>
              Companies top up float packs (e.g., pay 100 ZMW → credit 95
              float). Each transaction’s profit distributes a percentage (e.g.,
              40%) to the referring agent.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-3">
            <Stat label="Float balance" value="ZMW 1,240" />
            <Stat label="Today’s prints" value="86" />
            <Stat label="Agent commissions (today)" value="ZMW 540" />
          </CardContent>
        </Card>
      </section>

      {/* CTA */}
      <section className="border-t bg-background">
        <div className="container py-16 text-center">
          <h3 className="text-2xl font-bold">
            Build on Strapi API • PDF.js • Maps • Payments
          </h3>
          <p className="mt-2 text-muted-foreground">
            API layer: Strapi (SQLite3). Lifecycle hooks process PDFs. Plugins
            power queues, scheduling, float, and commissions.
          </p>
          <div className="mt-6 flex items-center justify-center gap-3">
            <Button asChild>
              <Link to="/">Print now</Link>
            </Button>
            <Button asChild variant="secondary">
              <a href="#features">Learn more</a>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}

function Feature({
  icon,
  title,
  desc,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {icon} {title}
        </CardTitle>
        <CardDescription>{desc}</CardDescription>
      </CardHeader>
    </Card>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border bg-card p-4">
      <div className="text-xs uppercase text-muted-foreground">{label}</div>
      <div className="mt-1 text-2xl font-bold">{value}</div>
    </div>
  );
}
