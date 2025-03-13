import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function POST(request) {
    try{
        const authToken = request.headers.get("Authorization")?.split(" ")[1];
        if (!authToken) {
            return NextResponse.json({ error: "Missing AuthToken" }, { status: 401 });
        }

        const body = await request.json();
        const { callerId, calleeId } = body;

        const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/callLog/endCall`, {
            method: "POST",
            credentials: "include",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${authToken}`,
            },
            body: JSON.stringify({ callerId, calleeId }),
        });

        if (!res.ok) {
            return NextResponse.json({ error: "Invalid session" }, { status: 401 });
        }

        return res


    } catch (error) {
        console.error("User fetch error:", error);
        return NextResponse.json({ error: "Failed to add log" }, { status: 500 });
    }
}