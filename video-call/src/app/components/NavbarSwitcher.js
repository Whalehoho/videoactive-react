"use client";
import { useEffect, useState } from "react";
import Navbar from "./Navbar";
import LoginNavbar from "./LoginNavbar";

export default function NavbarSwitcher() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkSession = async () => {
      try {
        const sessionRes = await fetch("/api/auth/check-session", { credentials: "include" });
        if (!sessionRes.ok) {
          setUser(null);
          setLoading(false);
          return;
        }

        const userRes = await fetch("/api/auth/user", { credentials: "include" });
        if (userRes.ok) {
          const userData = await userRes.json();
          setUser(userData.user);
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error("Authentication error:", error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    checkSession();
  }, []);

  if (loading) return null; // Prevents flickering while checking session

  return user ? <Navbar user={user} /> : <LoginNavbar />;
}
