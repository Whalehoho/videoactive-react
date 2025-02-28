"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Footer from "../components/Footer";
import Image from "next/image";
import { fetchUser } from "../services/api"; // ✅ Use your own API

export default function HomePage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetchUser().then((data) => {
      if (!data) {
        router.push("/auth"); // Redirect if not logged in
      } else {
        setUser(data);
      }
      setLoading(false);
    });
  }, []);

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  return (
    <div>
      <main className="relative flex flex-col min-h-screen">
        <Image
          src="/landing2.jpg"
          alt="Landing Image"
          layout="fill"
          objectFit="cover"
          className="opacity-70"
          priority
        />
        <div className="absolute inset-0 flex items-center px-20 ml-10">
          <div className="text-left z-10 max-w-lg">
            <h1 className="text-4xl font-bold text-black">Welcome Back!</h1>
            <h2 className="text-2xl text-pink-600 font-semibold">{user?.email}</h2>
            <button className="mt-6 bg-pink-600 text-white px-6 py-2 rounded-lg hover:bg-pink-700 transition">
              Make A Friend!
            </button>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
