"use client";
import Header from "../../Header/Header";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getToken } from "../../lib/auth";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

type Service = { id: number; image: string | null; title: string; desc: string; price?: number; available?: boolean; };

const FALLBACK_SERVICES: Service[] = [
  { id: 1, image: "/spa and wellness.jpg", title: "Spa & Wellness", desc: "Rejuvenate your body and mind with our world-class spa treatments.", price: 2500, available: true },
  { id: 2, image: "/fine dining.jpg", title: "Fine Dining", desc: "Savor exquisite cuisine crafted by our award-winning chefs.", price: 1500, available: true },
  { id: 3, image: "/swimming pool.jpg", title: "Swimming Pool", desc: "Enjoy our heated infinity pool with panoramic city views.", price: 500, available: true },
  { id: 4, image: "/gym.jpg", title: "Fitness Center", desc: "State-of-the-art gym equipment available 24/7 for guests.", price: 300, available: true },
  { id: 5, image: "/airport transfer.jpg", title: "Airport Transfer", desc: "Comfortable and reliable airport pickup and drop-off service.", price: 1200, available: true },
  { id: 6, image: "/Concierge.png", title: "Concierge Service", desc: "Our dedicated concierge team is available around the clock.", price: 0, available: true },
  { id: 7, image: "/Room Service.png", title: "Room Service", desc: "24-hour in-room dining with an extensive menu selection.", price: 200, available: true },
  { id: 8, image: "/Valet Parking.png", title: "Valet Parking", desc: "Secure and convenient valet parking for all hotel guests.", price: 400, available: true },
];

function getImageUrl(image: string | null): string | null {
  if (!image) return null;
  if (image.startsWith("http")) return image;
  if (image.startsWith("/")) return image;
  return `${API}${image}`;
}

const emptyForm = { room_number: "", requested_date: "", notes: "" };

export default function ServicesPage() {
  const router = useRouter();
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`${API}/api/services/`)
      .then(r => r.json())
      .then(data => setServices(Array.isArray(data) && data.length ? data : FALLBACK_SERVICES))
      .catch(() => setServices(FALLBACK_SERVICES))
      .finally(() => setLoading(false));
  }, []);

  function openModal(service: Service) {
    const token = localStorage.getItem("token");
    if (!token) { router.push(`/login?redirect=/services`); return; }
    setSelectedService(service);
    setForm(emptyForm);
    setError("");
    setSuccess(false);
    // pre-fill name and email from localStorage
  }

  function closeModal() {
    setSelectedService(null);
    setSuccess(false);
    setError("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    const token = await getToken();
    if (!token) { router.push("/login?redirect=/services"); return; }

    const userName = localStorage.getItem("userName") || "";
    const userEmail = localStorage.getItem("userEmail") || "";

    try {
      const res = await fetch(`${API}/api/services/requests/`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          service: selectedService!.id,
          user_name: userName,
          user_email: userEmail,
          room_number: form.room_number,
          requested_date: form.requested_date,
          notes: form.notes,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.detail || JSON.stringify(data)); return; }
      setSuccess(true);
    } catch {
      setError("Cannot connect to server.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <Header />

      {/* Request Modal */}
      {selectedService && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl p-8 w-full max-w-md">
            {success ? (
              <div className="text-center py-4">
                <div className="text-6xl mb-4">✅</div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">Request Submitted!</h3>
                <p className="text-gray-500 mb-1">Your request for <strong>{selectedService.title}</strong> has been sent.</p>
                <p className="text-gray-400 text-sm mb-6">Our staff will confirm your request shortly.</p>
                <button onClick={closeModal} className="w-full bg-emerald-700 text-white py-2.5 rounded-lg font-semibold hover:bg-emerald-800 transition">
                  Done
                </button>
              </div>
            ) : (
              <>
                <div className="flex items-start justify-between mb-5">
                  <div>
                    <h3 className="text-xl font-bold text-gray-800">Request Service</h3>
                    <p className="text-emerald-700 font-medium text-sm mt-0.5">{selectedService.title}</p>
                  </div>
                  <button onClick={closeModal} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
                </div>

                {error && <div className="bg-red-50 text-red-600 rounded-lg px-4 py-2 mb-4 text-sm">{error}</div>}

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Room Number</label>
                    <input
                      required
                      value={form.room_number}
                      onChange={e => setForm({ ...form, room_number: e.target.value })}
                      placeholder="e.g. 101"
                      className="w-full border rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Requested Date</label>
                    <input
                      required
                      type="date"
                      value={form.requested_date}
                      onChange={e => setForm({ ...form, requested_date: e.target.value })}
                      min={new Date().toISOString().split("T")[0]}
                      className="w-full border rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Notes <span className="text-gray-400">(optional)</span></label>
                    <textarea
                      value={form.notes}
                      onChange={e => setForm({ ...form, notes: e.target.value })}
                      placeholder="Any special instructions or preferences..."
                      rows={3}
                      className="w-full border rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                    />
                  </div>
                  <div className="flex gap-3 pt-1">
                    <button type="submit" disabled={submitting}
                      className="flex-1 bg-emerald-700 text-white py-2.5 rounded-lg font-semibold hover:bg-emerald-800 transition disabled:opacity-60">
                      {submitting ? "Submitting..." : "Submit Request"}
                    </button>
                    <button type="button" onClick={closeModal}
                      className="flex-1 border border-gray-300 text-gray-600 py-2.5 rounded-lg font-semibold hover:bg-gray-50 transition">
                      Cancel
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      )}

      <div className="bg-emerald-800 py-16 text-center text-white pt-28">
        <h1 className="text-5xl font-bold mb-2">Our Services</h1>
        <p className="text-emerald-200">Everything you need for a perfect stay</p>
      </div>

      <main className="max-w-7xl mx-auto px-6 py-16">
        {loading ? (
          <div className="text-center text-gray-400 py-20">Loading services...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {services.map(s => {
              const imgUrl = getImageUrl(s.image);
              const unavailable = s.available === false;
              return (
                <div key={s.id} className={`bg-white rounded-xl shadow hover:shadow-lg transition overflow-hidden flex flex-col ${unavailable ? "opacity-60" : ""}`}>
                  {imgUrl ? (
                    <div className="h-40 overflow-hidden relative">
                      <img src={imgUrl} alt={s.title} className="w-full h-full object-cover" />
                      {unavailable && (
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                          <span className="bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full">Unavailable</span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="h-40 bg-emerald-50 flex items-center justify-center text-5xl">🛎️</div>
                  )}
                  <div className="p-5 text-center flex flex-col flex-1">
                    <h3 className="text-lg font-bold text-gray-800 mb-2">{s.title}</h3>
                    <p className="text-gray-500 text-sm mb-3 flex-1">{s.desc}</p>
                    {s.price != null && s.price > 0 ? (
                      <span className="inline-block bg-emerald-50 text-emerald-700 font-semibold text-sm px-3 py-1 rounded-full mb-4">
                        ₱{s.price.toLocaleString()}
                      </span>
                    ) : s.price === 0 ? (
                      <span className="inline-block bg-gray-100 text-gray-500 font-semibold text-sm px-3 py-1 rounded-full mb-4">
                        Complimentary
                      </span>
                    ) : <div className="mb-4" />}
                    <button
                      disabled={unavailable}
                      onClick={() => openModal(s)}
                      className={`w-full py-2 rounded-lg text-sm font-semibold transition ${unavailable ? "bg-gray-200 text-gray-400 cursor-not-allowed" : "bg-emerald-700 text-white hover:bg-emerald-800"}`}
                    >
                      {unavailable ? "Unavailable" : "Request Service"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </>
  );
}
