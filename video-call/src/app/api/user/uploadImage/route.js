import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const formData = await req.formData();
    const file = formData.get("file");
    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    // Get AuthToken from cookies
    const authToken = req.headers.get("Authorization")?.split(" ")[1];

    if (!authToken) {
      return NextResponse.json({ error: "Unauthorized: Missing AuthToken" }, { status: 401 });
    }

    // Forward the request to the backend with Authorization header
    const backendResponse = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/user/updateImage`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
      body: formData, // Forward formData as it is
    });

    if (!backendResponse.ok) {
      return NextResponse.json({ error: "Failed to upload image" }, { status: backendResponse.status });
    }

    const data = await backendResponse.json();
    return NextResponse.json(data); // Expected response: { url: "https://your-image-server.com/image.jpg" }
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
