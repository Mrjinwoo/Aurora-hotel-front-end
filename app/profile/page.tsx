"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Header from "../../Header/Header";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export default function ProfilePage() {
  const router = useRouter();
  const [tab, setTab] = useState<"profile" | "password">("profile");
  const [editing, setEditing] = useState(false);
  const [saved, setSaved] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", phone: "" });
  const [pwForm, setPwForm] = useState({ current: "", password: "", confirm: "" });

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { router.replace("/login?redirect=/profile"); return; }
    fetch(`${API}/api/users/me/`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(data => {
        const f = {
          name: data.name || data.full_name || localStorage.getItem("userName") || "",
          email: data.email || localStorage.getItem("userEmail") || "",
          phone: data.phone || data.contact || localStorage.getItem("userContact") || "",
        };
        setForm(f);
        localStorage.setItem("userName", f.name);
        localStorage.setItem("userEmail", f.email);
      })
      .catch(() => {
        setForm({
          name: localStorage.getItem("userName") || "",
          email: localStorage.getItem("userEmail") || "",
          phone: localStorage.getItem("userContact") || "",
        });
      });
  }, [router]);

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    setError(""); setSaved("");
    setLoading(true);
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`${API}/api/users/me/`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name: form.name, phone: form.phone }),
      });
      if (!res.ok) { const d = await res.json(); setError(d.detail || "Failed to update profile."); return; }
      localStorage.setItem("userName", form.name);
      localStorage.setItem("userContact", form.phone);
      setEditing(false);
      setSaved("Profile updated successfully!");
      setTimeout(() => setSaved(""), 3000);
    } catch {
      setError("Cannot connect to server.");
    } finally {
      setLoading(false);
    }
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    setError(""); setSaved("");
    if (pwForm.password !== pwForm.confirm) { setError("Passwords do not match."); return; }
    if (pwForm.password.length < 8) { setError("Password must be at least 8 characters."); return; }
    setLoading(true);
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`${API}/api/users/change-password/`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ current_password: pwForm.current, new_password: pwForm.password }),
      });
      if (!res.ok) { const d = await res.json(); setError(d.detail || "Failed to change password."); return; }
      setPwForm({ current: "", password: "", confirm: "" });
      setSaved("Password changed successfully!");
      setTimeout(() => setSaved(""), 3000);
    } catch {
      setError("Cannot connect to server.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gray-50 pt-28 pb-16">
        <div className="max-w-xl mx-auto px-6">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">My Profile</h1>
          <p className="text-gray-500 mb-6">Manage your personal information</p>

          {saved && <div className="bg-green-50 text-green-700 rounded-lg px-4 py-3 mb-4 text-sm font-medium">✅ {saved}</div>}
          {error && <div className="bg-red-50 text-red-600 rounded-lg px-4 py-3 mb-4 text-sm">{error}</div>}

          {/* Tabs */}
          <div className="flex gap-2 mb-6">
            {(["profile", "password"] as const).map(t => (
              <button key={t} onClick={() => { setTab(t); setError(""); setSaved(""); }}
                className={`px-5 py-2 rounded-full text-sm font-semibold transition ${tab === t ? "bg-emerald-700 text-white" : "bg-white border border-gray-300 text-gray-600 hover:border-emerald-500"}`}>
                {t === "profile" ? "Profile Info" : "Change Password"}
              </button>
            ))}
          </div>

          <div className="bg-white rounded-xl shadow p-8">
            {tab === "profile" && (
              <>
                <div className="flex items-center justify-between mb-6">
                  <div className="w-16 h-16 bg-emerald-700 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                    {form.name ? form.name[0].toUpperCase() : "?"}
                  </div>
                  {!editing && (
                    <button onClick={() => setEditing(true)} className="px-4 py-2 border border-emerald-600 text-emerald-700 rounded-lg hover:bg-emerald-50 transition text-sm font-semibold">
                      Edit Profile
                    </button>
                  )}
                </div>

                {editing ? (
                  <form onSubmit={handleSaveProfile} className="space-y-4">
                    {[
                      { label: "Full Name", key: "name", placeholder: "Juan Dela Cruz" },
                      { label: "Phone Number", key: "phone", placeholder: "+63 912 345 6789" },
                    ].map(({ label, key, placeholder }) => (
                      <div key={key}>
                        <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
                        <input
                          value={form[key as keyof typeof form]}
                          onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                          placeholder={placeholder}
                          className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                      </div>
                    ))}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                      <input value={form.email} disabled className="w-full border rounded-lg px-4 py-2 bg-gray-50 text-gray-400 cursor-not-allowed" />
                      <p className="text-xs text-gray-400 mt-1">Email cannot be changed.</p>
                    </div>
                    <div className="flex gap-3 pt-2">
                      <button type="submit" disabled={loading} className="flex-1 bg-emerald-700 text-white py-2.5 rounded-lg font-semibold hover:bg-emerald-800 transition disabled:opacity-60">
                        {loading ? "Saving..." : "Save Changes"}
                      </button>
                      <button type="button" onClick={() => setEditing(false)} className="flex-1 border border-gray-300 text-gray-600 py-2.5 rounded-lg font-semibold hover:bg-gray-50 transition">
                        Cancel
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="space-y-4">
                    {[
                      { label: "Full Name", value: form.name },
                      { label: "Email", value: form.email },
                      { label: "Phone Number", value: form.phone },
                    ].map(({ label, value }) => (
                      <div key={label} className="border-b pb-4 last:border-0">
                        <p className="text-xs text-gray-400 uppercase font-medium mb-1">{label}</p>
                        <p className="text-gray-800 font-medium">{value || <span className="text-gray-400 italic">Not set</span>}</p>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}

            {tab === "password" && (
              <form onSubmit={handleChangePassword} className="space-y-4">
                {[
                  { label: "Current Password", key: "current" },
                  { label: "New Password", key: "password" },
                  { label: "Confirm New Password", key: "confirm" },
                ].map(({ label, key }) => (
                  <div key={key}>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
                    <input
                      required
                      type="password"
                      value={pwForm[key as keyof typeof pwForm]}
                      onChange={(e) => setPwForm({ ...pwForm, [key]: e.target.value })}
                      placeholder="••••••••"
                      className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                ))}
                <button type="submit" disabled={loading} className="w-full bg-emerald-700 text-white py-2.5 rounded-lg font-semibold hover:bg-emerald-800 transition disabled:opacity-60 mt-2">
                  {loading ? "Updating..." : "Change Password"}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
