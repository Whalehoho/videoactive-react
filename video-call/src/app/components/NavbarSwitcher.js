"use client";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Navbar from "./Navbar";
import LoginNavbar from "./LoginNavbar";
import { fetchUser } from "../services/api"; // ✅ Centralized API function

export default function NavbarSwitcher() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const pathname = usePathname(); // ✅ Get current path

  useEffect(() => {
    const checkUser = async () => {
      const userData = await fetchUser(); // ✅ Call fetchUser() directly
      setUser(userData);
      setLoading(false);
      console.log(userData);
    };

    checkUser();
  }, []);

  if (loading) return null; // Prevent flickering while loading

  return user ? <Navbar user={user} activePage={pathname} /> : <LoginNavbar activePage={pathname} />;
}
