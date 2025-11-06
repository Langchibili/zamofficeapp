const BASE = ""; // same-origin base

function getToken() {
  return localStorage.getItem("agent_token");
}
function setToken(token: string) {
  localStorage.setItem("agent_token", token);
}
function clearToken() {
  localStorage.removeItem("agent_token");
}

async function req(path: string, init: RequestInit = {}) {
  const headers: any = {
    "Content-Type": "application/json",
    ...(init.headers || {}),
  };
  const token = getToken();
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const res = await fetch(`${BASE}${path}`, { ...init, headers });
  if (!res.ok) {
    if (res.status === 401) {
      clearToken();
      throw new Error("Unauthenticated. Please log in again.");
    }
    const text = await res.text().catch(() => "");
    try {
      const json = JSON.parse(text);
      throw new Error(json.error || res.statusText);
    } catch (_) {
      throw new Error(text || res.statusText);
    }
  }
  try {
    return await res.json();
  } catch {
    return null as any;
  }
}

export const agentApi = {
  requestOtp: (email: string, firstName?: string, lastName?: string) =>
    req("/api/agent/request-otp", {
      method: "POST",
      body: JSON.stringify({ email, firstName, lastName }),
    }),
  verifyOtp: async (email: string, code: string) => {
    const data = await req("/api/agent/verify-otp", {
      method: "POST",
      body: JSON.stringify({ email, code }),
    });
    setToken(data.token);
    return data;
  },
  logout: async () => {
    await req("/api/agent/logout", { method: "POST" });
    clearToken();
  },
  profile: () => req("/api/agent/profile"),
  metrics: () => req("/api/agent/metrics"),
  commissions: () => req("/api/agent/commissions"),
  withdrawals: () => req("/api/agent/withdrawals"),
  createWithdrawal: (amount: number) =>
    req("/api/agent/withdrawals", {
      method: "POST",
      body: JSON.stringify({ amount }),
    }),
  referrals: () => req("/api/agent/referrals"),
  getToken,
  setToken,
  clearToken,
};
