"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import Header from "../../Header/Header";
import { saveTokens } from "../../lib/auth";

const API = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

export default function LoginPage() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const params = useSearchParams();
  const redirect = params.get("redirect") || "/";
  const resetSuccess = params.get("reset") === "success";

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/users/login/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.detail || data.message || "Invalid email or password."); return; }
      saveTokens(data.access, data.refresh);
      localStorage.setItem("userName", data.name || data.username || form.email.split("@")[0]);
      localStorage.setItem("userEmail", form.email);
      const role = data.role || "guest";
      localStorage.setItem("role", role);
      if (role === "admin") { router.push("/admin"); return; }
      if (role === "staff") { router.push("/staff"); return; }
      router.push(redirect);
    } catch {
      setError("Cannot connect to server. Make sure Django is running.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gray-50 flex items-center justify-center pt-16">
        <div className="bg-white rounded-xl shadow-lg p-10 w-full max-w-md">
          <h1 className="text-3xl font-bold text-gray-800 mb-2 text-center">Welcome Back</h1>
          <p className="text-gray-500 text-center mb-8">Sign in to your Aurora Hotel account</p>
          {resetSuccess && <div className="bg-green-50 text-green-700 rounded-lg px-4 py-3 mb-4 text-sm">✅ Password reset successfully! Please sign in.</div>}
          {error && <div className="bg-red-50 text-red-600 rounded-lg px-4 py-3 mb-4 text-sm">{error}</div>}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input required type="email" name="email" value={form.email} onChange={handleChange} placeholder="your@email.com" className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-600" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input required type="password" name="password" value={form.password} onChange={handleChange} placeholder="••••••••" className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-600" />
            </div>
            <button type="submit" disabled={loading} className="w-full bg-emerald-700 text-white py-3 rounded-lg font-semibold hover:bg-emerald-800 transition disabled:opacity-60">
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>
          <p className="text-center text-gray-500 text-sm mt-4">
            Don&apos;t have an account?{" "}
            <Link href="/signup" className="text-emerald-700 hover:underline font-medium">Sign Up</Link>
          </p>
        </div>
      </div>
    </>
  );
}
