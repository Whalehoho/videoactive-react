"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Profile data states
  const [name, setName] = useState("");
  const [gender, setGender] = useState("Other");
  const [description, setDescription] = useState("");

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
          setName(userData.user.name || "");
          setGender(userData.user.gender || "Other");
          setDescription(userData.user.description || "");
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

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
      router.push("/");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  if (!user) return null; // Prevents flickering during redirect

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar activePage="profile" />

      <main className="flex-grow flex flex-col items-center justify-center px-10 py-10">
        {/* Profile Card */}
        <div className="bg-white shadow-lg rounded-lg p-6 flex gap-8 w-full max-w-3xl py-10 my-10">
          {/* Profile Picture */}
          <div className="w-40 h-40 bg-gray-300 flex items-center justify-center rounded-lg overflow-hidden">
            {user.image ? (
              <img src={user.image} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <span className="text-gray-500">No Image</span> // ✅ Handles missing profile image
            )}
          </div>

          {/* Profile Details */}
          <div className="flex flex-col gap-4 w-full">
            <h1 className="text-2xl font-semibold text-gray-800">Profile</h1>

            {/* Name Input */}
            <div>
              <label className="text-gray-600 font-medium">Name:</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full border border-gray-300 text-gray-900 rounded-lg px-3 py-2 mt-1"
              />
            </div>

            {/* Email (Read-Only) */}
            <div>
              <label className="text-gray-600 font-medium">Email:</label>
              <input
                type="email"
                value={user.email}
                readOnly
                className="w-full border border-gray-300 rounded-lg text-gray-900 px-3 py-2 mt-1 bg-gray-100 cursor-not-allowed"
              />
            </div>

            {/* Gender Input */}
            <div>
              <label className="text-gray-600 font-medium">Gender:</label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                className="w-full border border-gray-300 text-gray-900 rounded-lg px-3 py-2 mt-1"
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>

            {/* Description Input */}
            <div>
              <label className="text-gray-600 font-medium">Description:</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full border border-gray-300 text-gray-900 rounded-lg px-3 py-2 mt-1"
                rows="3"
              />
            </div>

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              className="bg-red-500 text-white px-4 py-2 rounded-lg mt-4 hover:bg-red-600 transition"
            >
              Logout
            </button>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
