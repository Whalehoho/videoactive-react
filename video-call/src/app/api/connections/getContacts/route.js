import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET(req) {
    try {
        const authToken = req.headers.get("Authorization")?.split(" ")[1];

        if (!authToken) {
        return NextResponse.json({ error: "Missing AuthToken" }, { status: 401 });
        }

        // ✅ Call backend /getContacts to get the user's friends' contacts
        const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/connections/getContacts`, {
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

        return res; // ✅ Return contact details
    } catch (error) {
        console.error("User fetch error:", error);
        return NextResponse.json({ error: "Failed to retrieve user data" }, { status: 500 });
    }
}
