"use client";
import { signIn, signOut, useSession } from "next-auth/react";
import Navbar from "../components/LoginNavbar";
import Footer from "../components/Footer";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function AuthPage() {
  const { data: session } = useSession();
  const router = useRouter();

  // Redirect authenticated users to the homepage
  useEffect(() => {
    if (session?.user?.email?.endsWith("@gmail.com")) {
      router.push("/home");
    }
  }, [session, router]);

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar activePage="auth" />

      {/* Main content with background image */}
      <main className="flex-grow flex items-center justify-center relative">
        {/* Background Image */}
        <div className="absolute inset-0 bg-cover bg-center opacity-70" style={{ backgroundImage: "url('/landing3.jpg')" }}></div>

        {/* Content Box */}
        <div className="relative bg-white bg-opacity-80 p-8 rounded-lg shadow-lg w-[350px] text-center z-10">
          {session ? (
            <div>
              {/* Check if the user is using a Gmail account */}
              {session.user.email.endsWith("@gmail.com") ? (
                <>
                  <p className="text-lg font-semibold text-gray-800">
                    Welcome, {session.user.email}
                  </p>
                  {/* <button
                    onClick={() => signOut()}
                    className="w-full bg-red-500 text-white px-4 py-2 rounded-lg mt-4 hover:bg-red-600 transition"
                  >
                    Sign Out
                  </button> */}
                </>
              ) : (
                <>
                  <p className="text-lg font-semibold text-red-600">
                    Only Gmail accounts are allowed!
                  </p>
                  <button
                    onClick={() => signOut()}
                    className="w-full bg-red-500 text-white px-4 py-2 rounded-lg mt-4 hover:bg-red-600 transition"
                  >
                    Sign Out
                  </button>
                </>
              )}
            </div>
          ) : (
            <>
              <button
                onClick={() => signIn("google")}
                className="w-full bg-pink-500 py-2 rounded-lg font-semibold hover:bg-pink-600 transition text-white flex items-center justify-center"
              >
                <img src="/logos/google.svg" alt="Google" className="mr-2 h-5 w-5" />
                <span>Sign in with Google</span>
              </button>
            </>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
