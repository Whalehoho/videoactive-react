import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST() {
  try {
    console.log("Logout API called");
    const cookieStore = await cookies();
    const authToken = cookieStore.get("AuthToken")?.value;

    if (authToken) {
      // Notify backend to invalidate the session
      await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/auth/logout`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        credentials: "include",
      });
    }

    // Prepare response with cookie deletion
    const response = NextResponse.json({ message: "Logged out successfully" });

    // Delete the AuthToken cookie by setting it to expire in the past
    response.cookies.set({
      name: "AuthToken",
      value: "",
      path: "/",
      expires: new Date(0),
      domain: ".kc123.me",
    });

    console.log("AuthToken cookie deleted");

    return response;
  } catch (error) {
    console.error("Logout error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}