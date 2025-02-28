import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const cookieStore = cookies();
    const authToken = cookieStore.get("AuthToken")?.value;

    if (!authToken) {
      return NextResponse.json({ error: "Missing AuthToken" }, { status: 401 });
    }

    // Fetch user details from the backend
    const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/auth/validate-token`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authToken}`,
      },
    });

    if (!res.ok) {
      return NextResponse.json({ error: "Invalid session" }, { status: 401 });
    }

    const data = await res.json();
    return NextResponse.json({ user: data.user });
  } catch (error) {
    console.error("User fetch error:", error);
    return NextResponse.json({ error: "Failed to retrieve user data" }, { status: 500 });
  }
}
