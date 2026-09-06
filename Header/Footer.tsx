"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/rooms", label: "Rooms" },
  { href: "/services", label: "Services" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
  { href: "/reviews", label: "Reviews" },
  { href: "/my-bookings", label: "My Bookings" },
];

const CONTACT = [
  { icon: "📍", text: "Balud, San Fernando, Cebu City, Philippines" },
  { icon: "📞", text: "+63 975-940-3511" },
  { icon: "✉️", text: "admin@aurorahotel.com" },
  { icon: "🕐", text: "Front Desk: 24/7" },
];

export default function Footer() {
  const pathname = usePathname();
  const [avgRating, setAvgRating] = useState<string | null>(null);
  const [reviewCount, setReviewCount] = useState<number | null>(null);

  useEffect(() => {
    if (pathname.startsWith("/admin") || pathname.startsWith("/staff")) return;
    fetch(`${API}/api/reviews/`)
      .then(r => r.json())
      .then((data: { rating: number }[]) => {
        if (data.length) {
          setAvgRating((data.reduce((s, r) => s + r.rating, 0) / data.length).toFixed(1));
          setReviewCount(data.length);
        }
      })
      .catch(() => {});
  }, []);

  if (pathname.startsWith("/admin") || pathname.startsWith("/staff")) return null;

  return (
    <footer className="relative bg-gray-900 text-gray-300">
      {/* Wave top edge */}
      <div className="overflow-hidden leading-none">
        <svg viewBox="0 0 1440 60" xmlns="http://www.w3.org/2000/svg" className="w-full block" preserveAspectRatio="none" style={{ height: 60 }}>
          <path d="M0,30 C360,60 1080,0 1440,30 L1440,0 L0,0 Z" fill="#f9fafb" />
        </svg>
      </div>

      <div className="max-w-3xl mx-auto px-6 pt-8 pb-12 text-center">
        {/* Brand */}
        <h3 className="text-emerald-400 text-3xl font-bold tracking-tight mb-1">Aurora Hotel</h3>
        <p className="text-gray-400 text-sm mb-3">Luxury, comfort, and world-class service in the heart of the city.</p>
        {avgRating && reviewCount && (
          <div className="inline-flex items-center gap-2 bg-gray-800 rounded-full px-4 py-1.5 mb-6">
            <span className="text-yellow-400">{"★".repeat(Math.round(Number(avgRating)))}<span className="text-gray-600">{"★".repeat(5 - Math.round(Number(avgRating)))}</span></span>
            <span className="text-sm text-gray-300 font-semibold">{avgRating}</span>
            <span className="text-xs text-gray-500">from {reviewCount} guests</span>
          </div>
        )}

        {/* Nav row */}
        <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 mb-6">
          {NAV_LINKS.map(({ href, label }) => (
            <Link key={href + label} href={href} className="text-sm text-gray-400 hover:text-emerald-400 transition">{label}</Link>
          ))}
        </div>

        {/* Divider */}
        <div className="border-t border-gray-700 mb-6" />

        {/* Contact strip */}
        <div className="flex flex-wrap justify-center gap-x-8 gap-y-2 text-sm text-gray-400">
          {CONTACT.map(({ icon, text }) => (
            <span key={text} className="flex items-center gap-1.5">
              <span>{icon}</span>{text}
            </span>
          ))}
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-gray-500">
          <span>© {new Date().getFullYear()} Aurora Hotel. All rights reserved.</span>
          <div className="flex gap-4">
            <Link href="/about" className="hover:text-emerald-400 transition">Privacy Policy</Link>
            <Link href="/about" className="hover:text-emerald-400 transition">Terms of Service</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
