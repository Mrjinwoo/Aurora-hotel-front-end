"use client";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState, useMemo } from "react";
import Header from "../../../Header/Header";
import { decodeToken, getToken } from "../../../lib/auth";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

type Room = {
  id: number;
  room_number: string;
  category: string;
  name: string;
  price: number;
  beds: number;
  guests: number;
  desc: string;
  available: boolean;
  image: string | null;
  images?: { id: number; image: string }[];
  amenities?: string[];
};

type BookedRange = { check_in: string; check_out: string };

function getImageUrl(image: string | null): string | null {
  if (!image) return null;
  if (image.startsWith("http")) return image;
  return `${API}${image}`;
}

const AMENITY_ICONS: Record<string, string> = {
  "Wi-Fi": "📶", "WiFi": "📶", "AC": "❄️", "Air Conditioning": "❄️",
  "TV": "📺", "Mini Bar": "🍹", "Minibar": "🍹", "Safe": "🔒",
  "Bathtub": "🛁", "Shower": "🚿", "Balcony": "🌅", "Ocean View": "🌊",
  "Room Service": "🛎️", "Gym": "🏋️", "Pool": "🏊", "Parking": "🅿️",
};

function getAmenityIcon(a: string) {
  for (const key of Object.keys(AMENITY_ICONS)) {
    if (a.toLowerCase().includes(key.toLowerCase())) return AMENITY_ICONS[key];
  }
  return "✓";
}

// Returns all dates (YYYY-MM-DD) in [start, end) range
function getDatesInRange(start: string, end: string): Set<string> {
  const dates = new Set<string>();
  const cur = new Date(start);
  const last = new Date(end);
  while (cur < last) {
    dates.add(cur.toISOString().split("T")[0]);
    cur.setDate(cur.getDate() + 1);
  }
  return dates;
}

type RoomReview = {
  id: number;
  name: string;
  rating: number;
  comment: string;
  created_at?: string;
};

function StarRating({
  value,
  onChange,
  size = "text-2xl",
}: {
  value: number;
  onChange?: (v: number) => void;
  size?: string;
}) {
  const [hovered, setHovered] = useState(0);
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange?.(star)}
          onMouseEnter={() => onChange && setHovered(star)}
          onMouseLeave={() => onChange && setHovered(0)}
          className={`${size} focus:outline-none ${onChange ? "cursor-pointer" : "cursor-default"}`}
          aria-label={`${star} star${star !== 1 ? "s" : ""}`}
        >
          <span className={(hovered || value) >= star ? "text-yellow-400" : "text-gray-300"}>★</span>
        </button>
      ))}
    </div>
  );
}

function getRatingLabel(score: number): string {
  if (score >= 9.0) return "Superb";
  if (score >= 8.0) return "Excellent";
  if (score >= 7.0) return "Very Good";
  if (score >= 6.0) return "Good";
  if (score >= 4.0) return "Fair";
  return "Poor";
}

function RoomRatingSummary({ roomId }: { roomId: string }) {
  const [avg, setAvg] = useState<string | null>(null);
  const [count, setCount] = useState(0);

  useEffect(() => {
    fetch(`${API}/api/reviews/?room=${roomId}`)
      .then(r => r.json())
      .then(data => {
        const list: RoomReview[] = Array.isArray(data) ? data : data.results ?? [];
        if (list.length > 0) {
          const a = (list.reduce((s, r) => s + r.rating, 0) / list.length).toFixed(1);
          setAvg(a);
          setCount(list.length);
        }
      })
      .catch(() => {});
  }, [roomId]);

  if (!avg) return null;
  const score = Number(avg) * 2;
  return (
    <div className="flex items-center gap-2 mt-2">
      <span className="bg-emerald-700 text-white text-sm font-bold px-2 py-0.5 rounded">
        {score.toFixed(1)}
      </span>
      <span className="text-sm font-semibold text-gray-800">{getRatingLabel(score)}</span>
      <span className="text-xs text-gray-400">({count} rating{count !== 1 ? "s" : ""})</span>
    </div>
  );
}

