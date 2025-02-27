"use client";
import { useSession, signOut } from "next-auth/react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  // User state for editing inputs
  const [name, setName] = useState("");
  const [gender, setGender] = useState("");
  const [description, setDescription] = useState("");

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth");
    }
    if (session?.user) {
      // Load existing user data
      setName(session.user.name || "");
      setGender("Male"); // Default gender, update when API integration is added
      setDescription("A guy that loves basketball"); // Placeholder
    }
  }, [status, router, session]);

  if (status === "loading") {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar activePage="profile" />

      <main className="flex-grow flex flex-col items-center justify-center px-10 py-10">
        {/* Profile Card */}
        <div className="bg-white shadow-lg rounded-lg p-6 flex gap-8 w-full max-w-3xl py-10 my-10">
          {/* Profile Picture */}
          <div className="w-40 h-40 bg-gray-300 flex items-center justify-center rounded-lg">
            <img
              src={session.user.image}
              alt="Profile"
              className="w-full h-full object-cover rounded-lg"
            />
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
                value={session?.user?.email || ""}
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
                onClick={() => signOut({ callbackUrl: "/" })} // Redirects to "/"
                className="text-red-500 text-2xl mt-4 self-end"
            >
              <img src="/logos/logout.svg" alt="Logout" className="w-8 h-8" />
            </button>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
