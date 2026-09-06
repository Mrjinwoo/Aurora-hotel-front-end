"use client";
import { useState, useEffect, Suspense, useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Header from "../../Header/Header";
import { getToken } from "../../lib/auth";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

type BookedRange = { check_in: string; check_out: string };

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

function hasDateConflict(checkIn: string, checkOut: string, bookedRanges: BookedRange[]): boolean {
  const requested = getDatesInRange(checkIn, checkOut);
  for (const r of bookedRanges) {
    const booked = getDatesInRange(r.check_in, r.check_out);
    for (const d of requested) if (booked.has(d)) return true;
  }
  return false;
}

function AvailabilityCalendar({ bookedRanges, checkIn, checkOut }: { bookedRanges: BookedRange[]; checkIn: string; checkOut: string }) {
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());

  const bookedDates = useMemo(() => {
    const dates = new Set<string>();
    for (const r of bookedRanges) getDatesInRange(r.check_in, r.check_out).forEach(d => dates.add(d));
    return dates;
  }, [bookedRanges]);

  const selectedDates = useMemo(() => checkIn && checkOut ? getDatesInRange(checkIn, checkOut) : new Set<string>(), [checkIn, checkOut]);

  const firstDay = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const todayStr = today.toISOString().split("T")[0];
  const monthName = new Date(viewYear, viewMonth).toLocaleString("en-PH", { month: "long", year: "numeric" });

  function prevMonth() {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  }
  function nextMonth() {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  }

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">Availability Calendar</label>
      <div className="border border-gray-200 rounded-xl p-4 bg-gray-50">
        <div className="flex gap-4 mb-3 text-xs text-gray-500">
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-red-200 inline-block" /> Booked</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-emerald-200 inline-block" /> Your Selection</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-white border inline-block" /> Available</span>
        </div>
        <div className="flex items-center justify-between mb-3">
          <button type="button" onClick={prevMonth} className="text-gray-500 hover:text-gray-800 px-2 py-1 rounded hover:bg-gray-200 transition">‹</button>
          <span className="font-semibold text-gray-700 text-sm">{monthName}</span>
          <button type="button" onClick={nextMonth} className="text-gray-500 hover:text-gray-800 px-2 py-1 rounded hover:bg-gray-200 transition">›</button>
        </div>
        <div className="grid grid-cols-7 mb-1">
          {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map(d => (
            <div key={d} className="text-center text-xs font-semibold text-gray-400 py-1">{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-0.5">
          {Array.from({ length: firstDay }).map((_, i) => <div key={`e-${i}`} />)}
          {Array.from({ length: daysInMonth }, (_, i) => {
            const day = i + 1;
            const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
            const isPast = dateStr < todayStr;
            const isBooked = bookedDates.has(dateStr);
            const isSelected = selectedDates.has(dateStr);
            const isToday = dateStr === todayStr;
            let cls = "text-center text-xs py-1.5 rounded ";
            if (isPast) cls += "text-gray-300 bg-gray-100";
            else if (isBooked) cls += "bg-red-200 text-red-700 font-semibold";
            else if (isSelected) cls += "bg-emerald-200 text-emerald-800 font-semibold";
            else cls += "bg-white text-gray-600";
            if (isToday) cls += " ring-2 ring-emerald-500";
            return <div key={day} className={cls}>{day}</div>;
          })}
        </div>
      </div>
    </div>
  );
}

function BookingForm() {
  const params = useSearchParams();
  const router = useRouter();
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    checkIn: "",
    checkOut: "",
    room: params.get("room") || "",
    roomId: params.get("roomId") || "",
    roomNumber: params.get("roomNumber") || "",
    price: params.get("price") || "",
    guests: "1",
    specialRequest: "",
  });
  const [submitted, setSubmitted] = useState(false);
  const [bookingRef, setBookingRef] = useState("");
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [bookedRanges, setBookedRanges] = useState<BookedRange[]>([]);

  useEffect(() => {
    getToken().then(token => {
      if (!token) {
        const current = `/booking?room=${encodeURIComponent(params.get("room") || "")}&price=${params.get("price") || ""}&roomId=${params.get("roomId") || ""}&roomNumber=${encodeURIComponent(params.get("roomNumber") || "")}`;
        router.replace(`/login?redirect=${encodeURIComponent(current)}`);
        return;
      }
      setForm(f => ({
        ...f,
        name: localStorage.getItem("userName") || "",
        email: localStorage.getItem("userEmail") || "",
        checkIn: params.get("checkIn") || "",
        checkOut: params.get("checkOut") || "",
      }));
    });
    const roomId = params.get("roomId");
    if (roomId) {
      fetch(`${API}/api/rooms/${roomId}/bookings/`)
        .then(r => r.json())
        .then(data => setBookedRanges(Array.isArray(data) ? data : []))
        .catch(() => {});
    }
  }, []);

  const nights = form.checkIn && form.checkOut
    ? Math.max(0, Math.ceil((new Date(form.checkOut).getTime() - new Date(form.checkIn).getTime()) / 86400000))
    : 0;
  const total = nights * Number(form.price);

  function validate() {
    const errors: Record<string, string> = {};
    if (!form.name.trim()) errors.name = "Full name is required.";
    if (!/^[\w.-]+@[\w.-]+\.[a-zA-Z]{2,}$/.test(form.email)) errors.email = "Enter a valid email address.";
    if (!/^(\+63|0)\d{10}$/.test(form.phone.replace(/\s/g, ""))) errors.phone = "Enter a valid PH number (e.g. +63 912 345 6789).";
    if (!form.checkIn) errors.checkIn = "Check-in date is required.";
    if (!form.checkOut) errors.checkOut = "Check-out date is required.";
    if (form.checkIn && form.checkOut && form.checkOut <= form.checkIn) errors.checkOut = "Check-out must be after check-in.";
    return errors;
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    setForm({ ...form, [e.target.name]: e.target.value });
    if (fieldErrors[e.target.name]) setFieldErrors(prev => ({ ...prev, [e.target.name]: "" }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const errors = validate();
    if (Object.keys(errors).length > 0) { setFieldErrors(errors); return; }
    if (hasDateConflict(form.checkIn, form.checkOut, bookedRanges)) {
      setError("These dates overlap with an existing booking. Please choose different dates.");
      return;
    }
    setLoading(true);
    const token = await getToken();
    try {
      const res = await fetch(`${API}/api/bookings/`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          room_id: Number(form.roomId) || 0,
          room: form.room,
          name: form.name,
          email: form.email,
          phone: form.phone,
          check_in: form.checkIn,
          check_out: form.checkOut,
          guests: Number(form.guests),
          total: total,
          special_request: form.specialRequest,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.detail || JSON.stringify(data)); return; }
      setBookingRef(data.booking_no || data.bookingNo || `HTL-${String(data.id).padStart(4, "0")}`);
      setSubmitted(true);
    } catch {
      setError("Cannot connect to server.");
    } finally {
      setLoading(false);
    }
  }

  const dateConflict = form.checkIn && form.checkOut && hasDateConflict(form.checkIn, form.checkOut, bookedRanges);

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white p-10 rounded-xl shadow text-center max-w-md">
          <div className="text-6xl mb-4">✅</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Booking Submitted!</h2>
          {bookingRef && <p className="text-sm text-gray-400 mb-3">Reference: <strong>{bookingRef}</strong></p>}
          <p className="text-gray-500 mb-1">Thank you, <strong>{form.name}</strong>!</p>
          <p className="text-gray-500 mb-1">Room: <strong>{form.room}</strong>{form.roomNumber && ` – Room ${form.roomNumber}`}</p>
          <p className="text-gray-500 mb-1">{form.checkIn} → {form.checkOut} ({nights} night{nights !== 1 ? "s" : ""})</p>
          <p className="text-emerald-700 font-bold text-xl mt-3">Total: ₱{total.toLocaleString()}</p>
          <p className="text-gray-400 text-sm mt-2">Awaiting confirmation from staff.</p>
          <div className="flex gap-3 mt-6">
            <a href="/my-bookings" className="flex-1 bg-emerald-700 text-white px-4 py-2.5 rounded-lg hover:bg-emerald-800 font-semibold text-sm text-center">My Bookings</a>
            <a href="/" className="flex-1 border border-gray-300 text-gray-600 px-4 py-2.5 rounded-lg hover:bg-gray-50 font-semibold text-sm text-center">Back to Home</a>
          </div>
        </div>
      </div>
    );
  }

  const timeSlots = ["10:00 AM", "11:00 AM", "12:00 PM", "1:00 PM", "2:00 PM", "3:00 PM"];

  return (
    <div className="min-h-screen bg-gray-50 pt-28 pb-16">
      <div className="max-w-5xl mx-auto px-6">
        <h1 className="text-4xl font-bold text-gray-800 mb-2">Book Your Stay</h1>
        <p className="text-gray-500 mb-8">Fill in the details below to reserve your room.</p>
        {error && <div className="bg-red-50 text-red-600 rounded-lg px-4 py-3 mb-4 text-sm">{error}</div>}

        <div className="flex flex-col md:flex-row gap-6 items-start">
          {/* Room Timetable */}
          <div className="w-full md:w-64 shrink-0 bg-white rounded-xl shadow p-6">
            <h2 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2">Room Timetable</h2>
            <div className="mb-4">
              <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Check-in</p>
              <p className="text-emerald-700 font-bold text-sm">10:00 AM</p>
            </div>
            <div className="mb-5">
              <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Check-out</p>
              <p className="text-emerald-700 font-bold text-sm">12:00 PM</p>
            </div>
            <hr className="mb-4" />
            <p className="text-xs text-gray-500 uppercase font-semibold mb-3">Available Slots</p>
            <ul className="space-y-2">
              {timeSlots.map(slot => (
                <li key={slot} className="flex items-center gap-2 text-sm text-gray-700">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
                  {slot}
                </li>
              ))}
            </ul>
          </div>

          {/* Booking Form */}
          <div className="flex-1">
            {/* Room Summary */}
            {form.room && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 mb-6 flex items-center justify-between">
                <div>
                  <p className="font-bold text-emerald-800">{form.room}</p>
                  {form.roomNumber && <p className="text-sm text-emerald-600">Room {form.roomNumber}</p>}
                </div>
                <p className="text-emerald-700 font-bold">₱{Number(form.price).toLocaleString()}<span className="text-sm font-normal">/night</span></p>
              </div>
            )}

        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow p-8 space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
              <input name="name" value={form.name} onChange={handleChange} placeholder="John Doe"
                className={`w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 ${fieldErrors.name ? "border-red-400 focus:ring-red-400" : "focus:ring-emerald-600"}`} />
              {fieldErrors.name && <p className="text-red-500 text-xs mt-1">{fieldErrors.name}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input type="email" name="email" value={form.email} onChange={handleChange} placeholder="john@email.com"
                className={`w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 ${fieldErrors.email ? "border-red-400 focus:ring-red-400" : "focus:ring-emerald-600"}`} />
              {fieldErrors.email && <p className="text-red-500 text-xs mt-1">{fieldErrors.email}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
              <input name="phone" value={form.phone} onChange={handleChange} placeholder="+63 912 345 6789"
                className={`w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 ${fieldErrors.phone ? "border-red-400 focus:ring-red-400" : "focus:ring-emerald-600"}`} />
              {fieldErrors.phone && <p className="text-red-500 text-xs mt-1">{fieldErrors.phone}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Guests</label>
              <select name="guests" value={form.guests} onChange={handleChange}
                className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-600">
                {[1, 2, 3, 4].map(n => <option key={n} value={n}>{n} Guest{n > 1 ? "s" : ""}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Check-In</label>
              <input type="date" name="checkIn" value={form.checkIn} onChange={handleChange}
                min={new Date().toISOString().split("T")[0]}
                className={`w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 ${dateConflict || fieldErrors.checkIn ? "border-red-400 focus:ring-red-400" : "focus:ring-emerald-600"}`} />
              {fieldErrors.checkIn && <p className="text-red-500 text-xs mt-1">{fieldErrors.checkIn}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Check-Out</label>
              <input type="date" name="checkOut" value={form.checkOut} onChange={handleChange}
                min={form.checkIn || new Date().toISOString().split("T")[0]}
                className={`w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 ${dateConflict || fieldErrors.checkOut ? "border-red-400 focus:ring-red-400" : "focus:ring-emerald-600"}`} />
              {fieldErrors.checkOut && <p className="text-red-500 text-xs mt-1">{fieldErrors.checkOut}</p>}
            </div>
          </div>

          {dateConflict && (
            <div className="bg-red-50 border border-red-200 text-red-600 rounded-lg px-4 py-3 text-sm">
              ⚠️ These dates overlap with an existing booking. Please choose different dates.
            </div>
          )}

          <AvailabilityCalendar bookedRanges={bookedRanges} checkIn={form.checkIn} checkOut={form.checkOut} />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Special Request <span className="text-gray-400">(optional)</span></label>
            <textarea name="specialRequest" value={form.specialRequest} onChange={handleChange}
              placeholder="Any special requests or preferences..."
              rows={3} className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-600 resize-none" />
          </div>

          {nights > 0 && form.price && (
            <div className="bg-emerald-50 rounded-lg p-4 text-sm text-emerald-800">
              <p>{nights} night{nights !== 1 ? "s" : ""} × ₱{Number(form.price).toLocaleString()}/night = <strong>₱{total.toLocaleString()}</strong></p>
            </div>
          )}

          <button type="submit" disabled={loading || !!dateConflict}
            className="w-full bg-emerald-700 text-white py-3 rounded-lg font-semibold hover:bg-emerald-800 transition disabled:opacity-60">
            {loading ? "Submitting..." : "Confirm Booking"}
          </button>
        </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function BookingPage() {
  return (
    <>
      <Header />
      <Suspense fallback={<div className="pt-28 text-center">Loading...</div>}>
        <BookingForm />
      </Suspense>
    </>
  );
}
