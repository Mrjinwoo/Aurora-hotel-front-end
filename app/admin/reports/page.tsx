"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AdminSidebar from "../../../Header/AdminSidebar";
import { getToken } from "../../../lib/auth";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

type Status = "Pending" | "Confirmed" | "Checked-In" | "Completed" | "Cancelled";

const STATUS_CONFIG: { status: Status; color: string; bg: string; icon: string }[] = [
  { status: "Pending",    color: "text-yellow-700", bg: "bg-yellow-50",  icon: "⏳" },
  { status: "Confirmed",  color: "text-green-700",  bg: "bg-green-50",   icon: "✅" },
  { status: "Checked-In", color: "text-blue-700",   bg: "bg-blue-50",    icon: "🏨" },
  { status: "Completed",  color: "text-gray-700",   bg: "bg-gray-100",   icon: "🎉" },
  { status: "Cancelled",  color: "text-red-600",    bg: "bg-red-50",     icon: "❌" },
];

type Stats = {
  total_bookings: number;
  pending_bookings: number;
  confirmed_bookings: number;
  cancelled_bookings: number;
  total_revenue: number;
};

export default function AdminReportsPage() {
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);
  const [stats, setStats] = useState<Stats | null>(null);
  const [checkedIn, setCheckedIn] = useState(0);
  const [completed, setCompleted] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const role = localStorage.getItem("role");
    if (role !== "admin") { router.replace("/login"); return; }
    setAuthorized(true);
    fetchData();
  }, [router]);

  async function fetchData() {
    const token = await getToken();
    if (!token) return;
    try {
      const [statsRes, bookingsRes] = await Promise.all([
        fetch(`${API}/api/admin/stats/`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API}/api/bookings/`, { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      if (statsRes.ok) setStats(await statsRes.json());
      if (bookingsRes.ok) {
        const data = await bookingsRes.json();
        const list = Array.isArray(data) ? data : (data.results ?? []);
        setCheckedIn(list.filter((b: any) => b.status === "Checked-In").length);
        setCompleted(list.filter((b: any) => b.status === "Completed").length);
      }
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }

  if (!authorized) return null;

  const statusCounts: Record<Status, number> = {
    Pending:      stats?.pending_bookings ?? 0,
    Confirmed:    stats?.confirmed_bookings ?? 0,
    "Checked-In": checkedIn,
    Completed:    completed,
    Cancelled:    stats?.cancelled_bookings ?? 0,
  };

  const total = stats?.total_bookings ?? 0;

  return (
    <div className="flex min-h-screen bg-slate-50">
      <AdminSidebar />
      <div className="flex-1 ml-60">
        <div className="bg-white border-b px-8 py-4">
          <p className="text-xs text-slate-400 uppercase tracking-widest font-medium">Admin › Reports</p>
          <h1 className="text-xl font-bold text-slate-800">Reports</h1>
        </div>
        <div className="px-8 py-8">
          <p className="text-slate-500 text-sm mb-8">Booking statistics overview</p>

          {loading ? (
            <div className="text-center py-20 text-gray-400">Loading reports...</div>
          ) : (
            <>
              {/* Total + Revenue */}
              <div className="grid grid-cols-2 gap-6 mb-8">
                <div className="bg-gray-900 text-white rounded-xl shadow p-6 text-center">
                  <p className="text-5xl font-bold mb-1">{total}</p>
                  <p className="text-gray-300 font-medium">Total Bookings</p>
                </div>
                <div className="bg-white rounded-xl shadow p-6 text-center">
                  <p className="text-5xl font-bold text-gray-800 mb-1">₱{(stats?.total_revenue ?? 0).toLocaleString()}</p>
                  <p className="text-gray-500 font-medium">Total Revenue</p>
                </div>
              </div>

              {/* Booking Statistics */}
              <h2 className="text-lg font-bold text-gray-700 mb-4">Booking Statistics</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-5 mb-10">
                {STATUS_CONFIG.map(({ status, color, bg, icon }) => {
                  const count = statusCounts[status];
                  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
                  return (
                    <div key={status} className={`${bg} rounded-xl shadow p-6 text-center`}>
                      <div className="text-3xl mb-2">{icon}</div>
                      <p className={`text-4xl font-bold mb-1 ${color}`}>{count}</p>
                      <p className="text-gray-600 font-medium text-sm">{status}</p>
                      <div className="mt-3 bg-white rounded-full h-2 overflow-hidden">
                        <div className="h-2 bg-gray-400 rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                      <p className="text-xs text-gray-400 mt-1">{pct}% of total</p>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
