"use client";

import { useAuthStore } from "@/lib/store";
import Link from "next/link";

export default function WalletResultPage() {
  const { userId, walletAddress } = useAuthStore();

  if (!userId) {
    return (
      <main className="flex min-h-screen items-center justify-center p-6">
        <div className="max-w-md text-center">
          <h1 className="text-2xl font-bold text-red-400">Not Connected</h1>
          <p className="mt-4 text-gray-400">Wallet verification was not completed.</p>
          <Link href="/wallet/connect" className="mt-6 inline-block rounded bg-gray-800 px-4 py-2 text-sm">
            Try Again
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <div className="max-w-md text-center">
        <h1 className="text-2xl font-bold text-green-400">Wallet Connected</h1>
        <p className="mt-4 text-sm text-gray-400 break-all">{walletAddress}</p>
        <Link href="/" className="mt-6 inline-block rounded bg-indigo-600 px-6 py-2 font-semibold">
          Continue
        </Link>
      </div>
    </main>
  );
}
