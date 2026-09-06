"use client";
import { useState, useEffect } from "react";
import Header from "../../Header/Header";
import { decodeToken } from "../../lib/auth";

export default function ContactPage() {
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [sent, setSent] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      const payload = decodeToken(token);
      if (payload) {
        setForm(f => ({
          ...f,
          name: payload.name || localStorage.getItem("userName") || "",
          email: payload.email || localStorage.getItem("userEmail") || "",
        }));
      }
    }
  }, []);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSent(true);
  }

  return (
    <>
      <Header />
      <div className="bg-emerald-800 py-16 text-center text-white pt-28">
        <h1 className="text-5xl font-bold mb-2">Contact Us</h1>
        <p className="text-emerald-200">We would love to hear from you</p>
      </div>
      <main className="max-w-7xl mx-auto px-6 py-16 grid grid-cols-1 md:grid-cols-2 gap-12">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Get in Touch</h2>
          {sent ? (
            <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-green-700">
              <p className="font-semibold text-lg">✅ Message Sent!</p>
              <p className="text-sm mt-1">Thank you, {form.name}. We will get back to you shortly.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input required name="name" value={form.name} onChange={handleChange} placeholder="Your name" className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-600" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input required type="email" name="email" value={form.email} onChange={handleChange} placeholder="your@email.com" className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-600" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
                <textarea required name="message" value={form.message} onChange={handleChange} rows={5} placeholder="How can we help you?" className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-600" />
              </div>
              <button type="submit" className="w-full bg-emerald-700 text-white py-3 rounded-lg font-semibold hover:bg-emerald-800 transition">
                Send Message
              </button>
            </form>
          )}
        </div>
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-gray-800">Contact Information</h2>
          {[
            { icon: "\uD83D\uDCCD", label: "Address", value: "6018 Crossing Balud, San Fernando, Cebu City" },
            { icon: "\uD83D\uDCDE", label: "Phone", value: "09759403511" },
            { icon: "\u2709\uFE0F", label: "Email", value: "admin@aurorahotel.com" },
            { icon: "\uD83D\uDD50", label: "Hours", value: "Front Desk: 24/7 | Reservations: 8AM - 10PM" },
          ].map(({ icon, label, value }) => (
            <div key={label} className="flex gap-4">
              <span className="text-2xl">{icon}</span>
              <div>
                <p className="font-semibold text-gray-800">{label}</p>
                <p className="text-gray-500 text-sm">{value}</p>
              </div>
            </div>
          ))}
        </div>
      </main>
    </>
  );
}
