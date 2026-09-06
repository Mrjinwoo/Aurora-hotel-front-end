"use client";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { clearAuth } from "../lib/auth";

type Props = {
  tab: string;
  setTab: (t: any) => void;
  pendingSvcCount: number;
  openIssueCount: number;
};

const NAV = [
  { key: "dashboard",        icon: "📊", label: "Dashboard" },
  { key: "bookings",         icon: "📋", label: "Bookings" },
  { key: "rooms",            icon: "🏨", label: "Room Availability" },
  { key: "service-requests", icon: "🛎️", label: "Service Requests" },
  { key: "issues",           icon: "🚨", label: "Room Issues" },
];

export default function StaffSidebar({ tab, setTab, pendingSvcCount, openIssueCount }: Props) {
  const router = useRouter();
  const [staffName, setStaffName] = useState("Staff");

  useEffect(() => { setStaffName(localStorage.getItem("userName") || "Staff"); }, []);

  function handleLogout() { clearAuth(); router.push("/login"); }

  return (
    <aside className="fixed top-0 left-0 h-full w-60 bg-emerald-900 flex flex-col z-50 shadow-xl">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-emerald-700">
        <div className="flex items-center gap-3">
          <Image src="/logo.webp" alt="Logo" width={38} height={38} className="rounded-full" />
          <div>
            <p className="text-white font-bold text-sm leading-tight">Aurora Hotel</p>
            <p className="text-emerald-300 text-xs">Staff Panel</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {NAV.map(({ key, icon, label }) => {
          const isActive = tab === key;
          const badge = key === "service-requests" ? pendingSvcCount : key === "issues" ? openIssueCount : 0;
          return (
            <button key={key} onClick={() => setTab(key)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition text-left ${
                isActive
                  ? "bg-white/20 text-white"
                  : "text-emerald-200 hover:bg-emerald-800 hover:text-white"
              }`}>
              <span className="text-base">{icon}</span>
              <span className="flex-1">{label}</span>
              {badge > 0 && (
                <span className="bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5 font-bold">{badge}</span>
              )}
            </button>
          );
        })}
      </nav>

      {/* User + Logout */}
      <div className="px-4 py-4 border-t border-emerald-700 space-y-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
            {staffName[0]?.toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="text-white text-sm font-semibold truncate">{staffName}</p>
            <div className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-green-400 rounded-full inline-block"></span>
              <p className="text-emerald-300 text-xs">Online</p>
            </div>
          </div>
        </div>
        <button onClick={handleLogout}
          className="w-full bg-red-500 hover:bg-red-600 text-white text-sm font-semibold py-2 rounded-lg transition">
          Logout
        </button>
      </div>
    </aside>
  );
}
