import { useEffect, useMemo, useRef, useState } from "react";

export type MapPickerProps = {
  lat: number;
  lng: number;
  onChange: (lat: number, lng: number) => void;
  height?: number | string;
};

export default function MapPicker({ lat, lng, onChange, height = 360 }: MapPickerProps) {
  const [ready, setReady] = useState(false);
  const [leaflet, setLeaflet] = useState<any>(null);
  const mapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const L = await import("leaflet");
      await import("leaflet/dist/leaflet.css");
      if (!mounted) return;
      setLeaflet(L);
      setReady(true);
    })();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!ready || !leaflet) return;
    const map = leaflet.map("map-picker", { center: [lat, lng], zoom: 15 });
    leaflet
      .tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "&copy; OpenStreetMap contributors",
      })
      .addTo(map);
    const marker = leaflet.marker([lat, lng], { draggable: true }).addTo(map);
    marker.on("dragend", () => {
      const p = marker.getLatLng();
      onChange(p.lat, p.lng);
    });
    map.on("click", (e: any) => {
      marker.setLatLng(e.latlng);
      onChange(e.latlng.lat, e.latlng.lng);
    });
    mapRef.current = map;
    markerRef.current = marker;
    return () => {
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
  }, [ready, leaflet]);

  useEffect(() => {
    if (mapRef.current && markerRef.current) {
      markerRef.current.setLatLng([lat, lng]);
      mapRef.current.panTo([lat, lng], { animate: true, duration: 0.5 });
    }
  }, [lat, lng]);

  async function runSearch() {
    if (!query.trim()) return;
    setLoading(true);
    try {
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
        query,
      )}&addressdetails=1&limit=5`;
      const res = await fetch(url, { headers: { "Accept-Language": "en" } });
      const json = await res.json();
      setResults(json);
      setOpen(true);
    } catch (e) {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }

  function pickResult(item: any) {
    const La = parseFloat(item.lat);
    const Ln = parseFloat(item.lon);
    if (markerRef.current && mapRef.current) {
      markerRef.current.setLatLng([La, Ln]);
      mapRef.current.setView([La, Ln], 16, { animate: true });
    }
    onChange(La, Ln);
    setOpen(false);
  }

  const key = useMemo(() => `${lat.toFixed(6)}:${lng.toFixed(6)}`, [lat, lng]);

  return (
    <div style={{ height }} className="relative rounded-lg overflow-hidden border">
      <div className="absolute z-10 left-3 right-3 top-3 flex gap-2">
        <div className="flex-1 relative">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") runSearch();
            }}
            placeholder="Search location (e.g. Cairo Tower)"
            className="w-full h-10 rounded-md bg-background/95 backdrop-blur px-3 border shadow transition focus:ring-2 focus:ring-ring"
          />
          {open && results.length > 0 && (
            <div className="absolute mt-1 w-full bg-background border rounded-md shadow-lg overflow-hidden transition-all animate-in fade-in slide-in-from-top-2">
              {results.map((r) => (
                <button
                  key={`${r.place_id}`}
                  className="w-full text-left px-3 py-2 hover:bg-accent/60"
                  onClick={() => pickResult(r)}
                >
                  <div className="font-medium truncate">{r.display_name}</div>
                  <div className="text-xs text-muted-foreground truncate">{r.type}</div>
                </button>
              ))}
            </div>
          )}
        </div>
        <button
          onClick={runSearch}
          className="h-10 px-4 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition"
        >
          {loading ? "Searching..." : "Search"}
        </button>
      </div>
      <div id="map-picker" key={key} style={{ height: "100%", width: "100%" }} />
    </div>
  );
}
