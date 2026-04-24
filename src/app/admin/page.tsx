import Link from "next/link";

export default function AdminPage() {
  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold">Admin Dashboard</h1>
      <div className="mt-6 grid grid-cols-2 gap-4">
        <Link href="/admin/markets" className="rounded-lg bg-gray-900 border border-gray-800 p-6 hover:border-gray-600 transition">
          <p className="font-semibold">Markets</p>
          <p className="text-sm text-gray-400 mt-1">View & manage markets</p>
        </Link>
        <Link href="/admin/duels" className="rounded-lg bg-gray-900 border border-gray-800 p-6 hover:border-gray-600 transition">
          <p className="font-semibold">Duels</p>
          <p className="text-sm text-gray-400 mt-1">Settle & refund duels</p>
        </Link>
        <Link href="/admin/audit" className="rounded-lg bg-gray-900 border border-gray-800 p-6 hover:border-gray-600 transition">
          <p className="font-semibold">Audit Log</p>
          <p className="text-sm text-gray-400 mt-1">Search audit records</p>
        </Link>
        <Link href="/admin/reconcile" className="rounded-lg bg-gray-900 border border-gray-800 p-6 hover:border-gray-600 transition">
          <p className="font-semibold">Reconcile</p>
          <p className="text-sm text-gray-400 mt-1">Transaction overview</p>
        </Link>
      </div>
    </div>
  );
}
