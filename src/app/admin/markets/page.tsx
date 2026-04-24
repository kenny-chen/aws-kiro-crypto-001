"use client";

import { useEffect, useState } from "react";

type Market = { id: string; title: string; status: string; createdAt: string; feeBps: number; minStake: string };

export default function AdminMarketsPage() {
  const [markets, setMarkets] = useState<Market[]>([]);

  useEffect(() => {
    fetch("/api/admin/markets").then((r) => r.json()).then((res) => { if (res.ok) setMarkets(res.data); });
  }, []);

  const doAction = async (marketId: string, action: string) => {
    await fetch("/api/admin/market-action", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ marketId, action, adminId: "admin" }),
    });
    // Refresh
    const res = await fetch("/api/admin/markets").then((r) => r.json());
    if (res.ok) setMarkets(res.data);
  };

  return (
    <div>
      <h1 className="text-xl font-bold mb-4">Markets</h1>
      <table className="w-full text-sm">
        <thead><tr className="text-left text-gray-400 border-b border-gray-800">
          <th className="pb-2">Title</th><th className="pb-2">Status</th><th className="pb-2">Min Stake</th><th className="pb-2">Fee</th><th className="pb-2">Actions</th>
        </tr></thead>
        <tbody>
          {markets.map((m) => (
            <tr key={m.id} className="border-b border-gray-800/50">
              <td className="py-2">{m.title}</td>
              <td className="py-2">{m.status}</td>
              <td className="py-2">{m.minStake}</td>
              <td className="py-2">{m.feeBps}bps</td>
              <td className="py-2 space-x-2">
                {m.status === "active" && <button onClick={() => doAction(m.id, "freeze")} className="text-yellow-400 hover:underline text-xs">Freeze</button>}
                {m.status === "active" && <button onClick={() => doAction(m.id, "cancel")} className="text-red-400 hover:underline text-xs">Cancel</button>}
                {m.status === "frozen" && <button onClick={() => doAction(m.id, "restore")} className="text-green-400 hover:underline text-xs">Restore</button>}
                {m.status === "frozen" && <button onClick={() => doAction(m.id, "cancel")} className="text-red-400 hover:underline text-xs">Cancel</button>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
