import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const cookieStore = cookies();
    const authToken = cookieStore.get("AuthToken")?.value;

    if (!authToken) {
      return NextResponse.json({ isAuthenticated: false }, { status: 401 });
    }

    // Validate session with backend
    const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/auth/validate-token`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authToken}`,
      },
    });

    if (!res.ok) {
      return NextResponse.json({ isAuthenticated: false }, { status: 401 });
    }

    return NextResponse.json({ isAuthenticated: true });
  } catch (error) {
    console.error("Check session error:", error);
    return NextResponse.json({ isAuthenticated: false }, { status: 500 });
  }
}
