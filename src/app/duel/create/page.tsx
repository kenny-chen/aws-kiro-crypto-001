"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuthStore } from "@/lib/store";

function DuelCreateForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const marketId = searchParams.get("marketId") ?? "";
  const userId = useAuthStore((s) => s.userId);

  const [form, setForm] = useState({ side: "A" as "A" | "B", stakeAmount: "1", closeAt: "" });
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [result, setResult] = useState<{ inviteLink: string; inviteToken: string } | null>(null);
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) { router.push(`/wallet/connect?redirect=/duel/create?marketId=${marketId}`); return; }
    setStatus("submitting");
    try {
      const res = await fetch("/api/duel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ marketId, userId, closeAt: new Date(form.closeAt).toISOString(), side: form.side, stakeAmount: form.stakeAmount }),
      });
      const data = await res.json();
      if (data.ok) {
        setStatus("success");
        setResult({ inviteLink: data.data.inviteLink, inviteToken: data.data.inviteToken });
      } else {
        setStatus("error");
        setErrorMsg(data.error);
      }
    } catch {
      setStatus("error");
      setErrorMsg("Network error");
    }
  };

  if (status === "success" && result) {
    return (
      <main className="flex min-h-screen items-center justify-center p-6">
        <div className="w-full max-w-lg rounded-xl border border-gray-800 bg-gray-900 p-8 text-center">
          <h1 className="text-2xl font-bold text-green-400">Duel Created!</h1>
          <p className="mt-4 text-sm text-gray-400">Share this invite link:</p>
          <div className="mt-2 rounded bg-gray-800 p-3 text-sm break-all select-all">{result.inviteLink}</div>
          <button onClick={() => navigator.clipboard.writeText(result.inviteLink)}
            className="mt-4 rounded bg-indigo-600 px-4 py-2 text-sm font-semibold hover:bg-indigo-500 transition">
            Copy Link
          </button>
          <button onClick={() => router.push(`/duel/room/${result.inviteToken}`)}
            className="mt-2 block w-full rounded bg-gray-800 py-2 text-sm hover:bg-gray-700 transition">
            Enter Duel Room
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <form onSubmit={handleSubmit} className="w-full max-w-lg rounded-xl border border-gray-800 bg-gray-900 p-8 space-y-5">
        <h1 className="text-2xl font-bold">Create Duel</h1>

        <div>
          <label className="block text-sm text-gray-400 mb-2">Choose Side</label>
          <div className="grid grid-cols-2 gap-4">
            {(["A", "B"] as const).map((s) => (
              <button key={s} type="button" onClick={() => setForm((f) => ({ ...f, side: s }))}
                className={`rounded-lg p-4 text-center font-semibold transition ${form.side === s ? "bg-indigo-600 ring-2 ring-indigo-400" : "bg-gray-800 hover:bg-gray-700"}`}>
                Option {s}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm text-gray-400 mb-1">Stake (USDC)</label>
          <input type="number" step="0.01" min="0.01" value={form.stakeAmount}
            onChange={(e) => setForm((f) => ({ ...f, stakeAmount: e.target.value }))}
            className="w-full rounded bg-gray-800 px-3 py-2 text-white" required />
        </div>

        <div>
          <label className="block text-sm text-gray-400 mb-1">Close Time (UTC)</label>
          <input type="datetime-local" value={form.closeAt}
            onChange={(e) => setForm((f) => ({ ...f, closeAt: e.target.value }))}
            className="w-full rounded bg-gray-800 px-3 py-2 text-white" required />
        </div>

        {status === "error" && <p className="text-sm text-red-400">{errorMsg}</p>}

        <button type="submit" disabled={status === "submitting"}
          className="w-full rounded-lg bg-indigo-600 py-3 font-semibold hover:bg-indigo-500 disabled:opacity-50 transition">
          {status === "submitting" ? "Creating..." : "Create Duel"}
        </button>
      </form>
    </main>
  );
}

export default function DuelCreatePage() {
  return (
    <Suspense fallback={<main className="flex min-h-screen items-center justify-center"><p className="text-gray-400">Loading...</p></main>}>
      <DuelCreateForm />
    </Suspense>
  );
}
