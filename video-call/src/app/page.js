"use client";
import NavbarSwitcher from "./components/NavbarSwitcher";
import Footer from "./components/Footer";
import Link from "next/link";

export default function Home() {
  return (
    <div>
      <NavbarSwitcher />
      <main className="text-center">
        {/* Hero Section with Text Overlay */}
        <section className="relative w-full h-[400px]">
          {/* Background Image */}
          <img 
            src="/landing.jpg" 
            alt="ViMeet Logo" 
            className="w-full h-full object-cover opacity-70" 
          />
          
          {/* Centered Text Overlay */}
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40">
            <h1 className="text-4xl font-bold text-white">
              Meet Friends With <span className="text-pink-500">ViMEET</span>
            </h1>
            <Link href="/auth">
              <button className="bg-pink-500 text-white px-4 py-2 rounded-lg mt-4">
                Sign in / Register
              </button>
            </Link>
          </div>
        </section>

        {/* Image Section */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-4 p-6">
          <img src="/landing2.jpg" alt="Person working on laptop" className="rounded-lg shadow" />
          <img src="/landing3.jpg" alt="Group of friends chatting" className="rounded-lg shadow" />
        </section>
      </main>
      <Footer />
    </div>
  );
}
