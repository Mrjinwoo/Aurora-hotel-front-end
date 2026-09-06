"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import StaffSidebar from "../../Header/StaffSidebar";
import { getToken } from "../../lib/auth";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

type BookingStatus = "Pending" | "Confirmed" | "Checked-In" | "Completed" | "Cancelled";
type SvcReqStatus = "Pending" | "Confirmed" | "In Progress" | "Completed" | "Cancelled";
type IssueStatus = "Open" | "In Progress" | "Resolved";
type Tab = "dashboard" | "bookings" | "rooms" | "service-requests" | "issues";

type Booking = {
  id: number; bookingNo: string; guest: string; room: string;
  roomNumber: string; checkIn: string; checkOut: string;
  guests: number; total: number; status: BookingStatus;
};
type Room = { id: number; number: string; type: string; price: number; capacity: number; available: boolean; };
type ServiceRequest = {
  id: number; service_title: string; user_name: string; user_email: string;
  room_number: string; requested_date: string; notes: string;
  status: SvcReqStatus; created_at: string;
};
type RoomIssue = {
  id: number; booking_id: number; room_number: string; guest_name: string;
  guest_email: string; category: string; description: string;
  status: IssueStatus; created_at: string;
};

const BOOKING_STATUS_STYLES: Record<BookingStatus, string> = {
  Pending: "bg-yellow-100 text-yellow-700",
  Confirmed: "bg-green-100 text-green-700",
  "Checked-In": "bg-blue-100 text-blue-700",
  Completed: "bg-gray-100 text-gray-700",
  Cancelled: "bg-red-100 text-red-600",
};

const SVC_STATUS_STYLES: Record<SvcReqStatus, string> = {
  Pending: "bg-yellow-100 text-yellow-700",
  Confirmed: "bg-green-100 text-green-700",
  "In Progress": "bg-blue-100 text-blue-700",
  Completed: "bg-gray-100 text-gray-700",
  Cancelled: "bg-red-100 text-red-600",
};

const ISSUE_STATUS_STYLES: Record<IssueStatus, string> = {
  Open: "bg-red-100 text-red-600",
  "In Progress": "bg-yellow-100 text-yellow-700",
  Resolved: "bg-green-100 text-green-700",
};

const BOOKING_NEXT: Partial<Record<BookingStatus, BookingStatus>> = {
  Pending: "Confirmed", Confirmed: "Checked-In", "Checked-In": "Completed",
};
const BOOKING_NEXT_LABEL: Partial<Record<BookingStatus, string>> = {
  Pending: "Confirm", Confirmed: "Check-In", "Checked-In": "Complete",
};

const SVC_NEXT: Partial<Record<SvcReqStatus, SvcReqStatus>> = {
  Pending: "Confirmed", Confirmed: "In Progress", "In Progress": "Completed",
};
const SVC_NEXT_LABEL: Partial<Record<SvcReqStatus, string>> = {
  Pending: "Confirm", Confirmed: "Start", "In Progress": "Complete",
};

const ISSUE_NEXT: Partial<Record<IssueStatus, IssueStatus>> = {
  Open: "In Progress", "In Progress": "Resolved",
};
const ISSUE_NEXT_LABEL: Partial<Record<IssueStatus, string>> = {
  Open: "Start", "In Progress": "Resolve",
};

