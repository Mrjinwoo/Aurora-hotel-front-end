"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AdminSidebar from "../../../Header/AdminSidebar";
import { getToken } from "../../../lib/auth";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

type Service = { id: number; title: string; desc: string; price: number; image: string | null; available: boolean; };
const emptyForm = { title: "", desc: "", price: 0, available: true };

export default function AdminServicesPage() {
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);
  const [services, setServices] = useState<Service[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [viewService, setViewService] = useState<Service | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (localStorage.getItem("role") !== "admin") { router.replace("/login"); return; }
    setAuthorized(true);
    fetchServices();
  }, [router]);

  async function fetchServices() {
    const token = await getToken();
    try {
      const res = await fetch(`${API}/api/services/`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) setServices((await res.json()).map((s: any) => ({ ...s, price: Number(s.price) })));
    } catch { /* ignore */ }
  }

  async function saveService() {
    setError("");
    if (!form.title.trim()) { setError("Title is required."); return; }
    setLoading(true);
    const token = await getToken();
    const method = editingService ? "PUT" : "POST";
    const url = editingService ? `${API}/api/services/${editingService.id}/` : `${API}/api/services/`;
    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.detail || JSON.stringify(data)); return; }
      await fetchServices();
      setShowForm(false);
      setEditingService(null);
      setForm(emptyForm);
    } catch { setError("Cannot connect to server."); }
    finally { setLoading(false); }
  }

  async function deleteService(id: number) {
    const token = await getToken();
    await fetch(`${API}/api/services/${id}/`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
    setServices(prev => prev.filter(s => s.id !== id));
  }

  if (!authorized) return null;

  return (
    <div className="flex min-h-screen bg-slate-50">
      <AdminSidebar />
      <div className="flex-1 ml-60">
        <div className="bg-white border-b px-8 py-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400 uppercase tracking-widest font-medium">Admin › Services</p>
            <h1 className="text-xl font-bold text-slate-800">Manage Services</h1>
          </div>
          <button onClick={() => { setEditingService(null); setForm(emptyForm); setError(""); setShowForm(true); }}
            className="bg-slate-900 text-white px-5 py-2 rounded-lg hover:bg-slate-700 transition font-semibold text-sm">+ Add Service</button>
        </div>
        <div className="px-8 py-8">
          <p className="text-slate-500 text-sm mb-6">{services.length} services</p>

          {/* View Modal */}
          {viewService && (
            <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-xl shadow-xl p-8 w-full max-w-md">
                <h3 className="text-xl font-bold text-gray-800 mb-4">Service Details</h3>
                {[["Title", viewService.title], ["Description", viewService.desc], ["Price", `₱${viewService.price.toLocaleString()}`], ["Status", viewService.available ? "Available" : "Unavailable"]].map(([l, v]) => (
                  <div key={l} className="flex justify-between py-2 border-b last:border-0 text-sm">
                    <span className="text-gray-500">{l}</span>
                    <span className="font-semibold text-gray-800">{v}</span>
                  </div>
                ))}
                <button onClick={() => setViewService(null)} className="mt-6 w-full bg-gray-900 text-white py-2.5 rounded-lg font-semibold hover:bg-gray-700 transition">Close</button>
              </div>
            </div>
          )}

          {/* Add/Edit Form */}
          {showForm && (
            <div className="bg-white rounded-xl shadow p-6 mb-6">
              <h3 className="text-lg font-bold text-gray-800 mb-4">{editingService ? "Edit Service" : "Add New Service"}</h3>
              {error && <div className="bg-red-50 text-red-600 rounded-lg px-4 py-2 mb-4 text-sm">{error}</div>}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                  <input placeholder="e.g. Spa & Wellness" value={form.title}
                    onChange={e => setForm({ ...form, title: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Price (₱)</label>
                  <input type="number" placeholder="500" value={form.price}
                    onChange={e => setForm({ ...form, price: Number(e.target.value) })}
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <input placeholder="Brief description of the service" value={form.desc}
                    onChange={e => setForm({ ...form, desc: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400" />
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <input type="checkbox" id="svc-avail" checked={form.available} onChange={e => setForm({ ...form, available: e.target.checked })} className="w-4 h-4" />
                  <label htmlFor="svc-avail" className="text-sm font-medium text-gray-700">Available</label>
                </div>
              </div>
              <div className="flex gap-3 mt-5">
                <button onClick={saveService} disabled={loading}
                  className="bg-gray-900 text-white px-6 py-2.5 rounded-lg hover:bg-gray-700 transition font-semibold text-sm disabled:opacity-60">
                  {loading ? "Saving..." : "Save Service"}
                </button>
                <button onClick={() => setShowForm(false)} className="border border-gray-300 text-gray-600 px-6 py-2.5 rounded-lg hover:bg-gray-50 transition text-sm">Cancel</button>
              </div>
            </div>
          )}

          <div className="bg-white rounded-xl shadow overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-900 text-white">
                <tr>{["Title", "Description", "Price", "Status", "Actions"].map(h => (
                  <th key={h} className="px-4 py-3 text-left font-semibold">{h}</th>
                ))}</tr>
              </thead>
              <tbody>
                {services.map((s, i) => (
                  <tr key={s.id} className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                    <td className="px-4 py-3 font-semibold text-gray-800">{s.title}</td>
                    <td className="px-4 py-3 text-gray-500">{s.desc}</td>
                    <td className="px-4 py-3 font-semibold">₱{s.price.toLocaleString()}</td>
                    <td className="px-4 py-3">
                      <button onClick={async () => {
                        const token = await getToken();
                        await fetch(`${API}/api/services/${s.id}/`, {
                          method: "PATCH",
                          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                          body: JSON.stringify({ available: !s.available }),
                        });
                        setServices(prev => prev.map(x => x.id === s.id ? { ...x, available: !x.available } : x));
                      }} className={`px-3 py-1 rounded-full text-xs font-semibold ${s.available ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"}`}>
                        {s.available ? "Available" : "Unavailable"}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1.5">
                        <button onClick={() => setViewService(s)} className="bg-blue-500 hover:bg-blue-600 text-white text-xs px-2.5 py-1.5 rounded font-semibold">View</button>
                        <button onClick={() => { setEditingService(s); setForm({ title: s.title, desc: s.desc, price: s.price, available: s.available }); setError(""); setShowForm(true); }}
                          className="bg-yellow-400 hover:bg-yellow-500 text-white text-xs px-2.5 py-1.5 rounded font-semibold">Edit</button>
                        <button onClick={() => deleteService(s.id)} className="bg-red-500 hover:bg-red-600 text-white text-xs px-2.5 py-1.5 rounded font-semibold">Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
                {services.length === 0 && (
                  <tr><td colSpan={5} className="px-4 py-10 text-center text-gray-400">No services found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
