"use client";

import { Suspense, useCallback, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { useSearchParams, useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/store";

function WalletConnectForm() {
  const { publicKey, signMessage, connected } = useWallet();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") ?? "/";
  const setAuth = useAuthStore((s) => s.setAuth);
  const [status, setStatus] = useState<"idle" | "signing" | "verifying" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const handleVerify = useCallback(async () => {
    if (!publicKey || !signMessage) return;
    setStatus("signing");
    try {
      const challengeRes = await fetch("/api/auth/connect", { method: "POST" });
      const { data } = await challengeRes.json();
      const encoded = new TextEncoder().encode(data.challenge);
      const signature = await signMessage(encoded);
      setStatus("verifying");
      const verifyRes = await fetch("/api/auth/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          walletAddress: publicKey.toBase58(),
          signature: Array.from(signature),
          message: data.challenge,
        }),
      });
      const result = await verifyRes.json();
      if (result.ok) {
        setAuth(result.data.userId, result.data.walletAddress);
        router.push(redirect);
      } else {
        setStatus("error");
        setErrorMsg(result.error);
      }
    } catch (e) {
      setStatus("error");
      setErrorMsg(e instanceof Error ? e.message : "Verification failed");
    }
  }, [publicKey, signMessage, redirect, router, setAuth]);

  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <div className="w-full max-w-md rounded-xl border border-gray-800 bg-gray-900 p-8 text-center">
        <h1 className="text-2xl font-bold">Connect Wallet</h1>
        <p className="mt-2 text-sm text-gray-400">
          Connect your Solana wallet and sign a message to verify ownership.
        </p>
        <div className="mt-6 flex justify-center">
          <WalletMultiButton />
        </div>
        {connected && publicKey && (
          <button
            onClick={handleVerify}
            disabled={status === "signing" || status === "verifying"}
            className="mt-6 w-full rounded-lg bg-indigo-600 py-3 font-semibold hover:bg-indigo-500 disabled:opacity-50 transition"
          >
            {status === "signing" ? "Sign in wallet..." : status === "verifying" ? "Verifying..." : "Verify & Continue"}
          </button>
        )}
        {status === "error" && <p className="mt-4 text-sm text-red-400">{errorMsg}</p>}
      </div>
    </main>
  );
}

export default function WalletConnectPage() {
  return (
    <Suspense fallback={<main className="flex min-h-screen items-center justify-center"><p className="text-gray-400">Loading...</p></main>}>
      <WalletConnectForm />
    </Suspense>
  );
}
