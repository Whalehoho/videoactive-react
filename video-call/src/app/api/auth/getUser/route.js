import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET(req) {
  try {
    // const authToken = req.headers.get("Authorization")?.split(" ")[1];

    const cookieStore = await cookies();
    const authToken = cookieStore.get("AuthToken")?.value;
    

    if (!authToken) {
      return NextResponse.json({ error: "Missing AuthToken" }, { status: 401 });
    }

    // ✅ Call backend /validate-token since it also returns user info
    const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/auth/getUser`, {
      method: "GET",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authToken}`,
      },
    });

    if (!res.ok) {
      return NextResponse.json({ error: "Invalid session" }, { status: 401 });
    }

    return res; // ✅ Return user details
  } catch (error) {
    console.error("User fetch error:", error);
    return NextResponse.json({ error: "Failed to retrieve user data" }, { status: 500 });
  }
}
