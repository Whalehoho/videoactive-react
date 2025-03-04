"use client";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import NavbarSwitcher from "./components/NavbarSwitcher"; // ✅ Import NavbarSwitcher
import Footer from "./components/Footer"; // ✅ Import Footer

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
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased flex flex-col min-h-screen`}>
        <NavbarSwitcher /> {/*  Navbar always at the top */}
        <main className="flex-grow">{children}</main> {/*  Makes content take full height */}
        <Footer /> {/*  Footer always at the bottom */}
      </body>
    </html>
  );
}
