"use client";

import { useState } from "react";

type AuditEntry = { id: string; actorType: string; action: string; entityType: string; entityId: string; createdAt: string };

export default function AdminAuditPage() {
  const [entityType, setEntityType] = useState("");
  const [entityId, setEntityId] = useState("");
  const [logs, setLogs] = useState<AuditEntry[]>([]);

  const search = async () => {
    const params = new URLSearchParams();
    if (entityType) params.set("entityType", entityType);
    if (entityId) params.set("entityId", entityId);
    const res = await fetch(`/api/admin/audit?${params}`).then((r) => r.json());
    if (res.ok) setLogs(res.data);
  };

  return (
    <div>
      <h1 className="text-xl font-bold mb-4">Audit Log</h1>
      <div className="flex gap-3 mb-4">
        <select value={entityType} onChange={(e) => setEntityType(e.target.value)} className="rounded bg-gray-800 px-3 py-2 text-sm text-white">
          <option value="">All types</option>
          {["user_account", "invite", "market", "duel", "duel_participant", "settlement", "ledger_entry", "chain_tx", "chat_message"].map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
        <input value={entityId} onChange={(e) => setEntityId(e.target.value)} placeholder="Entity ID" className="rounded bg-gray-800 px-3 py-2 text-sm text-white" />
        <button onClick={search} className="rounded bg-indigo-600 px-4 py-2 text-sm font-semibold">Search</button>
      </div>
      <table className="w-full text-sm">
        <thead><tr className="text-left text-gray-400 border-b border-gray-800">
          <th className="pb-2">Time</th><th className="pb-2">Actor</th><th className="pb-2">Action</th><th className="pb-2">Entity</th><th className="pb-2">Entity ID</th>
        </tr></thead>
        <tbody>
          {logs.map((l) => (
            <tr key={l.id} className="border-b border-gray-800/50">
              <td className="py-2 text-xs">{new Date(l.createdAt).toLocaleString()}</td>
              <td className="py-2">{l.actorType}</td>
              <td className="py-2">{l.action}</td>
              <td className="py-2">{l.entityType}</td>
              <td className="py-2 font-mono text-xs">{l.entityId.slice(0, 8)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
