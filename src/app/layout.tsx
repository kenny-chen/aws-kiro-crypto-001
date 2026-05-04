import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "aws-kiro-crypto-001",
  description: "",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-950 text-white antialiased">
        {children}
      </body>
    </html>
  );
}
