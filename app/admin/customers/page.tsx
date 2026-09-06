"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AdminSidebar from "../../../Header/AdminSidebar";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

type Customer = { id: number; name: string; email: string; role: string; created_at: string; };

export default function AdminCustomersPage() {
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [viewCustomer, setViewCustomer] = useState<Customer | null>(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const role = localStorage.getItem("role");
    if (role !== "admin") { router.replace("/login"); return; }
    setAuthorized(true);
    fetchCustomers();
  }, [router]);

  async function fetchCustomers() {
    const token = localStorage.getItem("token");
    if (!token) return;
    try {
      // Decode token to check role — admin has id:0 so backend _get_user_from_token returns None
      // Use the admin-accessible endpoint directly
      const res = await fetch(`${API}/api/users/list/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return;
      const data = await res.json();
      const list = Array.isArray(data) ? data : (data.results ?? []);
      setCustomers(list.filter((u: any) => u.role === "guest" || u.role === "customer" || u.role === "user" || !u.role));
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }

  async function deleteCustomer(id: number) {
    if (!confirm("Delete this customer?")) return;
    const token = localStorage.getItem("token");
    await fetch(`${API}/api/users/${id}/`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    setCustomers(prev => prev.filter(c => c.id !== id));
  }

  if (!authorized) return null;

  const filtered = customers.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex min-h-screen bg-slate-50">
      <AdminSidebar />
      <div className="flex-1 ml-60">
        <div className="bg-white border-b px-8 py-4">
          <p className="text-xs text-slate-400 uppercase tracking-widest font-medium">Admin › Customers</p>
          <h1 className="text-xl font-bold text-slate-800">Manage Customers</h1>
        </div>
        <div className="px-8 py-8">
          <p className="text-slate-500 text-sm mb-6">{customers.length} registered customers</p>

          {/* View Modal */}
          {viewCustomer && (
            <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-xl shadow-xl p-8 w-full max-w-md">
                <div className="w-16 h-16 bg-gray-900 rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4">
                  {viewCustomer.name[0]}
                </div>
                <h3 className="text-xl font-bold text-gray-800 text-center mb-4">{viewCustomer.name}</h3>
                {[
                  ["Email", viewCustomer.email],
                  ["Role", viewCustomer.role],
                  ["Joined", new Date(viewCustomer.created_at).toLocaleDateString("en-PH", { year: "numeric", month: "long", day: "numeric" })],
                ].map(([l, v]) => (
                  <div key={l} className="flex justify-between py-2 border-b last:border-0 text-sm">
                    <span className="text-gray-500">{l}</span>
                    <span className="font-semibold text-gray-800">{v}</span>
                  </div>
                ))}
                <button onClick={() => setViewCustomer(null)} className="mt-6 w-full bg-gray-900 text-white py-2.5 rounded-lg font-semibold hover:bg-gray-700 transition">Close</button>
              </div>
            </div>
          )}

          <div className="mb-5">
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name or email..."
              className="w-full max-w-sm border rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400 bg-white" />
          </div>

          <div className="bg-white rounded-xl shadow overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-900 text-white">
                <tr>{["Full Name", "Email", "Role", "Joined", "Actions"].map(h => (
                  <th key={h} className="px-4 py-3 text-left font-semibold">{h}</th>
                ))}</tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={5} className="px-4 py-10 text-center text-gray-400">Loading customers...</td></tr>
                ) : filtered.map((c, i) => (
                  <tr key={c.id} className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                    <td className="px-4 py-3 font-semibold text-gray-800">{c.name}</td>
                    <td className="px-4 py-3 text-gray-600">{c.email}</td>
                    <td className="px-4 py-3 text-gray-500 capitalize">{c.role}</td>
                    <td className="px-4 py-3 text-gray-500">{new Date(c.created_at).toLocaleDateString("en-PH")}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button onClick={() => setViewCustomer(c)} className="bg-blue-500 hover:bg-blue-600 text-white text-xs px-3 py-1.5 rounded font-semibold">View</button>
                        <button onClick={() => deleteCustomer(c.id)} className="bg-red-500 hover:bg-red-600 text-white text-xs px-3 py-1.5 rounded font-semibold">Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
                {!loading && filtered.length === 0 && (
                  <tr><td colSpan={5} className="px-4 py-10 text-center text-gray-400">No customers found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
