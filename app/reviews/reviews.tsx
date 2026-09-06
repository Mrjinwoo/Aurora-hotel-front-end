"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Header from "../../Header/Header";
import { getToken } from "../../lib/auth";

const API = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

type Review = { id: number; name: string; rating: number; comment: string };

function StarRating({ value, onChange }: { value: number; onChange?: (v: number) => void }) {
  const [hovered, setHovered] = useState(0);
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button key={star} type="button" onClick={() => onChange?.(star)}
          onMouseEnter={() => onChange && setHovered(star)}
          onMouseLeave={() => onChange && setHovered(0)}
          className="text-2xl focus:outline-none">
          <span className={(hovered || value) >= star ? "text-yellow-400" : "text-gray-300"}>★</span>
        </button>
      ))}
    </div>
  );
}

export default function ReviewsPage() {
  const router = useRouter();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [form, setForm] = useState({ name: "", rating: 0, comment: "" });
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    setIsLoggedIn(!!localStorage.getItem("token"));
    fetch(`${API}/api/reviews/`)
      .then((r) => r.json())
      .then(setReviews)
      .catch(() => setReviews([]));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const token = await getToken();
    if (!token) { router.push("/login?redirect=/reviews"); return; }
    if (form.rating === 0) { setError("Please select a star rating."); return; }
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/reviews/`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.detail || "Failed to submit review."); return; }
      setReviews([data, ...reviews]);
      setForm({ name: "", rating: 0, comment: "" });
      setSubmitted(true);
      setTimeout(() => setSubmitted(false), 3000);
    } catch {
      setError("Cannot connect to server.");
    } finally {
      setLoading(false);
    }
  }

  const avg = reviews.length ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1) : "0.0";

  return (
    <>
      <Header />
      <div className="bg-emerald-800 py-16 text-center text-white pt-28">
        <h1 className="text-5xl font-bold mb-2">Guest Reviews</h1>
        <p className="text-emerald-200">See what our guests are saying</p>
      </div>
      <main className="max-w-4xl mx-auto px-6 py-16">
        <div className="bg-emerald-50 rounded-xl p-6 text-center mb-12">
          <p className="text-6xl font-bold text-emerald-700 mb-1">{avg}</p>
          <StarRating value={Math.round(Number(avg))} />
          <p className="text-gray-500 mt-2">{reviews.length} reviews</p>
        </div>
        <div className="bg-white rounded-xl shadow-md p-8 mb-12">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Leave a Review</h2>
          {!isLoggedIn ? (
            <div className="text-center py-6">
              <p className="text-gray-500 mb-4">You must be logged in to leave a review.</p>
              <button onClick={() => router.push("/login?redirect=/reviews")}
                className="bg-emerald-700 text-white px-8 py-3 rounded-lg font-semibold hover:bg-emerald-800 transition">
                Login to Leave a Review
              </button>
            </div>
          ) : (
            <>
              {submitted && <div className="bg-green-50 text-green-700 rounded-lg px-4 py-3 mb-4 text-sm font-medium">Thank you for your review!</div>}
              {error && <div className="bg-red-50 text-red-600 rounded-lg px-4 py-3 mb-4 text-sm">{error}</div>}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Your Name</label>
                  <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Juan dela Cruz" className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-600" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Rating</label>
                  <StarRating value={form.rating} onChange={(v) => setForm({ ...form, rating: v })} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Comment</label>
                  <textarea required value={form.comment} onChange={(e) => setForm({ ...form, comment: e.target.value })} placeholder="Share your experience..." rows={4} className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-600 resize-none" />
                </div>
                <button type="submit" disabled={loading} className="w-full bg-emerald-700 text-white py-3 rounded-lg font-semibold hover:bg-emerald-800 transition disabled:opacity-60">
                  {loading ? "Submitting..." : "Submit Review"}
                </button>
              </form>
            </>
          )}
        </div>
        <div className="space-y-6">
          {reviews.map((r) => (
            <div key={r.id} className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <p className="font-bold text-gray-800 mb-1">{r.name}</p>
              <StarRating value={r.rating} />
              <p className="text-gray-600 mt-3">{r.comment}</p>
            </div>
          ))}
          {reviews.length === 0 && <p className="text-center text-gray-400">No reviews yet. Be the first!</p>}
        </div>
      </main>
    </>
  );
}
