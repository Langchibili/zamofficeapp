//AddFloat.tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { useCompany } from "@/hooks/use-company";
import { logClick } from "@/lib/logger";
import { formatCurrency } from "@/lib/currency";

export type FloatEntry = {
  id: string;
  amount: number;
  note?: string;
  createdAt: string;
  companyId: string;
};

function saveFloat(entry: FloatEntry) {
  const key = `zamoffice.floatHistory.${entry.companyId}`;
  const raw = localStorage.getItem(key);
  const arr = raw ? (JSON.parse(raw) as FloatEntry[]) : [];
  arr.unshift(entry);
  localStorage.setItem(key, JSON.stringify(arr));
}

function getTotal(companyId: string) {
  const key = `zamoffice.floatHistory.${companyId}`;
  const raw = localStorage.getItem(key);
  const arr = raw ? (JSON.parse(raw) as FloatEntry[]) : [];
  return arr.reduce((s, a) => s + (Number(a.amount) || 0), 0);
}

export default function AddFloat() {
  const { company } = useCompany();
  const [amount, setAmount] = useState<number>(0);
  const [note, setNote] = useState("");

  if (!company) {
    return (
      <div className="container py-8">
        <Card>
          <CardHeader>
            <CardTitle>Sign in required</CardTitle>
          </CardHeader>
          <CardContent>Login to add float.</CardContent>
        </Card>
      </div>
    );
  }

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    logClick("Add Float submit", "client/pages/AddFloat.tsx", 53);
    const entry: FloatEntry = {
      id: Math.random().toString(36).slice(2, 9),
      amount: Number(amount),
      note,
      createdAt: new Date().toISOString(),
      companyId: company.id,
    };
    saveFloat(entry);
    setAmount(0);
    setNote("");
  };

  const total = company ? getTotal(company.id) : 0;
  const curr = company?.settings?.currency || (company as any)?.currency || "ZMW";

  return (
    <div className="container py-8">
      <Card className="max-w-xl">
        <CardHeader>
          <CardTitle>Add Float</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4 text-sm text-muted-foreground">Current total: {formatCurrency(total, curr)} ({curr})</div>
          <form onSubmit={submit} className="space-y-4">
            <div>
              <Label htmlFor="amount">Amount</Label>
              <Input id="amount" type="number" value={amount} onChange={(e) => setAmount(parseFloat(e.target.value))} />
            </div>
            <div>
              <Label htmlFor="note">Note</Label>
              <Input id="note" value={note} onChange={(e) => setNote(e.target.value)} />
            </div>
            <div className="flex gap-3">
              <Button variant="success" type="submit" onClick={() => logClick("Add Float button", "client/pages/AddFloat.tsx", 73)}>
                Add Float
              </Button>
              <Button variant="secondary" type="button" onClick={() => { setAmount(0); setNote(""); logClick("Reset form", "client/pages/AddFloat.tsx", 76); }}>Reset</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
