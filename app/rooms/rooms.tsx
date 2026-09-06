"use client";
import { useRouter } from "next/navigation";
import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import Header from "../../Header/Header"; 

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

type Room = {
  id: number;
  room_number: string;
  category: string;
  name: string;
  price: number;
  beds: number;
  guests: number;
  desc: string;
  amenities: string;
  available: boolean;
  image: string | null;
  images: { id: number; image: string }[];
};

const FILTERS = ["All", "standard", "deluxe", "suite", "presidential", "family"];
const FILTER_LABELS: Record<string, string> = { All: "All", standard: "Standard", deluxe: "Deluxe", suite: "Suite", presidential: "Presidential", family: "Family" };
const CAPACITY_OPTIONS = ["Any", "1", "2", "3", "4+"];
const PRICE_MAX = 120000;

export default function RoomsPage() {
  const router = useRouter();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState("All");
  const [priceRange, setPriceRange] = useState(PRICE_MAX);
  const [capacity, setCapacity] = useState("Any");
  const [galleryRoom, setGalleryRoom] = useState<Room | null>(null);
  const [galleryIndex, setGalleryIndex] = useState(0);
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 9;

  // debounced values to avoid re-filtering on every keystroke/drag
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [debouncedPrice, setDebouncedPrice] = useState(PRICE_MAX);
  useEffect(() => { const t = setTimeout(() => setDebouncedSearch(search), 300); return () => clearTimeout(t); }, [search]);
  useEffect(() => { const t = setTimeout(() => setDebouncedPrice(priceRange), 200); return () => clearTimeout(t); }, [priceRange]);

  useEffect(() => {
    fetch(`${API}/api/rooms/`)
      .then((r) => r.json())
      .then((data) => setRooms(data))
      .catch(() => setRooms([]))
      .finally(() => setLoading(false));
  }, []);

  function getImageSrc(image: string | null): string | null {
    if (!image) return null;
    if (image.startsWith("http")) return image;
    return `${API}${image}`;
  }

  const filtered = useMemo(() => rooms.filter((room) => {
    const q = debouncedSearch.toLowerCase();
    const matchSearch = !q || room.name.toLowerCase().includes(q) || room.room_number.toLowerCase().includes(q);
    const matchType = activeFilter === "All" || room.category === activeFilter;
    const matchPrice = Number(room.price) <= debouncedPrice;
    const matchCapacity = capacity === "Any" || (capacity === "4+" ? room.guests >= 4 : room.guests === Number(capacity));
    return matchSearch && matchType && matchPrice && matchCapacity;
  }), [rooms, debouncedSearch, activeFilter, debouncedPrice, capacity]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function handleBookNow(room: Room) {
    const token = localStorage.getItem("token");
    const dest = `/booking?room=${encodeURIComponent(room.name)}&price=${room.price}&roomId=${room.id}&roomNumber=${encodeURIComponent(room.room_number)}`;
    if (!token) { router.push(`/login?redirect=${encodeURIComponent(dest)}`); return; }
    router.push(dest);
  }

  if (loading) return <div className="pt-40 text-center text-gray-400">Loading rooms...</div>;

  const galleryImages = galleryRoom?.images?.length ? galleryRoom.images.map(i => i.image) : galleryRoom?.image ? [galleryRoom.image] : [];

  return (
    <>
      <Header />

      {/* Gallery Modal */}
      {galleryRoom && galleryImages.length > 0 && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4" onClick={() => setGalleryRoom(null)}>
          <div className="relative max-w-3xl w-full" onClick={e => e.stopPropagation()}>
            <img src={galleryImages[galleryIndex]} alt="Room" className="w-full max-h-[70vh] object-contain rounded-xl" />
            <div className="flex justify-between mt-3">
              <button onClick={() => setGalleryIndex(i => Math.max(0, i - 1))} disabled={galleryIndex === 0} className="bg-white/20 text-white px-4 py-2 rounded-lg disabled:opacity-30">← Prev</button>
              <span className="text-white text-sm">{galleryIndex + 1} / {galleryImages.length}</span>
              <button onClick={() => setGalleryIndex(i => Math.min(galleryImages.length - 1, i + 1))} disabled={galleryIndex === galleryImages.length - 1} className="bg-white/20 text-white px-4 py-2 rounded-lg disabled:opacity-30">Next →</button>
            </div>
            <button onClick={() => setGalleryRoom(null)} className="absolute top-2 right-2 text-white bg-black/50 rounded-full w-8 h-8 flex items-center justify-center">✕</button>
          </div>
        </div>
      )}
      <div className="pt-24">
        <div className="bg-emerald-800 py-16 text-center text-white">
          <h1 className="text-5xl font-bold mb-2">Our Rooms</h1>
          <p className="text-emerald-200">Choose the perfect room for your stay</p>
        </div>
        <main className="max-w-7xl mx-auto px-6 py-16">

          {/* Search & Filter Bar */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 mb-10 space-y-4">
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
              <input
                type="text"
                placeholder="Search by room name or number..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              {FILTERS.map((f) => (
                <button key={f} onClick={() => { setActiveFilter(f); setPage(1); }}
                  className={`px-4 py-1.5 rounded-full text-sm font-medium border transition ${
                    activeFilter === f ? "bg-emerald-700 text-white border-emerald-700" : "bg-white text-gray-600 border-gray-300 hover:border-emerald-500 hover:text-emerald-700"
                  }`}>{FILTER_LABELS[f]}</button>
              ))}
            </div>
            <div className="flex flex-wrap gap-2 items-center">
              <span className="text-sm text-gray-500 font-medium">Guests:</span>
              {CAPACITY_OPTIONS.map(c => (
                <button key={c} onClick={() => { setCapacity(c); setPage(1); }}
                  className={`px-3 py-1 rounded-full text-sm font-medium border transition ${
                    capacity === c ? "bg-emerald-700 text-white border-emerald-700" : "bg-white text-gray-600 border-gray-300 hover:border-emerald-500"
                  }`}>{c}</button>
              ))}
            </div>
            <div>
              <div className="flex justify-between text-sm text-gray-500 mb-1">
                <span>Price Range</span>
                <span className="font-semibold text-emerald-700">&#8369;1,000 – &#8369;{Number(priceRange).toLocaleString()}</span>
              </div>
              <input
                type="range"
                min={1000}
                max={PRICE_MAX}
                step={500}
                value={priceRange}
                onChange={(e) => { setPriceRange(Number(e.target.value)); setPage(1); }}
                className="w-full accent-emerald-600"
              />
              <div className="flex justify-between text-xs text-gray-400 mt-0.5">
                <span>&#8369;1,000</span>
                <span>&#8369;{PRICE_MAX.toLocaleString()}</span>

              </div>
            </div>
          </div>

          <p className="text-sm text-gray-500 mb-6">{filtered.length} room{filtered.length !== 1 ? "s" : ""} found</p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {paginated.length === 0 ? (
              <div className="col-span-3 text-center py-20 text-gray-400">
                <p className="text-4xl mb-3">🔍</p>
                <p className="text-lg font-medium">No rooms match your search.</p>
                <p className="text-sm">Try adjusting your filters or price range.</p>
              </div>
            ) : paginated.map((room) => {
              const imgSrc = getImageSrc(room.image);
              return (
                <div key={room.id} className="bg-white rounded-xl shadow-md overflow-hidden transition hover:shadow-xl">
                  <div className="relative h-56">
                    {imgSrc ? (
                      <img src={imgSrc} alt={room.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-gray-100 flex items-center justify-center text-gray-400 text-sm">No image</div>
                    )}
                    <span className={`absolute top-3 right-3 text-xs font-semibold px-2.5 py-1 rounded-full ${
                      room.available ? "bg-green-500 text-white" : "bg-red-500 text-white"
                    }`}>{room.available ? "Available" : "Unavailable"}</span>
                  </div>
                  <div className="p-6">
                    <Link href={`/rooms/${room.id}`} className="hover:underline">
                      <h3 className="text-xl font-bold text-gray-800 mb-1">{room.name}</h3>
                    </Link>
                    <p className="text-xs text-gray-400 font-medium uppercase mb-1">Room {room.room_number} · {room.category}</p>
                    <p className="text-gray-500 text-sm mb-3">{room.desc}</p>
                    <div className="flex gap-4 text-sm text-gray-500 mb-4">
                      <span>🛏 {room.beds} Bed{room.beds > 1 ? "s" : ""}</span>
                      <span>👤 {room.guests} Guests</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-2xl font-bold text-emerald-700">&#8369;{Number(room.price).toLocaleString()}<span className="text-sm text-gray-400">/night</span></span>
                      <button
                        onClick={() => handleBookNow(room)}
                        className="px-4 py-2 rounded-lg transition text-sm font-semibold bg-emerald-700 text-white hover:bg-emerald-800"
                      >
                        Book Now
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-10">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                className="px-4 py-2 rounded-lg border text-sm font-semibold disabled:opacity-40 hover:bg-gray-50 transition">← Prev</button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                <button key={p} onClick={() => setPage(p)}
                  className={`w-9 h-9 rounded-lg text-sm font-semibold transition ${p === page ? "bg-emerald-700 text-white" : "border hover:bg-gray-50 text-gray-600"}`}>{p}</button>
              ))}
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                className="px-4 py-2 rounded-lg border text-sm font-semibold disabled:opacity-40 hover:bg-gray-50 transition">Next →</button>
            </div>
          )}
        </main>
      </div>
    </>
  );
}
