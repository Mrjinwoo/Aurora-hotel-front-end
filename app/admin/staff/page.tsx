"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AdminSidebar from "../../../Header/AdminSidebar";
import { getToken } from "../../../lib/auth";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

type Staff = { id: number; name: string; email: string; contact: string; role: string; };
const emptyForm = { name: "", email: "", password: "", contact: "", role: "staff" };

export default function AdminStaffPage() {
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [editingStaff, setEditingStaff] = useState<Staff | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [viewStaff, setViewStaff] = useState<Staff | null>(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (localStorage.getItem("role") !== "admin") { router.replace("/login"); return; }
    setAuthorized(true);
    fetchStaff();
  }, [router]);

  async function fetchStaff() {
    const token = await getToken();
    if (!token) return;
    try {
      const res = await fetch(`${API}/api/users/staff/`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) {
        const data = await res.json();
        const list = Array.isArray(data) ? data : (data.results ?? []);
        setStaff(list.filter((u: any) => u.role === "staff" || u.role === "admin"));
      }
    } catch { /* ignore */ }
  }

  async function saveStaff() {
    setError("");
    setLoading(true);
    const token = await getToken();
    const method = editingStaff ? "PUT" : "POST";
    const url = editingStaff ? `${API}/api/users/staff/${editingStaff.id}/` : `${API}/api/users/staff/`;
    const body = editingStaff
      ? { name: form.name, email: form.email, contact: form.contact, role: form.role }
      : form;
    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.detail || JSON.stringify(data)); return; }
      await fetchStaff();
      setShowForm(false);
      setEditingStaff(null);
      setForm(emptyForm);
    } catch { setError("Cannot connect to server."); }
    finally { setLoading(false); }
  }

  async function deleteStaff(id: number) {
    const token = await getToken();
    await fetch(`${API}/api/users/staff/${id}/`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
    setStaff(prev => prev.filter(s => s.id !== id));
  }

  if (!authorized) return null;

  const filtered = staff.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex min-h-screen bg-slate-50">
      <AdminSidebar />
      <div className="flex-1 ml-60">
        <div className="bg-white border-b px-8 py-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400 uppercase tracking-widest font-medium">Admin › Staff</p>
            <h1 className="text-xl font-bold text-slate-800">Manage Staff</h1>
          </div>
          <button onClick={() => { setEditingStaff(null); setForm(emptyForm); setError(""); setShowForm(true); }}
            className="bg-slate-900 text-white px-5 py-2 rounded-lg hover:bg-slate-700 transition font-semibold text-sm">+ Add Staff</button>
        </div>
        <div className="px-8 py-8">
          <p className="text-slate-500 text-sm mb-6">{staff.length} staff members</p>

          {/* View Modal */}
          {viewStaff && (
            <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-xl shadow-xl p-8 w-full max-w-md">
                <div className="w-16 h-16 bg-gray-900 rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4">
                  {viewStaff.name[0]}
                </div>
                <h3 className="text-xl font-bold text-gray-800 text-center mb-4">{viewStaff.name}</h3>
                {[["Email", viewStaff.email], ["Contact", viewStaff.contact], ["Role", viewStaff.role]].map(([l, v]) => (
                  <div key={l} className="flex justify-between py-2 border-b last:border-0 text-sm">
                    <span className="text-gray-500">{l}</span>
                    <span className="font-semibold text-gray-800">{v}</span>
                  </div>
                ))}
                <button onClick={() => setViewStaff(null)} className="mt-6 w-full bg-gray-900 text-white py-2.5 rounded-lg font-semibold hover:bg-gray-700 transition">Close</button>
              </div>
            </div>
          )}

          {/* Add/Edit Form */}
          {showForm && (
            <div className="bg-white rounded-xl shadow p-6 mb-6">
              <h3 className="text-lg font-bold text-gray-800 mb-4">{editingStaff ? "Edit Staff" : "Add New Staff"}</h3>
              {error && <div className="bg-red-50 text-red-600 rounded-lg px-4 py-2 mb-4 text-sm">{error}</div>}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {([["Full Name", "name", "text", "Jane Doe"], ["Email", "email", "email", "jane@aurora.com"], ["Contact", "contact", "text", "+63 912 000 0000"]] as [string, string, string, string][]).map(([label, key, type, placeholder]) => (
                  <div key={key}>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
                    <input type={type} placeholder={placeholder} value={form[key as keyof typeof form]}
                      onChange={e => setForm({ ...form, [key]: e.target.value })}
                      className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400" />
                  </div>
                ))}
                {!editingStaff && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                    <input type="password" placeholder="••••••••" value={form.password}
                      onChange={e => setForm({ ...form, password: e.target.value })}
                      className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400" />
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                  <select value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400">
                    <option value="staff">Staff</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-3 mt-5">
                <button onClick={saveStaff} disabled={loading}
                  className="bg-gray-900 text-white px-6 py-2.5 rounded-lg hover:bg-gray-700 transition font-semibold text-sm disabled:opacity-60">
                  {loading ? "Saving..." : "Save Staff"}
                </button>
                <button onClick={() => setShowForm(false)} className="border border-gray-300 text-gray-600 px-6 py-2.5 rounded-lg hover:bg-gray-50 transition text-sm">Cancel</button>
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
                <tr>{["Full Name", "Email", "Contact", "Role", "Actions"].map(h => (
                  <th key={h} className="px-4 py-3 text-left font-semibold">{h}</th>
                ))}</tr>
              </thead>
              <tbody>
                {filtered.map((s, i) => (
                  <tr key={s.id} className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                    <td className="px-4 py-3 font-semibold text-gray-800">{s.name}</td>
                    <td className="px-4 py-3 text-gray-600">{s.email}</td>
                    <td className="px-4 py-3 text-gray-500">{s.contact}</td>
                    <td className="px-4 py-3 capitalize">{s.role}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1.5">
                        <button onClick={() => setViewStaff(s)} className="bg-blue-500 hover:bg-blue-600 text-white text-xs px-2.5 py-1.5 rounded font-semibold">View</button>
                        <button onClick={() => { setEditingStaff(s); setForm({ name: s.name, email: s.email, password: "", contact: s.contact, role: s.role }); setError(""); setShowForm(true); }}
                          className="bg-yellow-400 hover:bg-yellow-500 text-white text-xs px-2.5 py-1.5 rounded font-semibold">Edit</button>
                        <button onClick={() => deleteStaff(s.id)} className="bg-red-500 hover:bg-red-600 text-white text-xs px-2.5 py-1.5 rounded font-semibold">Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr><td colSpan={5} className="px-4 py-10 text-center text-gray-400">No staff found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
