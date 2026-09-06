"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Header from "../../Header/Header";
import { saveTokens } from "../../lib/auth";

const API = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

export default function SignupPage() {
  const [form, setForm] = useState({ name: "", email: "", password: "", confirm: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (form.password !== form.confirm) { setError("Passwords do not match."); return; }
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/users/signup/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: form.name, email: form.email, password: form.password }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.detail || "Signup failed."); return; }
      saveTokens(data.access, data.refresh);
      localStorage.setItem("userName", form.name);
      localStorage.setItem("userEmail", form.email);
      router.push("/");
    } catch (err) {
      console.error("Signup error:", err);
      setError(`Cannot connect to server at ${API}. Make sure Django is running on port 8000.`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gray-50 flex items-center justify-center pt-16">
        <div className="bg-white rounded-xl shadow-lg p-10 w-full max-w-md">
          <h1 className="text-3xl font-bold text-gray-800 mb-2 text-center">Create Account</h1>
          <p className="text-gray-500 text-center mb-8">Join Aurora Hotel for exclusive benefits</p>
          {error && <div className="bg-red-50 text-red-600 rounded-lg px-4 py-3 mb-4 text-sm">{error}</div>}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
              <input required name="name" value={form.name} onChange={handleChange} placeholder="John Doe" className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-600" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input required type="email" name="email" value={form.email} onChange={handleChange} placeholder="your@email.com" className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-600" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input required type="password" name="password" value={form.password} onChange={handleChange} placeholder="••••••••" className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-600" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
              <input required type="password" name="confirm" value={form.confirm} onChange={handleChange} placeholder="••••••••" className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-600" />
            </div>
            <button type="submit" disabled={loading} className="w-full bg-emerald-700 text-white py-3 rounded-lg font-semibold hover:bg-emerald-800 transition disabled:opacity-60">
              {loading ? "Creating account..." : "Create Account"}
            </button>
          </form>
          <p className="text-center text-gray-500 text-sm mt-6">
            Already have an account?{" "}
            <Link href="/login" className="text-emerald-700 hover:underline font-medium">Sign In</Link>
          </p>
        </div>
      </div>
    </>
  );
}
