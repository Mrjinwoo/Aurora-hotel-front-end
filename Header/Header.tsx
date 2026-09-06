"use client";
import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import StaffHeader from "./StaffHeader";
import AdminHeader from "./AdminHeader";

export default function Header() {
  const router = useRouter();
  const [role, setRole] = useState<string | null>(null);
  const [userName, setUserName] = useState("");

  useEffect(() => {
    setRole(localStorage.getItem("role"));
    setUserName(localStorage.getItem("userName") || "");
  }, []);

  if (role === "admin") return <AdminHeader />;
  if (role === "staff") return <StaffHeader />;

  function handleLogout() {
    localStorage.clear();
    setRole(null);
    router.push("/");
  }

  return (
    <header className="fixed top-0 left-0 w-full bg-white/90 backdrop-blur-md shadow-sm z-50">
      <div className="max-w-7xl mx-auto flex items-center justify-between px-6 py-4">

        {/* Logo */}
        <Link href="/" className="flex items-center space-x-3">
          <Image src="/logo.webp" alt="Aurora Hotel Logo" width={44} height={44} className="rounded-full" />
          <div>
            <h1 className="text-xl font-bold text-gray-800">Aurora Hotel</h1>
            <p className="text-xs text-gray-500">Luxury Hotel Booking</p>
          </div>
        </Link>

        {/* Navigation */}
        <nav className="hidden md:flex items-center space-x-8">
          <Link href="/" className="text-gray-700 hover:text-emerald-700 transition font-medium">Home</Link>
          <Link href="/rooms" className="text-gray-700 hover:text-emerald-700 transition font-medium">Rooms</Link>
          <Link href="/services" className="text-gray-700 hover:text-emerald-700 transition font-medium">Services</Link>
          <Link href="/about" className="text-gray-700 hover:text-emerald-700 transition font-medium">About</Link>
          <Link href="/contact" className="text-gray-700 hover:text-emerald-700 transition font-medium">Contact</Link>
          {role === "guest" && (
            <Link href="/my-bookings" className="text-gray-700 hover:text-emerald-700 transition font-medium">My Bookings</Link>
          )}
        </nav>

        {/* Buttons */}
        <div className="flex items-center gap-3">
          {role === "guest" ? (
            <>
              <span className="hidden md:block text-sm text-gray-600 font-medium">Hi, {userName}</span>
              <Link href="/dashboard" className="hidden md:block px-4 py-2 border border-emerald-700 rounded-lg text-emerald-700 hover:bg-emerald-50 transition text-sm font-medium">Dashboard</Link>
              <button onClick={handleLogout} className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition font-medium text-sm">Logout</button>
            </>
          ) : (
            <>
              <Link href="/login" className="hidden md:block px-5 py-2 border border-emerald-700 rounded-lg text-emerald-700 hover:bg-emerald-50 transition">Login</Link>
              <Link href="/booking" className="px-5 py-2 bg-emerald-700 text-white rounded-lg hover:bg-emerald-800 transition">Book Now</Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}