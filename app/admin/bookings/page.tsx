"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AdminSidebar from "../../../Header/AdminSidebar";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

type Status = "Pending" | "Confirmed" | "Checked-In" | "Completed" | "Cancelled";
type Booking = { id: number; bookingNo: string; guest: string; room: string; roomNumber: string; checkIn: string; checkOut: string; guests: number; total: number; status: Status; };

const STATUS_STYLES: Record<Status, string> = {
  Pending: "bg-yellow-100 text-yellow-700",
  Confirmed: "bg-green-100 text-green-700",
  "Checked-In": "bg-blue-100 text-blue-700",
  Completed: "bg-gray-200 text-gray-700",
  Cancelled: "bg-red-100 text-red-600",
};

const NEXT_STATUS: Partial<Record<Status, Status>> = {
  Pending: "Confirmed",
  Confirmed: "Checked-In",
  "Checked-In": "Completed",
};

export default function AdminBookingsPage() {
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [viewBooking, setViewBooking] = useState<Booking | null>(null);
  const [filterStatus, setFilterStatus] = useState<"All" | Status>("All");
  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 10;

  useEffect(() => {
    const role = localStorage.getItem("role");
    if (role !== "admin") { router.replace("/login"); return; }
    setAuthorized(true);
    fetchBookings();
  }, [router]);

  async function fetchBookings() {
    const token = localStorage.getItem("token");
    const res = await fetch(`${API}/api/bookings/`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return;
    const data = await res.json();
    const list = Array.isArray(data) ? data : (data.results ?? []);
    setBookings(list.map((b: any) => ({
      id: b.id,
      bookingNo: `HTL-${String(b.id).padStart(4, "0")}`,
      guest: b.name,
      room: b.room,
      roomNumber: "",
      checkIn: b.check_in,
      checkOut: b.check_out,
      guests: b.guests,
      total: b.total || 0,
      status: b.status,
    })));
  }

  if (!authorized) return null;

  async function updateStatus(id: number, status: Status) {
    const token = localStorage.getItem("token");
    await fetch(`${API}/api/bookings/${id}/`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ status }),
    });
    setBookings(prev => prev.map(b => b.id === id ? { ...b, status } : b));
  }

  const filtered = bookings.filter(b => {
    const q = search.toLowerCase();
    const matchSearch = !q || b.guest.toLowerCase().includes(q) || b.bookingNo.toLowerCase().includes(q) || b.room.toLowerCase().includes(q);
    const matchStatus = filterStatus === "All" || b.status === filterStatus;
    const matchFrom = !dateFrom || b.checkIn >= dateFrom;
    const matchTo = !dateTo || b.checkOut <= dateTo;
    return matchSearch && matchStatus && matchFrom && matchTo;
  });
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="flex min-h-screen bg-slate-50">
      <AdminSidebar />
      <div className="flex-1 ml-60">
        <div className="bg-white border-b px-8 py-4">
          <p className="text-xs text-slate-400 uppercase tracking-widest font-medium">Admin › Bookings</p>
          <h1 className="text-xl font-bold text-slate-800">Manage Bookings</h1>
        </div>
        <div className="px-8 py-8">
          <p className="text-slate-500 text-sm mb-4">{bookings.length} total bookings</p>

          {/* Search & Date Filter */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-5 flex flex-wrap gap-3 items-center">
            <div className="relative flex-1 min-w-[200px]">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">🔍</span>
              <input type="text" placeholder="Search guest, room, booking no..." value={search}
                onChange={e => { setSearch(e.target.value); setPage(1); }}
                className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-400" />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-500">From:</label>
              <input type="date" value={dateFrom} onChange={e => { setDateFrom(e.target.value); setPage(1); }}
                className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400" />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-500">To:</label>
              <input type="date" value={dateTo} onChange={e => { setDateTo(e.target.value); setPage(1); }}
                className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400" />
            </div>
            {(search || dateFrom || dateTo) && (
              <button onClick={() => { setSearch(""); setDateFrom(""); setDateTo(""); setPage(1); }} className="text-sm text-red-500 hover:underline">Clear</button>
            )}
          </div>

          {/* View Modal */}
          {viewBooking && (
            <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-xl shadow-xl p-8 w-full max-w-md">
                <h3 className="text-xl font-bold text-gray-800 mb-4">Booking Details</h3>
                {[
                  ["Booking No.", viewBooking.bookingNo],
                  ["Guest", viewBooking.guest],
                  ["Room", `${viewBooking.room} – Room ${viewBooking.roomNumber}`],
                  ["Check-in", viewBooking.checkIn],
                  ["Check-out", viewBooking.checkOut],
                  ["Guests", String(viewBooking.guests)],
                  ["Total Amount", `₱${viewBooking.total.toLocaleString()}`],
                  ["Status", viewBooking.status],
                ].map(([l, v]) => (
                  <div key={l} className="flex justify-between py-2 border-b last:border-0 text-sm">
                    <span className="text-gray-500">{l}</span>
                    <span className="font-semibold text-gray-800">{v}</span>
                  </div>
                ))}
                <button onClick={() => setViewBooking(null)} className="mt-6 w-full bg-gray-900 text-white py-2.5 rounded-lg font-semibold hover:bg-gray-700 transition">Close</button>
              </div>
            </div>
          )}

          {/* Filter tabs */}
          <div className="flex flex-wrap gap-2 mb-5">
            {(["All", "Pending", "Confirmed", "Checked-In", "Completed", "Cancelled"] as const).map(s => (
              <button key={s} onClick={() => { setFilterStatus(s); setPage(1); }}
                className={`px-4 py-1.5 rounded-full text-sm font-semibold transition ${filterStatus === s ? "bg-gray-900 text-white" : "bg-white text-gray-600 border hover:bg-gray-50"}`}>
                {s}
              </button>
            ))}
          </div>

          <div className="bg-white rounded-xl shadow overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-900 text-white">
                <tr>{["Booking No.", "Customer", "Room", "Check-in", "Check-out", "Total", "Status", "Actions"].map(h => (
                  <th key={h} className="px-4 py-3 text-left font-semibold">{h}</th>
                ))}</tr>
              </thead>
              <tbody>
                {paginated.map((b, i) => (
                  <tr key={b.id} className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                    <td className="px-4 py-3 font-bold text-gray-800">{b.bookingNo}</td>
                    <td className="px-4 py-3">{b.guest}</td>
                    <td className="px-4 py-3">{b.room}</td>
                    <td className="px-4 py-3">{b.checkIn}</td>
                    <td className="px-4 py-3">{b.checkOut}</td>
                    <td className="px-4 py-3 font-semibold">₱{b.total.toLocaleString()}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${STATUS_STYLES[b.status]}`}>{b.status}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        <button onClick={() => setViewBooking(b)} className="bg-blue-500 hover:bg-blue-600 text-white text-xs px-2 py-1 rounded font-semibold">View</button>
                        {NEXT_STATUS[b.status] && (
                          <button onClick={() => updateStatus(b.id, NEXT_STATUS[b.status]!)}
                            className="bg-green-500 hover:bg-green-600 text-white text-xs px-2 py-1 rounded font-semibold">
                            {b.status === "Pending" ? "Confirm" : b.status === "Confirmed" ? "Check-In" : "Complete"}
                          </button>
                        )}
                        {b.status === "Pending" && (
                          <button onClick={() => updateStatus(b.id, "Cancelled")} className="bg-red-500 hover:bg-red-600 text-white text-xs px-2 py-1 rounded font-semibold">Cancel</button>
                        )}
                        <button onClick={async () => {
                          const token = localStorage.getItem("token");
                          await fetch(`${API}/api/bookings/${b.id}/`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
                          setBookings(prev => prev.filter(x => x.id !== b.id));
                        }} className="bg-gray-400 hover:bg-gray-500 text-white text-xs px-2 py-1 rounded font-semibold">Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
                {paginated.length === 0 && (
                  <tr><td colSpan={8} className="px-4 py-10 text-center text-gray-400">No bookings found.</td></tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-6">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                className="px-4 py-2 rounded-lg border text-sm font-semibold bg-white disabled:opacity-40 hover:bg-gray-50 transition">← Prev</button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                <button key={p} onClick={() => setPage(p)}
                  className={`w-9 h-9 rounded-lg text-sm font-semibold transition ${p === page ? "bg-gray-900 text-white" : "border bg-white hover:bg-gray-50 text-gray-600"}`}>{p}</button>
              ))}
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                className="px-4 py-2 rounded-lg border text-sm font-semibold bg-white disabled:opacity-40 hover:bg-gray-50 transition">Next →</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
