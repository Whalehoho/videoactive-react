"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { handleLogout } from "../services/api";
import { useWebSocket } from "../context/WebSocketContext";

export default function Navbar({ activePage, user, onLogout }) { 
  const router = useRouter();
  const { incomingCalls } = useWebSocket();
  const hasIncomingCalls = incomingCalls.length > 0;

  const handleUserLogout = async () => {
    await handleLogout();
    onLogout(); // ✅ Trigger re-fetch in NavbarSwitcher
    router.push("/"); // Redirect to home after logout
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
              href="/randomCall"
              className={`px-4 py-3 rounded-lg ${activePage === "/randomCall" ? "bg-pink-600 text-white" : "text-gray-700 hover:bg-gray-200"}`}
            >
              Random Call
            </Link>
          </li>
          <li>
            <Link 
              href="/connections"
              className={`px-4 py-3 rounded-lg ${activePage === "/connections" ? "bg-pink-600 text-white" : "text-gray-700 hover:bg-gray-200"}`}
            >
              Connections
            </Link>
            {hasIncomingCalls && (
              <span className="absolute top-0 right-60 w-3 h-3 bg-pink-600 rounded-full animate-pulse"></span>
            )}
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
            <button onClick={handleUserLogout} className="px-3 py-2 bg-red-600 text-white rounded-lg">
            <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth="1.5"
                  stroke="currentColor"
                  className="w-5 h-5"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
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
