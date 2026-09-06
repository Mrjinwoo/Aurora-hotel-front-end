"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Header from "../../Header/Header";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export default function DashboardPage() {
  const router = useRouter();
  const [userName, setUserName] = useState("Guest");
  const [myBookings, setMyBookings] = useState<number | null>(null);
  const [availableRooms, setAvailableRooms] = useState<number | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { router.replace("/login?redirect=/dashboard"); return; }
    setUserName(localStorage.getItem("userName") || "Guest");

    // Fetch my bookings count
    fetch(`${API}/api/bookings/my/`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(data => {
        const list = Array.isArray(data) ? data : (data.results ?? []);
        setMyBookings(list.length);
      })
      .catch(() => setMyBookings(0));

    // Fetch available rooms count
    fetch(`${API}/api/rooms/`)
      .then(r => r.json())
      .then(data => {
        const list = Array.isArray(data) ? data : (data.results ?? []);
        setAvailableRooms(list.filter((r: any) => r.available).length);
      })
      .catch(() => setAvailableRooms(0));
  }, [router]);

  const cards = [
    { label: "Browse Rooms", icon: "🛏️", href: "/rooms", color: "bg-blue-600" },
    { label: "My Bookings", icon: "📋", href: "/my-bookings", color: "bg-emerald-600" },
    { label: "My Profile", icon: "👤", href: "/profile", color: "bg-purple-600" },
    { label: "Request Service", icon: "🛎️", href: "/services", color: "bg-orange-500" },
  ];

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gray-50 pt-28 pb-16">
        <div className="max-w-4xl mx-auto px-6">
          <h1 className="text-4xl font-bold text-gray-800 mb-1">Welcome, {userName}!</h1>
          <p className="text-gray-500 mb-10">What would you like to do today?</p>

          {/* Summary */}
          <div className="grid grid-cols-2 gap-4 mb-10">
            <div className="bg-white rounded-xl shadow p-6 text-center">
              <p className="text-4xl font-bold text-blue-600 mb-1">{availableRooms ?? "..."}</p>
              <p className="text-gray-500 font-medium">Available Rooms</p>
            </div>
            <div className="bg-white rounded-xl shadow p-6 text-center">
              <p className="text-4xl font-bold text-emerald-600 mb-1">{myBookings ?? "..."}</p>
              <p className="text-gray-500 font-medium">My Bookings</p>
            </div>
          </div>

          {/* Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {cards.map(({ label, icon, href, color }) => (
              <Link key={label} href={href} className={`${color} text-white rounded-xl p-8 text-center hover:opacity-90 transition shadow-md`}>
                <div className="text-5xl mb-4">{icon}</div>
                <p className="text-xl font-bold">{label}</p>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
