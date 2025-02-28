import { NextResponse } from "next/server";

export async function GET() {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/auth/user`, {
      credentials: "include",
    });

    if (!res.ok) {
      return NextResponse.json({ user: null }, { status: 404 });
    }

    const user = await res.json();
    return NextResponse.json({ user });
  } catch (error) {
    return NextResponse.json({ error: "User fetch error" }, { status: 500 });
  }
}