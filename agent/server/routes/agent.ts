import type { RequestHandler } from "express";
import crypto from "node:crypto";

type Agent = {
  email: string;
  firstName?: string;
  lastName?: string;
  agentCode: string;
  createdAt: string;
};
type Company = { id: string; name: string; createdAt: string };
type Job = {
  id: string;
  companyId: string;
  jobDate: string;
  pages: number;
  amount: number;
  status: "completed" | "cancelled" | "refunded" | "pending";
};
type Withdrawal = {
  id: string;
  amount: number;
  status: "pending" | "approved" | "rejected" | "paid";
  createdAt: string;
};

type OTP = { code: string; expiresAt: number };

const COMMISSION_RATE = 0.1;

const agentsByEmail = new Map<string, Agent>();
const agentCodes = new Set<string>();
const otps = new Map<string, OTP>();
const sessions = new Map<string, string>(); // token -> email
const companiesByAgent = new Map<string, Company[]>(); // email -> companies
const jobsByAgent = new Map<string, Job[]>(); // email -> jobs
const withdrawalsByAgent = new Map<string, Withdrawal[]>(); // email -> withdrawals

function genCode(len = 6) {
  let s = "";
  for (let i = 0; i < len; i++) s += Math.floor(Math.random() * 10);
  return s;
}

function sanitizeNamePart(s: string) {
  return s
    .normalize("NFKD")
    .replace(/[^\p{L}\p{N}]+/gu, "")
    .toUpperCase();
}

function genAgentCodeFromNames(firstName: string, lastName: string) {
  const baseRaw = `${sanitizeNamePart(firstName)}${sanitizeNamePart(lastName)}`;
  const base = baseRaw.slice(0, 50);
  for (;;) {
    const four = String(Math.floor(1000 + Math.random() * 9000));
    const code = `${base}${four}`;
    if (!agentCodes.has(code) && code.length > 0) return code;
  }
}

function ensureAgent(
  email: string,
  firstName?: string,
  lastName?: string,
): Agent {
  let existing = agentsByEmail.get(email);
  if (existing) {
    // Update missing names if provided
    if (firstName && !existing.firstName) existing.firstName = firstName;
    if (lastName && !existing.lastName) existing.lastName = lastName;
    return existing;
  }
  const fn = firstName?.trim() || "AGENT";
  const ln = lastName?.trim() || "USER";
  const agentCode = genAgentCodeFromNames(fn, ln);
  const agent: Agent = {
    email,
    firstName: fn,
    lastName: ln,
    agentCode,
    createdAt: new Date().toISOString(),
  };
  agentsByEmail.set(email, agent);
  agentCodes.add(agentCode);
  // seed sample referred companies and jobs
  const companies: Company[] = Array.from({ length: 3 }).map((_, i) => ({
    id: crypto.randomUUID(),
    name: `Company ${String.fromCharCode(65 + i)}`,
    createdAt: new Date(Date.now() - (i + 1) * 86400000).toISOString(),
  }));
  companiesByAgent.set(email, companies);
  const jobs: Job[] = [];
  for (const c of companies) {
    const n = Math.floor(Math.random() * 4);
    for (let j = 0; j < n; j++) {
      const pages = 5 + Math.floor(Math.random() * 100);
      const amount = pages * 1.5;
      jobs.push({
        id: crypto.randomUUID(),
        companyId: c.id,
        jobDate: new Date(
          Date.now() - Math.floor(Math.random() * 20) * 86400000,
        ).toISOString(),
        pages,
        amount,
        status: "completed",
      });
    }
  }
  jobsByAgent.set(email, jobs);
  withdrawalsByAgent.set(email, []);
  return agent;
}

function requireAuth(req: any, res: any, next: any) {
  const auth = req.headers["authorization"] as string | undefined;
  const token = auth?.startsWith("Bearer ") ? auth.slice(7) : undefined;
  if (!token) return res.status(401).json({ error: "missing token" });
  const email = sessions.get(token);
  if (!email) return res.status(401).json({ error: "invalid token" });
  req.agentEmail = email;
  next();
}

export const requestOtp: RequestHandler = (req, res) => {
  const { email, firstName, lastName } = req.body as {
    email?: string;
    firstName?: string;
    lastName?: string;
  };
  if (!email) return res.status(400).json({ error: "email required" });
  ensureAgent(email.toLowerCase(), firstName, lastName);
  const code = genCode(6);
  otps.set(email.toLowerCase(), { code, expiresAt: Date.now() + 5 * 60_000 });
  res.json({ ok: true, code }); // Returned for demo since no email integration
};

export const verifyOtp: RequestHandler = (req, res) => {
  const { email, code } = req.body as { email?: string; code?: string };
  if (!email || !code)
    return res.status(400).json({ error: "email and code required" });
  const otp = otps.get(email.toLowerCase());
  if (!otp) return res.status(400).json({ error: "no code requested" });
  if (Date.now() > otp.expiresAt)
    return res.status(400).json({ error: "code expired" });
  if (otp.code !== code) return res.status(400).json({ error: "invalid code" });
  otps.delete(email.toLowerCase());
  const token = crypto.randomBytes(24).toString("hex");
  sessions.set(token, email.toLowerCase());
  res.json({ token });
};

