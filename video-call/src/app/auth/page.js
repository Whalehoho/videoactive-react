"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { fetchUser, loginRedirectUrl } from "../services/api";

export default function AuthPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // ✅ Loading state

  useEffect(() => {
    fetchUser()
      .then((data) => {
        if (data) {
          setUser(data);
          router.push("/home"); // ✅ Redirect if already logged in
        }
      })
      .catch(() => setUser(null))
      .finally(() => setLoading(false)); // ✅ Ensure loading state updates
  }, [router]);

  return (
    <div className="flex flex-col min-h-screen items-center justify-center">
      {loading ? (
        <p>Loading...</p> // ✅ Show loading text
      ) : user ? (
        <p>Redirecting...</p> // ✅ Prevent flickering
      ) : (
        <button
          onClick={() => router.push(loginRedirectUrl)} // ✅ Next.js navigation
          className="bg-blue-500 text-white px-4 py-2 rounded-lg"
        >
          Login with Google
        </button>
      )}
    </div>
  );
}
