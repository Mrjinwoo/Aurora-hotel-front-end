"use client";
import Link from "next/link";
import Image from "next/image";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { clearAuth } from "../lib/auth";

export default function StaffHeader() {
  const router = useRouter();
  const pathname = usePathname();
  const [staffName, setStaffName] = useState("Staff");

  useEffect(() => {
    setStaffName(localStorage.getItem("userName") || "Staff");
  }, []);

  function handleLogout() {
    clearAuth();
    router.push("/login");
  }

  const navLinks = [
    { href: "/staff", label: "Dashboard" },
    { href: "/reviews", label: "Reviews" },
  ];

  return (
    <header className="fixed top-0 left-0 w-full bg-emerald-900/95 backdrop-blur-md shadow-md z-50">
      <div className="max-w-7xl mx-auto flex items-center justify-between px-6 py-4">
        <Link href="/staff" className="flex items-center space-x-3">
          <Image src="/logo.webp" alt="Aurora Hotel Logo" width={44} height={44} className="rounded-full" />
          <div>
            <h1 className="text-xl font-bold text-white">Aurora Hotel</h1>
            <p className="text-xs text-emerald-300">Staff Dashboard</p>
          </div>
        </Link>

        <nav className="hidden md:flex items-center space-x-8">
          {navLinks.map(({ href, label }) => {
            const isActive = pathname === href;
            return (
              <Link key={href} href={href}
                className={`font-medium transition border-b-2 pb-0.5 ${
                  isActive ? "text-white border-emerald-300" : "text-emerald-200 hover:text-white border-transparent"
                }`}>
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-3">
          <span className="hidden md:flex items-center gap-2 bg-emerald-700 text-emerald-100 text-sm px-4 py-1.5 rounded-full font-medium">
            <span className="w-2 h-2 bg-green-400 rounded-full inline-block"></span>
            {staffName}
          </span>
          <button onClick={handleLogout} className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-semibold transition">
            Logout
          </button>
        </div>
      </div>
    </header>
  );
}
