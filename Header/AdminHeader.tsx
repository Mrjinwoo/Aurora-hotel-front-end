"use client";
import Link from "next/link";
import Image from "next/image";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";

export default function AdminHeader() {
  const router = useRouter();
  const pathname = usePathname();
  const [userName, setUserName] = useState("Admin");

  useEffect(() => {
    setUserName(localStorage.getItem("userName") || "Admin");
  }, []);

  function handleLogout() {
    localStorage.clear();
    router.push("/login");
  }

  return (
    <header className="fixed top-0 left-0 w-full bg-gray-900 shadow-lg z-50">
      <div className="max-w-7xl mx-auto flex items-center justify-between px-6 py-4">
        <Link href="/admin" className="flex items-center space-x-3">
          <Image src="/logo.webp" alt="Aurora Hotel Logo" width={44} height={44} className="rounded-full" />
          <div>
            <h1 className="text-xl font-bold text-white">Aurora Hotel</h1>
            <p className="text-xs text-gray-400">Admin Panel</p>
          </div>
        </Link>

        <nav className="hidden md:flex items-center space-x-6">
          {[
            { href: "/admin", label: "Dashboard" },
            { href: "/admin/rooms", label: "Rooms" },
            { href: "/admin/bookings", label: "Bookings" },
            { href: "/admin/customers", label: "Customers" },
            { href: "/admin/staff", label: "Staff" },
            { href: "/admin/services", label: "Services" },
            { href: "/admin/reports", label: "Reports" },
          ].map(({ href, label }) => {
            const isActive = pathname === href;
            return (
              <Link key={href} href={href}
                className={`font-medium text-sm transition border-b-2 pb-0.5 ${
                  isActive ? "text-white border-yellow-400" : "text-gray-300 hover:text-white border-transparent"
                }`}>
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-3">
          <span className="hidden md:flex items-center gap-2 bg-gray-700 text-gray-200 text-sm px-4 py-1.5 rounded-full font-medium">
            <span className="w-2 h-2 bg-yellow-400 rounded-full inline-block"></span>
            {userName} (Admin)
          </span>
          <button onClick={handleLogout} className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-semibold transition">
            Logout
          </button>
        </div>
      </div>
    </header>
  );
}
