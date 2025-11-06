export type Shop = {
  id: string;
  name: string;
  lat: number;
  lon: number;
  queue: number;
  floatOK: boolean;
};

export const SHOPS: Shop[] = [
  {
    id: "cairo",
    name: "Cairo Rd Print Hub",
    lat: -15.4167,
    lon: 28.2833,
    queue: 5,
    floatOK: true,
  },
  {
    id: "kamwala",
    name: "Kamwala Stationers",
    lat: -15.429,
    lon: 28.294,
    queue: 2,
    floatOK: true,
  },
  {
    id: "eastpark",
    name: "EastPark QuickPrint",
    lat: -15.408,
    lon: 28.332,
    queue: 11,
    floatOK: false,
  },
];

export function haversineKm(
  a: { lat: number; lon: number },
  b: { lat: number; lon: number },
) {
  const toRad = (x: number) => (x * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(b.lat - a.lat);
  const dLon = toRad(b.lon - a.lon);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const sinDLat = Math.sin(dLat / 2);
  const sinDLon = Math.sin(dLon / 2);
  const h =
    sinDLat * sinDLat + Math.cos(lat1) * Math.cos(lat2) * sinDLon * sinDLon;
  const c = 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
  return R * c;
}
