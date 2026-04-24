import type { Metadata } from "next";
import { SolanaProvider } from "@/components/solana-provider";
import { QueryProvider } from "@/components/query-provider";
import "./globals.css";

export const metadata: Metadata = {
  title: "Crypto Duel",
  description: "Invite-only private USDC duels on Solana",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-950 text-white antialiased">
        <QueryProvider>
          <SolanaProvider>{children}</SolanaProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
