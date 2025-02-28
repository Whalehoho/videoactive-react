"use client";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import NavbarSwitcher from "./components/NavbarSwitcher"; // ✅ Import NavbarSwitcher

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <NavbarSwitcher /> {/* ✅ Client Component for Navbar */}
        {children}
      </body>
    </html>
  );
}
