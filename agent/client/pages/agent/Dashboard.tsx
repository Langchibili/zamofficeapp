import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ProtectedRoute, useAgentAuth } from "@/hooks/useAgentAuth";
import { agentApi } from "@/lib/agentApi";
import { useToast } from "@/components/ui/use-toast";
import { motion } from "framer-motion";

export default function AgentDashboard() {
  return (
    <ProtectedRoute>
      <DashboardInner />
    </ProtectedRoute>
  );
}

function DashboardInner() {
  const { profile, signOut } = useAgentAuth();
  const { toast } = useToast();
  const [agentCode, setAgentCode] = React.useState<string>("");
  const [balance, setBalance] = React.useState<number>(0);
  const [metrics, setMetrics] = React.useState({
    referredCompanies: 0,
    activeCompanies: 0,
    totalJobs: 0,
    totalPages: 0,
    totalCommission: 0,
  });
  const [commissions, setCommissions] = React.useState<any[]>([]);
  const [withdrawals, setWithdrawals] = React.useState<any[]>([]);
  const [referrals, setReferrals] = React.useState<any[]>([]);

  React.useEffect(() => {
    const load = async () => {
      try {
        const [p, m, c, w, r] = await Promise.all([
          agentApi.profile(),
          agentApi.metrics(),
          agentApi.commissions(),
          agentApi.withdrawals(),
          agentApi.referrals(),
        ]);
        setAgentCode(p.agentCode);
        setBalance(m.balance);
        setMetrics({
          referredCompanies: m.referredCompanies,
          activeCompanies: m.activeCompanies,
          totalJobs: m.totalJobs,
          totalPages: m.totalPages,
          totalCommission: m.totalCommission,
        });
        setCommissions(c);
        setWithdrawals(w);
        setReferrals(r);
      } catch (e: any) {
        if (e?.message?.toLowerCase().includes("unauthenticated")) {
          window.location.href = "/agent/login";
          return;
        }
        console.error(e);
      }
    };
    load();
  }, []);

  const requestWithdrawal = async () => {
    const amount = prompt(
      "Enter amount to withdraw (available: " + balance + ")",
    );
    if (!amount) return;
    const num = Number(amount);
    if (isNaN(num) || num <= 0 || num > balance) {
      alert("Invalid amount");
      return;
    }
    try {
      await agentApi.createWithdrawal(num);
      toast({ title: "Withdrawal requested" });
      const m = await agentApi.metrics();
      const w = await agentApi.withdrawals();
      setBalance(m.balance);
      setWithdrawals(w);
    } catch (e: any) {
      toast({
        title: "Withdrawal failed",
        description: e.message,
        variant: "destructive",
      });
    }
  };

  return (
    <motion.div
      className="min-h-screen p-4 sm:p-6"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
    >
      <div className="mx-auto max-w-6xl space-y-4 sm:space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h1 className="text-xl sm:text-2xl font-semibold">Agent Dashboard</h1>
          <div className="flex flex-wrap items-center gap-2">
            <div className="text-xs sm:text-sm text-muted-foreground order-2 sm:order-1 w-full sm:w-auto truncate">
              {profile?.firstName && profile?.lastName
                ? `${profile.firstName} ${profile.lastName}`
                : profile?.email}
            </div>
            <div className="flex gap-2 order-1 sm:order-2 w-full sm:w-auto">
              <Button
                className="flex-1 sm:flex-none"
                variant="secondary"
                onClick={() => (window.location.href = "/agent/support")}
              >
                Support
              </Button>
              <Button
                className="flex-1 sm:flex-none"
                variant="outline"
                onClick={() => (window.location.href = "/agent/login")}
              >
                Switch
              </Button>
              <Button
                className="flex-1 sm:flex-none"
                variant="destructive"
                onClick={signOut}
              >
                Log out
              </Button>
            </div>
          </div>
        </div>

        {agentCode && (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.2 }}
          >
            <Card>
              <CardHeader>
                <CardTitle>Your Agent Code</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="text-lg sm:text-xl font-mono break-all">
                  {agentCode}
                </div>
                <div className="flex flex-col sm:flex-row w-full sm:w-auto gap-2">
                  <Button
                    className="w-full sm:w-auto"
                    onClick={() => navigator.clipboard.writeText(agentCode)}
                    variant="secondary"
                  >
                    Copy Code
                  </Button>
                  <Button
                    className="w-full sm:w-auto"
                    onClick={() =>
                      navigator.clipboard.writeText(
                        `${window.location.origin}/company/signup?ref=${agentCode}`,
                      )
                    }
                  >
                    Copy Referral Link
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        <Tabs defaultValue="overview">
          <div className="-mx-1 overflow-x-auto">
            <TabsList className="mx-1 min-w-max gap-1">
              <TabsTrigger className="shrink-0" value="overview">
                Overview
              </TabsTrigger>
              <TabsTrigger className="shrink-0" value="commissions">
                Commissions
              </TabsTrigger>
              <TabsTrigger className="shrink-0" value="withdrawals">
                Withdrawals
              </TabsTrigger>
              <TabsTrigger className="shrink-0" value="referrals">
                Referrals
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="overview">
            <motion.div
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.2 }}
            >
              <Stat
                title="Available Balance"
                value={`ZMW ${balance.toFixed(2)}`}
              />
              <Stat
                title="Total Commission"
                value={`ZMW ${metrics.totalCommission.toFixed(2)}`}
              />
              <Stat
                title="Referred Companies"
                value={String(metrics.referredCompanies)}
              />
              <Stat
                title="Active Companies"
                value={String(metrics.activeCompanies)}
              />
              <Stat
                title="Total Print Jobs"
                value={String(metrics.totalJobs)}
              />
              <Stat title="Total Pages" value={String(metrics.totalPages)} />
            </motion.div>
          </TabsContent>

          <TabsContent value="commissions">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.2 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle>Commission per Print Job</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="w-full overflow-x-auto">
                    <Table className="min-w-[720px] text-xs sm:text-sm">
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Company</TableHead>
                          <TableHead className="text-right">Pages</TableHead>
                          <TableHead className="text-right">
                            Amount (ZMW)
                          </TableHead>
                          <TableHead className="text-right">
                            Commission (ZMW)
                          </TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {commissions.map((c) => (
                          <TableRow key={c.jobId}>
                            <TableCell>
                              {new Date(c.jobDate).toLocaleDateString()}
                            </TableCell>
                            <TableCell>{c.companyName}</TableCell>
                            <TableCell className="text-right">
                              {c.pages}
                            </TableCell>
                            <TableCell className="text-right">
                              {Number(c.amount).toFixed(2)}
                            </TableCell>
                            <TableCell className="text-right">
                              {Number(c.commission).toFixed(2)}
                            </TableCell>
                            <TableCell>{c.status}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          <TabsContent value="withdrawals">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.2 }}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3 sm:mb-4">
                <h2 className="text-base sm:text-lg font-medium">
                  Withdrawals
                </h2>
                <Button
                  className="w-full sm:w-auto"
                  onClick={requestWithdrawal}
                >
                  Request Withdrawal
                </Button>
              </div>
              <Card>
                <CardContent>
                  <div className="w-full overflow-x-auto">
                    <Table className="min-w-[520px] text-xs sm:text-sm">
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead className="text-right">
                            Amount (ZMW)
                          </TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {withdrawals.map((w) => (
                          <TableRow key={w.id}>
                            <TableCell>
                              {new Date(w.createdAt).toLocaleString()}
                            </TableCell>
                            <TableCell className="text-right">
                              {Number(w.amount).toFixed(2)}
                            </TableCell>
                            <TableCell>{w.status}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          <TabsContent value="referrals">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.2 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle>Referred Companies</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="w-full overflow-x-auto">
                    <Table className="min-w-[680px] text-xs sm:text-sm">
                      <TableHeader>
                        <TableRow>
                          <TableHead>Company</TableHead>
                          <TableHead className="text-right">Jobs</TableHead>
                          <TableHead className="text-right">Pages</TableHead>
                          <TableHead className="text-right">
                            Total Spend (ZMW)
                          </TableHead>
                          <TableHead>Last Activity</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {referrals.map((r) => (
                          <TableRow key={r.companyId}>
                            <TableCell>{r.companyName}</TableCell>
                            <TableCell className="text-right">
                              {r.jobsCount}
                            </TableCell>
                            <TableCell className="text-right">
                              {r.pages}
                            </TableCell>
                            <TableCell className="text-right">
                              {Number(r.totalSpend).toFixed(2)}
                            </TableCell>
                            <TableCell>
                              {r.lastJobAt
                                ? new Date(r.lastJobAt).toLocaleString()
                                : "—"}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>
        </Tabs>
      </div>
    </motion.div>
  );
}

function Stat({ title, value }: { title: string; value: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
    >
      <Card>
        <CardHeader>
          <CardTitle className="text-xs sm:text-sm text-muted-foreground">
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-xl sm:text-2xl font-semibold">{value}</div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
