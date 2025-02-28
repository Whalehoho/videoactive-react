"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

export default function ConnectionPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const checkSession = async () => {
      try {
        const sessionRes = await fetch("/api/auth/check-session", { credentials: "include" });
        if (!sessionRes.ok) {
          router.push("/auth"); // Redirect to login if not authenticated
          return;
        }

        const userRes = await fetch("/api/auth/user", { credentials: "include" });
        if (userRes.ok) {
          const userData = await userRes.json();
          setUser(userData.user);
        } else {
          router.push("/auth");
        }
      } catch (error) {
        console.error("Authentication error:", error);
        router.push("/auth");
      } finally {
        setLoading(false);
      }
    };

    checkSession();
  }, [router]);

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  if (!user) return null; // Prevents flickering during redirect

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar activePage="connections" />
      <main className="flex-grow flex flex-col md:flex-row">
        <aside className="w-full md:w-1/3 bg-gray-700 p-6 text-white">
          <h2 className="text-lg font-semibold">Online Contacts</h2>
          <input
            type="text"
            placeholder="Search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full p-2 mt-2 text-black border border-gray-300 rounded"
          />
        </aside>

        <section className="flex-1 flex flex-col items-center justify-center p-10">
          <h1 className="text-2xl text-black font-bold">
            My Username: <span className="text-pink-600">{user?.name || "Guest"}</span>
          </h1>
          <button className="bg-green-500 text-white px-6 py-3 rounded-lg mt-5 hover:bg-green-600 transition">
            Start a Random Call
          </button>
        </section>
      </main>
      <Footer />
    </div>
  );
}
