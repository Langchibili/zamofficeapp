"use client";

import { api_url, getJwt } from "./Constants";

/* -------------------------
   Client ID auth (no login)
   ------------------------- */
export const getClientId = () => {
  if (typeof window === "undefined") return null;
  let clientId = localStorage.getItem("zamofficeClientId");
  if (!clientId) {
    clientId = `client-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
    localStorage.setItem("zamofficeClientId", clientId);
  }
  return clientId;
}

/* -------------------------
   Low-level fetch wrapper (public / unauthenticated)
   ------------------------- */
const zamFetch = async (path, options = {}) => {
  const res = await fetch(
    `${api_url.replace(/\/$/, "")}/${path.replace(/^\//, "")}`,
    {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(options.headers || {})
      },
    },
  );

  // Try to parse JSON, but handle non-JSON gracefully
  let json = null;
  try {
    json = await res.json();
  } catch (err) {
    const text = await res.text().catch(() => "");
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}: ${text}`);
    }
    return text;
  }

  if (!res.ok) {
    const message =
      json?.error?.message ||
      json?.errors?.[0]?.message ||
      json?.message ||
      `HTTP ${res.status}`;
    const err = new Error(message);
    err.payload = json;
    throw err;
  }
  return json;
};

/* -------------------------
   Normalization utilities
   ------------------------- */
/**
 * Safe flatten of a single Strapi item object.
 * Handles:
 * - item = { id, attributes: { ... } } -> { id, ...attributes }
 * - item = { id, ... } (already flat) -> returns as-is
 * - nested data.attributes.data -> resolves to inner item
 */
export const normalizeStrapiItem = (item) => {
  if (!item || typeof item !== "object") return null;

  if (Object.prototype.hasOwnProperty.call(item, "attributes")) {
    const { id, attributes } = item;
    if (attributes && typeof attributes === "object") {
      return { id, ...attributes };
    }
    return { id };
  }

  if (item?.data && item?.data?.attributes) {
    return normalizeStrapiItem(item.data);
  }

  return item;
};

/**
 * Normalize an entire Strapi response JSON.
 * - returnArray=true  => return array (collection)
 * - returnArray=false => return single object (single type / item)
 */
export const normalizeStrapiResponse = (json, { returnArray = true } = {}) => {
  if (!json || typeof json !== "object") return returnArray ? [] : null;

  const data = json.data;

  if (data === null || typeof data === "undefined") {
    return returnArray ? [] : null;
  }

  if (Array.isArray(data)) {
    return data.map(normalizeStrapiItem).filter(Boolean);
  }

  const normalized = normalizeStrapiItem(data);
  return returnArray ? [normalized].filter(Boolean) : normalized;
};

/* -------------------------
   Helper: build auth headers when jwt provided
   ------------------------- */
const buildAuthHeaders = (jwt) => {
  const headers = { 'Content-Type': 'application/json' };
  if (jwt) headers['Authorization'] = `Bearer ${jwt}`;
  return headers;
};

/* -------------------------
   Company
   ------------------------- */
export const getCompanies = async (params = "") => {
  const json = await zamFetch(`companies${params ? `?${params}` : ""}`);
  return normalizeStrapiResponse(json, { returnArray: true });
};

export const getCompanyById = async (id, params = "") => {
  const json = await zamFetch(`companies/${id}${params ? `?${params}` : ""}`);
  return normalizeStrapiResponse(json, { returnArray: false });
};

/**
 * createCompany(payload, jwt = null)
 * - If jwt provided, attach Authorization header and use fetch directly.
 * - If jwt not provided, use public zamFetch.
 */
export const createCompany = async (payload, jwt = null) => {
  const body = JSON.stringify({ data: payload });
  if (jwt) {
    const res = await fetch(`${api_url.replace(/\/$/, "")}/companies`, {
      method: 'POST',
      headers: buildAuthHeaders(jwt),
      body
    });
    const json = await res.json().catch(() => null);
    if (!res.ok) {
      const message = (json && (json?.error?.message || json?.message)) || `HTTP ${res.status}`;
      const err = new Error(message); err.payload = json; throw err;
    }
    return normalizeStrapiResponse(json, { returnArray: false });
  }
  const json = await zamFetch('companies', { method: 'POST', body });
  return normalizeStrapiResponse(json, { returnArray: false });
};

export const updateCompany = async (id, payload, jwt = null) => {
  if (!id) throw new Error('updateCompany: id required');
  const body = JSON.stringify({ data: payload });
  if (jwt) {
    const res = await fetch(`${api_url.replace(/\/$/, "")}/companies/${id}`, {
      method: 'PUT',
      headers: buildAuthHeaders(jwt),
      body
    });
    const json = await res.json().catch(() => null);
    if (!res.ok) {
      const message = (json && (json?.error?.message || json?.message)) || `HTTP ${res.status}`;
      const err = new Error(message); err.payload = json; throw err;
    }
    return normalizeStrapiResponse(json, { returnArray: false });
  }
  const json = await zamFetch(`companies/${id}`, { method: 'PUT', body });
  return normalizeStrapiResponse(json, { returnArray: false });
};

export const deleteCompany = async (id, jwt = null) => {
  if (!id) throw new Error('deleteCompany: id required');
  if (jwt) {
    const res = await fetch(`${api_url.replace(/\/$/, "")}/companies/${id}`, {
      method: 'DELETE',
      headers: buildAuthHeaders(jwt)
    });
    const json = await res.json().catch(() => null);
    if (!res.ok) {
      const message = (json && (json?.error?.message || json?.message)) || `HTTP ${res.status}`;
      const err = new Error(message); err.payload = json; throw err;
    }
    return json;
  }
  const json = await zamFetch(`companies/${id}`, { method: 'DELETE' });
  return json;
};

// export const getCompanyByName = async (name, { exact = true, params = "" } = {}) => {
//   if (!name) return null;
//   const operator = exact ? "$eq" : "$containsi";
//   const q = `?filters[name][${operator}]=${name}${params ? `&${params}` : ""}`;
//   const json = await zamFetch(`companies${q}`);
//   const arr = normalizeStrapiResponse(json, { returnArray: true });
//   return arr && arr.length ? arr[0] : null;
// };

export const getNearbyCompanies = async ({ clientId = null, location = null, radiusMeters = 500, params = "" } = {}) => {
  let clientLocation = location;
  if (!clientLocation) {
    if (!clientId) clientId = getClientId();
    if (clientId) {
      const client = await getClientByClientId(clientId, params);
      clientLocation = client?.currentLocation || client?.location || null;
    }
  }

  if (!clientLocation || typeof clientLocation.lat !== "number" || typeof clientLocation.lng !== "number") {
    return [];
  }

  const lat = Number(clientLocation.lat);
  const lng = Number(clientLocation.lng);
  const radius = Number(radiusMeters) || 500;

  const earth = 6378137.0;
  const rad = radius;
  const degLat = (rad / earth) * (180 / Math.PI);
  const degLng = degLat / Math.cos((lat * Math.PI) / 180);

  const minLat = lat - degLat;
  const maxLat = lat + degLat;
  const minLng = lng - degLng;
  const maxLng = lng + degLng;

  const qParts = [
    `filters[location][lat][$gte]=${minLat}`,
    `filters[location][lat][$lte]=${maxLat}`,
    `filters[location][lng][$gte]=${minLng}`,
    `filters[location][lng][$lte]=${maxLng}`
  ];
  if (params && params.length) qParts.push(params);
  const q = `?${qParts.join("&")}`;

  const json = await zamFetch(`companies${q}`);
  const companies = normalizeStrapiResponse(json, { returnArray: true });

  const extractLocation = (company) => {
    if (!company) return null;
    if (company.location && typeof company.location === "object" && typeof company.location.lat === "number" && typeof company.location.lng === "number") {
      return { lat: Number(company.location.lat), lng: Number(company.location.lng) };
    }
    if (company.attributes?.location && typeof company.attributes.location === "object") {
      const L = company.attributes.location;
      if (typeof L.lat === "number" && typeof L.lng === "number") return { lat: Number(L.lat), lng: Number(L.lng) };
    }
    if (typeof company.location === "string") {
      try {
        const parsed = JSON.parse(company.location);
        if (parsed && typeof parsed.lat === "number" && typeof parsed.lng === "number") return { lat: Number(parsed.lat), lng: Number(parsed.lng) };
      } catch (e) {}
    }
    return null;
  };

  const haversineMeters = (lat1, lon1, lat2, lon2) => {
    const toRad = (v) => (v * Math.PI) / 180;
    const R = 6378137;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const results = companies
    .map((comp) => {
      const loc = extractLocation(comp);
      if (!loc) return { __invalidLocation: true, company: comp };
      const d = haversineMeters(lat, lng, loc.lat, loc.lng);
      return {
        ...comp,
        distanceMeters: Math.round(d),
        isNearby: d <= radius,
        proximityColor: d <= radius ? "green" : "gray",
        _rawLocation: loc
      };
    })
    .filter((c) => !c.__invalidLocation)
    .filter((c) => c.distanceMeters <= radius)
    .sort((a, b) => a.distanceMeters - b.distanceMeters);

  return results;
};

/* -------------------------
   Client
   ------------------------- */
export const getClients = async (params = "") => {
  const json = await zamFetch(`clients${params ? `?${params}` : ""}`);
  return normalizeStrapiResponse(json, { returnArray: true });
};
export const getClientById = async (id, params = "") => {
  const json = await zamFetch(`clients/${id}${params ? `?${params}` : ""}`);
  return normalizeStrapiResponse(json, { returnArray: false });
};
export const getClientByClientId = async (clientId, params = "") => {
  if (!clientId) return null;
  const q = `?filters[clientId][$eq]=${clientId}${params ? `&${params}` : ""}`;
  const json = await zamFetch(`clients${q}`);
  const arr = normalizeStrapiResponse(json, { returnArray: true });
  return arr && arr.length ? arr[0] : null;
};
export const createClient = async (payload) => {
  const json = await zamFetch("clients", {
    method: "POST",
    body: JSON.stringify({ data: payload }),
  });
  return normalizeStrapiResponse(json, { returnArray: false });
};
export const updateClient = async (id, payload) => {
  const json = await zamFetch(`clients/${id}`, {
    method: "PUT",
    body: JSON.stringify({ data: payload }),
  });
  return normalizeStrapiResponse(json, { returnArray: false });
};

/* -------------------------
   User (admin / companies / agents link)
   ------------------------- */
export const getUsers = async (params = "") => {
  const json = await zamFetch(`users${params ? `?${params}` : ""}`);
  return normalizeStrapiResponse(json, { returnArray: true });
};
export const getUserById = async (id, params = "") => {
  const json = await zamFetch(`users/${id}${params ? `?${params}` : ""}`);
  return normalizeStrapiResponse(json, { returnArray: false });
};
export const createUser = async (payload) => {
  // plugin::users-permissions registration usually expects a raw body (no { data: ... })
  const json = await zamFetch("users", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return json;
};

/**
 * updateUser (for plugin::users-permissions user updates)
 * - Use customJwt for authenticated admin actions. If customJwt is null and the endpoint requires auth, call will fail.
 * - Sends raw JSON body (no { data: ... } wrapper).
 */
export const updateUser = async (updateObject, userId, customJwt = null) => {
  if (!userId) throw new Error('updateUser: userId required');
  const jwt = customJwt || getJwt() || null;
  const res = await fetch(`${api_url.replace(/\/$/, "")}/users/${userId}`, {
    method: 'PUT',
    headers: buildAuthHeaders(jwt),
    body: JSON.stringify(updateObject)
  });
  const json = await res.json().catch(() => null);
  if (!res.ok) {
    const message = (json && (json?.error?.message || json?.message)) || `HTTP ${res.status}`;
    const err = new Error(message); err.payload = json; throw err;
  }
  return json;
};

/* -------------------------
   Agent (create/update may require auth)
   ------------------------- */
export const getAgents = async (params = "") => {
  const json = await zamFetch(`agents${params ? `?${params}` : ""}`);
  return normalizeStrapiResponse(json, { returnArray: true });
};
export const getAgentById = async (id, params = "") => {
  const json = await zamFetch(`agents/${id}${params ? `?${params}` : ""}`);
  return normalizeStrapiResponse(json, { returnArray: false });
};
export const createAgent = async (payload, jwt = null) => {
  const body = JSON.stringify({ data: payload });
  if (jwt) {
    const res = await fetch(`${api_url.replace(/\/$/, "")}/agents`, {
      method: 'POST',
      headers: buildAuthHeaders(jwt),
      body
    });
    const json = await res.json().catch(() => null);
    if (!res.ok) {
      const message = (json && (json?.error?.message || json?.message)) || `HTTP ${res.status}`;
      const err = new Error(message); err.payload = json; throw err;
    }
    return normalizeStrapiResponse(json, { returnArray: false });
  }
  const json = await zamFetch('agents', { method: 'POST', body });
  return normalizeStrapiResponse(json, { returnArray: false });
};
export const updateAgent = async (id, payload, jwt = null) => {
  if (!id) throw new Error('updateAgent: id required');
  const body = JSON.stringify({ data: payload });
  if (jwt) {
    const res = await fetch(`${api_url.replace(/\/$/, "")}/agents/${id}`, {
      method: 'PUT',
      headers: buildAuthHeaders(jwt),
      body
    });
    const json = await res.json().catch(() => null);
    if (!res.ok) {
      const message = (json && (json?.error?.message || json?.message)) || `HTTP ${res.status}`;
      const err = new Error(message); err.payload = json; throw err;
    }
    return normalizeStrapiResponse(json, { returnArray: false });
  }
  const json = await zamFetch(`agents/${id}`, { method: 'PUT', body });
  return normalizeStrapiResponse(json, { returnArray: false });
};

/* -------------------------
   Print (file uploads)
   ------------------------- */
/**
 * createPrint supports either:
 *  - JSON payload (fields only) -> application/json { data: {...} }
 *  - multipart form (file upload) -> FormData: append('files', file) + append('data', JSON.stringify({...}))
 *
 * Note: file upload does NOT set any custom headers here. Browser supplies Content-Type boundary.
 */
export const getPrints = async (params = "") => {
  const json = await zamFetch(`prints${params ? `?${params}` : ""}`);
  return normalizeStrapiResponse(json, { returnArray: true });
};
export const getPrintById = async (id, params = "") => {
  const json = await zamFetch(`prints/${id}${params ? `?${params}` : ""}`);
  return normalizeStrapiResponse(json, { returnArray: false });
}
export const createPrint = async ({ dataFields = null, file = null }) => {
  if (file) {
    const fd = new FormData();
    fd.append("files", file);
    fd.append("data", JSON.stringify(dataFields || {}));
    const res = await fetch(`${api_url.replace(/\/$/, "")}/prints`, {
      method: "POST",
      body: fd
    });
    if (!res.ok) {
      const json = await res.json().catch(() => null);
      throw new Error(json?.error?.message || `Upload failed ${res.status}`);
    }
    const json = await res.json();
    return normalizeStrapiResponse(json, { returnArray: false });
  } else {
    const json = await zamFetch("prints", {
      method: "POST",
      body: JSON.stringify({ data: dataFields || {} }),
    });
    return normalizeStrapiResponse(json, { returnArray: false });
  }
}
export const updatePrint = async (id, payload) => {
  const json = await zamFetch(`prints/${id}`, {
    method: "PUT",
    body: JSON.stringify({ data: payload }),
  });
  return normalizeStrapiResponse(json, { returnArray: false });
};

/* -------------------------
   Queue
   ------------------------- */
export const getQueues = async (params = "") => {
  const json = await zamFetch(`queues${params ? `?${params}` : ""}`);
  return normalizeStrapiResponse(json, { returnArray: true });
};
export const getQueueById = async (id) => {
  const json = await zamFetch(`queues/${id}`);
  return normalizeStrapiResponse(json, { returnArray: false });
};
export const createQueue = async (payload) => {
  const json = await zamFetch("queues", {
    method: "POST",
    body: JSON.stringify({ data: payload }),
  });
  return normalizeStrapiResponse(json, { returnArray: false });
};
export const updateQueue = async (id, payload) => {
  const json = await zamFetch(`queues/${id}`, {
    method: "PUT",
    body: JSON.stringify({ data: payload }),
  });
  return normalizeStrapiResponse(json, { returnArray: false });
}

// Get a queue for a company by company id, including clients
// export const getQueueForCompany = async (companyId, { params = "" } = {}) => {
//   if (!companyId) return null

//   // Step 1: Fetch queue for this company
//   const q = `?filters[company][id][$eq]=${companyId}${params ? `&${params}` : ""}`
//   const json = await zamFetch(`queues${q}`)
//   const arr = normalizeStrapiResponse(json, { returnArray: true })
//   if (!arr?.length) return null

//   const queue = arr[0]

//   try {
//     // Step 2: Fetch clients with only their IDs
//     const clientQuery = `clients?filters[queue][id][$eq]=${queue.id}&fields[0]=id`
//     const clientJson = await zamFetch(clientQuery)

//     // Step 3: Read total count from meta
//     const clientCount = clientJson?.meta?.pagination?.total || 0
//     // Step 4: Return the queue with client count
//     return { ...queue, clients:clientJson?.data || [], clientCount }
//   } catch (err) {
//     console.error("Error fetching clients for queue:", err)
//     return { ...queue, clientCount: 0 }
//   }
// }


// Get a company by id (alias for getCompanyById)
export const getCompany = async (id, params = "") => {
  return getCompanyById(id, params);
}

/* -------------------------
   Float Top Up (company-auth required to credit float)
   ------------------------- */
export const getFloatTopUps = async (params = "") => {
  const json = await zamFetch(`float-top-ups${params ? `?${params}` : ""}`);
  return normalizeStrapiResponse(json, { returnArray: true });
}

export const createFloatTopUp = async (payload, jwt = null) => {
  const body = JSON.stringify({ data: payload });
  if (jwt) {
    const res = await fetch(`${api_url.replace(/\/$/, "")}/float-top-ups`, {
      method: 'POST',
      headers: buildAuthHeaders(jwt),
      body
    });
    const json = await res.json().catch(() => null);
    if (!res.ok) {
      const message = (json && (json?.error?.message || json?.message)) || `HTTP ${res.status}`;
      const err = new Error(message); err.payload = json; throw err;
    }
    return normalizeStrapiResponse(json, { returnArray: false });
  }
  const json = await zamFetch('float-top-ups', { method: 'POST', body });
  return normalizeStrapiResponse(json, { returnArray: false });
};
export const updateFloatTopUp = async (id, payload, jwt = null) => {
  if (!id) throw new Error('updateFloatTopUp: id required');
  const body = JSON.stringify({ data: payload });
  if (jwt) {
    const res = await fetch(`${api_url.replace(/\/$/, "")}/float-top-ups/${id}`, {
      method: 'PUT',
      headers: buildAuthHeaders(jwt),
      body
    });
    const json = await res.json().catch(() => null);
    if (!res.ok) {
      const message = (json && (json?.error?.message || json?.message)) || `HTTP ${res.status}`;
      const err = new Error(message); err.payload = json; throw err;
    }
    return normalizeStrapiResponse(json, { returnArray: false });
  }
  const json = await zamFetch(`float-top-ups/${id}`, { method: 'PUT', body });
  return normalizeStrapiResponse(json, { returnArray: false });
};

/* -------------------------
   Commissions
   ------------------------- */
export const getCommissions = async (params = "") => {
  const json = await zamFetch(`commissions${params ? `?${params}` : ""}`);
  return normalizeStrapiResponse(json, { returnArray: true });
};
export const createCommission = async (payload, jwt = null) => {
  const body = JSON.stringify({ data: payload });
  if (jwt) {
    const res = await fetch(`${api_url.replace(/\/$/, "")}/commissions`, {
      method: 'POST',
      headers: buildAuthHeaders(jwt),
      body
    });
    const json = await res.json().catch(() => null);
    if (!res.ok) {
      const message = (json && (json?.error?.message || json?.message)) || `HTTP ${res.status}`;
      const err = new Error(message); err.payload = json; throw err;
    }
    return normalizeStrapiResponse(json, { returnArray: false });
  }
  const json = await zamFetch('commissions', { method: 'POST', body });
  return normalizeStrapiResponse(json, { returnArray: false });
};

/* -------------------------
   Ads
   ------------------------- */
export const getAds = async (params = "") => {
  const json = await zamFetch(`ads${params ? `?${params}` : ""}`);
  return normalizeStrapiResponse(json, { returnArray: true });
};
export const createAd = async (payload, jwt = null) => {
  const body = JSON.stringify({ data: payload });
  if (jwt) {
    const res = await fetch(`${api_url.replace(/\/$/, "")}/ads`, {
      method: 'POST',
      headers: buildAuthHeaders(jwt),
      body
    });
    const json = await res.json().catch(() => null);
    if (!res.ok) {
      const message = (json && (json?.error?.message || json?.message)) || `HTTP ${res.status}`;
      const err = new Error(message); err.payload = json; throw err;
    }
    return normalizeStrapiResponse(json, { returnArray: false });
  }
  const json = await zamFetch('ads', { method: 'POST', body });
  return normalizeStrapiResponse(json, { returnArray: false });
};
export const updateAd = async (id, payload, jwt = null) => {
  if (!id) throw new Error('updateAd: id required');
  const body = JSON.stringify({ data: payload });
  if (jwt) {
    const res = await fetch(`${api_url.replace(/\/$/, "")}/ads/${id}`, {
      method: 'PUT',
      headers: buildAuthHeaders(jwt),
      body
    });
    const json = await res.json().catch(() => null);
    if (!res.ok) {
      const message = (json && (json?.error?.message || json?.message)) || `HTTP ${res.status}`;
      const err = new Error(message); err.payload = json; throw err;
    }
    return normalizeStrapiResponse(json, { returnArray: false });
  }
  const json = await zamFetch(`ads/${id}`, { method: 'PUT', body });
  return normalizeStrapiResponse(json, { returnArray: false });
};

/* -------------------------
   Email OTP (email-otp)
   ------------------------- */
export const requestEmailOtp = async (email) => {
  const json = await zamFetch("email-otps", {
    method: "POST",
    body: JSON.stringify({ data: { email } }),
  });
  return normalizeStrapiResponse(json, { returnArray: false });
};
export const verifyEmailOtp = async (idOrQuery, otp) => {
  const json = await zamFetch(`company/verify-otp`, {
    method: "POST",
    body: JSON.stringify({ email: idOrQuery, otp }),
  });
  return json;
};

/* -------------------------
   OrderId (single type)
   ------------------------- */
export const getOrderIdSingle = async () => {
  const json = await zamFetch("order-id");
  if (json?.data) return normalizeStrapiResponse(json, { returnArray: false });
  if (json?.nextOrderNumber || typeof json?.nextOrderNumber !== "undefined") {
    return json;
  }
  return json;
};
export const incrementOrderNumber = async () => {
  const order = await getOrderIdSingle();
  const current = order?.nextOrderNumber || order?.data?.attributes?.nextOrderNumber || 1;
  const updated = await zamFetch("order-id", {
    method: "PUT",
    body: JSON.stringify({ data: { nextOrderNumber: current + 1 } }),
  });
  return updated;
};

/* -------------------------
   Dashboard Summary (single type)
   ------------------------- */
export const getDashboardSummary = async () => {
  const json = await zamFetch("dashboard-summary");
  if (json?.data) return normalizeStrapiResponse(json, { returnArray: false });
  return json;
};
export const updateDashboardSummary = async (payload, jwt = null) => {
  const body = JSON.stringify({ data: payload });
  if (jwt) {
    const res = await fetch(`${api_url.replace(/\/$/, "")}/dashboard-summary`, {
      method: 'PUT',
      headers: buildAuthHeaders(jwt),
      body
    });
    const json = await res.json().catch(() => null);
    if (!res.ok) {
      const message = (json && (json?.error?.message || json?.message)) || `HTTP ${res.status}`;
      const err = new Error(message); err.payload = json; throw err;
    }
    return json;
  }
  const json = await zamFetch("dashboard-summary", { method: "PUT", body });
  return json;
};

/* -------------------------
   History
   ------------------------- */
export const getHistories = async (params = "") => {
  const json = await zamFetch(`histories${params ? `?${params}` : ""}`);
  return normalizeStrapiResponse(json, { returnArray: true });
};
export const getHistoryById = async (id, params = "") => {
  const json = await zamFetch(`histories/${id}${params ? `?${params}` : ""}`);
  return normalizeStrapiResponse(json, { returnArray: false });
};
export const createHistory = async (payload) => {
  const json = await zamFetch("histories", {
    method: "POST",
    body: JSON.stringify({ data: payload }),
  });
  return normalizeStrapiResponse(json, { returnArray: false });
};
export const updateHistory = async (id, payload) => {
  const json = await zamFetch(`histories/${id}`, {
    method: "PUT",
    body: JSON.stringify({ data: payload }),
  });
  return normalizeStrapiResponse(json, { returnArray: false });
};


/* -------------------------
   Queue - UPDATED for print-based queue
   ------------------------- */

// Add this function to get queue with prints
// export const getQueueForCompany = async (companyId, options = {}) => {
//   try {
//     const queryParams = new URLSearchParams();
//     queryParams.append('filters[company][id][$eq]', companyId);
//     queryParams.append('populate[0]', 'prints');
//     queryParams.append('populate[1]', 'prints.client');
//     queryParams.append('populate[2]', 'prints.pdf_file');
    
//     if (options.params) {
//       options.params.split('&').forEach(param => {
//         const [key, value] = param.split('=');
//         queryParams.append(key, value);
//       });
//     }

//     const response = await fetch(`${api_url}/queues?${queryParams}`);
//     if (!response.ok) throw new Error('Failed to fetch queue');
    
//     const data = await response.json();
//     return data.data && data.data.length > 0 ? data.data[0] : null;
//   } catch (error) {
//     console.error('Error fetching queue:', error);
//     return null;
//   }
// };
export const getQueueForCompany = async (companyId, options = {}) => {
  if (!companyId) return null;

  try {
    // Build query parameters
    let query = `filters[company][id][$eq]=${companyId}`;
    
    if (options.params) {
      query += `&${options.params}`;
    } else {
      // Default population
      query += '&populate[0]=prints&populate[1]=prints.client&populate[2]=prints.pdf_file';
    }

    const response = await fetch(`${api_url}/queues?${query}`);
    if (!response.ok) throw new Error('Failed to fetch queue');
    
    const data = await response.json();
    const queue = data.data?.[0] || data[0];
    
    if (!queue) return null;

    // Process prints data
    const printsData = queue.attributes?.prints?.data || [];
    const prints = printsData.map(print => {
      const processedPrint = {
        id: print.id,
        ...print.attributes
      };
      
      // Process client data
      if (print.attributes.client?.data) {
        processedPrint.client = {
          id: print.attributes.client.data.id,
          ...print.attributes.client.data.attributes
        };
      }
      
      // Process PDF file data
      if (print.attributes.pdf_file?.data) {
        processedPrint.pdf_file = {
          id: print.attributes.pdf_file.data.id,
          ...print.attributes.pdf_file.data.attributes
        };
      }
      
      return processedPrint;
    });

    const printCount = prints.length;

    return {
      ...queue,
      prints,
      printCount,
      clientCount: printCount
    };
    
  } catch (error) {
    console.error('Error fetching queue:', error);
    return null;
  }
};

// Update getCompanyByName to include queue with prints
export const getCompanyByName = async (name, options = {}) => {
  try {
    const queryParams = new URLSearchParams();
    queryParams.append('filters[name][$eq]', name);
    queryParams.append('populate[0]', 'queue');
    queryParams.append('populate[1]', 'queue.prints');
    queryParams.append('populate[2]', 'queue.prints.client');
    queryParams.append('populate[3]', 'queue.prints.pdf_file');
    
    if (options.params) {
      options.params.split('&').forEach(param => {
        const [key, value] = param.split('=');
        queryParams.append(key, value);
      });
    }

    const response = await fetch(`${api_url}/companies?${queryParams}`);
    if (!response.ok) throw new Error('Failed to fetch company');
    
    const data = await response.json();
    return data.data && data.data.length > 0 ? data.data[0] : null;
  } catch (error) {
    console.error('Error fetching company:', error);
    throw error;
  }
};

// Add function to get client's queued prints
export const getClientQueuedPrints = async (clientId, companyId) => {
  try {
    const queryParams = new URLSearchParams();
    queryParams.append('filters[client][id][$eq]', clientId);
    queryParams.append('filters[company][id][$eq]', companyId);
    queryParams.append('filters[state][$eq]', 'queued');
    queryParams.append('populate[0]', 'pdf_file');
    queryParams.append('populate[1]', 'queue');
    queryParams.append('sort[0]', 'createdAt:asc');

    const response = await fetch(`${api_url}/prints?${queryParams}`);
    if (!response.ok) throw new Error('Failed to fetch client prints');
    
    const data = await response.json();
    return data.data || [];
  } catch (error) {
    console.error('Error fetching client prints:', error);
    return [];
  }
};
/**
 * Get all prints in a queue (for queue management)
 * @param {number} queueId - The queue ID
 * @returns {Promise<Array>} Array of print objects in queue
 */
export const getPrintsInQueue = async (queueId) => {
  try {
    const json = await zamFetch(
      `prints?` +
      `filters[queue][id][$eq]=${queueId}&` +
      `filters[state][$eq]=queued&` +
      `populate=client,company&` +
      `sort=createdAt:asc`
    );
    
    return normalizeStrapiResponse(json, { returnArray: true });
  } catch (error) {
    console.error('Error fetching prints in queue:', error);
    throw error;
  }
};

/**
 * Get a client's position in queue based on their prints
 * @param {string} clientId - The client's clientId (not database ID)
 * @param {number} companyId - The company ID
 * @returns {Promise<object>} Object with position info
 */
export const getClientQueuePosition = async (clientId, companyId) => {
  try {
    // Get the queue
    const queue = await getQueueForCompany(companyId, { 
      params: 'populate=prints,prints.client' 
    });
    
    if (!queue || !queue.prints || queue.prints.length === 0) {
      return {
        positions: [],
        total: 0,
        hasJobs: false
      };
    }
    
    // Find all prints for this client
    const clientPrints = queue.prints.filter(print => {
      const printClientId = print.client?.clientId || print.client?.id;
      return printClientId === clientId;
    });
    
    if (clientPrints.length === 0) {
      return {
        positions: [],
        total: queue.prints.length,
        hasJobs: false
      };
    }
    
    // Calculate positions for each print
    const positions = clientPrints.map(print => {
      const position = queue.prints.findIndex(p => p.id === print.id) + 1;
      return {
        printId: print.id,
        position: position,
        orderId: print.order_id
      };
    });
    
    return {
      positions: positions,
      total: queue.prints.length,
      hasJobs: true
    };
  } catch (error) {
    console.error('Error getting client queue position:', error);
    throw error;
  }
};






