import { db } from "@/db/client";
import { market } from "@/db/schema";
import { eq } from "drizzle-orm";
import Link from "next/link";
import { notFound } from "next/navigation";

export default async function MarketDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const m = await db.query.market.findFirst({ where: eq(market.id, id) });
  if (!m) notFound();

  const isFrozen = m.status === "frozen" || m.status === "cancelled";

  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <div className="w-full max-w-lg rounded-xl border border-gray-800 bg-gray-900 p-8">
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500 uppercase tracking-wide">Market</p>
          <span className={`text-xs px-2 py-1 rounded ${
            m.status === "active" ? "bg-green-900 text-green-300" :
            m.status === "frozen" ? "bg-yellow-900 text-yellow-300" :
            m.status === "cancelled" ? "bg-red-900 text-red-300" :
            "bg-gray-800 text-gray-400"
          }`}>{m.status}</span>
        </div>

        <h1 className="mt-2 text-2xl font-bold">{m.title}</h1>

        <div className="mt-6 grid grid-cols-2 gap-4">
          <div className="rounded-lg bg-gray-800 p-4 text-center">
            <p className="text-xs text-gray-400">Option A</p>
            <p className="mt-1 font-semibold text-blue-400">{m.optionALabel}</p>
          </div>
          <div className="rounded-lg bg-gray-800 p-4 text-center">
            <p className="text-xs text-gray-400">Option B</p>
            <p className="mt-1 font-semibold text-purple-400">{m.optionBLabel}</p>
          </div>
        </div>

        <div className="mt-6 space-y-2 text-sm text-gray-400">
          <div className="flex justify-between"><span>Min Stake</span><span className="text-white">{m.minStake} USDC</span></div>
          <div className="flex justify-between"><span>Fee</span><span className="text-white">{(m.feeBps / 100).toFixed(2)}%</span></div>
          <div className="flex justify-between"><span>Resolution</span><span className="text-white">{m.resolutionAt.toISOString()}</span></div>
        </div>

        {isFrozen ? (
          <p className="mt-8 text-center text-sm text-yellow-400">
            This market is {m.status} and cannot accept new duels.
          </p>
        ) : m.status === "active" ? (
          <Link href={`/duel/create?marketId=${m.id}`}
            className="mt-8 block w-full rounded-lg bg-indigo-600 py-3 text-center font-semibold hover:bg-indigo-500 transition">
            Start a Duel
          </Link>
        ) : null}
      </div>
    </main>
  );
}
