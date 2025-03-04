"use client";
import { useEffect, useState, useCallback } from "react";
import { usePathname } from "next/navigation";
import Navbar from "./Navbar";
import LoginNavbar from "./LoginNavbar";
import { fetchUser } from "../services/api"; // ✅ Centralized API function

export default function NavbarSwitcher() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const pathname = usePathname(); // ✅ Get current path

  // ✅ Function to refresh user state
  const checkUser = useCallback(async () => {
    setLoading(true);
    const userData = await fetchUser();
    setUser(userData);
    setLoading(false);
  }, []);

  // ✅ Run on mount and every time checkUser changes
  useEffect(() => {
    checkUser();
  }, [checkUser]);

  if (loading) return null; // Prevent flickering while loading

  return user ? (
    <Navbar user={user} activePage={pathname} onLogout={checkUser} /> 
  ) : (
    <LoginNavbar activePage={pathname} />
  );
}