function RoomReviews({ roomId, userName, hasCompletedBooking }: { roomId: string | string[]; userName: string; hasCompletedBooking: boolean }) {
  const router = useRouter();
  const [reviews, setReviews] = useState<RoomReview[]>([]);
  const [form, setForm] = useState({ name: userName, rating: 0, comment: "" });
  const [loading, setLoading] = useState(false);
  const [fetchingReviews, setFetchingReviews] = useState(true);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  // keep name in sync if userName loads after mount
  useEffect(() => {
    setForm(f => ({ ...f, name: userName }));
  }, [userName]);

  useEffect(() => {
    fetch(`${API}/api/reviews/?room=${roomId}`)
      .then(r => r.json())
      .then(data => setReviews(Array.isArray(data) ? data : data.results ?? []))
      .catch(() => setReviews([]))
      .finally(() => setFetchingReviews(false));
  }, [roomId]);

  const avg = reviews.length
    ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
    : null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const token = await getToken();
    if (!token) {
      router.push(`/login?redirect=${encodeURIComponent(`/rooms/${roomId}`)}`);
      return;
    }
    if (form.rating === 0) { setError("Please select a star rating."); return; }
    if (!form.name.trim()) { setError("Please enter your name."); return; }
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/reviews/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          room_id: Number(roomId),
          name: form.name.trim(),
          rating: form.rating,
          comment: form.comment.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.detail || data.non_field_errors?.[0] || "Failed to submit review.");
        return;
      }
      setReviews(prev => [data, ...prev]);
      setForm(f => ({ ...f, rating: 0, comment: "" }));
      setSubmitted(true);
      setTimeout(() => setSubmitted(false), 4000);
    } catch {
      setError("Cannot connect to server.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-8">
      {/* Section header */}
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-xl font-bold text-gray-800">Guest Reviews</h2>
        {avg && (
          <div className="flex items-center gap-2">
            <span className="bg-emerald-700 text-white text-sm font-bold px-2 py-0.5 rounded">
              {(Number(avg) * 2).toFixed(1)}
            </span>
            <span className="text-sm font-semibold text-gray-800">{getRatingLabel(Number(avg) * 2)}</span>
            <span className="text-gray-400 text-sm">({reviews.length} rating{reviews.length !== 1 ? "s" : ""})</span>
          </div>
        )}
      </div>

      {/* Review form — only for guests with a completed booking */}
      <div className="bg-white rounded-xl shadow p-6 mb-6 border border-gray-100">
        <h3 className="text-base font-semibold text-gray-800 mb-4">Leave a Review</h3>
        {!hasCompletedBooking ? (
          <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 rounded-lg px-4 py-3 text-sm">
            ⭐ Only guests who have completed a stay in this room can leave a review.
          </div>
        ) : (
          <>
            {submitted && (
              <div className="bg-green-50 text-green-700 rounded-lg px-4 py-3 mb-4 text-sm font-medium">
                ✅ Thank you for your review!
              </div>
            )}
            {error && (
              <div className="bg-red-50 text-red-600 rounded-lg px-4 py-3 mb-4 text-sm">
                {error}
              </div>
            )}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Your Name</label>
                <input
                  required
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  placeholder="Juan dela Cruz"
                  className="w-full border border-gray-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Rating</label>
                <StarRating value={form.rating} onChange={v => setForm({ ...form, rating: v })} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Comment</label>
                <textarea
                  required
                  value={form.comment}
                  onChange={e => setForm({ ...form, comment: e.target.value })}
                  placeholder="Share your experience with this room..."
                  rows={3}
                  className="w-full border border-gray-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-emerald-700 text-white py-2.5 rounded-lg font-semibold text-sm hover:bg-emerald-800 transition disabled:opacity-60"
              >
                {loading ? "Submitting..." : "Submit Review"}
              </button>
            </form>
          </>
        )}
      </div>

      {/* Review list */}
      {fetchingReviews ? (
        <p className="text-center text-gray-400 text-sm py-4">Loading reviews...</p>
      ) : reviews.length === 0 ? (
        <p className="text-center text-gray-400 text-sm py-4">No reviews yet for this room. Be the first!</p>
      ) : (
        <div className="space-y-4">
          {reviews.map(r => (
            <div key={r.id} className="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
              <div className="flex items-start justify-between mb-1">
                <p className="font-semibold text-gray-800 text-sm">{r.name}</p>
                {r.created_at && (
                  <span className="text-xs text-gray-400">
                    {new Date(r.created_at).toLocaleDateString("en-PH", { year: "numeric", month: "short", day: "numeric" })}
                  </span>
                )}
              </div>
              <StarRating value={r.rating} size="text-base" />
              <p className="text-gray-600 text-sm mt-2 leading-relaxed">{r.comment}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function AvailabilityCalendar({ bookedRanges }: { bookedRanges: BookedRange[] }) {
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth()); // 0-indexed

  const bookedDates = useMemo(() => {
    const dates = new Set<string>();
    for (const r of bookedRanges) {
      getDatesInRange(r.check_in, r.check_out).forEach(d => dates.add(d));
    }
    return dates;
  }, [bookedRanges]);

  const firstDay = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const todayStr = today.toISOString().split("T")[0];

  function prevMonth() {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  }
  function nextMonth() {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  }

  const monthName = new Date(viewYear, viewMonth).toLocaleString("en-PH", { month: "long", year: "numeric" });

  return (
    <div className="mb-8">
      <h3 className="font-bold text-gray-800 mb-3">Availability Calendar</h3>
      <div className="border border-gray-200 rounded-xl p-4 bg-gray-50">
        {/* Legend */}
        <div className="flex gap-4 mb-3 text-xs text-gray-500">
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-red-200 inline-block" /> Booked</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-emerald-100 inline-block" /> Available</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-gray-200 inline-block" /> Past</span>
        </div>
        {/* Nav */}
        <div className="flex items-center justify-between mb-3">
          <button onClick={prevMonth} className="text-gray-500 hover:text-gray-800 px-2 py-1 rounded hover:bg-gray-200 transition">‹</button>
          <span className="font-semibold text-gray-700 text-sm">{monthName}</span>
          <button onClick={nextMonth} className="text-gray-500 hover:text-gray-800 px-2 py-1 rounded hover:bg-gray-200 transition">›</button>
        </div>
        {/* Day headers */}
        <div className="grid grid-cols-7 mb-1">
          {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map(d => (
            <div key={d} className="text-center text-xs font-semibold text-gray-400 py-1">{d}</div>
          ))}
        </div>
        {/* Days */}
        <div className="grid grid-cols-7 gap-0.5">
          {Array.from({ length: firstDay }).map((_, i) => <div key={`e-${i}`} />)}
          {Array.from({ length: daysInMonth }, (_, i) => {
            const day = i + 1;
            const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
            const isPast = dateStr < todayStr;
            const isBooked = bookedDates.has(dateStr);
            const isToday = dateStr === todayStr;
            let cls = "text-center text-xs py-1.5 rounded ";
            if (isPast) cls += "text-gray-300 bg-gray-100";
            else if (isBooked) cls += "bg-red-200 text-red-700 font-semibold";
            else cls += "bg-emerald-100 text-emerald-700";
            if (isToday) cls += " ring-2 ring-emerald-500";
            return <div key={day} className={cls}>{day}</div>;
          })}
        </div>
      </div>
    </div>
  );
}

function hasDateConflict(checkIn: string, checkOut: string, bookedRanges: BookedRange[]): boolean {
  const requested = getDatesInRange(checkIn, checkOut);
  for (const r of bookedRanges) {
    const booked = getDatesInRange(r.check_in, r.check_out);
    for (const d of requested) if (booked.has(d)) return true;
  }
  return false;
}

export default function RoomDetailsPage() {
  const { id } = useParams();
  const router = useRouter();
  const [room, setRoom] = useState<Room | null>(null);
  const [bookedRanges, setBookedRanges] = useState<BookedRange[]>([]);
  const [loading, setLoading] = useState(true);
  const [imgIndex, setImgIndex] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [hasCompletedBooking, setHasCompletedBooking] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      const payload = decodeToken(token);
      if (payload) {
        setUserName(payload.name || localStorage.getItem("userName") || "");
        setUserEmail(payload.email || localStorage.getItem("userEmail") || "");
      }
      fetch(`${API}/api/bookings/my/`, { headers: { Authorization: `Bearer ${token}` } })
        .then(r => r.json())
        .then(data => {
          const list = Array.isArray(data) ? data : (data.results ?? []);
          setHasCompletedBooking(list.some((b: any) => String(b.room_id) === String(id) && b.status === "Completed"));
        })
        .catch(() => {});
    }
    Promise.all([
      fetch(`${API}/api/rooms/${id}/`).then(r => r.json()),
      fetch(`${API}/api/rooms/${id}/bookings/`).then(r => r.json()).catch(() => []),
    ]).then(([roomData, bookingsData]) => {
      setRoom(roomData);
      setBookedRanges(Array.isArray(bookingsData) ? bookingsData : []);
    }).catch(() => setRoom(null))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return (
    <>
      <Header />
      <div className="pt-28 text-center text-gray-400">Loading room details...</div>
    </>
  );

  if (!room) return (
    <>
      <Header />
      <div className="pt-28 text-center text-gray-500">Room not found.</div>
    </>
  );

  const allImages: string[] = room.images?.map(i => getImageUrl(i.image) || "").filter(Boolean) ||
    (room.image ? [getImageUrl(room.image)!] : []);

  function handleBook() {
    const token = localStorage.getItem("token");
    const dest = `/booking?room=${encodeURIComponent(room!.name)}&price=${room!.price}&roomId=${room!.id}&roomNumber=${encodeURIComponent(room!.room_number)}`;
    if (!token) { router.push(`/login?redirect=${encodeURIComponent(dest)}`); return; }
    setShowModal(true);
  }

  function handleModalConfirm() {
    const dest = `/booking?room=${encodeURIComponent(room!.name)}&price=${room!.price}&roomId=${room!.id}&roomNumber=${encodeURIComponent(room!.room_number)}&checkIn=${checkIn}&checkOut=${checkOut}`;
    router.push(dest);
  }

  const modalNights = checkIn && checkOut
    ? Math.max(0, Math.ceil((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / 86400000))
    : 0;
  const modalTotal = modalNights * (room?.price || 0);
  const modalConflict = checkIn && checkOut ? hasDateConflict(checkIn, checkOut, bookedRanges) : false;

  const categoryLabel = room.category ? room.category.charAt(0).toUpperCase() + room.category.slice(1) : "";

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gray-50 pt-28 pb-16">
        <div className="max-w-3xl mx-auto px-6">

          {/* Images */}
          {allImages.length > 0 ? (
            <div className="relative h-72 rounded-xl overflow-hidden shadow-lg mb-8 group">
              <img src={allImages[imgIndex]} alt={room.name} className="w-full h-full object-cover" />
              {allImages.length > 1 && (
                <>
                  <button onClick={() => setImgIndex((imgIndex - 1 + allImages.length) % allImages.length)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full w-9 h-9 flex items-center justify-center opacity-0 group-hover:opacity-100 transition">‹</button>
                  <button onClick={() => setImgIndex((imgIndex + 1) % allImages.length)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full w-9 h-9 flex items-center justify-center opacity-0 group-hover:opacity-100 transition">›</button>
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                    {allImages.map((_, i) => (
                      <button key={i} onClick={() => setImgIndex(i)}
                        className={`w-2 h-2 rounded-full transition ${i === imgIndex ? "bg-white" : "bg-white/50"}`} />
                    ))}
                  </div>
                </>
              )}

            </div>
          ) : (
            <div className="h-72 rounded-xl bg-gray-200 flex items-center justify-center text-gray-400 mb-8">No image</div>
          )}

          {/* Thumbnail strip */}
          {allImages.length > 1 && (
            <div className="flex gap-2 mb-8 overflow-x-auto pb-1">
              {allImages.map((src, i) => (
                <button key={i} onClick={() => setImgIndex(i)}
                  className={`flex-shrink-0 w-20 h-14 rounded-lg overflow-hidden border-2 transition ${i === imgIndex ? "border-emerald-500" : "border-transparent"}`}>
                  <img src={src} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}

          <div className="bg-white rounded-xl shadow p-8">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-800">{room.name}</h1>
                <p className="text-gray-400 text-sm mt-1">Room {room.room_number} · {categoryLabel}</p>
                <RoomRatingSummary roomId={String(id)} />
              </div>
              <span className="px-4 py-1.5 rounded-full text-sm font-semibold bg-green-100 text-green-700">
                Available
              </span>
            </div>

            <p className="text-gray-600 mb-6">{room.desc}</p>

            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-emerald-50 rounded-lg p-4 text-center">
                <p className="text-2xl font-bold text-emerald-700">₱{Number(room.price).toLocaleString()}</p>
                <p className="text-gray-500 text-sm">per night</p>
              </div>
              <div className="bg-emerald-50 rounded-lg p-4 text-center">
                <p className="text-2xl font-bold text-emerald-700">{room.guests}</p>
                <p className="text-gray-500 text-sm">Max Guests</p>
              </div>
              <div className="bg-emerald-50 rounded-lg p-4 text-center">
                <p className="text-2xl font-bold text-emerald-700">{room.beds}</p>
                <p className="text-gray-500 text-sm">Bed{room.beds > 1 ? "s" : ""}</p>
              </div>
            </div>

            {/* Amenities */}
            {room.amenities && room.amenities.length > 0 && (
              <div className="mb-8">
                <h3 className="font-bold text-gray-800 mb-3">Amenities</h3>
                <div className="flex flex-wrap gap-2">
                  {room.amenities.map(a => (
                    <span key={a} className="bg-gray-100 text-gray-700 text-sm px-3 py-1.5 rounded-full">
                      {getAmenityIcon(a)} {a}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Availability Calendar */}
            <AvailabilityCalendar bookedRanges={bookedRanges} />

            <button
              onClick={handleBook}
              className="w-full py-4 rounded-xl font-bold text-lg transition bg-emerald-700 text-white hover:bg-emerald-800"
            >
              BOOK THIS ROOM
            </button>
          </div>

          {/* Per-room reviews */}
          <div id="reviews">
            <RoomReviews roomId={String(id)} userName={userName} hasCompletedBooking={hasCompletedBooking} />
          </div>
        </div>
      </div>

      {/* Booking Timetable Modal */}
      {showModal && room && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg relative flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="flex items-start justify-between p-6 pb-4 border-b border-gray-100">
              <div>
                <h2 className="text-xl font-bold text-gray-800">Select Your Dates</h2>
                <p className="text-gray-500 text-sm">{room.name} · Room {room.room_number}</p>
              </div>
              <button onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-700 text-xl font-bold ml-4">✕</button>
            </div>

            {/* Scrollable body */}
            <div className="overflow-y-auto p-6 space-y-5">

              {/* User info preview */}
              {(userName || userEmail) && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-lg px-4 py-3 text-sm">
                  <p className="text-emerald-800 font-semibold">Booking as:</p>
                  {userName && <p className="text-emerald-700">{userName}</p>}
                  {userEmail && <p className="text-emerald-600">{userEmail}</p>}
                </div>
              )}

              {/* Inline Availability Calendar */}
              <AvailabilityCalendar bookedRanges={bookedRanges} />

              {/* Date pickers */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Check-In</label>
                  <input type="date" value={checkIn} onChange={e => setCheckIn(e.target.value)}
                    min={new Date().toISOString().split("T")[0]}
                    className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 ${modalConflict ? "border-red-400 focus:ring-red-400" : "focus:ring-emerald-600"}`} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Check-Out</label>
                  <input type="date" value={checkOut} onChange={e => setCheckOut(e.target.value)}
                    min={checkIn || new Date().toISOString().split("T")[0]}
                    className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 ${modalConflict ? "border-red-400 focus:ring-red-400" : "focus:ring-emerald-600"}`} />
                </div>
              </div>

              {modalConflict && (
                <div className="bg-red-50 border border-red-200 text-red-600 rounded-lg px-4 py-3 text-sm">
                  ⚠️ These dates overlap with an existing booking. Please choose different dates.
                </div>
              )}

              {modalNights > 0 && !modalConflict && (
                <div className="bg-emerald-50 rounded-lg px-4 py-3 text-sm text-emerald-800">
                  <div className="flex justify-between">
                    <span>{modalNights} night{modalNights !== 1 ? "s" : ""} × ₱{Number(room.price).toLocaleString()}/night</span>
                    <span className="font-bold">₱{modalTotal.toLocaleString()}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-6 pt-4 border-t border-gray-100">
              <button
                onClick={handleModalConfirm}
                disabled={!checkIn || !checkOut || modalNights <= 0 || !!modalConflict}
                className="w-full bg-emerald-700 text-white py-3 rounded-xl font-bold hover:bg-emerald-800 transition disabled:opacity-50"
              >
                Continue to Booking
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
