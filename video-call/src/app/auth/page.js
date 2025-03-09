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

  // Handle Google login, use a popup window for redirect
  const handleLogin = () => {
    const popup = window.open(loginRedirectUrl, "_blank", "width=600,height=600");
    if (popup) {
      popup.focus();
    } else {
      alert("Please allow popups for this website");
    }
  }

  // Listen for the message event to receive the token
  useEffect(() => {
    const handleMessage = (event) => {
      if (event.data && event.data.token) {
        console.log("Token received:", event.data.token);
        // Save the token to local storage or state
        localStorage.setItem("authToken", event.data.token);
        // Print the token in the console
        console.log("Token saved:", localStorage.getItem("authToken"));
        // Redirect to the home page
        router.push("/home");
      }
    };

    window.addEventListener("message", handleMessage);

    return () => {
      window.removeEventListener("message", handleMessage);
    };
  }, [router]);

  return (
    <div className="flex flex-col min-h-screen items-center justify-center">
      {loading ? (
        <p>Loading...</p> // ✅ Show loading text
      ) : user ? (
        <p>Redirecting...</p> // ✅ Prevent flickering
      ) : (
        <button
          onClick= {handleLogin} // ✅ Handle login
          className="bg-blue-500 text-white px-4 py-2 rounded-lg"
        >
          Login with Google
        </button>
      )}
    </div>
  );
}
