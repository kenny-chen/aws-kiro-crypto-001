"use client";

import { useEffect, useState } from "react";

type Metrics = {
  funnel: { invitesOpened: number; walletsConnected: number; depositsCount: number; settlementsCount: number };
  revenue: { totalDeposits: string; totalFees: string; totalRefunds: string };
  overview: { totalDuels: number };
};

export default function AdminMetricsPage() {
  const [m, setM] = useState<Metrics | null>(null);

  useEffect(() => {
    fetch("/api/admin/metrics").then((r) => r.json()).then((res) => { if (res.ok) setM(res.data); });
  }, []);

  if (!m) return <p className="text-gray-400">Loading...</p>;

  return (
    <div>
      <h1 className="text-xl font-bold mb-4">Metrics</h1>

      <h2 className="text-sm text-gray-400 uppercase mt-6 mb-2">Funnel</h2>
      <div className="grid grid-cols-4 gap-4">
        {Object.entries(m.funnel).map(([k, v]) => (
          <div key={k} className="rounded-lg bg-gray-900 border border-gray-800 p-4">
            <p className="text-xs text-gray-400">{k}</p>
            <p className="text-2xl font-bold mt-1">{v}</p>
          </div>
        ))}
      </div>

      <h2 className="text-sm text-gray-400 uppercase mt-6 mb-2">Revenue</h2>
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-lg bg-gray-900 border border-gray-800 p-4">
          <p className="text-xs text-gray-400">Total Deposits</p>
          <p className="text-2xl font-bold mt-1">{m.revenue.totalDeposits} USDC</p>
        </div>
        <div className="rounded-lg bg-gray-900 border border-gray-800 p-4">
          <p className="text-xs text-gray-400">Total Fees</p>
          <p className="text-2xl font-bold mt-1 text-green-400">{m.revenue.totalFees} USDC</p>
        </div>
        <div className="rounded-lg bg-gray-900 border border-gray-800 p-4">
          <p className="text-xs text-gray-400">Total Refunds</p>
          <p className="text-2xl font-bold mt-1 text-red-400">{m.revenue.totalRefunds} USDC</p>
        </div>
      </div>

      <h2 className="text-sm text-gray-400 uppercase mt-6 mb-2">Overview</h2>
      <div className="rounded-lg bg-gray-900 border border-gray-800 p-4 max-w-xs">
        <p className="text-xs text-gray-400">Total Duels</p>
        <p className="text-2xl font-bold mt-1">{m.overview.totalDuels}</p>
      </div>
    </div>
  );
}
