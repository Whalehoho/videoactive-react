import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function POST(req) {
    try {
        // const authToken = req.headers.get("Authorization")?.split(" ")[1];

        const cookieStore = await cookies();
        const authToken = cookieStore.get("AuthToken")?.value;

        if (!authToken) {
        return NextResponse.json({ error: "Missing AuthToken" }, { status: 401 });
        }

        const { friendId } = await req.json(); // ✅ Extract friendId from request body

        console.log("Received request to add contact:", friendId);
        console.log("AuthToken from cookies:", authToken);

        // ✅ Send request to .NET backend
        const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/addContact`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ friendId }),
        });

        console.log("Response status from .NET backend:", res.status);

        if (!res.ok) {
        const errorText = await res.text();
        console.error("Error response from .NET backend:", errorText);
        return NextResponse.json({ error: "Failed to add contact" }, { status: res.status });
        }

        const data = await res.json();
        console.log("Success response from .NET backend:", data);
        return NextResponse.json(data);
    } catch (error) {
        console.error("Add contact error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
