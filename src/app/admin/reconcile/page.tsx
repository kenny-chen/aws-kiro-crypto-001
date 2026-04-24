"use client";

import { useEffect, useState } from "react";

type Stats = { pendingTransactions: number; failedTransactions: number; pendingPayouts: number; failedPayouts: number };

export default function AdminReconcilePage() {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    fetch("/api/admin/reconcile").then((r) => r.json()).then((res) => { if (res.ok) setStats(res.data); });
  }, []);

  if (!stats) return <p className="text-gray-400">Loading...</p>;

  const cards = [
    { label: "Pending Transactions", value: stats.pendingTransactions, color: "text-yellow-400" },
    { label: "Failed Transactions", value: stats.failedTransactions, color: "text-red-400" },
    { label: "Pending Payouts", value: stats.pendingPayouts, color: "text-yellow-400" },
    { label: "Failed Payouts", value: stats.failedPayouts, color: "text-red-400" },
  ];

  return (
    <div>
      <h1 className="text-xl font-bold mb-4">Reconciliation Overview</h1>
      <div className="grid grid-cols-2 gap-4 max-w-xl">
        {cards.map((c) => (
          <div key={c.label} className="rounded-lg bg-gray-900 border border-gray-800 p-6">
            <p className="text-sm text-gray-400">{c.label}</p>
            <p className={`text-3xl font-bold mt-1 ${c.color}`}>{c.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
