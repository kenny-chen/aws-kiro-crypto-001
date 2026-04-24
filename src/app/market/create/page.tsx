"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/store";

export default function MarketCreatePage() {
  const router = useRouter();
  const userId = useAuthStore((s) => s.userId);
  const [form, setForm] = useState({
    title: "",
    optionALabel: "",
    optionBLabel: "",
    resolutionAt: "",
    minStake: "1",
    feeBps: 200,
  });
  const [status, setStatus] = useState<"idle" | "submitting" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const set = (key: string, value: string | number) => setForm((f) => ({ ...f, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) {
      router.push("/wallet/connect?redirect=/market/create");
      return;
    }
    setStatus("submitting");
    try {
      const res = await fetch("/api/market", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, userId }),
      });
      const result = await res.json();
      if (result.ok) {
        router.push(`/market/${result.data.id}`);
      } else {
        setStatus("error");
        setErrorMsg(result.error);
      }
    } catch {
      setStatus("error");
      setErrorMsg("Network error");
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <form onSubmit={handleSubmit} className="w-full max-w-lg rounded-xl border border-gray-800 bg-gray-900 p-8 space-y-5">
        <h1 className="text-2xl font-bold">Create Market</h1>

        <div>
          <label className="block text-sm text-gray-400 mb-1">Title</label>
          <input value={form.title} onChange={(e) => set("title", e.target.value)}
            className="w-full rounded bg-gray-800 px-3 py-2 text-white" required minLength={3} maxLength={200} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Option A</label>
            <input value={form.optionALabel} onChange={(e) => set("optionALabel", e.target.value)}
              className="w-full rounded bg-gray-800 px-3 py-2 text-white" required maxLength={100} />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Option B</label>
            <input value={form.optionBLabel} onChange={(e) => set("optionBLabel", e.target.value)}
              className="w-full rounded bg-gray-800 px-3 py-2 text-white" required maxLength={100} />
          </div>
        </div>

        <div>
          <label className="block text-sm text-gray-400 mb-1">Resolution Time (UTC)</label>
          <input type="datetime-local" value={form.resolutionAt} onChange={(e) => set("resolutionAt", new Date(e.target.value).toISOString())}
            className="w-full rounded bg-gray-800 px-3 py-2 text-white" required />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Min Stake (USDC)</label>
            <input type="number" step="0.01" min="0.01" value={form.minStake} onChange={(e) => set("minStake", e.target.value)}
              className="w-full rounded bg-gray-800 px-3 py-2 text-white" required />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Fee (bps, 200 = 2%)</label>
            <input type="number" min="0" max="5000" value={form.feeBps} onChange={(e) => set("feeBps", Number(e.target.value))}
              className="w-full rounded bg-gray-800 px-3 py-2 text-white" required />
          </div>
        </div>

        {status === "error" && <p className="text-sm text-red-400">{errorMsg}</p>}

        <button type="submit" disabled={status === "submitting"}
          className="w-full rounded-lg bg-indigo-600 py-3 font-semibold hover:bg-indigo-500 disabled:opacity-50 transition">
          {status === "submitting" ? "Creating..." : "Create Market"}
        </button>
      </form>
    </main>
  );
}
