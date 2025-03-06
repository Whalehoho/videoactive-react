import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function POST(req) {
    try {
        const cookieStore = cookies();
        const authToken = cookieStore.get("AuthToken")?.value;

        if (!authToken) {
        return NextResponse.json({ error: "Missing AuthToken" }, { status: 401 });
        }

        const { friendId } = await req.json(); // ✅ Extract friendId from request body

        const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/connections/rejectContact`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ friendId }),
        });

        const result = await response.json();
        if (!response.ok) {
        console.error("Error response from .NET backend:", result);
        return NextResponse.json({ error: "Failed to reject contact" }, { status: response.status });
        }

        console.log("Success response from .NET backend:", result);
        return NextResponse.json(result);
    } catch (error) {
        console.error("Error rejecting contact:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
    }
