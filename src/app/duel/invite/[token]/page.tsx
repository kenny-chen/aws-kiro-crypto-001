"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuthStore } from "@/lib/store";
import { Countdown } from "@/components/countdown";

type DuelInfo = {
  duelId: string;
  status: string;
  closeAt: string;
  totalStakeA: string;
  totalStakeB: string;
  participantCount: number;
  market: { title: string; optionALabel: string; optionBLabel: string; minStake: string; feeBps: number } | null;
};

export default function DuelInviteJoinPage() {
  const { token } = useParams<{ token: string }>();
  const router = useRouter();
  const { userId, walletAddress } = useAuthStore();
  const [info, setInfo] = useState<DuelInfo | null>(null);
  const [side, setSide] = useState<"A" | "B">("A");
  const [stakeAmount, setStakeAmount] = useState("1");
  const [status, setStatus] = useState<"loading" | "ready" | "submitting" | "error">("loading");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    fetch(`/api/duel/${token}`).then((r) => r.json()).then((res) => {
      if (res.ok) { setInfo(res.data); setStatus("ready"); }
      else { setStatus("error"); setErrorMsg(res.error); }
    }).catch(() => { setStatus("error"); setErrorMsg("Failed to load duel"); });
  }, [token]);

  const handleJoin = async () => {
    if (!userId || !walletAddress) {
      router.push(`/wallet/connect?redirect=/duel/invite/${token}`);
      return;
    }
    setStatus("submitting");
    try {
      const res = await fetch("/api/duel/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ duelToken: token, userId, side, stakeAmount, walletAddress }),
      });
      const data = await res.json();
      if (data.ok) router.push(`/duel/room/${token}`);
      else { setStatus("error"); setErrorMsg(data.error); }
    } catch {
      setStatus("error");
      setErrorMsg("Network error");
    }
  };

  if (status === "loading") {
    return <main className="flex min-h-screen items-center justify-center"><p className="text-gray-400">Loading...</p></main>;
  }

  if (!info || !info.market) {
    return <main className="flex min-h-screen items-center justify-center"><p className="text-red-400">{errorMsg || "Duel not found"}</p></main>;
  }

  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <div className="w-full max-w-lg rounded-xl border border-gray-800 bg-gray-900 p-8 space-y-6">
        <p className="text-sm text-gray-500 uppercase tracking-wide">Join Private Duel</p>
        <h1 className="text-2xl font-bold">{info.market.title}</h1>

        <div className="flex justify-between text-sm text-gray-400">
          <span>Closes in</span>
          <Countdown target={info.closeAt} />
        </div>

        <div>
          <label className="block text-sm text-gray-400 mb-2">Choose Side</label>
          <div className="grid grid-cols-2 gap-4">
            <button type="button" onClick={() => setSide("A")}
              className={`rounded-lg p-4 text-center font-semibold transition ${side === "A" ? "bg-blue-600 ring-2 ring-blue-400" : "bg-gray-800 hover:bg-gray-700"}`}>
              {info.market.optionALabel}
            </button>
            <button type="button" onClick={() => setSide("B")}
              className={`rounded-lg p-4 text-center font-semibold transition ${side === "B" ? "bg-purple-600 ring-2 ring-purple-400" : "bg-gray-800 hover:bg-gray-700"}`}>
              {info.market.optionBLabel}
            </button>
          </div>
        </div>

        <div>
          <label className="block text-sm text-gray-400 mb-1">Stake (USDC, min {info.market.minStake})</label>
          <input type="number" step="0.01" min={info.market.minStake} value={stakeAmount}
            onChange={(e) => setStakeAmount(e.target.value)}
            className="w-full rounded bg-gray-800 px-3 py-2 text-white" />
        </div>

        <div className="text-sm text-gray-400 space-y-1">
          <div className="flex justify-between"><span>Pool A</span><span className="text-white">{info.totalStakeA} USDC</span></div>
          <div className="flex justify-between"><span>Pool B</span><span className="text-white">{info.totalStakeB} USDC</span></div>
          <div className="flex justify-between"><span>Participants</span><span className="text-white">{info.participantCount}</span></div>
        </div>

        {status === "error" && <p className="text-sm text-red-400">{errorMsg}</p>}

        <button onClick={handleJoin} disabled={status === "submitting"}
          className="w-full rounded-lg bg-indigo-600 py-3 font-semibold hover:bg-indigo-500 disabled:opacity-50 transition">
          {status === "submitting" ? "Joining..." : "Join & Deposit"}
        </button>
      </div>
    </main>
  );
}
