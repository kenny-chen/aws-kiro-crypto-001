import { resolveInvite } from "@/server/invite";
import { Countdown } from "@/components/countdown";
import Link from "next/link";

export default async function AccessPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const data = await resolveInvite(token);

  if (data.state === "invalid") {
    return (
      <main className="flex min-h-screen items-center justify-center p-6">
        <div className="max-w-md text-center">
          <h1 className="text-2xl font-bold text-red-400">Invalid Invite</h1>
          <p className="mt-4 text-gray-400">This invite link is not valid.</p>
          <Link href="/" className="mt-6 inline-block rounded bg-gray-800 px-4 py-2 text-sm">
            Go Home
          </Link>
        </div>
      </main>
    );
  }

  if (data.state === "expired") {
    return (
      <main className="flex min-h-screen items-center justify-center p-6">
        <div className="max-w-md text-center">
          <h1 className="text-2xl font-bold text-yellow-400">Invite Expired</h1>
          <p className="mt-4 text-gray-400">
            This duel is no longer accepting participants. Contact the creator for a new invite.
          </p>
          <Link href="/" className="mt-6 inline-block rounded bg-gray-800 px-4 py-2 text-sm">
            Go Home
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <div className="w-full max-w-lg rounded-xl border border-gray-800 bg-gray-900 p-8">
        <p className="text-sm text-gray-500 uppercase tracking-wide">Private Duel Invite</p>
        <h1 className="mt-2 text-2xl font-bold">{data.marketTitle}</h1>

        <div className="mt-6 grid grid-cols-2 gap-4">
          <div className="rounded-lg bg-gray-800 p-4 text-center">
            <p className="text-xs text-gray-400">Option A</p>
            <p className="mt-1 font-semibold text-blue-400">{data.optionA}</p>
          </div>
          <div className="rounded-lg bg-gray-800 p-4 text-center">
            <p className="text-xs text-gray-400">Option B</p>
            <p className="mt-1 font-semibold text-purple-400">{data.optionB}</p>
          </div>
        </div>

        <div className="mt-6 space-y-2 text-sm text-gray-400">
          <div className="flex justify-between">
            <span>Min Stake</span>
            <span className="text-white">{data.minStake} USDC</span>
          </div>
          <div className="flex justify-between">
            <span>Fee</span>
            <span className="text-white">{(data.feeBps! / 100).toFixed(2)}%</span>
          </div>
          <div className="flex justify-between">
            <span>Participants</span>
            <span className="text-white">{data.participantCount}</span>
          </div>
          <div className="flex justify-between">
            <span>Closes in</span>
            <Countdown target={data.closeAt!} />
          </div>
        </div>

        <Link
          href={`/wallet/connect?redirect=/duel/invite/${data.duelToken}`}
          className="mt-8 block w-full rounded-lg bg-indigo-600 py-3 text-center font-semibold hover:bg-indigo-500 transition"
        >
          Connect Wallet & Join
        </Link>
      </div>
    </main>
  );
}
