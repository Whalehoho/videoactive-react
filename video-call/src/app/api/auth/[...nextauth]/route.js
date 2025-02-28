import { NextResponse } from "next/server";

export const authOptions = {
  debug: false, // 🔥 Disable extra logging
  events: {
    async signIn() {
      console.log("User signed in");
    },
    async signOut() {
      console.log("User signed out");
    }
  }
};

export async function GET() {
  try {
    // Fetch user session from your .NET backend
    const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/auth/check-session`, {
      method: "GET",
      credentials: "include", // Include cookies for authentication
    });

    if (!res.ok) {
      return NextResponse.json({ user: null }, { status: 401 });
    }

    const user = await res.json();
    return NextResponse.json({ user });
  } catch (error) {
    console.error("Error fetching session:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
