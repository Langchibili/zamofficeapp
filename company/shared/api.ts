/**
 * Shared code between client and server
 * Useful to share types between client and server
 * and/or small pure JS functions that can be used on both client and server
 */

/**
 * Example response type for /api/demo
 */
export interface DemoResponse {
  message: string;
}

export type Coordinates = {
  lat: number;
  lng: number;
};

export interface CompanySettings {
  availabilityRadiusM: number; // min 50, max 1000, default 500
  allowScheduling: boolean; // default true
  currency: string; // e.g., "ZMW"
}

export interface CompanyProfile {
  id: string;
  name: string;
  location: Coordinates;
  email?: string;
  country?: string;
  currency?: string; // legacy field; prefer settings.currency
  logoDataUrl?: string;
  about?: string;
  settings?: CompanySettings;
}

export const DEFAULT_AVAILABILITY_RADIUS_M = 500;

export interface PrintJob {
  id: string;
  clientName: string;
  pages: number;
  color: boolean;
  fileName: string;
  createdAt: string; // ISO
  scheduledAt?: string | null; // ISO or null
  clientLocation: Coordinates;
  notes?: string;
}

/**
 * Haversine formula to compute great-circle distance between two coordinates in meters.
 */
export function haversineMeters(a: Coordinates, b: Coordinates): number {
  const R = 6371000; // Earth radius in meters
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLon = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);

  const sinDLat = Math.sin(dLat / 2);
  const sinDLon = Math.sin(dLon / 2);

  const c =
    sinDLat * sinDLat +
    Math.cos(lat1) * Math.cos(lat2) * sinDLon * sinDLon;

  const d = 2 * Math.atan2(Math.sqrt(c), Math.sqrt(1 - c));
  return R * d;
}
