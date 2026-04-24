import Link from "next/link";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-950">
      <nav className="border-b border-gray-800 px-6 py-3 flex gap-6 text-sm">
        <Link href="/admin" className="font-bold text-white">Admin</Link>
        <Link href="/admin/markets" className="text-gray-400 hover:text-white">Markets</Link>
        <Link href="/admin/duels" className="text-gray-400 hover:text-white">Duels</Link>
        <Link href="/admin/audit" className="text-gray-400 hover:text-white">Audit</Link>
        <Link href="/admin/reconcile" className="text-gray-400 hover:text-white">Reconcile</Link>
        <Link href="/admin/metrics" className="text-gray-400 hover:text-white">Metrics</Link>
      </nav>
      <main className="p-6">{children}</main>
    </div>
  );
}
