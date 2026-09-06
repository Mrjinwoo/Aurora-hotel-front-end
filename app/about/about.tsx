import Header from "../../Header/Header";
import Image from "next/image";

export default function AboutPage() {
  return (
    <>
      <Header />
      <div className="bg-emerald-800 py-16 text-center text-white pt-28">
        <h1 className="text-5xl font-bold mb-2">About Us</h1>
        <p className="text-emerald-200">Our story, our mission, our people</p>
      </div>
      <main className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center mb-16">
          <div>
            <h2 className="text-3xl font-bold text-gray-800 mb-4">Welcome to Aurora Hotel</h2>
            <p className="text-gray-500 mb-4">
              Founded in 2021, Aurora Hotel has been a beacon of luxury and hospitality in the heart of the city.
              We believe every guest deserves an extraordinary experience — from the moment you arrive to the moment you leave.
            </p>
            <p className="text-gray-500">
              Our dedicated team of over 200 professionals works tirelessly to ensure your comfort, satisfaction, and happiness.
              Whether you are here for business or leisure, Aurora Hotel is your home away from home.
            </p>
          </div>
          <div className="relative h-72 rounded-xl overflow-hidden shadow-lg">
            <Image src="/aurora hotel.png" alt="Aurora Hotel" fill className="object-cover" unoptimized loading="eager" priority />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
          {[
            { stat: "5", label: "Years of Excellence" },
            { stat: "100+", label: "Happy Guests" },
            { stat: "10", label: "Dedicated Staff" },
          ].map(({ stat, label }) => (
            <div key={label} className="bg-emerald-50 rounded-xl p-8">
              <p className="text-5xl font-bold text-emerald-700 mb-2">{stat}</p>
              <p className="text-gray-600 font-medium">{label}</p>
            </div>
          ))}
        </div>
      </main>
    </>
  );
}
