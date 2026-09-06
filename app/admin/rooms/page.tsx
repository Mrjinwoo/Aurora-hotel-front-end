"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AdminSidebar from "../../../Header/AdminSidebar";

type Room = { id: number; number: string; type: string; desc: string; price: number; capacity: number; amenities: string; available: boolean; image?: string | null; };

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
const emptyRoom = { number: "", type: "Standard", desc: "", price: 0, capacity: 1, amenities: "", available: true };

export default function AdminRoomsPage() {
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const [form, setForm] = useState(emptyRoom);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [viewRoom, setViewRoom] = useState<Room | null>(null);

  useEffect(() => {
    const role = localStorage.getItem("role");
    if (role !== "admin") { router.replace("/login"); return; }
    setAuthorized(true);
    fetchRooms();
  }, [router]);

  async function fetchRooms() {
    const res = await fetch(`${API}/api/rooms/`);
    if (!res.ok) return;
    const data = await res.json();
    setRooms(data.map((r: any) => ({
      id: r.id,
      number: r.room_number,
      type: r.category,
      desc: r.desc,
      price: r.price,
      capacity: r.guests,
      amenities: "",
      available: r.available,
    })));
  }

  if (!authorized) return null;

  function openAdd() { setEditingRoom(null); setForm(emptyRoom); setImageFiles([]); setImagePreviews([]); setShowForm(true); }
  function openEdit(r: Room) { setEditingRoom(r); setForm({ number: r.number, type: r.type, desc: r.desc, price: r.price, capacity: r.capacity, amenities: r.amenities, available: r.available }); setImageFiles([]); setImagePreviews([]); setShowForm(true); }

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    setImageFiles(prev => [...prev, ...files]);
    files.forEach(f => {
      const reader = new FileReader();
      reader.onload = ev => setImagePreviews(prev => [...prev, ev.target?.result as string]);
      reader.readAsDataURL(f);
    });
  }

  function removeImage(index: number) {
    setImageFiles(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  }

  async function saveRoom() {
    if (!form.number.trim()) return alert("Room number is required.");
    const token = localStorage.getItem("token");
    const fd = new FormData();
    fd.append("room_number", form.number);
    fd.append("category", form.type);
    fd.append("desc", form.desc);
    fd.append("price", String(form.price));
    fd.append("guests", String(form.capacity));
    fd.append("available", String(form.available));
    if (form.amenities) fd.append("amenities", form.amenities);
    // first image goes as primary "image", rest as "images"
    imageFiles.forEach((file, i) => fd.append(i === 0 ? "image" : "images", file));

    if (editingRoom) {
      await fetch(`${API}/api/rooms/${editingRoom.id}/`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });
    } else {
      await fetch(`${API}/api/rooms/`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });
    }
    fetchRooms();
    setShowForm(false);
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      <AdminSidebar />
      <div className="flex-1 ml-60">
        <div className="bg-white border-b px-8 py-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400 uppercase tracking-widest font-medium">Admin › Rooms</p>
            <h1 className="text-xl font-bold text-slate-800">Manage Rooms</h1>
          </div>
          <button onClick={openAdd} className="bg-slate-900 text-white px-5 py-2 rounded-lg hover:bg-slate-700 transition font-semibold text-sm">+ Add Room</button>
        </div>
        <div className="px-8 py-8">
          <p className="text-slate-500 text-sm mb-6">{rooms.length} rooms total · {rooms.filter(r => r.available).length} available</p>

          {/* View Modal */}
          {viewRoom && (
            <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-xl shadow-xl p-8 w-full max-w-md">
                <h3 className="text-xl font-bold text-gray-800 mb-4">Room Details</h3>
                {[["Room Number", viewRoom.number], ["Type", viewRoom.type], ["Description", viewRoom.desc], ["Price/Night", `₱${viewRoom.price.toLocaleString()}`], ["Capacity", String(viewRoom.capacity)], ["Amenities", viewRoom.amenities], ["Status", viewRoom.available ? "Available" : "Unavailable"]].map(([l, v]) => (
                  <div key={l} className="flex justify-between py-2 border-b last:border-0 text-sm">
                    <span className="text-gray-500">{l}</span>
                    <span className="font-semibold text-gray-800">{v}</span>
                  </div>
                ))}
                <button onClick={() => setViewRoom(null)} className="mt-6 w-full bg-gray-900 text-white py-2.5 rounded-lg font-semibold hover:bg-gray-700 transition">Close</button>
              </div>
            </div>
          )}

          {/* Add/Edit Form */}
          {showForm && (
            <div className="bg-white rounded-xl shadow p-6 mb-6">
              <h3 className="text-lg font-bold text-gray-800 mb-4">{editingRoom ? "Edit Room" : "Add New Room"}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {([["Room Number", "number", "text", "305"], ["Description", "desc", "text", "Spacious room..."], ["Amenities", "amenities", "text", "Wi-Fi, TV, AC"]] as [string, string, string, string][]).map(([label, key, type, placeholder]) => (
                  <div key={key}>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
                    <input type={type} placeholder={placeholder} value={String(form[key as keyof typeof form])}
                      onChange={e => setForm({ ...form, [key]: e.target.value })}
                      className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400" />
                  </div>
                ))}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Room Type</label>
                  <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400">
                    {["Standard", "Deluxe", "Suite", "Family", "Presidential"].map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Price per Night (₱)</label>
                  <input type="number" placeholder="3500" value={form.price}
                    onChange={e => setForm({ ...form, price: Number(e.target.value) })}
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Capacity</label>
                  <input type="number" placeholder="2" value={form.capacity}
                    onChange={e => setForm({ ...form, capacity: Number(e.target.value) })}
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Room Images <span className="text-gray-400">(multiple allowed)</span></label>
                  <input type="file" accept="image/*" multiple onChange={handleImageChange}
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400" />
                  {editingRoom?.image && imageFiles.length === 0 && (
                    <p className="text-xs text-gray-400 mt-1">Existing images will be kept if no new files are selected.</p>
                  )}
                  {imagePreviews.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      {imagePreviews.map((src, i) => (
                        <div key={i} className="relative w-20 h-20">
                          <img src={src} className="w-full h-full object-cover rounded-lg border" />
                          <button type="button" onClick={() => removeImage(i)}
                            className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center hover:bg-red-600">
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <input type="checkbox" id="avail" checked={form.available} onChange={e => setForm({ ...form, available: e.target.checked })} className="w-4 h-4" />
                  <label htmlFor="avail" className="text-sm font-medium text-gray-700">Available</label>
                </div>
              </div>
              <div className="flex gap-3 mt-5">
                <button onClick={saveRoom} className="bg-gray-900 text-white px-6 py-2.5 rounded-lg hover:bg-gray-700 transition font-semibold text-sm">Save Room</button>
                <button onClick={() => setShowForm(false)} className="border border-gray-300 text-gray-600 px-6 py-2.5 rounded-lg hover:bg-gray-50 transition text-sm">Cancel</button>
              </div>
            </div>
          )}

          <div className="bg-white rounded-xl shadow overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-900 text-white">
                <tr>{["Room No.", "Type", "Price/Night", "Capacity", "Amenities", "Availability", "Actions"].map(h => (
                  <th key={h} className="px-4 py-3 text-left font-semibold">{h}</th>
                ))}</tr>
              </thead>
              <tbody>
                {rooms.map((r, i) => (
                  <tr key={r.id} className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                    <td className="px-4 py-3 font-bold text-gray-800">{r.number}</td>
                    <td className="px-4 py-3">{r.type}</td>
                    <td className="px-4 py-3 font-semibold">₱{r.price.toLocaleString()}</td>
                    <td className="px-4 py-3">{r.capacity} guests</td>
                    <td className="px-4 py-3 text-gray-500">{r.amenities}</td>
                    <td className="px-4 py-3">
                      <button onClick={async () => {
                        const token = localStorage.getItem("token");
                        await fetch(`${API}/api/rooms/${r.id}/`, {
                          method: "PATCH",
                          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                          body: JSON.stringify({ available: !r.available }),
                        });
                        fetchRooms();
                      }}
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${r.available ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"}`}>
                        {r.available ? "Available" : "Unavailable"}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1.5">
                        <button onClick={() => setViewRoom(r)} className="bg-blue-500 hover:bg-blue-600 text-white text-xs px-2.5 py-1.5 rounded font-semibold">View</button>
                        <button onClick={() => openEdit(r)} className="bg-yellow-400 hover:bg-yellow-500 text-white text-xs px-2.5 py-1.5 rounded font-semibold">Edit</button>
                        <button onClick={async () => {
                          if (!confirm("Delete this room?")) return;
                          const token = localStorage.getItem("token");
                          await fetch(`${API}/api/rooms/${r.id}/`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
                          fetchRooms();
                        }} className="bg-red-500 hover:bg-red-600 text-white text-xs px-2.5 py-1.5 rounded font-semibold">Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
