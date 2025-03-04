import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const cookieStore = cookies();
    const authToken = cookieStore.get("AuthToken")?.value;

    console.log("Received request in Next.js API:", req.method);
    console.log("AuthToken from cookies:", authToken);

    if (!authToken) {
      return NextResponse.json({ error: "Missing AuthToken" }, { status: 401 });
    }

    // ✅ Read request body
    const body = await req.json();
    console.log("Request body received in Next.js API:", body);

    // ✅ Send request to .NET backend
    const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/user/updateUser`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify(body),
    });

    console.log("Response status from .NET backend:", res.status);

    if (!res.ok) {
      const errorText = await res.text();
      console.error("Error response from .NET backend:", errorText);
      return NextResponse.json({ error: "Failed to update user" }, { status: res.status });
    }

    const data = await res.json();
    console.log("Success response from .NET backend:", data);
    return NextResponse.json(data);
  } catch (error) {
    console.error("Update user error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
