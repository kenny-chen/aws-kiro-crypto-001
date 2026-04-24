"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useAuthStore } from "@/lib/store";

type ResultData = {
  duelId: string;
  duelStatus: string;
  settlement: {
    winningSide: string;
    feeAmount: string;
    distributableAmount: string;
    decidedAt: string;
    disputeWindowEndsAt?: string;
  } | null;
  payouts: {
    participantId: string;
    userId: string;
    side: string;
    stakeAmount: string;
    payoutAmount: string;
    payoutStatus: string;
    chainTxSignature?: string;
    chainTxStatus?: string;
  }[];
};

export default function DuelResultPage() {
  const { token } = useParams<{ token: string }>();
  const { userId } = useAuthStore();
  const [data, setData] = useState<ResultData | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`/api/duel/result/${token}`).then((r) => r.json()).then((res) => {
      if (res.ok) setData(res.data);
      else setError(res.error);
    });
  }, [token]);

  if (error) return <main className="flex min-h-screen items-center justify-center"><p className="text-red-400">{error}</p></main>;
  if (!data) return <main className="flex min-h-screen items-center justify-center"><p className="text-gray-400">Loading...</p></main>;

  const myPayout = data.payouts.find((p) => p.userId === userId);
  const isRefunded = data.duelStatus === "refunded";

  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <div className="w-full max-w-lg rounded-xl border border-gray-800 bg-gray-900 p-8 space-y-6">
        <h1 className="text-2xl font-bold">{isRefunded ? "Duel Refunded" : "Duel Result"}</h1>

        {data.settlement && (
          <div className="rounded-lg bg-gray-800 p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Winner</span>
              <span className="font-bold text-green-400">Side {data.settlement.winningSide}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Fee</span>
              <span className="text-white">{data.settlement.feeAmount} USDC</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Distributed</span>
              <span className="text-white">{data.settlement.distributableAmount} USDC</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Decided</span>
              <span className="text-white">{new Date(data.settlement.decidedAt).toLocaleString()}</span>
            </div>
          </div>
        )}

        {myPayout && (
          <div className={`rounded-lg p-4 ${parseFloat(myPayout.payoutAmount) > 0 ? "bg-green-900/30 border border-green-800" : "bg-red-900/30 border border-red-800"}`}>
            <p className="text-sm text-gray-400">Your Result</p>
            <p className="text-2xl font-bold mt-1">
              {parseFloat(myPayout.payoutAmount) > 0 ? `+${myPayout.payoutAmount} USDC` : "No payout"}
            </p>
            <p className="text-xs text-gray-400 mt-1">
              Side {myPayout.side} · Staked {myPayout.stakeAmount} USDC · Status: {myPayout.payoutStatus}
            </p>
            {myPayout.chainTxSignature && (
              <p className="text-xs text-gray-500 mt-1 break-all">Tx: {myPayout.chainTxSignature}</p>
            )}
          </div>
        )}

        <button
          onClick={() => navigator.clipboard.writeText(window.location.href)}
          className="w-full rounded-lg bg-gray-800 py-3 text-sm font-semibold hover:bg-gray-700 transition"
        >
          Copy Share Link
        </button>
      </div>
    </main>
  );
}
