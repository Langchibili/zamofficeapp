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
import { MapPin, Search } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { SHOPS, Shop, haversineKm } from "@/data/shops";
import {
  getCompanies,
  getClientId,
  getClients,
  createClient,
  updateClient,
} from "../../Functions.js";

function MapMini({
  user,
  shops,
}: {
  user: { lat: number; lon: number } | null;
  shops: (Shop & { km: number | null })[];
}) {
  if (!user) {
    return (
      <div className="h-52 w-full rounded-md border bg-muted/40 grid place-items-center text-xs text-muted-foreground">
        Enable location to view nearby shops on map
      </div>
    );
  }
  const all = [user, ...shops.map((s) => ({ lat: s.lat, lon: s.lon }))];
  const minLat = Math.min(...all.map((p) => p.lat));
  const maxLat = Math.max(...all.map((p) => p.lat));
  const minLon = Math.min(...all.map((p) => p.lon));
  const maxLon = Math.max(...all.map((p) => p.lon));
  const latRange = Math.max(0.0005, maxLat - minLat);
  const lonRange = Math.max(0.0005, maxLon - minLon);

  const project = (p: { lat: number; lon: number }) => ({
    x: ((p.lon - minLon) / lonRange) * 100,
    y: (1 - (p.lat - minLat) / latRange) * 100,
  });

  const userPt = project(user);

  return (
    <div className="relative h-56 w-full overflow-hidden rounded-md border bg-background">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,hsl(var(--secondary))/0.6,transparent_40%),radial-gradient(circle_at_80%_80%,hsl(var(--accent))/0.25,transparent_35%)]" />
      <div className="absolute inset-0">
        {/* user */}
        <div
          className="absolute -translate-x-1/2 -translate-y-1/2"
          style={{ left: `${userPt.x}%`, top: `${userPt.y}%` }}
        >
          <div
            className="h-3 w-3 rounded-full bg-primary ring-4 ring-primary/30"
            title="You"
          />
        </div>
        {/* shops */}
        {shops.map((s) => {
          const pt = project({ lat: s.lat, lon: s.lon });
          return (
            <div
              key={s.id}
              className="absolute -translate-x-1/2 -translate-y-1/2"
              style={{ left: `${pt.x}%`, top: `${pt.y}%` }}
            >
              <div
                className={`h-3 w-3 rounded-full ${s.km !== null && s.km <= 0.5 && s.floatOK ? "bg-green-500" : "bg-gray-400"}`}
                title={s.name}
              />
            </div>
          );
        })}
      </div>
      <div className="absolute bottom-2 right-2 rounded bg-background/80 px-2 py-1 text-[10px] text-muted-foreground">
        Schematic map
      </div>
    </div>
  );
}

export default function AllCompanies() {
  const [coords, setCoords] = useState<{ lat: number; lon: number } | null>(
    null,
  );
  const [query, setQuery] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) =>
          setCoords({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
        () => setCoords(null),
        { enableHighAccuracy: true, timeout: 8000 },
      );
    }
  }, []);

  const computed = useMemo(() => {
    const enriched = SHOPS.map((s) => ({
      ...s,
      km: coords ? haversineKm(coords, { lat: s.lat, lon: s.lon }) : null,
      available: coords
        ? s.floatOK && haversineKm(coords, { lat: s.lat, lon: s.lon }) <= 0.5
        : false,
    }));
    const filtered = enriched.filter((s) =>
      s.name.toLowerCase().includes(query.toLowerCase()),
    );
    return filtered.sort((a, b) => (a.km ?? 999) - (b.km ?? 999));
  }, [coords, query]);

  return (
    <section className="container py-6 md:py-10">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-xl font-bold md:text-2xl">Print near me</h1>
      </div>

      <div className="mt-4 flex items-center gap-2 rounded-md border bg-background px-3 py-2">
        <Search className="h-4 w-4 text-muted-foreground" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full bg-transparent text-sm outline-none"
          placeholder="Search companies"
        />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2 grid gap-4 sm:grid-cols-2">
          {computed.map((s) => (
            <Card
              key={s.id}
              className="hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => navigate(`/company/${encodeURIComponent(s.name)}`)}
            >
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between">
                  <span className="truncate">{s.name}</span>
                  <span
                    className={`ml-2 inline-flex h-2 w-2 rounded-full ${s.available ? "bg-green-500" : "bg-gray-300"}`}
                  />
                </CardTitle>
                <CardDescription className="flex items-center gap-2 text-sm">
                  <MapPin className="h-4 w-4" />
                  {s.km !== null
                    ? `${s.km.toFixed(2)} km`
                    : "Location needed"}{" "}
                  • Queue {s.queue}
                  {!s.floatOK && (
                    <span className="text-destructive ml-1">Out of float</span>
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0 flex items-center justify-between">
                <Badge variant="secondary">
                  Float {s.floatOK ? "OK" : "Low"}
                </Badge>
                <Button
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/company/${encodeURIComponent(s.name)}`);
                  }}
                >
                  {s.available ? "Submit now" : "Schedule"}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
        <div>
          <MapMini user={coords} shops={computed} />
          {coords && (
            <a
              className="mt-2 block text-xs text-primary hover:underline"
              href={`https://www.openstreetmap.org/?mlat=${coords.lat}&mlon=${coords.lon}#map=16/${coords.lat}/${coords.lon}`}
              target="_blank"
              rel="noreferrer"
            >
              Open in map
            </a>
          )}
        </div>
      </div>
    </section>
  );
}
