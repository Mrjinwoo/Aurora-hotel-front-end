"use client";
import { useEffect, useState } from "react";
import Header from "../Header/Header";
import Link from "next/link";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

type Review = { id: number; name: string; rating: number; comment: string };

function initials(name: string) {
  return name.split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase();
}

const AVATAR_COLORS = [
  "bg-emerald-600", "bg-blue-600", "bg-purple-600", "bg-rose-600", "bg-amber-600",
];

export default function Home() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    setIsLoggedIn(!!localStorage.getItem("token"));
    fetch(`${API}/api/reviews/`)
      .then(r => r.json())
      .then((data: Review[]) => setReviews(data.slice(0, 6)))
      .catch(() => setReviews([]));
  }, []);

  return (
    <>
      <Header />
      <main className="pt-24">
        <section className="h-screen bg-[url('/aurora.jpg')] bg-cover bg-center bg-no-repeat flex items-center justify-center">
          <div className="text-center text-white bg-black/50 p-10 rounded-xl">
            <h1 className="text-6xl font-bold mb-4">Welcome to Aurora Hotel</h1>
            <p className="text-xl mb-8">Find the perfect room for your stay.</p>
            <Link href="/rooms" className="bg-emerald-700 px-8 py-4 rounded-lg hover:bg-emerald-800">
              Book Your Stay
            </Link>
          </div>
        </section>

        <section className="py-16 bg-gray-50">
          <div className="max-w-7xl mx-auto px-6 text-center">
            <h2 className="text-4xl font-bold text-gray-800 mb-4">Why Choose Aurora Hotel?</h2>
            <p className="text-gray-500 mb-12">Experience luxury, comfort, and world-class service.</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                { icon: "\uD83D\uDECF\uFE0F", title: "Luxury Rooms", desc: "Elegantly designed rooms with premium amenities." },
                { icon: "\uD83C\uDF7D\uFE0F", title: "Fine Dining", desc: "World-class cuisine crafted by top chefs." },
                { icon: "\uD83C\uDFCA", title: "Premium Facilities", desc: "Pool, spa, gym and more at your fingertips." },
              ].map(({ icon, title, desc }) => (
                <div key={title} className="bg-white p-8 rounded-xl shadow">
                  <div className="text-5xl mb-4">{icon}</div>
                  <h3 className="text-xl font-bold text-gray-800 mb-2">{title}</h3>
                  <p className="text-gray-500">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-16 bg-gray-50">
          <div className="max-w-6xl mx-auto px-6 text-center">
            <h2 className="text-4xl font-bold text-gray-800 mb-2">What Our Guests Say</h2>
            <p className="text-gray-500 mb-10">Real experiences from real guests</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {reviews.length === 0 ? (
                <div className="col-span-3 text-gray-400 py-10">No reviews yet. Be the first!</div>
              ) : reviews.map((r, i) => (
                <div key={r.id} className="bg-white p-6 rounded-xl shadow text-left flex flex-col border-l-4 border-emerald-500 relative overflow-hidden">
                  <span className="absolute top-3 right-4 text-7xl text-emerald-50 font-serif leading-none select-none">&ldquo;</span>
                  <p className="text-yellow-400 text-lg mb-3">
                    {"★".repeat(r.rating)}<span className="text-gray-200">{"★".repeat(5 - r.rating)}</span>
                  </p>
                  <p className="text-gray-600 text-sm mb-5 flex-1">&ldquo;{r.comment}&rdquo;</p>
                  <div className="flex items-center gap-3 mt-auto">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0 ${AVATAR_COLORS[i % AVATAR_COLORS.length]}`}>
                      {initials(r.name)}
                    </div>
                    <div>
                      <p className="font-bold text-gray-800 text-sm">{r.name}</p>
                      <p className="text-xs text-emerald-600 font-medium">Verified Guest</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <Link href={isLoggedIn ? "/reviews" : "/login?redirect=/reviews"} className="inline-block bg-emerald-700 text-white px-6 py-3 rounded-lg hover:bg-emerald-800 transition font-semibold">
              Leave a Review
            </Link>
          </div>
        </section>
      </main>
    </>
  );
}