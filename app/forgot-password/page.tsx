"use client";
import { useState } from "react";
import Link from "next/link";
import Header from "../../Header/Header";

const API = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/users/forgot-password/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.detail || "Failed to send reset email.");
        return;
      }
      setSent(true);
    } catch {
      setError("Cannot connect to server.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gray-50 flex items-center justify-center pt-16">
        <div className="bg-white rounded-xl shadow-lg p-10 w-full max-w-md">
          {sent ? (
            <div className="text-center">
              <div className="text-5xl mb-4">📧</div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Check your email</h2>
              <p className="text-gray-500 mb-6">
                We sent a password reset link to <strong>{email}</strong>. Check your inbox and follow the instructions.
              </p>
              <Link href="/login" className="text-emerald-700 hover:underline font-medium text-sm">
                Back to Sign In
              </Link>
            </div>
          ) : (
            <>
              <h1 className="text-3xl font-bold text-gray-800 mb-2 text-center">Forgot Password</h1>
              <p className="text-gray-500 text-center mb-8">
                Enter your email and we&apos;ll send you a reset link.
              </p>
              {error && (
                <div className="bg-red-50 text-red-600 rounded-lg px-4 py-3 mb-4 text-sm">{error}</div>
              )}
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    required
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-emerald-700 text-white py-3 rounded-lg font-semibold hover:bg-emerald-800 transition disabled:opacity-60"
                >
                  {loading ? "Sending..." : "Send Reset Link"}
                </button>
              </form>
              <p className="text-center text-gray-500 text-sm mt-6">
                Remember your password?{" "}
                <Link href="/login" className="text-emerald-700 hover:underline font-medium">
                  Sign In
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </>
  );
}
