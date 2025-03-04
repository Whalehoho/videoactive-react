"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { handleLogout} from "../services/api";

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
              className={`px-4 py-3 rounded-lg ${activePage === "/home" ? "bg-pink-600 text-white" : "text-gray-700 hover:bg-gray-200"}`}
            >
              Home
            </Link>
          </li>
          <li>
            <Link 
              href="/connections"
              className={`px-4 py-3 rounded-lg ${activePage === "/connections" ? "bg-pink-600 text-white" : "text-gray-700 hover:bg-gray-200"}`}
            >
              Connections
            </Link>
          </li>
          <li>
            <Link 
              href="/profile"
              className={`px-4 py-3 rounded-lg ${activePage === "/profile" ? "bg-pink-600 text-white" : "text-gray-700 hover:bg-gray-200"}`}
            >
              Profile
            </Link>
          </li>
          <li>
          <button onClick={() => handleLogout()} className="px-1 py-1 bg-red-600 rounded-lg">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="1.5"
              stroke="currentColor"
              className="size-6"
            >
              <path
                strokeLinecap="round" // Corrected property name
                strokeLinejoin="round" // corrected property name
                d="M8.25 9V5.25A2.25 2.25 0 0 1 10.5 3h6a2.25 2.25 0 0 1 2.25 2.25v13.5A2.25 2.25 0 0 1 16.5 21h-6a2.25 2.25 0 0 1-2.25-2.25V15m-3 0-3-3m0 0 3-3m-3 3H15"
              />
            </svg>
          </button>

          </li>
        </ul>
        
      </div>
    </nav>
  );
}
