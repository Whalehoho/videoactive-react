"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function Navbar({ activePage, user }) { // Accept activePage as a prop
  const router = useRouter();

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    router.push("/");
  };
  return (
    <nav className="bg-white shadow-md p-4 flex justify-between items-center">
      {/* Logo */}
      <div className="text-pink-600 text-xl font-bold flex items-center hover:bg-pink-200 rounded-lg px-1">
        <img src="/logos/logo.svg" alt="logo" className="rounded-lg px-1 mx-2" />
        ViMeet
      </div>

      {/* Navigation Links */}
      <div className="space-x-4 flex items-center">
        <ul className="flex space-x-6">
          <li>
            <Link 
              href="/home"
              className={`px-4 py-2 rounded-lg ${activePage === "home" ? "bg-pink-600 text-white" : "text-gray-700 hover:bg-gray-200"}`}
            >
              Home
            </Link>
          </li>
          <li>
            <Link 
              href="/connections"
              className={`px-4 py-2 rounded-lg ${activePage === "connections" ? "bg-pink-600 text-white" : "text-gray-700 hover:bg-gray-200"}`}
            >
              Connections
            </Link>
          </li>
          <li>
            <Link 
              href="/profile"
              className={`px-4 py-2 rounded-lg ${activePage === "profile" ? "bg-pink-600 text-white" : "text-gray-700 hover:bg-gray-200"}`}
            >
              Profile
            </Link>
          </li>
          <li>
          <button className="px-4 py-2 bg-red-600 rounded-lg">Logout</button>

          </li>
        </ul>
        
      </div>
    </nav>
  );
}
