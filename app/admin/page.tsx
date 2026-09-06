"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import AdminSidebar from "../../Header/AdminSidebar";
import { getToken } from "../../lib/auth";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

type Stats = {
  total_rooms: number;
  available_rooms: number;
  total_bookings: number;
  pending_bookings: number;
  confirmed_bookings: number;
  total_revenue: number;
  total_customers: number;
  total_staff: number;
};

export default function AdminDashboard() {
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    const role = localStorage.getItem("role");
    if (role !== "admin") { router.replace("/login"); return; }
    setAuthorized(true);
    fetchStats();
  }, [router]);

  async function fetchStats() {
    const token = await getToken();
    if (!token) return;
    try {
      const res = await fetch(`${API}/api/admin/stats/`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) setStats(await res.json());
    } catch { /* use fallback */ }
  }

  if (!authorized) return null;

  const cards = stats ? [
    { label: "Total Rooms", value: stats.total_rooms, color: "text-blue-600", bg: "bg-blue-50", icon: "🏨", href: "/admin/rooms" },
    { label: "Available Rooms", value: stats.available_rooms, color: "text-green-600", bg: "bg-green-50", icon: "✅", href: "/admin/rooms" },
    { label: "Total Bookings", value: stats.total_bookings, color: "text-purple-600", bg: "bg-purple-50", icon: "📋", href: "/admin/bookings" },
    { label: "Pending Bookings", value: stats.pending_bookings, color: "text-yellow-600", bg: "bg-yellow-50", icon: "⏳", href: "/admin/bookings" },
    { label: "Confirmed Bookings", value: stats.confirmed_bookings, color: "text-emerald-600", bg: "bg-emerald-50", icon: "🎟️", href: "/admin/bookings" },
    { label: "Total Revenue", value: `₱${stats.total_revenue.toLocaleString()}`, color: "text-gray-800", bg: "bg-gray-50", icon: "💰", href: "/admin/reports" },
    { label: "Total Customers", value: stats.total_customers, color: "text-indigo-600", bg: "bg-indigo-50", icon: "👥", href: "/admin/customers" },
    { label: "Total Staff", value: stats.total_staff, color: "text-pink-600", bg: "bg-pink-50", icon: "👤", href: "/admin/staff" },
  ] : [];

  return (
    <div className="flex min-h-screen bg-slate-50">
      <AdminSidebar />
      <div className="flex-1 ml-60">
        <div className="bg-white border-b px-8 py-4">
          <p className="text-xs text-slate-400 uppercase tracking-widest font-medium">Admin Panel</p>
          <h1 className="text-xl font-bold text-slate-800">Dashboard</h1>
        </div>
        <div className="px-8 py-8">
          <p className="text-slate-500 mb-8">Overview of Aurora Hotel operations</p>
          {stats ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {cards.map(({ label, value, color, bg, icon, href }) => (
                <Link key={label} href={href}
                  className={`${bg} rounded-xl shadow p-6 text-center hover:shadow-md transition hover:-translate-y-0.5 group`}>
                  <div className="text-3xl mb-2">{icon}</div>
                  <p className={`text-4xl font-bold mb-1 ${color}`}>{value}</p>
                  <p className="text-gray-600 font-medium text-sm">{label}</p>
                  <p className="text-xs text-gray-400 mt-2 group-hover:text-gray-600 transition">View details →</p>
                </Link>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="bg-white rounded-xl shadow p-6 animate-pulse">
                  <div className="w-8 h-8 bg-gray-200 rounded-full mx-auto mb-3" />
                  <div className="h-8 bg-gray-200 rounded w-16 mx-auto mb-2" />
                  <div className="h-4 bg-gray-100 rounded w-24 mx-auto" />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
