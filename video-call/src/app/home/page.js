"use client";
import { signOut, useSession } from "next-auth/react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function HomePage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth");
    }
  }, [status, router]);

  if (session) {
    console.log(session.user);
  }

  if (status === "loading") {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  return (
    <div>
      <Navbar activePage="home" />
      <main className="relative flex flex-col min-h-screen">
        {/* Background Image */}
        <img
          src="/landing2.jpg"
          alt="Landing Image"
          className="relative w-full h-[800px] object-cover opacity-70"
        />

        {/* Content Wrapper (Left-Aligned) */}
        <div className="absolute inset-0 flex items-center px-20 ml-10">
          <div className="text-left z-10 max-w-lg">
            <h1 className="text-4xl font-bold text-black">Welcome Back!</h1>
            <h2 className="text-2xl text-pink-600 font-semibold">{session?.user?.name}</h2>
            <button className="mt-6 bg-pink-600 text-white px-6 py-2 rounded-lg hover:bg-pink-700 transition">
              Make A Friend!
            </button>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
