import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET(req) {
    try {
        const authToken = req.headers.get("Authorization")?.split(" ")[1];

        if (!authToken) {
        return NextResponse.json({ error: "Missing AuthToken" }, { status: 401 });
        }

        console.log("authToken in get messages: ", authToken);

        // ✅ Call backend /getMessages to get the user's messages
        const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/message/getAllMessages`, {
        method: "GET",
        credentials: "include",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authToken}`,
        },
        });

        if (!res.ok) {
            console.log("res in get messages: ", res);
            return NextResponse.json({ error: "Invalid session" }, { status: 401 });
        }

        return res; // ✅ Return messages
    } catch (error) {
        console.error("User fetch error:", error);
        return NextResponse.json({ error: "Failed to retrieve messages" }, { status: 500 });
    }
}