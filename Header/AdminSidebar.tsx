"use client";
import Link from "next/link";
import Image from "next/image";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const NAV = [
  { href: "/admin",            icon: "📊", label: "Dashboard" },
  { href: "/admin/rooms",      icon: "🏨", label: "Rooms" },
  { href: "/admin/bookings",   icon: "📋", label: "Bookings" },
  { href: "/admin/customers",  icon: "👥", label: "Customers" },
  { href: "/admin/staff",      icon: "👤", label: "Staff" },
  { href: "/admin/services",   icon: "🛎️", label: "Services" },
  { href: "/admin/reports",    icon: "📈", label: "Reports" },
];

export default function AdminSidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const [userName, setUserName] = useState("Admin");

  useEffect(() => { setUserName(localStorage.getItem("userName") || "Admin"); }, []);

  function handleLogout() { localStorage.clear(); router.push("/login"); }

  return (
    <aside className="fixed top-0 left-0 h-full w-60 bg-slate-900 flex flex-col z-50 shadow-xl">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-slate-700">
        <Link href="/admin" className="flex items-center gap-3">
          <Image src="/logo.webp" alt="Logo" width={38} height={38} className="rounded-full" />
          <div>
            <p className="text-white font-bold text-sm leading-tight">Aurora Hotel</p>
            <p className="text-slate-400 text-xs">Admin Panel</p>
          </div>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {NAV.map(({ href, icon, label }) => {
          const isActive = pathname === href;
          return (
            <Link key={href} href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition ${
                isActive
                  ? "bg-emerald-600 text-white"
                  : "text-slate-300 hover:bg-slate-800 hover:text-white"
              }`}>
              <span className="text-base">{icon}</span>
              {label}
            </Link>
          );
        })}
      </nav>

      {/* User + Logout */}
      <div className="px-4 py-4 border-t border-slate-700 space-y-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-yellow-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
            {userName[0]?.toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="text-white text-sm font-semibold truncate">{userName}</p>
            <p className="text-slate-400 text-xs">Administrator</p>
          </div>
        </div>
        <button onClick={handleLogout}
          className="w-full bg-red-600 hover:bg-red-700 text-white text-sm font-semibold py-2 rounded-lg transition">
          Logout
        </button>
      </div>
    </aside>
  );
}
