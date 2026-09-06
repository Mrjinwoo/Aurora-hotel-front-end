"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Header from "../../Header/Header";

type Status = "Pending" | "Confirmed" | "Checked-In" | "Completed" | "Cancelled";

type Booking = {
  id: number;
  bookingNo: string;
  room: string;
  roomNumber: string;
  roomId?: number;
  checkIn: string;
  checkOut: string;
  guests: number;
  total: number;
  status: Status;
  specialRequest?: string;
};

type IssueForm = { bookingId: number; roomNumber: string; category: string; description: string; };

const STATUS_STYLES: Record<Status, string> = {
  Pending: "bg-yellow-100 text-yellow-700",
  Confirmed: "bg-green-100 text-green-700",
  "Checked-In": "bg-blue-100 text-blue-700",
  Completed: "bg-gray-100 text-gray-700",
  Cancelled: "bg-red-100 text-red-600",
};

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
const PAGE_SIZE = 5;

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-PH", { year: "numeric", month: "long", day: "numeric" });
}

function nights(checkIn: string, checkOut: string) {
  return Math.max(1, Math.ceil((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / 86400000));
}

export default function MyBookingsPage() {
  const router = useRouter();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [selected, setSelected] = useState<Booking | null>(null);
  const [cancelTarget, setCancelTarget] = useState<Booking | null>(null);
  const [issueTarget, setIssueTarget] = useState<Booking | null>(null);
  const [issueForm, setIssueForm] = useState<IssueForm>({ bookingId: 0, roomNumber: "", category: "Maintenance", description: "" });
  const [issueSubmitted, setIssueSubmitted] = useState(false);
  const [issueError, setIssueError] = useState("");

  // Filters
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"All" | Status>("All");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [page, setPage] = useState(1);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { router.replace("/login?redirect=/my-bookings"); return; }
    fetchBookings(token);
  }, [router]);

  async function fetchBookings(token: string) {
    try {
      const res = await fetch(`${API}/api/bookings/my/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return;
      const data = await res.json();
      const list = Array.isArray(data) ? data : (data.results ?? []);
      setBookings(list.map((b: any) => ({
        id: b.id,
        bookingNo: `HTL-${String(b.id).padStart(4, "0")}`,
        room: b.room,
        roomNumber: b.room_number || "—",
        roomId: b.room_id,
        checkIn: b.check_in,
        checkOut: b.check_out,
        guests: b.guests,
        total: b.total || 0,
        status: b.status,
        specialRequest: b.special_request || "",
      })));
    } catch { /* ignore */ }
  }

  async function confirmCancel() {
    if (!cancelTarget) return;
    const token = localStorage.getItem("token");
    await fetch(`${API}/api/bookings/${cancelTarget.id}/`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ status: "Cancelled" }),
    });
    setBookings(prev => prev.map(b => b.id === cancelTarget.id ? { ...b, status: "Cancelled" as Status } : b));
    setCancelTarget(null);
  }

  function openIssueModal(b: Booking) {
    setIssueTarget(b);
    setIssueForm({ bookingId: b.id, roomNumber: b.roomNumber, category: "Maintenance", description: "" });
    setIssueSubmitted(false);
    setIssueError("");
  }

  async function submitIssue() {
    if (!issueForm.description.trim()) { setIssueError("Please describe the issue."); return; }
    const token = localStorage.getItem("token");
    const res = await fetch(`${API}/api/bookings/issues/`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ booking_id: issueForm.bookingId, room_number: issueForm.roomNumber, category: issueForm.category, description: issueForm.description }),
    });
    if (res.ok) { setIssueSubmitted(true); }
    else { const d = await res.json(); setIssueError(d.detail || "Failed to submit."); }
  }

  // Filtering
  const filtered = bookings.filter(b => {
    const q = search.toLowerCase();
    const matchSearch = !q || b.room.toLowerCase().includes(q) || b.bookingNo.toLowerCase().includes(q);
    const matchStatus = statusFilter === "All" || b.status === statusFilter;
    const matchFrom = !dateFrom || b.checkIn >= dateFrom;
    const matchTo = !dateTo || b.checkOut <= dateTo;
    return matchSearch && matchStatus && matchFrom && matchTo;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function resetFilters() {
    setSearch(""); setStatusFilter("All"); setDateFrom(""); setDateTo(""); setPage(1);
  }

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gray-50 pt-28 pb-16">
        <div className="max-w-4xl mx-auto px-6">

          {/* Booking Details Modal */}
          {selected && (
            <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-xl shadow-xl p-8 w-full max-w-md">
                <h2 className="text-2xl font-bold text-gray-800 mb-6">Booking Details</h2>
                {[
                  { label: "Booking No.", value: selected.bookingNo },
                  { label: "Room", value: `${selected.room} – ${selected.roomNumber}` },
                  { label: "Check-in", value: formatDate(selected.checkIn) },
                  { label: "Check-out", value: formatDate(selected.checkOut) },
                  { label: "Nights", value: String(nights(selected.checkIn, selected.checkOut)) },
                  { label: "Guests", value: String(selected.guests) },
                  { label: "Total", value: `₱${selected.total.toLocaleString()}` },
                  { label: "Status", value: selected.status },
                  ...(selected.specialRequest ? [{ label: "Special Request", value: selected.specialRequest }] : []),
                ].map(({ label, value }) => (
                  <div key={label} className="flex justify-between py-2 border-b last:border-0">
                    <span className="text-gray-500 text-sm">{label}</span>
                    <span className="font-semibold text-gray-800 text-sm">{value}</span>
                  </div>
                ))}
                <button onClick={() => setSelected(null)} className="mt-6 w-full bg-blue-600 text-white py-2.5 rounded-lg font-semibold hover:bg-blue-700 transition">Close</button>
              </div>
            </div>
          )}

          {/* Cancel Confirmation Modal */}
          {cancelTarget && (
            <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-xl shadow-xl p-8 w-full max-w-sm text-center">
                <div className="text-5xl mb-4">⚠️</div>
                <h2 className="text-xl font-bold text-gray-800 mb-2">Cancel Booking?</h2>
                <p className="text-gray-500 mb-6">Are you sure you want to cancel booking <strong>{cancelTarget.bookingNo}</strong>?</p>
                <div className="flex gap-3">
                  <button onClick={confirmCancel} className="flex-1 bg-red-500 text-white py-2.5 rounded-lg font-semibold hover:bg-red-600 transition">YES</button>
                  <button onClick={() => setCancelTarget(null)} className="flex-1 border border-gray-300 text-gray-600 py-2.5 rounded-lg font-semibold hover:bg-gray-50 transition">NO</button>
                </div>
              </div>
            </div>
          )}

          {/* Report Issue Modal */}
          {issueTarget && (
            <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-xl shadow-xl p-8 w-full max-w-md">
                {issueSubmitted ? (
                  <div className="text-center">
                    <div className="text-5xl mb-4">✅</div>
                    <h2 className="text-xl font-bold text-gray-800 mb-2">Issue Reported</h2>
                    <p className="text-gray-500 mb-6">Our staff will look into it shortly.</p>
                    <button onClick={() => setIssueTarget(null)} className="w-full bg-emerald-600 text-white py-2.5 rounded-lg font-semibold hover:bg-emerald-700 transition">Close</button>
                  </div>
                ) : (
                  <>
                    <h2 className="text-xl font-bold text-gray-800 mb-1">🚨 Report an Issue</h2>
                    <p className="text-sm text-gray-500 mb-5">{issueTarget.room} – Room {issueTarget.roomNumber}</p>
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium text-gray-700 block mb-1">Category</label>
                        <select value={issueForm.category} onChange={e => setIssueForm(f => ({ ...f, category: e.target.value }))}
                          className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400">
                          {["Maintenance", "Cleanliness", "Noise", "Amenities", "Other"].map(c => <option key={c}>{c}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700 block mb-1">Description</label>
                        <textarea rows={4} value={issueForm.description} onChange={e => setIssueForm(f => ({ ...f, description: e.target.value }))}
                          placeholder="Describe the issue..."
                          className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400 resize-none" />
                      </div>
                      {issueError && <p className="text-red-500 text-sm">{issueError}</p>}
                    </div>
                    <div className="flex gap-3 mt-6">
                      <button onClick={submitIssue} className="flex-1 bg-red-500 text-white py-2.5 rounded-lg font-semibold hover:bg-red-600 transition">Submit</button>
                      <button onClick={() => setIssueTarget(null)} className="flex-1 border border-gray-300 text-gray-600 py-2.5 rounded-lg font-semibold hover:bg-gray-50 transition">Cancel</button>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          <h1 className="text-4xl font-bold text-gray-800 mb-2">My Bookings</h1>
          <p className="text-gray-500 mb-6">Track and manage your reservations</p>

          {/* Search & Filter */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 mb-6 space-y-4">
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
              <input
                type="text"
                placeholder="Search by room name or booking no..."
                value={search}
                onChange={e => { setSearch(e.target.value); setPage(1); }}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              {(["All", "Pending", "Confirmed", "Checked-In", "Completed", "Cancelled"] as const).map(s => (
                <button key={s} onClick={() => { setStatusFilter(s); setPage(1); }}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition ${statusFilter === s ? "bg-emerald-700 text-white border-emerald-700" : "bg-white text-gray-600 border-gray-300 hover:border-emerald-500"}`}>
                  {s}
                </button>
              ))}
            </div>
            <div className="flex flex-wrap gap-3 items-center">
              <div className="flex items-center gap-2">
                <label className="text-sm text-gray-500">Check-in from:</label>
                <input type="date" value={dateFrom} onChange={e => { setDateFrom(e.target.value); setPage(1); }}
                  className="border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400" />
              </div>
              <div className="flex items-center gap-2">
                <label className="text-sm text-gray-500">to:</label>
                <input type="date" value={dateTo} onChange={e => { setDateTo(e.target.value); setPage(1); }}
                  className="border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400" />
              </div>
              {(search || statusFilter !== "All" || dateFrom || dateTo) && (
                <button onClick={resetFilters} className="text-sm text-red-500 hover:underline">Clear filters</button>
              )}
            </div>
          </div>

          <p className="text-sm text-gray-500 mb-4">{filtered.length} booking{filtered.length !== 1 ? "s" : ""} found</p>

          {bookings.length === 0 ? (
            <div className="text-center py-20">
              <div className="text-6xl mb-4">🛎️</div>
              <p className="text-gray-500 text-lg mb-4">You have no bookings yet.</p>
              <a href="/rooms" className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition font-semibold">Browse Rooms</a>
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <p className="text-4xl mb-3">🔍</p>
              <p className="font-medium">No bookings match your filters.</p>
              <button onClick={resetFilters} className="mt-3 text-sm text-emerald-700 hover:underline">Clear filters</button>
            </div>
          ) : (
            <>
              <div className="space-y-4">
                {paginated.map((b) => (
                  <div key={b.id} className="bg-white rounded-xl shadow p-6">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="text-xs text-gray-400 font-medium">{b.bookingNo}</p>
                        <h3 className="text-lg font-bold text-gray-800">{b.room} – Room {b.roomNumber}</h3>
                      </div>
                      <span className={`text-xs font-semibold px-3 py-1 rounded-full ${STATUS_STYLES[b.status]}`}>{b.status}</span>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm mb-4">
                      {[
                        { label: "Check-In", value: formatDate(b.checkIn) },
                        { label: "Check-Out", value: formatDate(b.checkOut) },
                        { label: "Guests", value: String(b.guests) },
                        { label: "Total", value: `₱${b.total.toLocaleString()}` },
                      ].map(({ label, value }) => (
                        <div key={label}>
                          <p className="text-xs text-gray-400 uppercase font-medium">{label}</p>
                          <p className="font-semibold text-gray-700">{value}</p>
                        </div>
                      ))}
                    </div>
                    <div className="flex gap-2 flex-wrap">
                      <Link href={`/booking-details?id=${b.id}`} className="px-4 py-2 border border-blue-600 text-blue-600 rounded-lg text-sm font-semibold hover:bg-blue-50 transition">
                        View Details
                      </Link>
                      {b.status === "Pending" && (
                        <button onClick={() => setCancelTarget(b)} className="px-4 py-2 border border-red-500 text-red-500 rounded-lg text-sm font-semibold hover:bg-red-50 transition">
                          Cancel
                        </button>
                      )}
                      {(b.status === "Confirmed" || b.status === "Checked-In") && (
                        <button onClick={() => openIssueModal(b)} className="px-4 py-2 border border-red-400 text-red-500 rounded-lg text-sm font-semibold hover:bg-red-50 transition">
                          🚨 Report Issue
                        </button>
                      )}
                      {b.status === "Completed" && (
                        <Link
                          href={`/booking?room=${encodeURIComponent(b.room)}&roomId=${b.roomId || ""}&roomNumber=${encodeURIComponent(b.roomNumber)}&price=${b.total && nights(b.checkIn, b.checkOut) ? Math.round(b.total / nights(b.checkIn, b.checkOut)) : ""}`}
                          className="px-4 py-2 border border-emerald-600 text-emerald-700 rounded-lg text-sm font-semibold hover:bg-emerald-50 transition">
                          🔁 Re-book
                        </Link>
                      )}
                      {b.status === "Completed" && b.roomId && (
                        <Link
                          href={`/rooms/${b.roomId}#reviews`}
                          className="px-4 py-2 border border-yellow-500 text-yellow-600 rounded-lg text-sm font-semibold hover:bg-yellow-50 transition">
                          ⭐ Leave Review
                        </Link>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-8">
                  <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                    className="px-4 py-2 rounded-lg border text-sm font-semibold disabled:opacity-40 hover:bg-gray-50 transition">
                    ← Prev
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                    <button key={p} onClick={() => setPage(p)}
                      className={`w-9 h-9 rounded-lg text-sm font-semibold transition ${p === page ? "bg-emerald-700 text-white" : "border hover:bg-gray-50 text-gray-600"}`}>
                      {p}
                    </button>
                  ))}
                  <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                    className="px-4 py-2 rounded-lg border text-sm font-semibold disabled:opacity-40 hover:bg-gray-50 transition">
                    Next →
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}
