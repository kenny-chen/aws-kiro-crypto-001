"use client";

import { useEffect, useState } from "react";

type Duel = { id: string; status: string; closeAt: string; totalStakeA: string; totalStakeB: string; participantCount: number };

export default function AdminDuelsPage() {
  const [duels, setDuels] = useState<Duel[]>([]);
  const [settleTarget, setSettleTarget] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/duels").then((r) => r.json()).then((res) => { if (res.ok) setDuels(res.data); });
  }, []);

  const refresh = async () => {
    const res = await fetch("/api/admin/duels").then((r) => r.json());
    if (res.ok) setDuels(res.data);
  };

  const settle = async (duelId: string, winningSide: "A" | "B") => {
    await fetch("/api/admin/settle", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ duelId, winningSide, adminId: "admin" }),
    });
    setSettleTarget(null);
    refresh();
  };

  const refund = async (duelId: string) => {
    await fetch("/api/admin/refund", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ duelId, adminId: "admin", reason: "Admin triggered refund" }),
    });
    refresh();
  };

  return (
    <div>
      <h1 className="text-xl font-bold mb-4">Duels</h1>
      <table className="w-full text-sm">
        <thead><tr className="text-left text-gray-400 border-b border-gray-800">
          <th className="pb-2">ID</th><th className="pb-2">Status</th><th className="pb-2">Pool A</th><th className="pb-2">Pool B</th><th className="pb-2">Participants</th><th className="pb-2">Actions</th>
        </tr></thead>
        <tbody>
          {duels.map((d) => (
            <tr key={d.id} className="border-b border-gray-800/50">
              <td className="py-2 font-mono text-xs">{d.id.slice(0, 8)}</td>
              <td className="py-2">{d.status}</td>
              <td className="py-2">{d.totalStakeA}</td>
              <td className="py-2">{d.totalStakeB}</td>
              <td className="py-2">{d.participantCount}</td>
              <td className="py-2 space-x-2">
                {d.status === "closed" && (
                  settleTarget === d.id ? (
                    <span className="space-x-2">
                      <button onClick={() => settle(d.id, "A")} className="text-blue-400 hover:underline text-xs">A wins</button>
                      <button onClick={() => settle(d.id, "B")} className="text-purple-400 hover:underline text-xs">B wins</button>
                      <button onClick={() => setSettleTarget(null)} className="text-gray-400 hover:underline text-xs">Cancel</button>
                    </span>
                  ) : (
                    <button onClick={() => setSettleTarget(d.id)} className="text-green-400 hover:underline text-xs">Settle</button>
                  )
                )}
                {["open", "closed"].includes(d.status) && (
                  <button onClick={() => refund(d.id)} className="text-red-400 hover:underline text-xs">Refund</button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