export default function StaffPanel() {
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);
  const [tab, setTab] = useState<Tab>("dashboard");
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [serviceRequests, setServiceRequests] = useState<ServiceRequest[]>([]);
  const [issues, setIssues] = useState<RoomIssue[]>([]);
  const [issueFilter, setIssueFilter] = useState<"All" | IssueStatus>("All");
  const [viewBooking, setViewBooking] = useState<Booking | null>(null);
  const [viewSvcReq, setViewSvcReq] = useState<ServiceRequest | null>(null);
  const [viewIssue, setViewIssue] = useState<RoomIssue | null>(null);
  const [filterStatus, setFilterStatus] = useState<"All" | BookingStatus>("All");
  const [svcFilter, setSvcFilter] = useState<"All" | SvcReqStatus>("All");

  useEffect(() => {
    if (localStorage.getItem("role") !== "staff") { router.replace("/login"); return; }
    setAuthorized(true);
    fetchBookings();
    fetchRooms();
    fetchServiceRequests();
    fetchIssues();
  }, [router]);

  async function fetchBookings() {
    const token = await getToken();
    if (!token) return;
    try {
      const res = await fetch(`${API}/api/bookings/`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) {
        const data = await res.json();
        setBookings(data.map((b: any) => ({
          id: b.id,
          bookingNo: `HTL-${String(b.id).padStart(4, "0")}`,
          guest: b.name,
          room: b.room,
          roomNumber: "",
          checkIn: b.check_in,
          checkOut: b.check_out,
          guests: b.guests,
          total: 0,
          status: b.status,
        })));
      }
    } catch { /* ignore */ }
  }

  async function fetchRooms() {
    try {
      const res = await fetch(`${API}/api/rooms/`);
      if (res.ok) {
        const data = await res.json();
        setRooms(data.map((r: any) => ({
          id: r.id,
          number: r.room_number,
          type: r.category,
          price: Number(r.price),
          capacity: r.guests,
          available: r.available,
        })));
      }
    } catch { /* ignore */ }
  }

  async function fetchServiceRequests() {
    const token = await getToken();
    if (!token) return;
    try {
      const res = await fetch(`${API}/api/services/requests/`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) setServiceRequests(await res.json());
    } catch { /* ignore */ }
  }

  async function fetchIssues() {
    const token = await getToken();
    if (!token) return;
    try {
      const res = await fetch(`${API}/api/bookings/issues/`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) setIssues(await res.json());
    } catch { /* ignore */ }
  }

  async function updateBookingStatus(id: number, status: BookingStatus) {
    const token = await getToken();
    await fetch(`${API}/api/bookings/${id}/`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ status }),
    });
    setBookings(prev => prev.map(b => b.id === id ? { ...b, status } : b));
  }

  async function updateSvcStatus(id: number, status: SvcReqStatus) {
    const token = await getToken();
    await fetch(`${API}/api/services/requests/${id}/`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ status }),
    });
    setServiceRequests(prev => prev.map(r => r.id === id ? { ...r, status } : r));
    if (viewSvcReq?.id === id) setViewSvcReq(prev => prev ? { ...prev, status } : prev);
  }

  async function updateIssueStatus(id: number, status: IssueStatus) {
    const token = await getToken();
    await fetch(`${API}/api/bookings/issues/${id}/`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ status }),
    });
    setIssues(prev => prev.map(i => i.id === id ? { ...i, status } : i));
  }

  if (!authorized) return null;

  const filteredBookings = filterStatus === "All" ? bookings : bookings.filter(b => b.status === filterStatus);
  const filteredSvc = svcFilter === "All" ? serviceRequests : serviceRequests.filter(r => r.status === svcFilter);
  const filteredIssues = issueFilter === "All" ? issues : issues.filter(i => i.status === issueFilter);
  const pendingSvcCount = serviceRequests.filter(r => r.status === "Pending").length;
  const openIssueCount = issues.filter(i => i.status === "Open").length;

  const tabs: { key: Tab; label: string }[] = [
    { key: "dashboard", label: "Dashboard" },
    { key: "bookings", label: "Bookings" },
    { key: "rooms", label: "Room Availability" },
    { key: "service-requests", label: "Service Requests" },
    { key: "issues", label: "Room Issues" },
  ];

  return (
    <div className="flex min-h-screen bg-slate-50">
      <StaffSidebar tab={tab} setTab={setTab} pendingSvcCount={pendingSvcCount} openIssueCount={openIssueCount} />
      {/* Main */}
      <div className="flex-1 ml-60">
        {/* Top bar */}
        <div className="bg-white border-b px-8 py-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400 uppercase tracking-widest font-medium">Staff Panel</p>
            <h1 className="text-xl font-bold text-slate-800 capitalize">{tab.replace("-", " ")}</h1>
          </div>
        </div>
        <div className="px-8 py-8">

          {/* DASHBOARD */}
          {tab === "dashboard" && (
            <div>
              <h2 className="text-3xl font-bold text-gray-800 mb-8">Staff Dashboard</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                {[
                  { label: "Total Bookings", value: bookings.length, color: "text-blue-600", bg: "bg-blue-50", icon: "📋", tab: "bookings" as Tab },
                  { label: "Pending Bookings", value: bookings.filter(b => b.status === "Pending").length, color: "text-yellow-600", bg: "bg-yellow-50", icon: "⏳", tab: "bookings" as Tab },
                  { label: "Checked-In", value: bookings.filter(b => b.status === "Checked-In").length, color: "text-blue-500", bg: "bg-sky-50", icon: "🏨", tab: "bookings" as Tab },
                  { label: "Available Rooms", value: rooms.filter(r => r.available).length, color: "text-emerald-600", bg: "bg-emerald-50", icon: "🛌", tab: "rooms" as Tab },
                  { label: "Pending Services", value: pendingSvcCount, color: "text-orange-500", bg: "bg-orange-50", icon: "🛎️", tab: "service-requests" as Tab },
                  { label: "In Progress Services", value: serviceRequests.filter(r => r.status === "In Progress").length, color: "text-purple-600", bg: "bg-purple-50", icon: "⚙️", tab: "service-requests" as Tab },
                  { label: "Open Room Issues", value: openIssueCount, color: "text-red-500", bg: "bg-red-50", icon: "🚨", tab: "issues" as Tab },
                ].map(({ label, value, color, bg, icon, tab: t }) => (
                  <button key={label} onClick={() => setTab(t)}
                    className={`${bg} rounded-xl shadow p-6 text-center hover:shadow-md transition hover:-translate-y-0.5`}>
                    <div className="text-3xl mb-2">{icon}</div>
                    <p className={`text-4xl font-bold mb-1 ${color}`}>{value}</p>
                    <p className="text-gray-500 text-sm font-medium">{label}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* BOOKINGS */}
          {tab === "bookings" && (
            <div>
              <h2 className="text-3xl font-bold text-gray-800 mb-6">Manage Bookings</h2>
              {viewBooking && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                  <div className="bg-white rounded-xl shadow-xl p-8 w-full max-w-md">
                    <h3 className="text-xl font-bold text-gray-800 mb-4">Booking Details</h3>
                    {[
                      ["Booking No.", viewBooking.bookingNo],
                      ["Guest", viewBooking.guest],
                      ["Room", `${viewBooking.room} - Room ${viewBooking.roomNumber}`],
                      ["Check-in", viewBooking.checkIn],
                      ["Check-out", viewBooking.checkOut],
                      ["Guests", String(viewBooking.guests)],
                      ["Total", `₱${(viewBooking.total ?? 0).toLocaleString()}`],
                      ["Status", viewBooking.status],
                    ].map(([l, v]) => (
                      <div key={l} className="flex justify-between py-2 border-b last:border-0 text-sm">
                        <span className="text-gray-500">{l}</span>
                        <span className="font-semibold text-gray-800">{v}</span>
                      </div>
                    ))}
                    <button onClick={() => setViewBooking(null)} className="mt-6 w-full bg-emerald-600 text-white py-2.5 rounded-lg font-semibold hover:bg-emerald-700 transition">Close</button>
                  </div>
                </div>
              )}
              <div className="flex flex-wrap gap-2 mb-5">
                {(["All", "Pending", "Confirmed", "Checked-In", "Completed", "Cancelled"] as const).map(s => (
                  <button key={s} onClick={() => setFilterStatus(s)}
                    className={`px-4 py-1.5 rounded-full text-sm font-semibold transition ${filterStatus === s ? "bg-emerald-600 text-white" : "bg-white text-gray-600 border hover:bg-gray-50"}`}>{s}</button>
                ))}
              </div>
              <div className="bg-white rounded-xl shadow overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-emerald-700 text-white">
                    <tr>{["Booking No.", "Guest", "Room", "Check-in", "Check-out", "Total", "Status", "Actions"].map(h => <th key={h} className="px-4 py-3 text-left font-semibold">{h}</th>)}</tr>
                  </thead>
                  <tbody>
                    {filteredBookings.map((b, i) => (
                      <tr key={b.id} className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                        <td className="px-4 py-3 font-medium">{b.bookingNo}</td>
                        <td className="px-4 py-3">{b.guest}</td>
                        <td className="px-4 py-3">{b.room}</td>
                        <td className="px-4 py-3">{b.checkIn}</td>
                        <td className="px-4 py-3">{b.checkOut}</td>
                        <td className="px-4 py-3 font-semibold">₱{(b.total ?? 0).toLocaleString()}</td>
                        <td className="px-4 py-3"><span className={`px-2 py-1 rounded-full text-xs font-semibold ${BOOKING_STATUS_STYLES[b.status]}`}>{b.status}</span></td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-1">
                            <button onClick={() => setViewBooking(b)} className="bg-blue-500 hover:bg-blue-600 text-white text-xs px-2 py-1 rounded font-semibold">View</button>
                            {BOOKING_NEXT[b.status] && <button onClick={() => updateBookingStatus(b.id, BOOKING_NEXT[b.status]!)} className="bg-green-500 hover:bg-green-600 text-white text-xs px-2 py-1 rounded font-semibold">{BOOKING_NEXT_LABEL[b.status]}</button>}
                            {b.status === "Pending" && <button onClick={() => updateBookingStatus(b.id, "Cancelled")} className="bg-red-500 hover:bg-red-600 text-white text-xs px-2 py-1 rounded font-semibold">Cancel</button>}
                          </div>
                        </td>
                      </tr>
                    ))}
                    {filteredBookings.length === 0 && <tr><td colSpan={8} className="px-4 py-10 text-center text-gray-400">No bookings found.</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ROOM AVAILABILITY */}
          {tab === "rooms" && (
            <div>
              <h2 className="text-3xl font-bold text-gray-800 mb-4">Room Availability</h2>
              <div className="flex gap-4 mb-6">
                <div className="bg-emerald-50 rounded-xl px-5 py-3 text-center">
                  <p className="text-2xl font-bold text-emerald-600">{rooms.filter(r => r.available).length}</p>
                  <p className="text-xs text-gray-500 font-medium">Available</p>
                </div>
                <div className="bg-red-50 rounded-xl px-5 py-3 text-center">
                  <p className="text-2xl font-bold text-red-500">{rooms.filter(r => !r.available).length}</p>
                  <p className="text-xs text-gray-500 font-medium">Unavailable</p>
                </div>
                <div className="bg-gray-50 rounded-xl px-5 py-3 text-center">
                  <p className="text-2xl font-bold text-gray-700">{rooms.length}</p>
                  <p className="text-xs text-gray-500 font-medium">Total Rooms</p>
                </div>
              </div>
              <div className="bg-white rounded-xl shadow overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-emerald-700 text-white">
                    <tr>{["Room No.", "Type", "Price/Night", "Capacity", "Status"].map(h => <th key={h} className="px-4 py-3 text-left font-semibold">{h}</th>)}</tr>
                  </thead>
                  <tbody>
                    {rooms.length === 0 && <tr><td colSpan={5} className="px-4 py-10 text-center text-gray-400">No rooms found.</td></tr>}
                    {rooms.map((r, i) => (
                      <tr key={r.id} className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                        <td className="px-4 py-3 font-bold">{r.number}</td>
                        <td className="px-4 py-3">{r.type}</td>
                        <td className="px-4 py-3 font-semibold">₱{r.price.toLocaleString()}</td>
                        <td className="px-4 py-3">{r.capacity} guests</td>
                        <td className="px-4 py-3"><span className={`px-3 py-1 rounded-full text-xs font-semibold ${r.available ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"}`}>{r.available ? "Available" : "Unavailable"}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* SERVICE REQUESTS */}
          {tab === "service-requests" && (
            <div>
              <h2 className="text-3xl font-bold text-gray-800 mb-6">Service Requests</h2>
              {viewSvcReq && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                  <div className="bg-white rounded-xl shadow-xl p-8 w-full max-w-md">
                    <h3 className="text-xl font-bold text-gray-800 mb-4">Service Request Details</h3>
                    {[
                      ["Service", viewSvcReq.service_title],
                      ["Guest", viewSvcReq.user_name],
                      ["Email", viewSvcReq.user_email],
                      ["Room", viewSvcReq.room_number],
                      ["Requested Date", viewSvcReq.requested_date],
                      ["Notes", viewSvcReq.notes || "-"],
                      ["Status", viewSvcReq.status],
                    ].map(([l, v]) => (
                      <div key={l} className="flex justify-between py-2 border-b last:border-0 text-sm">
                        <span className="text-gray-500">{l}</span>
                        <span className="font-semibold text-gray-800 text-right max-w-[60%]">{v}</span>
                      </div>
                    ))}
                    <div className="flex gap-2 mt-6">
                      {SVC_NEXT[viewSvcReq.status] && (
                        <button onClick={() => updateSvcStatus(viewSvcReq.id, SVC_NEXT[viewSvcReq.status]!)}
                          className="flex-1 bg-emerald-600 text-white py-2.5 rounded-lg font-semibold hover:bg-emerald-700 transition text-sm">
                          {SVC_NEXT_LABEL[viewSvcReq.status]}
                        </button>
                      )}
                      {viewSvcReq.status === "Pending" && (
                        <button onClick={() => updateSvcStatus(viewSvcReq.id, "Cancelled")}
                          className="flex-1 bg-red-500 text-white py-2.5 rounded-lg font-semibold hover:bg-red-600 transition text-sm">Cancel</button>
                      )}
                      <button onClick={() => setViewSvcReq(null)} className="flex-1 border border-gray-300 text-gray-600 py-2.5 rounded-lg font-semibold hover:bg-gray-50 transition text-sm">Close</button>
                    </div>
                  </div>
                </div>
              )}
              <div className="flex flex-wrap gap-2 mb-5">
                {(["All", "Pending", "Confirmed", "In Progress", "Completed", "Cancelled"] as const).map(s => (
                  <button key={s} onClick={() => setSvcFilter(s)}
                    className={`px-4 py-1.5 rounded-full text-sm font-semibold transition ${svcFilter === s ? "bg-emerald-600 text-white" : "bg-white text-gray-600 border hover:bg-gray-50"}`}>{s}</button>
                ))}
              </div>
              <div className="bg-white rounded-xl shadow overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-emerald-700 text-white">
                    <tr>{["Service", "Guest", "Room", "Date", "Notes", "Status", "Actions"].map(h => <th key={h} className="px-4 py-3 text-left font-semibold">{h}</th>)}</tr>
                  </thead>
                  <tbody>
                    {filteredSvc.map((r, i) => (
                      <tr key={r.id} className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                        <td className="px-4 py-3 font-medium">{r.service_title}</td>
                        <td className="px-4 py-3">{r.user_name}</td>
                        <td className="px-4 py-3">{r.room_number}</td>
                        <td className="px-4 py-3">{r.requested_date}</td>
                        <td className="px-4 py-3 text-gray-500 max-w-[150px] truncate">{r.notes || "-"}</td>
                        <td className="px-4 py-3"><span className={`px-2 py-1 rounded-full text-xs font-semibold ${SVC_STATUS_STYLES[r.status]}`}>{r.status}</span></td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-1">
                            <button onClick={() => setViewSvcReq(r)} className="bg-blue-500 hover:bg-blue-600 text-white text-xs px-2 py-1 rounded font-semibold">View</button>
                            {SVC_NEXT[r.status] && <button onClick={() => updateSvcStatus(r.id, SVC_NEXT[r.status]!)} className="bg-green-500 hover:bg-green-600 text-white text-xs px-2 py-1 rounded font-semibold">{SVC_NEXT_LABEL[r.status]}</button>}
                            {r.status === "Pending" && <button onClick={() => updateSvcStatus(r.id, "Cancelled")} className="bg-red-500 hover:bg-red-600 text-white text-xs px-2 py-1 rounded font-semibold">Cancel</button>}
                          </div>
                        </td>
                      </tr>
                    ))}
                    {filteredSvc.length === 0 && <tr><td colSpan={7} className="px-4 py-10 text-center text-gray-400">No service requests found.</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ROOM ISSUES */}
          {tab === "issues" && (
            <div>
              <h2 className="text-3xl font-bold text-gray-800 mb-6">Room Issues</h2>
              {viewIssue && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                  <div className="bg-white rounded-xl shadow-xl p-8 w-full max-w-md">
                    <h3 className="text-xl font-bold text-gray-800 mb-4">Issue Details</h3>
                    {[
                      ["Room", viewIssue.room_number],
                      ["Guest", viewIssue.guest_name],
                      ["Email", viewIssue.guest_email],
                      ["Category", viewIssue.category],
                      ["Status", viewIssue.status],
                      ["Reported", new Date(viewIssue.created_at).toLocaleString()],
                    ].map(([l, v]) => (
                      <div key={l} className="flex justify-between py-2 border-b last:border-0 text-sm">
                        <span className="text-gray-500">{l}</span>
                        <span className="font-semibold text-gray-800 text-right max-w-[60%]">{v}</span>
                      </div>
                    ))}
                    <div className="mt-3 p-3 bg-gray-50 rounded-lg text-sm text-gray-700">
                      <p className="text-xs text-gray-400 mb-1 font-medium">Description</p>
                      {viewIssue.description}
                    </div>
                    <div className="flex gap-2 mt-6">
                      {ISSUE_NEXT[viewIssue.status] && (
                        <button onClick={() => { updateIssueStatus(viewIssue.id, ISSUE_NEXT[viewIssue.status]!); setViewIssue(prev => prev ? { ...prev, status: ISSUE_NEXT[prev.status]! } : prev); }}
                          className="flex-1 bg-emerald-600 text-white py-2.5 rounded-lg font-semibold hover:bg-emerald-700 transition text-sm">
                          {ISSUE_NEXT_LABEL[viewIssue.status]}
                        </button>
                      )}
                      <button onClick={() => setViewIssue(null)} className="flex-1 border border-gray-300 text-gray-600 py-2.5 rounded-lg font-semibold hover:bg-gray-50 transition text-sm">Close</button>
                    </div>
                  </div>
                </div>
              )}
              <div className="flex flex-wrap gap-2 mb-5">
                {(["All", "Open", "In Progress", "Resolved"] as const).map(s => (
                  <button key={s} onClick={() => setIssueFilter(s)}
                    className={`px-4 py-1.5 rounded-full text-sm font-semibold transition ${issueFilter === s ? "bg-emerald-600 text-white" : "bg-white text-gray-600 border hover:bg-gray-50"}`}>{s}</button>
                ))}
              </div>
              <div className="bg-white rounded-xl shadow overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-emerald-700 text-white">
                    <tr>{["Room", "Guest", "Category", "Description", "Reported", "Status", "Actions"].map(h => <th key={h} className="px-4 py-3 text-left font-semibold">{h}</th>)}</tr>
                  </thead>
                  <tbody>
                    {filteredIssues.map((issue, i) => (
                      <tr key={issue.id} className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                        <td className="px-4 py-3 font-medium">{issue.room_number}</td>
                        <td className="px-4 py-3">{issue.guest_name}</td>
                        <td className="px-4 py-3">{issue.category}</td>
                        <td className="px-4 py-3 max-w-[200px] truncate text-gray-600">{issue.description}</td>
                        <td className="px-4 py-3 text-gray-500">{new Date(issue.created_at).toLocaleDateString()}</td>
                        <td className="px-4 py-3"><span className={`px-2 py-1 rounded-full text-xs font-semibold ${ISSUE_STATUS_STYLES[issue.status]}`}>{issue.status}</span></td>
                        <td className="px-4 py-3">
                          <div className="flex gap-1">
                            <button onClick={() => setViewIssue(issue)} className="bg-blue-500 hover:bg-blue-600 text-white text-xs px-2 py-1 rounded font-semibold">View</button>
                            {ISSUE_NEXT[issue.status] && (
                              <button onClick={() => updateIssueStatus(issue.id, ISSUE_NEXT[issue.status]!)}
                                className="bg-green-500 hover:bg-green-600 text-white text-xs px-2 py-1 rounded font-semibold">
                                {ISSUE_NEXT_LABEL[issue.status]}
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                    {filteredIssues.length === 0 && <tr><td colSpan={7} className="px-4 py-10 text-center text-gray-400">No issues found.</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
