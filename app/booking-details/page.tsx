"use client";
import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Header from "../../Header/Header";
import { getToken } from "../../lib/auth";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

type Status = "Pending" | "Confirmed" | "Checked-In" | "Completed" | "Cancelled";

type Booking = {
  id: number;
  bookingNo: string;
  booking_no?: string;
  room: string;
  roomNumber: string;
  room_number?: string;
  checkIn: string;
  check_in?: string;
  checkOut: string;
  check_out?: string;
  guests: number;
  total: number;
  status: Status;
  name: string;
  email: string;
  phone: string;
  specialRequest?: string;
  special_request?: string;
};

const STATUS_STYLES: Record<Status, string> = {
  Pending: "bg-yellow-100 text-yellow-700",
  Confirmed: "bg-green-100 text-green-700",
  "Checked-In": "bg-blue-100 text-blue-700",
  Completed: "bg-gray-100 text-gray-700",
  Cancelled: "bg-red-100 text-red-600",
};

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-PH", { year: "numeric", month: "long", day: "numeric" });
}

function nights(checkIn: string, checkOut: string) {
  return Math.max(1, Math.ceil((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / 86400000));
}

function BookingDetails() {
  const params = useSearchParams();
  const router = useRouter();
  const bookingId = params.get("id");
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [cancelling, setCancelling] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    if (!bookingId) { router.replace("/my-bookings"); return; }
    fetchBooking();
  }, [bookingId]);

  async function fetchBooking() {
    const token = await getToken();
    if (!token) { router.replace("/login?redirect=/booking-details?id=" + bookingId); return; }
    try {
      const res = await fetch(`${API}/api/bookings/${bookingId}/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) { setError("Booking not found."); return; }
      const data = await res.json();
      // Normalize snake_case from backend
      setBooking({
        ...data,
        bookingNo: data.bookingNo || data.booking_no || `HTL-${String(data.id).padStart(4, "0")}`,
        roomNumber: data.roomNumber || data.room_number || "—",
        checkIn: data.checkIn || data.check_in || "",
        checkOut: data.checkOut || data.check_out || "",
        specialRequest: data.specialRequest || data.special_request || "",
      });
    } catch {
      setError("Cannot connect to server.");
    } finally {
      setLoading(false);
    }
  }

  async function cancelBooking() {
    setCancelling(true);
    const token = await getToken();
    try {
      const res = await fetch(`${API}/api/bookings/${bookingId}/`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status: "Cancelled" }),
      });
      if (res.ok) {
        setBooking(prev => prev ? { ...prev, status: "Cancelled" } : prev);
        setShowConfirm(false);
      }
    } catch { /* ignore */ }
    finally { setCancelling(false); }
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="text-5xl mb-4 animate-pulse">🛎️</div>
        <p className="text-gray-500">Loading booking details...</p>
      </div>
    </div>
  );

  if (error || !booking) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="text-5xl mb-4">❌</div>
        <p className="text-gray-600 mb-4">{error || "Booking not found."}</p>
        <button onClick={() => router.push("/my-bookings")} className="bg-blue-600 text-white px-6 py-2.5 rounded-lg hover:bg-blue-700 transition font-semibold">
          Back to My Bookings
        </button>
      </div>
    </div>
  );

  const n = nights(booking.checkIn, booking.checkOut);

  return (
    <div className="min-h-screen bg-gray-50 pt-28 pb-16">
      <div className="max-w-2xl mx-auto px-6">

        {/* Cancel Confirm Modal */}
        {showConfirm && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-xl p-8 w-full max-w-sm text-center">
              <div className="text-5xl mb-4">⚠️</div>
              <h2 className="text-xl font-bold text-gray-800 mb-2">Cancel Booking?</h2>
              <p className="text-gray-500 mb-6">Are you sure you want to cancel booking <strong>{booking.bookingNo}</strong>?</p>
              <div className="flex gap-3">
                <button onClick={cancelBooking} disabled={cancelling}
                  className="flex-1 bg-red-500 text-white py-2.5 rounded-lg font-semibold hover:bg-red-600 transition disabled:opacity-60">
                  {cancelling ? "Cancelling..." : "Yes, Cancel"}
                </button>
                <button onClick={() => setShowConfirm(false)} className="flex-1 border border-gray-300 text-gray-600 py-2.5 rounded-lg font-semibold hover:bg-gray-50 transition">
                  No, Keep It
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => router.push("/my-bookings")} className="text-gray-500 hover:text-gray-800 transition text-sm font-medium">
            ← Back to My Bookings
          </button>
        </div>

        <div className="bg-white rounded-xl shadow p-8">
          {/* Header */}
          <div className="flex items-start justify-between mb-6">
            <div>
              <p className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-1">Booking Reference</p>
              <h1 className="text-2xl font-bold text-gray-800">{booking.bookingNo}</h1>
            </div>
            <span className={`text-sm font-semibold px-4 py-1.5 rounded-full ${STATUS_STYLES[booking.status]}`}>
              {booking.status}
            </span>
          </div>

          {/* Room Summary */}
          <div className="bg-gray-50 rounded-xl p-5 mb-6">
            <h2 className="text-lg font-bold text-gray-800 mb-1">{booking.room}</h2>
            {booking.roomNumber !== "—" && <p className="text-gray-500 text-sm">Room {booking.roomNumber}</p>}
            <div className="flex gap-6 mt-3 text-sm text-gray-600">
              <div>
                <p className="text-xs text-gray-400 uppercase font-medium">Check-In</p>
                <p className="font-semibold">{formatDate(booking.checkIn)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 uppercase font-medium">Check-Out</p>
                <p className="font-semibold">{formatDate(booking.checkOut)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 uppercase font-medium">Duration</p>
                <p className="font-semibold">{n} night{n !== 1 ? "s" : ""}</p>
              </div>
            </div>
          </div>

          {/* Guest Info */}
          <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-3">Guest Information</h3>
          <div className="space-y-3 mb-6">
            {[
              ["Full Name", booking.name],
              ["Email", booking.email],
              ["Phone", booking.phone],
              ["Number of Guests", String(booking.guests)],
            ].map(([label, value]) => (
              <div key={label} className="flex justify-between py-2 border-b last:border-0 text-sm">
                <span className="text-gray-500">{label}</span>
                <span className="font-semibold text-gray-800">{value || "—"}</span>
              </div>
            ))}
          </div>

          {/* Special Request */}
          {booking.specialRequest && (
            <div className="bg-blue-50 rounded-lg p-4 mb-6">
              <p className="text-xs font-bold text-blue-700 uppercase mb-1">Special Request</p>
              <p className="text-sm text-blue-800">{booking.specialRequest}</p>
            </div>
          )}

          {/* Total */}
          <div className="flex items-center justify-between bg-emerald-50 rounded-xl p-5 mb-6">
            <div>
              <p className="text-sm text-gray-500">{n} night{n !== 1 ? "s" : ""} × ₱{booking.total ? (booking.total / n).toLocaleString() : 0}/night</p>
              <p className="text-xs text-gray-400">Total Amount</p>
            </div>
            <p className="text-3xl font-bold text-emerald-700">₱{(booking.total || 0).toLocaleString()}</p>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button onClick={() => router.push("/my-bookings")}
              className="flex-1 border border-gray-300 text-gray-600 py-2.5 rounded-lg font-semibold hover:bg-gray-50 transition text-sm">
              My Bookings
            </button>
            {booking.status === "Pending" && (
              <button onClick={() => setShowConfirm(true)}
                className="flex-1 bg-red-500 text-white py-2.5 rounded-lg font-semibold hover:bg-red-600 transition text-sm">
                Cancel Booking
              </button>
            )}
            {(booking.status === "Confirmed" || booking.status === "Checked-In") && (
              <button onClick={() => router.push("/rooms")}
                className="flex-1 bg-emerald-700 text-white py-2.5 rounded-lg font-semibold hover:bg-emerald-800 transition text-sm">
                Book Another Room
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function BookingDetailsPage() {
  return (
    <>
      <Header />
      <Suspense fallback={<div className="pt-28 text-center text-gray-400">Loading...</div>}>
        <BookingDetails />
      </Suspense>
    </>
  );
}