export const logout: RequestHandler = (req, res) => {
  const auth = req.headers["authorization"] as string | undefined;
  const token = auth?.startsWith("Bearer ") ? auth.slice(7) : undefined;
  if (token) sessions.delete(token);
  res.json({ ok: true });
};

export const profile: RequestHandler = (req: any, res) => {
  const email = req.agentEmail as string;
  const agent = agentsByEmail.get(email)!;
  res.json({
    email: agent.email,
    firstName: agent.firstName,
    lastName: agent.lastName,
    agentCode: agent.agentCode,
    createdAt: agent.createdAt,
  });
};

function computeCommission(amount: number) {
  return Math.round(amount * COMMISSION_RATE * 100) / 100;
}

export const commissions: RequestHandler = (req: any, res) => {
  const email = req.agentEmail as string;
  const jobs = jobsByAgent.get(email) ?? [];
  const companies = new Map(
    (companiesByAgent.get(email) ?? []).map((c) => [c.id, c]),
  );
  const items = jobs.map((j) => ({
    jobId: j.id,
    companyName: companies.get(j.companyId)?.name ?? "Unknown",
    jobDate: j.jobDate,
    pages: j.pages,
    amount: j.amount,
    commission: computeCommission(j.amount),
    status: j.status,
  }));
  res.json(items);
};

export const referrals: RequestHandler = (req: any, res) => {
  const email = req.agentEmail as string;
  const companies = companiesByAgent.get(email) ?? [];
  const jobs = jobsByAgent.get(email) ?? [];
  const items = companies.map((c) => {
    const cj = jobs.filter(
      (j) => j.companyId === c.id && j.status === "completed",
    );
    const jobsCount = cj.length;
    const pages = cj.reduce((s, j) => s + j.pages, 0);
    const totalSpend = cj.reduce((s, j) => s + j.amount, 0);
    const lastJobAt = cj.reduce<string | null>(
      (last, j) => (!last || j.jobDate > last ? j.jobDate : last),
      null,
    );
    return {
      companyId: c.id,
      companyName: c.name,
      jobsCount,
      pages,
      totalSpend,
      lastJobAt,
    };
  });
  res.json(items);
};

export const listWithdrawals: RequestHandler = (req: any, res) => {
  const email = req.agentEmail as string;
  res.json(withdrawalsByAgent.get(email) ?? []);
};

export const createWithdrawal: RequestHandler = (req: any, res) => {
  const email = req.agentEmail as string;
  const amount = Number((req.body as any).amount);
  if (!amount || amount <= 0)
    return res.status(400).json({ error: "invalid amount" });
  const bal = balanceFor(email);
  if (amount > bal)
    return res.status(400).json({ error: "amount exceeds balance" });
  const w: Withdrawal = {
    id: crypto.randomUUID(),
    amount: Math.round(amount * 100) / 100,
    status: "pending",
    createdAt: new Date().toISOString(),
  };
  const list = withdrawalsByAgent.get(email) ?? [];
  list.unshift(w);
  withdrawalsByAgent.set(email, list);
  res.json(w);
};

function balanceFor(email: string) {
  const jobs = jobsByAgent.get(email) ?? [];
  const earned = jobs
    .filter((j) => j.status === "completed")
    .reduce((s, j) => s + computeCommission(j.amount), 0);
  const withdrawn = (withdrawalsByAgent.get(email) ?? [])
    .filter((w) => ["pending", "approved", "paid"].includes(w.status))
    .reduce((s, w) => s + w.amount, 0);
  return Math.round((earned - withdrawn) * 100) / 100;
}

export const metrics: RequestHandler = (req: any, res) => {
  const email = req.agentEmail as string;
  const companies = companiesByAgent.get(email) ?? [];
  const jobs = jobsByAgent.get(email) ?? [];
  const totalJobs = jobs.filter((j) => j.status === "completed").length;
  const totalPages = jobs.reduce(
    (s, j) => s + (j.status === "completed" ? j.pages : 0),
    0,
  );
  const totalCommission = jobs
    .filter((j) => j.status === "completed")
    .reduce((s, j) => s + computeCommission(j.amount), 0);
  const activeCompanies = companies.filter((c) =>
    jobs.some((j) => j.companyId === c.id && j.status === "completed"),
  ).length;
  const data = {
    referredCompanies: companies.length,
    activeCompanies,
    totalJobs,
    totalPages,
    totalCommission: Math.round(totalCommission * 100) / 100,
    balance: balanceFor(email),
  };
  res.json(data);
};

export const attachAgentRoutes = (app: any) => {
  app.post("/api/agent/request-otp", requestOtp);
  app.post("/api/agent/verify-otp", verifyOtp);
  app.post("/api/agent/logout", logout);

  app.get("/api/agent/profile", requireAuth, profile);
  app.get("/api/agent/metrics", requireAuth, metrics);
  app.get("/api/agent/commissions", requireAuth, commissions);
  app.get("/api/agent/referrals", requireAuth, referrals);
  app.get("/api/agent/withdrawals", requireAuth, listWithdrawals);
  app.post("/api/agent/withdrawals", requireAuth, createWithdrawal);
};
